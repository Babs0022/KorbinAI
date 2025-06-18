
import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";

const corsHandler = cors({
  origin: [
    "http://localhost:9002", // For local testing
    "https://brieflyai.xyz", // For production
    // Add your production domain here if different
    "https://6000-firebase-studio-1749655004240.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev/",
  ],
});

admin.initializeApp();
const db = admin.firestore();

// --- Environment Variable Based Configuration ---
// These must be set in your Firebase Function's environment
const ENV_PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const ENV_PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const ENV_APP_CALLBACK_URL = process.env.APP_CALLBACK_URL;

logger.info("Function Cold Start: Reading environment variables.");
logger.info(
  `PAYSTACK_SECRET_KEY: ${ENV_PAYSTACK_SECRET_KEY ? "Loaded" : "MISSING!"}`
);
logger.info(
  `PAYSTACK_WEBHOOK_SECRET: ${ENV_PAYSTACK_WEBHOOK_SECRET ? "Loaded" : "MISSING!"}`
);
logger.info(
  `APP_CALLBACK_URL: ${ENV_APP_CALLBACK_URL ? "Loaded" : "MISSING!"}`
);

let globalPaystackInstance: Paystack | null = null;
if (ENV_PAYSTACK_SECRET_KEY) {
  try {
    globalPaystackInstance = new Paystack(ENV_PAYSTACK_SECRET_KEY);
    logger.info(
      "Global Paystack SDK instance initialized successfully at module load."
    );
  } catch (e: unknown) {
    logger.error(
      "Error initializing global Paystack SDK instance at module load:", e
    );
    globalPaystackInstance = null;
  }
} else {
  logger.warn(
    "PAYSTACK_SECRET_KEY not found in environment variables at module load. " +
    "Global Paystack SDK instance NOT initialized. " +
    "Handlers will attempt local SDK initialization if key is found later."
  );
}
// --- End Configuration ---


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
  {region: "us-central1", timeoutSeconds: 60, memory: "256MiB"},
  async (request) => {
    logger.info("createPaystackSubscription: Invoked.", {structuredData: true});

    const currentPaystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const currentAppCallbackUrl = process.env.APP_CALLBACK_URL;

    logger.info(
      "createPaystackSubscription: PAYSTACK_SECRET_KEY (runtime). Found: " +
      `${!!currentPaystackSecretKey}. Value: ${currentPaystackSecretKey ? "********" : "UNDEFINED"}`
    );
    logger.info(
      "createPaystackSubscription: APP_CALLBACK_URL (runtime). Found: " +
      `${!!currentAppCallbackUrl}. Value: ${currentAppCallbackUrl || "UNDEFINED/EMPTY"}`
    );

    if (!currentPaystackSecretKey) {
      logger.error(
        "createPaystackSubscription: CRITICAL: PAYSTACK_SECRET_KEY is " +
        "MISSING from environment variables. Cannot proceed."
      );
      throw new HttpsError(
        "internal",
        "Payment system configuration error (PSK_MISSING_ENV). " +
        "[Code: CFG_ERR_PSK]"
      );
    }
    if (!currentAppCallbackUrl) {
      logger.error(
        "createPaystackSubscription: CRITICAL: APP_CALLBACK_URL is " +
        "MISSING from environment variables. Cannot proceed."
      );
      throw new HttpsError(
        "internal",
        "Application configuration error (CB_URL_MISSING_ENV). " +
        "[Code: CFG_ERR_CB_URL]"
      );
    }

    let paystackSdkInstance: Paystack | null = null;
    try {
      logger.info(
        "createPaystackSubscription: Initializing Paystack SDK instance..."
      );
      paystackSdkInstance = new Paystack(currentPaystackSecretKey);
      logger.info(
        "createPaystackSubscription: Paystack SDK instance created successfully."
      );
    } catch (sdkError: unknown) {
      logger.error(
        "createPaystackSubscription: Error initializing Paystack SDK:", sdkError
      );
      if (sdkError instanceof Error) {
        logger.error(
          "createPaystackSubscription: Paystack SDK Init Error name:",
          sdkError.name
        );
        logger.error(
          "createPaystackSubscription: Paystack SDK Init Error message:",
          sdkError.message
        );
      }
      throw new HttpsError(
        "internal",
        "Failed to initialize payment service SDK. " +
        "[Code: SDK_INIT_FAIL_HANDLER]"
      );
    }

    const data = request.data as CreateSubscriptionData;
    const auth = request.auth;
    logger.info(
      "createPaystackSubscription: Request data received:", JSON.stringify(data)
    );
    logger.info(
      "createPaystackSubscription: Auth context received:",
      JSON.stringify(
        auth ? {uid: auth.uid, email: auth.token?.email} : {auth_missing: true}
      )
    );


    if (!auth) {
      logger.warn("createPaystackSubscription: Unauthenticated user attempt.");
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated. [Code: AUTH_REQ]"
      );
    }

    const userId = auth.uid;
    const clientProvidedEmail = data.email;
    const authenticatedUserEmail = auth.token?.email;
    const emailToUse = clientProvidedEmail || authenticatedUserEmail;
    const planId = data.planId;

    logger.info(
      `createPaystackSubscription: User ID: ${userId}, ` +
      `Email for Paystack: ${emailToUse ? "********" : "MISSING"}, ` +
      `Plan ID: ${planId}`
    );

    if (
      !emailToUse ||
      !planId ||
      !planDetails[planId] ||
      !planDetails[planId].plan_code
    ) {
      logger.error(
        "createPaystackSubscription: Invalid data for subscription provided:",
        {
          emailExists: !!emailToUse,
          planIdReceived: planId,
          planDetailsExistForId: !!planDetails[planId],
          planCodeExistsInDetails: !!planDetails[planId]?.plan_code,
        }
      );
      throw new HttpsError(
        "invalid-argument",
        "Valid email, planId, and plan configuration are required. " +
        "[Code: INVALID_ARGS_FINAL]"
      );
    }

    const plan = planDetails[planId];
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;
    logger.info(
      `createPaystackSubscription: Generated Paystack reference: ${reference}`
    );

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
        "createPaystackSubscription: Initializing Paystack transaction " +
        "with args:", JSON.stringify(transactionArgs)
      );

      const response =
        await paystackSdkInstance.transaction.initialize(transactionArgs);
      logger.info(
        "createPaystackSubscription: Paystack transaction.initialize RAW response:",
        JSON.stringify(response)
      );


      if (response.status && response.data && response.data.authorization_url) {
        logger.info(
          "createPaystackSubscription: Paystack initialization successful. " +
          "Proceeding to write to Firestore..."
        );
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
        logger.info(
          `createPaystackSubscription: Transaction ${reference} ` +
          "successfully saved to Firestore. Returning authorization URL."
        );
        return {
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference,
        };
      } else {
        logger.error(
          "createPaystackSubscription: Paystack transaction.initialize FAILED " +
          "or missing authorization_url in response.data:",
          {
            message: response.message,
            status: response.status,
            responseData: response.data,
          }
        );
        const errorMessage =
          response.message ||
          "Paystack initialization indicated failure or " +
          "did not return an authorization URL.";
        throw new HttpsError(
          "internal", errorMessage + " [Code: PSTK_INIT_NO_AUTH_URL]"
        );
      }
    } catch (error: unknown) {
      logger.error(
        "createPaystackSubscription: Error during Paystack transaction " +
        "initialization or Firestore DB write:",
        error
      );
      if (error instanceof Error) {
        logger.error(
          "createPaystackSubscription: Caught Error Name:", error.name
        );
        logger.error(
          "createPaystackSubscription: Caught Error Message:", error.message
        );
        if (error.stack) {
          logger.error(
            "createPaystackSubscription: Caught Error Stack:", error.stack
          );
        }
      } else {
        logger.error(
          "createPaystackSubscription: Caught non-Error object during " +
          "transaction/DB write:", String(error)
        );
      }
      const errorMessage =
        (error instanceof Error ? error.message : String(error)) ||
        "An unknown error occurred while initiating the payment process.";
      throw new HttpsError(
        "internal", errorMessage + " [Code: UNKNOWN_INIT_ERR_FINAL]"
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

async function processChargeSuccessEvent(
  eventData: PaystackChargeSuccessData
): Promise<void> {
  logger.info(
    "processChargeSuccessEvent: Starting for reference:", eventData.reference
  );

  let paystackInstanceForVerify = globalPaystackInstance;
  if (!paystackInstanceForVerify) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (secretKey) {
      try {
        logger.info(
          "processChargeSuccessEvent: Global Paystack SDK was null, " +
          "attempting to re-initialize for verification."
        );
        paystackInstanceForVerify = new Paystack(secretKey);
        logger.info(
          "processChargeSuccessEvent: Local Paystack SDK for " +
          "verification created successfully."
        );
      } catch (sdkError) {
        logger.error(
          "processChargeSuccessEvent: Error re-initializing local " +
          "Paystack SDK for verification:", sdkError
        );
        paystackInstanceForVerify = null;
      }
    }
  }


  if (!paystackInstanceForVerify) {
    const logMsg = "Paystack SDK instance not available (global or re-init). " +
      "This usually means PAYSTACK_SECRET_KEY was missing or failed to init. " +
      "Cannot verify transaction for reference: " + eventData.reference;
    logger.error("processChargeSuccessEvent: " + logMsg);
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
      {effectiveMetadata, planObjectDetails: planObject}
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
      "for reference:", reference, JSON.stringify(verification)
    );

    if (
      !verification ||
      !verification.status ||
      !verification.data || // Check for data existence
      verification.data.status !== "success"
    ) {
      logger.error(
        "processChargeSuccessEvent: Paystack transaction re-verification " +
        "failed or not successful for reference:",
        reference,
        {
          verificationStatus: verification?.data?.status,
          verificationMessage: verification?.message,
          verificationData: verification?.data,
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
      "processChargeSuccessEvent: Error during re-verification with Paystack:",
      reference,
      verifyError
    );
    if (verifyError instanceof Error) {
      logger.error(
        "processChargeSuccessEvent: Verification Error Name:",
        verifyError.name
      );
      logger.error(
        "processChargeSuccessEvent: Verification Error Message:",
        verifyError.message
      );
    }
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
    logger.info(
      "processChargeSuccessEvent: Updating Firestore for user subscription:",
      {userId, reference}
    );
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
      `processChargeSuccessEvent: Subscription for ${userId} ` +
      `(plan:${planId}, ref:${reference}) data successfully updated in Firestore.`
    );
  } catch (dbError: unknown) {
    logger.error(
      "processChargeSuccessEvent: Error updating Firestore for reference:",
      reference,
      {
        userId,
        error: dbError,
      }
    );
    if (dbError instanceof Error) {
      logger.error(
        "processChargeSuccessEvent: Firestore Update Error Name:",
        dbError.name
      );
      logger.error(
        "processChargeSuccessEvent: Firestore Update Error Message:",
        dbError.message
      );
    }
  }
}

export const paystackWebhookHandler = onRequest(
  {region: "us-central1", timeoutSeconds: 60, memory: "256MiB"},
  async (req, res) => {
    logger.info(
      "paystackWebhookHandler: Invoked.", {headers: req.headers}
    );

    const currentWebhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    const currentPaystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    logger.info(
      "paystackWebhookHandler: PAYSTACK_WEBHOOK_SECRET (runtime). Found: " +
      `${!!currentWebhookSecret}. Value: ` +
      `${currentWebhookSecret ? "********" : "UNDEFINED"}`
    );
    logger.info(
      "paystackWebhookHandler: PAYSTACK_SECRET_KEY (runtime, for verify). " +
      `Found: ${!!currentPaystackSecretKey}. Value: ` +
      `${currentPaystackSecretKey ? "********" : "UNDEFINED"}`
    );

    if (!currentWebhookSecret) {
      logger.error(
        "paystackWebhookHandler: CRITICAL: PAYSTACK_WEBHOOK_SECRET is " +
        "MISSING from environment. Cannot verify signature."
      );
      res.status(500).send(
        "Server configuration error (WHS_MISSING_ENV)."
      );
      return;
    }
    // SDK key (currentPaystackSecretKey) is checked within
    // processChargeSuccessEvent for Paystack verification

    corsHandler(req, res, async () => {
      logger.info(
        "paystackWebhookHandler (cors): Request received for path:", req.path
      );

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
        const sigErrorMsg = "Invalid Paystack webhook signature. " +
          `Expected: ${hash}, Got: ` +
          `${req.headers["x-paystack-signature"] || "Not present"}`;
        logger.warn("paystackWebhookHandler: " + sigErrorMsg);
        res.status(401).send("Invalid signature.");
        return;
      }

      logger.info("paystackWebhookHandler: Webhook signature VERIFIED.");
      const event = req.body;
      logger.info(
        "paystackWebhookHandler: Received Paystack event type:",
        event.event,
        "for Paystack reference:",
        event.data?.reference
      );

      if (event.event === "charge.success") {
        res.status(200).send(
          "Webhook for charge.success acknowledged. " +
          "Processing in background."
        );
        try {
          await processChargeSuccessEvent(
            event.data as PaystackChargeSuccessData
          );
          const successMsg = "Background processing for " +
            "charge.success completed for event reference: " +
            event.data?.reference;
          logger.info("paystackWebhookHandler: " + successMsg);
        } catch (processingError) {
          const errorMsg = "Error during background processing of " +
            "charge.success for event reference: " + event.data?.reference;
          logger.error(
            "paystackWebhookHandler: " + errorMsg,
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
// Ensure file ends with a newline character

      