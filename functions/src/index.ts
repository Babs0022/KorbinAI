
import * as functions from "firebase-functions"; // For config access
import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";
import * as logger from "firebase-functions/logger";

const corsHandler = cors({
  origin: [
    "http://localhost:9002", // For local testing
    "https://brieflyai.xyz",
    // Add your production domain here if different
    "https://6000-firebase-studio-1749655004240.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev/",
  ],
});

admin.initializeApp();
const db = admin.firestore();

// Access Firebase Functions config directly
const paystackConfig = functions.config().paystack;
const appConfig = functions.config().app;

logger.info(
  "Initial functions.config().paystack at startup:",
  JSON.stringify(paystackConfig || {config_not_found: true})
);
logger.info(
  "Initial functions.config().app at startup:",
  JSON.stringify(appConfig || {config_not_found: true})
);


const globalPaystackSecretKey = paystackConfig?.secret_key;
const globalPaystackWebhookSecret = paystackConfig?.webhook_secret;

logger.info(
  "Global scope: Attempting to read paystack.secret_key. " +
  `Found: ${!!globalPaystackSecretKey}. ` +
  `Value: ${globalPaystackSecretKey ? "********" : "UNDEFINED/EMPTY"}`
);
logger.info(
  "Global scope: Attempting to read paystack.webhook_secret. " +
  `Found: ${!!globalPaystackWebhookSecret}. ` +
  `Value: ${globalPaystackWebhookSecret ? "********" : "UNDEFINED/EMPTY"}`
);

let globalPaystackInstance: Paystack | null = null;
if (globalPaystackSecretKey) {
  try {
    globalPaystackInstance = new Paystack(globalPaystackSecretKey);
    logger.info(
      "Global Paystack SDK instance initialized successfully with secret key."
    );
  } catch (e) {
    logger.error(
      "Error initializing global Paystack SDK instance at startup:", e
    );
    globalPaystackInstance = null;
  }
} else {
  logger.warn(
    "Global Paystack secret key (paystack.secret_key) not found in " +
    "Firebase config at startup. Global Paystack SDK instance NOT " +
    "initialized."
  );
}

const planDetails: Record<
  string,
  {amount: number, name: string, plan_code: string}
