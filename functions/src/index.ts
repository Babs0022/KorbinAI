
import * as functions from "firebase-functions";
import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";

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

// Attempt to read config at module load time, with fallbacks.
let paystackConfig: { secret_key?: string; webhook_secret?: string } | undefined;
let appConfig: { callback_url?: string } | undefined;

let globalPaystackSecretKey: string | undefined;
let globalAppCallbackUrl: string | undefined;
// Webhook secret is fetched directly in handler, so no global needed here.

try {
  logger.info("Global scope: Attempting to read Firebase Functions config at module load...");
  const functionsConfigAll = functions.config();
  paystackConfig = functionsConfigAll.paystack;
  appConfig = functionsConfigAll.app;

  if (paystackConfig) {
    logger.info("Global scope: functions.config().paystack found:", JSON.stringify({secret_key_present: !!paystackConfig.secret_key, webhook_secret_present: !!paystackConfig.webhook_secret}));
    globalPaystackSecretKey = paystackConfig.secret_key;
  } else {
    logger.warn("Global scope: functions.config().paystack NOT found at module load.");
  }

  if (appConfig) {
    logger.info("Global scope: functions.config().app found:", JSON.stringify(appConfig));
    globalAppCallbackUrl = appConfig.callback_url;
  } else {
    logger.warn("Global scope: functions.config().app NOT found at module load.");
  }

} catch (e: unknown) {
  logger.error("CRITICAL: Error accessing functions.config() at module load:", e);
  if (e instanceof Error) {
    logger.error("Global Config Error Name:", e.name);
    logger.error("Global Config Error Message:", e.message);
  }
  // Globals will remain undefined, handlers must fetch config.
}


