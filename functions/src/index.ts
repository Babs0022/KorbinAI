
'use server'; // This directive is typically for Next.js server components, not Firebase Functions. Removing.

import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";

const corsHandler = cors({
  origin: [ "https://6000-firebase-studio-1749655004240.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev/", "https://brieflyai.xyz" ],
});

admin.initializeApp();
const db = admin.firestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const APP_CALLBACK_URL = process.env.APP_CALLBACK_URL;

let paystack: Paystack | null = null;

if (PAYSTACK_SECRET_KEY) {
  paystack = new Paystack(PAYSTACK_SECRET_KEY);
  logger.info("Paystack SDK initialized with secret key.");
} else {
  logger.error(
    "Paystack secret key not found in environment variables " +
    "(process.env.PAYSTACK_SECRET_KEY). Paystack SDK NOT initialized."
  );
}

const planDetails: Record<string, {
  amount: number,
  name: string,
  plan_code: string
}> = {
  premium: {
    amount: 16000 * 100, // NGN 16,000 in Kobo
    name: "BrieflyAI Premium",
    plan_code: "PLN_c7d9pwc77ezn3a8",
  },
  unlimited: {
    amount: 56000 * 100, // NGN 56,000 in Kobo
    name: "BrieflyAI Unlimited",
    plan_code: "PLN_kb83pnnocije9fz",
  },
};

export const createPaystackSubscription = onCall(
  { region: "us-central1" },
  async (request) => {
    logger.info("createPaystackSubscription invoked. Checking configuration...");
    logger.info(`PAYSTACK_SECRET_KEY available: ${!!PAYSTACK_SECRET_KEY}`);
    logger.info(`APP_CALLBACK_URL available: ${!!APP_CALLBACK_URL}`);

    const data = request.data as { email?: string; planId: string };
    const auth = request.auth;

    if (!paystack) {
      logger.error(
        "createPaystackSubscription: Paystack SDK not initialized. " +
        "This usually means PAYSTACK_SECRET_KEY was missing."
      );
      throw new HttpsError(
        "internal",
        "Payment system not configured on the server."
      );
    }
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to subscribe."
      );
    }
    if (!APP_CALLBACK_URL) {
      logger.error(
        "createPaystackSubscription: Application callback URL " +
        "(APP_CALLBACK_URL) is not configured."
      );
      throw new HttpsError(
        "internal",
        "Application callback URL not configured."
      );
    }

    const userId = auth.uid;
    const clientProvidedEmail = data.email;
    const authenticatedUserEmail = auth.token?.email;
    const emailToUse = clientProvidedEmail || authenticatedUserEmail;
    const planId = data.planId;

    if (
      !emailToUse ||
      !planId ||
      !planDetails[planId] ||
      !planDetails[planId].plan_code
    ) {
      logger.error("createPaystackSubscription: Invalid data received:", {
        emailExists: !!emailToUse,
        planId,
        planDetailsExist: !!planDetails[planId],
        planCodeExists: !!planDetails[planId]?.plan_code,
      });
      throw new HttpsError(
        "invalid-argument",
        "Valid email, planId, and configured plan code are required."
      );
    }

    const plan = planDetails[planId];
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;

    try {
      const transactionArgs = {
        email: emailToUse,
        plan: plan.plan_code,
        reference: reference,
        callback_url:
          `${APP_CALLBACK_URL}&ref=${reference}&planId=${planId}`,
        metadata: {userId, planId, service: "BrieflyAI Subscription"},
      };

      const response = await paystack.transaction.initialize(transactionArgs);

      if (response.status && response.data) {
        await db.collection("transactions").doc(reference).set({
          userId,
          planId,
          email: emailToUse,
          amount: plan.amount,
          planCode: plan.plan_code,
          status: "pending_paystack_redirect",
          paystackReference: response.data.reference,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference,
        };
      } else {
        logger.error(
          "createPaystackSubscription: Paystack transaction.initialize failed:",
          response.message,
          response.data
        );
        const errorMessage =
          response.message || "Paystack initialization failed.";
        throw new HttpsError("internal", errorMessage);
      }
    } catch (error: unknown) {
      logger.error(
        "createPaystackSubscription: Error initializing transaction:",
        error
      );
      const errorMessage =
        (error instanceof Error ? error.message : String(error)) ||
        "An unknown error occurred while initiating payment.";
      throw new HttpsError("internal", errorMessage);
    }
  }
);