> = {
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

interface CreateSubscriptionData {
  email?: string;
  planId: string;
}

export const createPaystackSubscription = onCall(
  {region: "us-central1"},
  async (request) => {
    logger.info("createPaystackSubscription invoked. Validating config...");

    const currentPaystackSecretKey = functions.config().paystack?.secret_key;
    const currentAppCallbackUrl = functions.config().app?.callback_url;

    logger.info(
      "Attempting to read PAYSTACK_SECRET_KEY. " +
      `Found: ${!!currentPaystackSecretKey}. ` +
      `Value: ${currentPaystackSecretKey ? "********" : "UNDEFINED/EMPTY"}`
    );
    logger.info(
      "Attempting to read APP_CALLBACK_URL. " +
      `Found: ${!!currentAppCallbackUrl}. ` +
      `Value: ${currentAppCallbackUrl || "UNDEFINED/EMPTY"}`
    );

    let paystackSdkInstance: Paystack | null = null;
    if (currentPaystackSecretKey) {
      try {
        paystackSdkInstance = new Paystack(currentPaystackSecretKey);
        logger.info(
          "Local Paystack SDK instance created for this call."
        );
      } catch (sdkError) {
        logger.error(
          "Error initializing local Paystack SDK instance:", sdkError
        );
        throw new HttpsError(
          "internal",
          "Failed to initialize payment service SDK. [Code: SDK_INIT_FAIL]"
        );
      }
    } else {
      logger.error(
        "CRITICAL: PAYSTACK_SECRET_KEY is MISSING or UNDEFINED in " +
        "Firebase environment config. Paystack SDK cannot be initialized. " +
        "Verify with: firebase functions:config:get paystack.secret_key"
      );
    }

    if (!paystackSdkInstance) {
      logger.error(
        "Critical Error: Local Paystack SDK is not initialized. " +
        "Aborting subscription attempt. Check PAYSTACK_SECRET_KEY env var."
      );
      throw new HttpsError(
        "internal",
        "Payment system is not configured correctly on the server. " +
        "[Code: PSK_MISSING_IN_CALL]"
      );
    }

    if (!currentAppCallbackUrl) {
      logger.error(
        "Critical Error: Application callback URL (APP_CALLBACK_URL) " +
        "is not configured. Aborting subscription attempt. Verify with: " +
        "firebase functions:config:get app.callback_url"
      );
      throw new HttpsError(
        "internal",
        "Application callback URL is not configured. " +
        "[Code: CB_URL_MISSING_IN_CALL]"
      );
    }

    const data = request.data as CreateSubscriptionData;
    const auth = request.auth;

    if (!auth) {
      logger.warn(
        "createPaystackSubscription: Unauthenticated user attempt."
      );
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to subscribe. [Code: AUTH_REQ]"
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
      logger.error(
        "createPaystackSubscription: Invalid data for subscription:",
        {
          emailExists: !!emailToUse,
          planId: planId,
          planDetailsExist: !!planDetails[planId],
          planCodeExists: !!planDetails[planId]?.plan_code,
        }
      );
      throw new HttpsError(
        "invalid-argument",
        "Valid email, planId, and plan configuration are required. " +
        "[Code: INVALID_ARGS]"
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
          `${currentAppCallbackUrl}?ref=${reference}&planId=${planId}`,
        metadata: {userId, planId, service: "BrieflyAI Subscription"},
      };
      logger.info(
        "createPaystackSubscription: Initializing transaction with args:",
        transactionArgs
      );

      const response =
        await paystackSdkInstance.transaction.initialize(transactionArgs);
      logger.info(
        "createPaystackSubscription: Paystack transaction.initialize response:",
        response
      );

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
          "createPaystackSubscription: Paystack transaction.initialize " +
          "failed (response indicated failure):",
          {message: response.message, data: response.data}
        );
        const errorMessage =
          response.message || "Paystack initialization indicated failure.";
        throw new HttpsError(
          "internal", errorMessage + " [Code: PSTK_INIT_FAIL]"
        );
      }
    } catch (error: unknown) {
      logger.error(
        "createPaystackSubscription:Error during transaction init or DB write:",
        error
      );
      const errorMessage =
        (error instanceof Error ? error.message : String(error)) ||
        "An unknown error occurred while initiating payment.";
      throw new HttpsError(
        "internal", errorMessage + " [Code: UNKNOWN_INIT_ERR]"
      );
    }
  }
);

interface PaystackCustomer {
  email?: string;
}
interface PaystackPlanObject {
  metadata?: {
    userId?: string;
    planId?: string;
    [key: string]: unknown;
  };
}
interface PaystackChargeSuccessData {
  reference: string;
  customer?: PaystackCustomer;
  amount: number;
  currency: string;
  metadata?: {
    userId?: string;
    planId?: string;
    [key: string]: unknown;
  };
  plan_object?: PaystackPlanObject;
  paid_at?: string | number; // Can be ISO string or timestamp
}

/**
 * Processes a successful charge event from Paystack.
 * Verifies the transaction and updates Firestore.
 * @param {PaystackChargeSuccessData} eventData The data from Paystack.
 */