let globalPaystackInstance: Paystack | null = null;
if (globalPaystackSecretKey) {
  try {
    globalPaystackInstance = new Paystack(globalPaystackSecretKey);
    logger.info(
      "Global Paystack SDK instance initialized successfully at module load."
    );
  } catch (e: unknown) {
    logger.error(
      "Error initializing global Paystack SDK instance at module load:", e
    );
    globalPaystackInstance = null; // Ensure it's null if init fails
  }
} else {
  logger.warn(
    "Global Paystack secret key was not available at module load. " +
    "Global Paystack SDK instance NOT initialized. " +
    "Handlers will attempt local SDK initialization or rely on this " +
    "instance if it gets initialized later by a re-read."
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
  {region: "us-central1", timeoutSeconds: 60, memory: "256MiB"},
  async (request) => {
    logger.info("createPaystackSubscription: Invoked.", {structuredData: true, requestId: request.id});

    let currentPaystackSecretKey: string | undefined;
    let currentAppCallbackUrl: string | undefined;

    try {
      logger.info("createPaystackSubscription: Attempting to read Firebase Functions config INSIDE handler...");
      const functionsConfigAll = functions.config();
      const paystackConf = functionsConfigAll.paystack;
      const appConf = functionsConfigAll.app;

      logger.info("createPaystackSubscription: functions.config().paystack (runtime):", JSON.stringify(paystackConf || {config_not_found: true}));
      logger.info("createPaystackSubscription: functions.config().app (runtime):", JSON.stringify(appConf || {config_not_found: true}));

      currentPaystackSecretKey = globalPaystackSecretKey || paystackConf?.secret_key;
      currentAppCallbackUrl = globalAppCallbackUrl || appConf?.callback_url;

      logger.info(
        `createPaystackSubscription: PAYSTACK_SECRET_KEY. Source: ${globalPaystackSecretKey ? "global_init" : "runtime_config"}. Found: ${!!currentPaystackSecretKey}. Value: ${currentPaystackSecretKey ? "********" : "UNDEFINED"}`
      );
      logger.info(
        `createPaystackSubscription: APP_CALLBACK_URL. Source: ${globalAppCallbackUrl ? "global_init" : "runtime_config"}. Found: ${!!currentAppCallbackUrl}. Value: ${currentAppCallbackUrl || "UNDEFINED/EMPTY"}`
      );

    } catch (configError: unknown) {
      logger.error("createPaystackSubscription: CRITICAL: Error reading Firebase config INSIDE handler:", configError);
      if (configError instanceof Error) {
        logger.error("createPaystackSubscription: Config Error Name (handler):", configError.name);
        logger.error("createPaystackSubscription: Config Error Message (handler):", configError.message);
      }
      throw new HttpsError("internal", "Server configuration error during payment setup. [Code: CFG_READ_FAIL_HANDLER]");
    }

    let paystackSdkInstance: Paystack | null = null;
    if (currentPaystackSecretKey) {
      try {
        logger.info("createPaystackSubscription: Initializing Paystack SDK instance...");
        paystackSdkInstance = new Paystack(currentPaystackSecretKey);
        logger.info("createPaystackSubscription: Paystack SDK instance created successfully.");
      } catch (sdkError: unknown) {
        logger.error("createPaystackSubscription: Error initializing Paystack SDK:", sdkError);
        if (sdkError instanceof Error) {
            logger.error("createPaystackSubscription: Paystack SDK Init Error name:", sdkError.name);
            logger.error("createPaystackSubscription: Paystack SDK Init Error message:", sdkError.message);
        }
        throw new HttpsError("internal", "Failed to initialize payment service SDK. [Code: SDK_INIT_FAIL_HANDLER]");
      }
    } else {
      logger.error("createPaystackSubscription: CRITICAL: PAYSTACK_SECRET_KEY is effectively MISSING. SDK cannot be initialized.");
      // Fall-through, next check will catch this.
    }

    if (!paystackSdkInstance) {
      logger.error("createPaystackSubscription: Critical Error: Paystack SDK is not initialized. Aborting. Check PAYSTACK_SECRET_KEY.");
      throw new HttpsError("internal", "Payment system not configured (SDK missing). [Code: PSK_SDK_MISSING_FINAL]");
    }

    if (!currentAppCallbackUrl) {
      logger.error("createPaystackSubscription: Critical Error: APP_CALLBACK_URL is not configured. Aborting. Check config.");
      throw new HttpsError("internal", "Application callback URL not configured. [Code: CB_URL_MISSING_FINAL]");
    }

    const data = request.data as CreateSubscriptionData;
    const auth = request.auth;
    logger.info("createPaystackSubscription: Request data received:", JSON.stringify(data));
    logger.info("createPaystackSubscription: Auth context received:", JSON.stringify(auth ? {uid: auth.uid, email: auth.token?.email} : {auth_missing: true}));


    if (!auth) {
      logger.warn("createPaystackSubscription: Unauthenticated user attempt.");
      throw new HttpsError("unauthenticated", "User must be authenticated. [Code: AUTH_REQ]");
    }

    const userId = auth.uid;
    const clientProvidedEmail = data.email;
    const authenticatedUserEmail = auth.token?.email;
    const emailToUse = clientProvidedEmail || authenticatedUserEmail;
    const planId = data.planId;

    logger.info(`createPaystackSubscription: User ID: ${userId}, Email for Paystack: ${emailToUse ? "********" : "MISSING"}, Plan ID: ${planId}`);

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
    logger.info(`createPaystackSubscription: Generated Paystack reference: ${reference}`);

    try {
      const transactionArgs = {
        email: emailToUse,
        plan: plan.plan_code,
        reference: reference,
        callback_url:
          `${currentAppCallbackUrl}?ref=${reference}&planId=${planId}`,
        metadata: {userId, planId, service: "BrieflyAI Subscription"},
      };
      logger.info("createPaystackSubscription: Initializing Paystack transaction with args:", JSON.stringify(transactionArgs));

      const response =
        await paystackSdkInstance.transaction.initialize(transactionArgs);
      // Log the entire raw response from Paystack for debugging
      logger.info("createPaystackSubscription: Paystack transaction.initialize RAW response:", JSON.stringify(response));


      if (response.status && response.data && response.data.authorization_url) {
        logger.info("createPaystackSubscription: Paystack initialization successful. Proceeding to write to Firestore...");
        await db.collection("transactions").doc(reference).set({
          userId,
          planId,
          email: emailToUse, // Logged above
          amount: plan.amount,
          planCode: plan.plan_code,
          status: "pending_paystack_redirect",
          paystackReference: response.data.reference, // Ensure this reference exists
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`createPaystackSubscription: Transaction ${reference} successfully saved to Firestore. Returning authorization URL.`);
        return {
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference,
        };
      } else {
        logger.error(
          "createPaystackSubscription: Paystack transaction.initialize FAILED or missing authorization_url in response.data:",
          {
            message: response.message, // Paystack's message
            status: response.status,   // Paystack's status
            responseData: response.data, // The data part of Paystack's response
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
        "createPaystackSubscription: Error during Paystack transaction initialization or Firestore DB write:",
        error // Log the full error object
      );
      if (error instanceof Error) {
        logger.error("createPaystackSubscription: Caught Error Name:", error.name);
        logger.error("createPaystackSubscription: Caught Error Message:", error.message);
        if (error.stack) {
          logger.error("createPaystackSubscription: Caught Error Stack:", error.stack);
        }
      } else {
        // If it's not an Error instance, log its string representation
        logger.error("createPaystackSubscription: Caught non-Error object during transaction/DB write:", String(error));
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

  let paystackInstanceForVerify = globalPaystackInstance;
  if (!paystackInstanceForVerify) {
    // Attempt to re-initialize if global failed but key is available
    const secretKey = globalPaystackSecretKey || functions.config().paystack?.secret_key;
    if (secretKey) {
      try {
        logger.info("processChargeSuccessEvent: Global Paystack SDK was null, attempting to re-initialize for verification.");
        paystackInstanceForVerify = new Paystack(secretKey);
        logger.info("processChargeSuccessEvent: Local Paystack SDK for verification created successfully.");
      } catch (sdkError) {
        logger.error("processChargeSuccessEvent: Error re-initializing local Paystack SDK for verification:", sdkError);
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
      !verification || // Ensure verification object itself is not null/undefined
      !verification.status ||
      !verification.data || // Added check for data existence
      verification.data.status !== "success"
    ) {
      logger.error(
        "processChargeSuccessEvent: Paystack transaction re-verification " +
        "failed or not successful for reference:",
        reference,
        {
          verificationStatus: verification?.data?.status,
          verificationMessage: verification?.message,
          verificationData: verification?.data, // Log the data part of the response
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
        logger.error("processChargeSuccessEvent: Verification Error Name:", verifyError.name);
        logger.error("processChargeSuccessEvent: Verification Error Message:", verifyError.message);
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
      // Approx 30 days. For more accuracy, parse plan interval from Paystack if available.
      new Date(new Date(actualPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    ),
    paystackReference: reference,
    amountPaid: amount,
    currency: currency,
    lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    logger.info("processChargeSuccessEvent: Updating Firestore for user subscription:", {userId, reference});
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
        logger.error("processChargeSuccessEvent: Firestore Update Error Name:", dbError.name);
        logger.error("processChargeSuccessEvent: Firestore Update Error Message:", dbError.message);
    }
  }
}

export const paystackWebhookHandler = onRequest(
  {region: "us-central1", timeoutSeconds: 60, memory: "256MiB"},
  async (req, res) => {
    logger.info("paystackWebhookHandler: Invoked.", {headers: req.headers});

    let currentWebhookSecret: string | undefined;
    try {
      logger.info("paystackWebhookHandler: Attempting to read Firebase Functions config INSIDE handler...");
      const functionsConfigAll = functions.config();
      const paystackConf = functionsConfigAll.paystack;
      logger.info("paystackWebhookHandler: functions.config().paystack (runtime):", JSON.stringify(paystackConf || {config_not_found: true}));
      currentWebhookSecret = paystackConf?.webhook_secret;
      logger.info(
        `paystackWebhookHandler: PAYSTACK_WEBHOOK_SECRET. Found: ${!!currentWebhookSecret}. Value: ${currentWebhookSecret ? "********" : "UNDEFINED"}`
      );
    } catch (configError: unknown) {
      logger.error("paystackWebhookHandler: CRITICAL: Error reading Firebase config for webhook secret:", configError);
      res.status(500).send("Server configuration error (WHS CFG_READ_FAIL).");
      return;
    }


    corsHandler(req, res, async () => {
      // Log basic request info, avoid logging full body in prod if sensitive.
      // req.rawBody is logged at the beginning of the outer handler.
      logger.info("paystackWebhookHandler (cors): Request received for path:", req.path);

      // Ensure secret key for Paystack instance is available for processChargeSuccessEvent
      if (!globalPaystackInstance && !globalPaystackSecretKey && !functions.config().paystack?.secret_key) {
        logger.error(
          "paystackWebhookHandler: CRITICAL: PAYSTACK_SECRET_KEY is missing. " +
          "Cannot verify transactions if needed by processChargeSuccessEvent."
        );
        // Note: Webhook signature check itself does not need the SDK secret key.
        // But subsequent verification in processChargeSuccessEvent does.
        // We might still proceed with signature check but log this as critical.
      }

      if (!currentWebhookSecret) {
        const whsErrorMsg = "PAYSTACK_WEBHOOK_SECRET not configured. " +
         "Verify with: firebase functions:config:get paystack.webhook_secret";
        logger.error("paystackWebhookHandler: " + whsErrorMsg);
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
        const sigErrorMsg = "Invalid Paystack webhook signature. " +
          `Expected: ${hash}, Got: ${req.headers["x-paystack-signature"] || "Not present"}`;
        logger.warn("paystackWebhookHandler: " + sigErrorMsg);
        res.status(401).send("Invalid signature.");
        return;
      }

      logger.info("paystackWebhookHandler: Webhook signature VERIFIED.");
      const event = req.body; // req.body should be parsed JSON
      logger.info(
        "paystackWebhookHandler: Received Paystack event type:",
        event.event,
        "for Paystack reference:",
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
