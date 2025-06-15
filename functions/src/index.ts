
import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";

const corsHandler = cors({
  origin: ["http://localhost:9002", "https://brieflyai.xyz"],
});

admin.initializeApp();
const db = admin.firestore();

// --- IMPORTANT: SET THESE IN FIREBASE ENVIRONMENT CONFIGURATION ---
// firebase functions:config:set paystack.secret_key="YOUR_PAYSTACK_SECRET_KEY"
// firebase functions:config:set paystack.webhook_secret="YOUR_PAYSTACK_WEBHOOK_SECRET"
// firebase functions:config:set app.callback_url="YOUR_APP_CALLBACK_URL"
// These will be available as process.env.PAYSTACK_SECRET_KEY, process.env.PAYSTACK_WEBHOOK_SECRET, process.env.APP_CALLBACK_URL
// ---

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const APP_CALLBACK_URL = process.env.APP_CALLBACK_URL;

let paystack: Paystack | null = null;

if (PAYSTACK_SECRET_KEY) {
  paystack = new Paystack(PAYSTACK_SECRET_KEY);
  logger.info("Paystack SDK initialized with secret key.");
} else {
  logger.error(
    "Paystack secret key not found in environment variables (process.env.PAYSTACK_SECRET_KEY). " +
    "Paystack SDK NOT initialized."
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
        "createPaystackSubscription: Paystack SDK not initialized. This usually means PAYSTACK_SECRET_KEY was missing."
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
        "createPaystackSubscription: Application callback URL (APP_CALLBACK_URL) is not configured."
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
      logger.error("createPaystackSubscription: Error initializing transaction:", error);
      const errorMessage =
        (error instanceof Error ? error.message : String(error)) ||
        "An unknown error occurred while initiating payment.";
      throw new HttpsError("internal", errorMessage);
    }
  }
);

export const paystackWebhookHandler = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    logger.info("paystackWebhookHandler invoked. Checking configuration...");
    logger.info(`PAYSTACK_SECRET_KEY available: ${!!PAYSTACK_SECRET_KEY}`);
    logger.info(`PAYSTACK_WEBHOOK_SECRET available: ${!!PAYSTACK_WEBHOOK_SECRET}`);

    if (!PAYSTACK_SECRET_KEY || !PAYSTACK_WEBHOOK_SECRET) {
      logger.error(
        "paystackWebhookHandler: Paystack secret key or webhook secret not configured in environment variables."
      );
      res.status(500).send("Server configuration error for webhooks (secrets missing).");
      return;
    }

    if (!paystack) {
      logger.error(
        "paystackWebhookHandler: Paystack SDK not initialized. This usually means PAYSTACK_SECRET_KEY was missing at startup."
      );
      // Attempt to re-initialize if PAYSTACK_SECRET_KEY is now available but paystack object is null
      // This is a fallback, ideally it's initialized globally.
      if (PAYSTACK_SECRET_KEY) {
          paystack = new Paystack(PAYSTACK_SECRET_KEY);
          logger.info("Paystack SDK re-initialized in webhook handler.");
          if (!paystack) { // Still couldn't initialize
             res.status(500).send("Payment system could not be initialized.");
             return;
          }
      } else {
          res.status(500).send("Payment system critical configuration missing.");
          return;
      }
    }


    corsHandler(req, res, async () => {
      const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET!) // We've checked PAYSTACK_WEBHOOK_SECRET above
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        logger.warn("paystackWebhookHandler: Invalid Paystack webhook signature.");
        res.status(401).send("Invalid signature.");
        return;
      }

      const event = req.body;
      logger.info("paystackWebhookHandler: Received Paystack webhook event:", event.event);

      if (event.event === "charge.success") {
        const {
          reference,
          customer,
          amount,
          currency,
          metadata,
          plan_object: planObject,
          paid_at: paidAt,
        } = event.data;

        const effectiveMetadata = metadata || planObject?.metadata || {};
        const userId = effectiveMetadata?.userId;
        const planId = effectiveMetadata?.planId;

        if (!userId || !planId) {
          logger.error(
            "paystackWebhookHandler: Missing userId or planId in webhook metadata for charge.success",
            {effectiveMetadata, planObject}
          );
          res.status(400).send("Missing user or plan identifier in metadata.");
          return;
        }

        try {
          const verification = await paystack.transaction.verify({reference}); // paystack is checked to be non-null
          if (!verification.status || verification.data.status !== "success") {
            logger.error(
              "paystackWebhookHandler: Paystack transaction re-verification failed or not successful for reference:",
              reference,
              verification
            );
            res.status(400).send("Transaction re-verification failed.");
            return;
          }
        } catch (verifyError: unknown) {
          logger.error(
            "paystackWebhookHandler: Error re-verifying transaction:",
            (verifyError instanceof Error ? verifyError.message : String(verifyError))
          );
          res.status(500).send("Error during transaction re-verification.");
          return;
        }

        const actualPaidAt = paidAt || Date.now();
        const subscriptionData = {
          userId,
          planId,
          email: customer?.email,
          status: "active",
          currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(
            new Date(new Date(actualPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000)
          ),
          paystackReference: reference,
          amountPaid: amount,
          currency: currency,
          lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        try {
          await db.collection("userSubscriptions").doc(userId).set(subscriptionData, {merge: true});
          await db.collection("transactions").doc(reference).update({
            status: "success",
            paidAt: admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          logger.info(
            `paystackWebhookHandler: Subscription for ${userId}(plan:${planId}) processed successfully.`
          );
          res.status(200).send("Webhook processed successfully.");
        } catch (error: unknown) {
          logger.error(
            "paystackWebhookHandler: Error updating Firestore:",
            (error instanceof Error ? error.message : String(error))
          );
          res.status(500).send("Error processing subscription update.");
        }
      } else {
        logger.info(
          "paystackWebhookHandler: Unhandled Paystack event type:",
          event.event
        );
        res.status(200).send("Event received but not processed.");
      }
    });
  }
);