async function processChargeSuccessEvent(eventData: any): Promise<void> {
  const {
    reference,
    customer,
    amount,
    currency,
    metadata,
    plan_object: planObject,
    paid_at: paidAt,
  } = eventData;

  if (!paystack) {
    logger.error(
      "processChargeSuccessEvent: Paystack SDK not available during event " +
      "processing for reference:", reference
    );
    return;
  }

  const effectiveMetadata = metadata || planObject?.metadata || {};
  const userId = effectiveMetadata?.userId;
  const planId = effectiveMetadata?.planId;

  if (!userId || !planId) {
    logger.error(
      "processChargeSuccessEvent: Missing userId or planId in webhook " +
      "metadata for reference:",
      reference,
      {effectiveMetadata, planObject}
    );
    return;
  }

  try {
    const verification = await paystack.transaction.verify({reference});
    if (!verification.status || verification.data.status !== "success") {
      logger.error(
        "processChargeSuccessEvent: Paystack transaction re-verification " +
        "failed or not successful for reference:",
        reference,
        {
          verificationStatus: verification.data?.status,
          verificationMessage: verification.message,
          verificationData: verification.data,
        }
      );
      return;
    }
    logger.info(
      "processChargeSuccessEvent: Transaction successfully re-verified " +
      "with Paystack for reference:", reference
    );
  } catch (verifyError: unknown) {
    logger.error(
      "processChargeSuccessEvent: Error re-verifying transaction with " +
      "Paystack for reference:",
      reference,
      (verifyError instanceof Error ? verifyError.message : String(verifyError))
    );
    return;
  }

  const actualPaidAt = paidAt || Date.now();
  const subscriptionData = {
    userId,
    planId,
    email: customer?.email,
    status: "active",
    currentPeriodStart:
      admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(
      new Date(new Date(actualPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    ), // Approx 30 days
    paystackReference: reference,
    amountPaid: amount,
    currency: currency,
    lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("userSubscriptions").doc(userId).set(
      subscriptionData,
      {merge: true}
    );
    await db.collection("transactions").doc(reference).update({
      status: "success",
      paidAt: admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(
      `processChargeSuccessEvent: Subscription for ${userId}` +
      `(plan:${planId}, ref:${reference}) data updated in Firestore.`
    );
  } catch (dbError: unknown) {
    logger.error(
      "processChargeSuccessEvent: Error updating Firestore for reference:",
      reference,
      {
        userId,
        error: (dbError instanceof Error ? dbError.message : String(dbError)),
      }
    );
  }
}

export const paystackWebhookHandler = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    logger.info("paystackWebhookHandler invoked. Checking configuration...");
    logger.info(`PAYSTACK_SECRET_KEY available: ${!!PAYSTACK_SECRET_KEY}`);
    logger.info(
      `PAYSTACK_WEBHOOK_SECRET available: ${!!PAYSTACK_WEBHOOK_SECRET}`
    );

    if (!PAYSTACK_SECRET_KEY || !PAYSTACK_WEBHOOK_SECRET) {
      logger.error(
        "paystackWebhookHandler: Paystack secret key or webhook secret not " +
        "configured in environment variables."
      );
      res.status(500).send(
        "Server configuration error for webhooks (secrets missing)."
      );
      return;
    }

    if (!paystack) {
      logger.error(
        "paystackWebhookHandler: Paystack SDK not initialized " +
        "(PAYSTACK_SECRET_KEY missing at startup or other init issue)."
      );
      if (PAYSTACK_SECRET_KEY) { // Check again
        paystack = new Paystack(PAYSTACK_SECRET_KEY);
        logger.info(
          "Paystack SDK re-attempted initialization in webhook handler."
        );
        if (!paystack) { // Still couldn't initialize
          res.status(500).send(
            "Payment system could not be initialized on re-attempt."
          );
          return;
        }
      } else {
        res.status(500).send(
          "Payment system critical configuration (secret key) missing."
        );
        return;
      }
    }

    corsHandler(req, res, async () => {
      const webhookSecret = PAYSTACK_WEBHOOK_SECRET!;
      const hash = crypto.createHmac("sha512", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        logger.warn(
          "paystackWebhookHandler: Invalid Paystack webhook signature."
        );
        res.status(401).send("Invalid signature.");
        return;
      }

      const event = req.body;
      logger.info(
        "paystackWebhookHandler: Received Paystack webhook event:",
        event.event,
        "for reference:",
        event.data?.reference
      );

      if (event.event === "charge.success") {
        // Acknowledge immediately to Paystack
        res.status(200).send(
          "Webhook for charge.success acknowledged. Processing in background."
        );
        // Perform the actual processing asynchronously
        try {
          await processChargeSuccessEvent(event.data);
          logger.info(
            "paystackWebhookHandler: Background processing for " +
            "charge.success completed for event reference:",
            event.data?.reference
          );
        } catch (processingError) {
          logger.error(
            "paystackWebhookHandler: Error during background processing of " +
            "charge.success for event reference:",
            event.data?.reference,
            processingError
          );
        }
      } else {
        logger.info(
          "paystackWebhookHandler: Unhandled or synchronously processed " +
          "Paystack event type:",
          event.event
        );
        res.status(200).send(
          "Event received and acknowledged " +
          "(non-charge.success or unhandled)."
        );
      }
    });
  }
);

    