
import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";

const corsHandler = cors({
  origin: [
    "http://localhost:9002",
    "https://brieflyai.xyz",
    // Add your production domain here if different
    "https://6000-firebase-studio-1749655004240.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev/",
  ],
});

admin.initializeApp();
const db = admin.firestore();

const functionsConfig = (
  globalThis as typeof globalThis & {
    functions?: {
      config?: () => {
        paystack?: { secret_key?: string; webhook_secret?: string };
        app?: { callback_url?: string };
        [key: string]: unknown;
      };
    };
  }
).functions?.config?.() || {};

// Global Paystack instance, primarily for webhook verification
// if PAYSTACK_SECRET_KEY is available globally at startup.
let globalPaystackInstance: Paystack | null = null;
if (functionsConfig.paystack?.secret_key) {
  try {
    globalPaystackInstance = new Paystack(functionsConfig.paystack.secret_key);
    logger.info("Global Paystack SDK instance initialized with secret key.");
  } catch (e) {
    logger.error(
      "Error initializing global Paystack SDK instance at startup:", e
    );
    globalPaystackInstance = null; // Ensure it's null if init fails
  }
} else {
  logger.warn(
    "Global Paystack secret key (paystack.secret_key) not found in " +
    "Firebase config at startup. Global Paystack SDK instance NOT " +
    "initialized. Functions will attempt local SDK initialization or use " +
    "this global one if re-attempted."
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
    // Log the raw config object for debugging
    logger.info("Raw functionsConfig object available to function:",
      JSON.stringify(functionsConfig || {config_not_found: true}));

    const currentPaystackSecretKey = functionsConfig.paystack?.secret_key;
    const currentAppCallbackUrl = functionsConfig.app?.callback_url;

    const secretKeyFound = !!currentPaystackSecretKey;
    const secretKeyValue = currentPaystackSecretKey ? "********" : "UNDEFINED";
    logger.info(
      `PAYSTACK_SECRET_KEY. Found: ${secretKeyFound}. Value: ${secretKeyValue}`
    );

    const callbackUrlFound = !!currentAppCallbackUrl;
    const callbackUrlValue = currentAppCallbackUrl || "UNDEFINED/EMPTY";
    logger.info(
      `APP_CALLBACK_URL. Found: ${callbackUrlFound}. Value: ${callbackUrlValue}`
    );


    let paystackSdkInstance: Paystack | null = null;
    if (currentPaystackSecretKey) {
      try {
        paystackSdkInstance = new Paystack(currentPaystackSecretKey);
        logger.info(
          "Local Paystack SDK instance created successfully for this call."
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
        "Firebase environment config. SDK cannot be initialized. " +
        "Verify: firebase functions:config:get paystack.secret_key"
      );
    }

    if (!paystackSdkInstance) {
      logger.error(
        "Critical Error: Local Paystack SDK is not initialized. " +
        "Aborting subscription attempt. Check PAYSTACK_SECRET_KEY env var."
      );
      throw new HttpsError(
        "internal",
        "Payment system is not configured correctly. " +
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
      const logData = {
        emailExists: !!emailToUse,
        planId: planId,
        planDetailsExist: !!planDetails[planId],
        planCodeExists: !!planDetails[planId]?.plan_code,
      };
      logger.error(
        "createPaystackSubscription: Invalid data for subscription:",
        logData
      );
      throw new HttpsError(
        "invalid-argument",
        "Valid email, planId, and plan config are required. " +
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
        const logMsg = "Paystack transaction.initialize failed";
        const logDetails = {
          message: response.message,
          data: response.data,
        };
        logger.error(logMsg, logDetails);
        const errorMessage =
          response.message || "Paystack initialization indicated failure.";
        throw new HttpsError(
          "internal", errorMessage + " [Code: PSTK_INIT_FAIL]"
        );
      }
    } catch (error: unknown) {
      logger.error(
        "Error during transaction init or DB write:",
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
    "processChargeSuccessEvent: Starting for ref:", eventData.reference
  );

  if (!globalPaystackInstance) {
    const errorMsg = "Global Paystack SDK instance not available. " +
      "This usually means PAYSTACK_SECRET_KEY was missing at startup. " +
      "Cannot verify transaction for reference:";
    logger.error(errorMsg, eventData.reference);
    return; // Cannot proceed without SDK for verification
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

  // Prioritize direct metadata, then plan_object metadata.
  const effectiveMetadata = metadata || planObject?.metadata || {};
  const userId = effectiveMetadata?.userId;
  const planId = effectiveMetadata?.planId;

  if (!userId || !planId) {
    const errorMsg = "processChargeSuccessEvent: Missing userId or planId " +
      "in webhook metadata for ref:";
    logger.error(errorMsg, reference, {effectiveMetadata, planObject});
    return;
  }

  try {
    logger.info(
      "Verifying transaction with Paystack for ref:", reference
    );
    const verification =
      await globalPaystackInstance.transaction.verify({reference});
    logger.info(
      "Paystack transaction.verify response for ref:",
      reference,
      verification
    );

    if (
      !verification.status ||
      !verification.data ||
      verification.data.status !== "success"
    ) {
      const logData = {
        verificationStatus: verification.data?.status,
        verificationMessage: verification.message,
        verificationData: verification.data,
      };
      logger.error(
        "Paystack re-verification failed for ref:", reference, logData
      );
      return;
    }
    logger.info(
      "Transaction successfully re-verified for ref:", reference
    );
  } catch (verifyError: unknown) {
    const errorMsg = verifyError instanceof Error ?
      verifyError.message : String(verifyError);
    logger.error(
      "Error re-verifying transaction for ref:", reference, errorMsg
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
    const logMsg = `Subscription for ${userId} (plan:${planId}, ` +
      `ref:${reference}) data updated in Firestore.`;
    logger.info(logMsg);
  } catch (dbError: unknown) {
    const errorMsg = dbError instanceof Error ?
      dbError.message : String(dbError);
    logger.error(
      "Error updating Firestore for reference:", reference, {userId, errorMsg}
    );
  }
}

export const paystackWebhookHandler = onRequest(
  {region: "us-central1"},
  async (req, res) => {
    logger.info("paystackWebhookHandler invoked. Validating webhook config...");
    logger.info("Raw functionsConfig object available to webhook:",
      JSON.stringify(functionsConfig || {config_not_found: true}));

    const currentWebhookSecret = functionsConfig.paystack?.webhook_secret;
    const currentPaystackSecretKeyForVerify =
      functionsConfig.paystack?.secret_key;

    const webhookSecretFound = !!currentWebhookSecret;
    const webhookSecretValue = currentWebhookSecret ? "********" : "UNDEFINED";
    logger.info(
      `PAYSTACK_WEBHOOK_SECRET. Found: ${webhookSecretFound}. ` +
      `Value: ${webhookSecretValue}`
    );

    const secretKeyVerifyFound = !!currentPaystackSecretKeyForVerify;
    const secretKeyVerifyValue = currentPaystackSecretKeyForVerify ?
      "********" : "UNDEFINED";
    const secretKeyLog = "PAYSTACK_SECRET_KEY for verification. " +
      `Found: ${secretKeyVerifyFound}. Value: ${secretKeyVerifyValue}`;
    logger.info(secretKeyLog);


    corsHandler(req, res, async () => {
      logger.info("paystackWebhookHandler: Request Headers:", req.headers);
      logger.info("Request Body (raw):", req.rawBody?.toString() || "N/A");
      logger.info("Request Body (parsed):", JSON.stringify(req.body || {}));


      if (!currentPaystackSecretKeyForVerify &&
        globalPaystackInstance === null) {
        logger.error(
          "PAYSTACK_SECRET_KEY missing or global SDK not init. " +
          "Cannot verify transactions."
        );
        res.status(500).send(
          "Server configuration error (PSK missing for verify)."
        );
        return;
      }

      if (!currentWebhookSecret) {
        const errorMsg = "PAYSTACK_WEBHOOK_SECRET not configured. " +
          "Verify with: firebase functions:config:get paystack.webhook_secret";
        logger.error(errorMsg);
        res.status(500).send("Server configuration error (WHS missing).");
        return;
      }

      const requestBodyString = req.rawBody?.toString();
      if (!requestBodyString) {
        const errorMsg = "Raw request body is missing. " +
          "Cannot verify signature.";
        logger.error(errorMsg);
        res.status(400).send(
          "Raw request body required for signature verification."
        );
        return;
      }

      const hash = crypto.createHmac("sha512", currentWebhookSecret)
        .update(requestBodyString)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        const errorMsg = "Invalid Paystack webhook signature. " +
          `Expected: ${hash}, Got: ${req.headers["x-paystack-signature"]}`;
        logger.warn(errorMsg);
        res.status(401).send("Invalid signature.");
        return;
      }

      const event = req.body;
      logger.info(
        "Received Paystack webhook event:",
        event.event,
        "for reference:",
        event.data?.reference
      );

      if (event.event === "charge.success") {
        res.status(200).send(
          "Webhook for charge.success acknowledged. Processing background."
        );

        try {
          await processChargeSuccessEvent(
            event.data as PaystackChargeSuccessData
          );
          logger.info(
            "Background processing for charge.success completed for ref:",
            event.data?.reference
          );
        } catch (processingError) {
          logger.error(
            "Error during background processing of charge.success for ref:",
            event.data?.reference,
            processingError
          );
        }
      } else {
        logger.info(
          "Unhandled or synchronously processed Paystack event type:",
          event.event
        );
        res.status(200).send(
          "Event received and acknowledged (non-charge.success or unhandled)."
        );
      }
    });
  }
);