async function processChargeSuccessEvent(
  eventData: PaystackChargeSuccessData
): Promise<void> {
  logger.info(
    "processChargeSuccessEvent: Starting for reference:", eventData.reference
  );

  const paystackInstanceForVerify = globalPaystackInstance || (
    globalPaystackSecretKey ? new Paystack(globalPaystackSecretKey) : null
  );

  if (!paystackInstanceForVerify) {
    logger.error(
      "processChargeSuccessEvent: Paystack SDK instance not available. " +
      "This usually means PAYSTACK_SECRET_KEY was missing at startup. " +
      "Cannot verify transaction for reference:", eventData.reference
    );
    return;
  }

  const {
    reference,
    customer,
    amount,
    currency,
    metadata,
    plan_object: planObject,
    paid_at: paidAt,
  } = eventData;

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
    logger.info(
      "processChargeSuccessEvent: Verifying transaction with Paystack " +
      "for reference:", reference
    );
    const verification =
      await paystackInstanceForVerify.transaction.verify({reference});
    logger.info(
      "processChargeSuccessEvent: Paystack transaction.verify response " +
      "for reference:", reference, verification
    );

    if (
      !verification.status ||
      !verification.data ||
      verification.data.status !== "success"
    ) {
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
  } catch (verifyError: unknown) {
    logger.error(
      "processChargeSuccessEvent: Error re-verifying transaction with " +
      "Paystack for reference:",
      reference,
      (verifyError instanceof Error ?
        verifyError.message :
        String(verifyError))
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
    ),
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
        error: (dbError instanceof Error ?
          dbError.message :
          String(dbError)),
      }
    );
  }
}

// Renaming this to paystackWebhookHandler
export const paystackWebhookHandler = onRequest(
  {region: "us-central1"},
  async (req, res) => {
    logger.info("paystackWebhookHandler invoked. Validating webhook config...");

    const currentWebhookSecret = functions.config().paystack?.webhook_secret;
    const paystackSecretKeyForVerify = functions.config().paystack?.secret_key;

    logger.info(
      "Attempting to read PAYSTACK_WEBHOOK_SECRET. " +
      `Found: ${!!currentWebhookSecret}. ` +
      `Value: ${currentWebhookSecret ? "********" : "UNDEFINED/EMPTY"}`
    );
    logger.info(
      "Attempting to read PAYSTACK_SECRET_KEY (for verification backup). " +
      `Found: ${!!paystackSecretKeyForVerify}. ` +
      `Value: ${paystackSecretKeyForVerify ? "********" : "UNDEFINED/EMPTY"}`
    );

    corsHandler(req, res, async () => {
      logger.info("paystackWebhookHandler: Request Headers:", req.headers);
      logger.info(
        "paystackWebhookHandler: Request Body (raw):",
        req.rawBody?.toString() || "N/A"
      );

      if (!globalPaystackInstance && !paystackSecretKeyForVerify) {
        logger.error(
          "paystackWebhookHandler: PAYSTACK_SECRET_KEY is missing " +
          "and global SDK not init. Cannot verify transactions."
        );
        res.status(500).send(
          "Server configuration error (PSK missing for verify)."
        );
        return;
      }

      if (!currentWebhookSecret) {
        logger.error(
          "paystackWebhookHandler: PAYSTACK_WEBHOOK_SECRET not configured. " +
          "Verify with: firebase functions:config:get paystack.webhook_secret"
        );
        res.status(500).send("Server configuration error (WHS missing).");
        return;
      }

      const requestBodyString = req.rawBody?.toString();
      if (!requestBodyString) {
        logger.error(
          "paystackWebhookHandler: Raw request body is missing. " +
          "Cannot verify signature."
        );
        res.status(400).send(
          "Raw request body required for signature verification."
        );
        return;
      }

      const hash = crypto.createHmac("sha512", currentWebhookSecret)
        .update(requestBodyString)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        logger.warn(
          "paystackWebhookHandler: Invalid Paystack webhook signature. " +
          `Expected: ${hash}, Got: ${req.headers["x-paystack-signature"]}`
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
        res.status(200).send(
          "Webhook for charge.success acknowledged. Processing in background."
        );
        try {
          await processChargeSuccessEvent(
            event.data as PaystackChargeSuccessData
          );
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
          "paystackWebhookHandler: Unhandled Paystack event type:",
          event.event
        );
        res.status(200).send(
          "Event received and acknowledged (unhandled type)."
        );
      }
    });
  }
);
// Ensure file ends with a newline character for ESLint 'eol-last' rule
