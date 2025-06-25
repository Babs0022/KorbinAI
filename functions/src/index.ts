
import {
  HttpsError, onCall, onRequest, CallableRequest,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";

// Environment variable logging at module load (cold start)
logger.info(
  "Function Cold Start: Reading environment variables from process.env.",
);
const PAYSTACK_SECRET_KEY_AT_LOAD = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET_AT_LOAD =
  process.env.PAYSTACK_WEBHOOK_SECRET;
const APP_CALLBACK_URL_AT_LOAD = process.env.APP_CALLBACK_URL;

if (!PAYSTACK_SECRET_KEY_AT_LOAD) {
  logger.warn(
    "Cold Start: PAYSTACK_SECRET_KEY env var is"
    + " MISSING or empty!",
  );
} else {
  logger.info(
    "Cold Start: PAYSTACK_SECRET_KEY env var"
    + " FOUND (length > 0).",
  );
}
if (!PAYSTACK_WEBHOOK_SECRET_AT_LOAD) {
  logger.warn(
    "Cold Start: PAYSTACK_WEBHOOK_SECRET env var is"
    + " MISSING or empty!",
  );
} else {
  logger.info(
    "Cold Start: PAYSTACK_WEBHOOK_SECRET env var"
    + " FOUND (length > 0).",
  );
}
if (!APP_CALLBACK_URL_AT_LOAD) {
  logger.warn(
    "Cold Start: APP_CALLBACK_URL env var is"
    + " MISSING or empty!",
  );
} else {
  logger.info(
    "Cold Start: APP_CALLBACK_URL env var"
    + " FOUND (length > 0).",
  );
}

try {
  admin.initializeApp();
} catch (e) {
  logger.warn(
    "Firebase Admin SDK already initialized or init failed:", e,
  );
}
const db = admin.firestore();

const planDetails: Record<string, {
  amount: number,
  name: string,
  plan_code: string
}> = {
  premium: {
    amount: 16000 * 100, // NGN 16,000 in Kobo
    name: "BrieflyAI Premium",
    plan_code: "PLN_c7d9pwc77ezn3a8", // Replace with actual plan code
  },
  unlimited: {
    amount: 56000 * 100, // NGN 56,000 in Kobo
    name: "BrieflyAI Unlimited",
    plan_code: "PLN_kb83pnnocije9fz", // Replace with actual plan code
  },
};

interface CreateSubscriptionData {
  email?: string;
  planId: string;
}

/**
 * Creates a Paystack subscription initialization.
 * @param {CallableRequest<CreateSubscriptionData>} request The request.
 * @return {Promise<{authorization_url: string, access_code: string, reference: string}>}
 *  The Paystack authorization details.
 * @throws {HttpsError} If authentication or arguments are invalid.
 */
export const createPaystackSubscription = onCall(
  {region: "us-central1", enforceAppCheck: false},
  async (request: CallableRequest<CreateSubscriptionData>) => {
    logger.info(
      "createPaystackSubscription invoked. Validating env vars...",
    );
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const appCallbackUrl = process.env.APP_CALLBACK_URL;

    if (!paystackSecretKey) {
      logger.error(
        "Invocation: CRITICAL: PAYSTACK_SECRET_KEY process.env var "
        + "is MISSING.",
      );
      throw new HttpsError(
        "internal",
        "Payment system configuration error. "
        + "[Code: PSK_ENV_MISSING]",
      );
    }
    if (!appCallbackUrl) {
      logger.error(
        "Invocation: CRITICAL: APP_CALLBACK_URL process.env var is MISSING.",
      );
      throw new HttpsError(
        "internal",
        "Application callback URL configuration error. "
        + "[Code: CB_ENV_MISSING]",
      );
    }
    logger.info(
      "Invocation: PAYSTACK_SECRET_KEY and"
      + " APP_CALLBACK_URL check passed.",
    );

    let paystackSdkInstance: Paystack;
    try {
      paystackSdkInstance = new Paystack(paystackSecretKey);
      logger.info(
        "Paystack SDK instance created successfully for this call.",
      );
    } catch (sdkError: unknown) {
      logger.error("Error initializing Paystack SDK instance:", sdkError);
      let message = "Failed to initialize payment service SDK.";
      if (sdkError instanceof Error) {
        message = sdkError.message;
      }
      throw new HttpsError(
        "internal",
        `${message} [Code: SDK_INIT_FAIL]`,
      );
    }

    const data = request.data;
    const auth = request.auth;

    if (!auth) {
      logger.warn(
        "createPaystackSubscription: Unauthenticated user attempt.",
      );
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to subscribe. [Code: AUTH_REQ]",
      );
    }

    const userId = auth.uid;
    const clientProvidedEmail = data.email;
    const authenticatedUserEmail = auth.token?.email;
    const emailToUse = clientProvidedEmail || authenticatedUserEmail;
    const planId = data.planId;

    if (
      !emailToUse
      || !planId
      || !planDetails[planId]
      || !planDetails[planId].plan_code
    ) {
      logger.error(
        "createPaystackSubscription: Invalid data for subscription:",
        {
          emailExists: !!emailToUse,
          planId: planId,
          planDetailsExist: !!planDetails[planId],
          planCodeExists: !!planDetails[planId]?.plan_code,
        },
      );
      throw new HttpsError(
        "invalid-argument",
        "Valid email and planId are required. "
        + "[Code: INVALID_ARGS]",
      );
    }

    const plan = planDetails[planId];
    const reference
      = `briefly-${userId}-${planId}-${Date.now()}`;

    try {
      const transactionArgs = {
        email: emailToUse,
        plan: plan.plan_code,
        reference: reference,
        callback_url:
          `${appCallbackUrl}?ref=${reference}&planId=${planId}&uid=${userId}`,
        metadata: {userId, planId, service: "BrieflyAI Subscription"},
      };
      logger.info(
        "createPaystackSubscription: Initializing transaction with args:",
        transactionArgs,
      );

      const response =
        await paystackSdkInstance.transaction.initialize(transactionArgs);
      logger.info(
        "createPaystackSubscription: Paystack response:",
        response,
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
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: response.data.reference,
        };
      } else {
        logger.error(
          "createPaystackSubscription: Paystack init failed:",
          {message: response.message, data: response.data},
        );
        const errorMessage =
          response.message
          || "Paystack initialization indicated failure.";
        throw new HttpsError(
          "internal", errorMessage + " [Code: PSTK_INIT_FAIL]",
        );
      }
    } catch (error: unknown) {
      logger.error(
        "createPaystackSubscription: Error during transaction init/DB write:",
        error,
      );
      const errorMessage =
        (error instanceof Error ? error.message : String(error))
        || "Unknown error during payment initiation.";
      throw new HttpsError(
        "internal", errorMessage + " [Code: UNKNOWN_INIT_ERR]",
      );
    }
  },
);

interface PaystackCustomer {
  email?: string;
}
interface PaystackPlanObject {
  metadata?: {
    userId?: string;
    planId?: string;
    [key: string]: unknown; // Allow other metadata properties
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
    [key: string]: unknown; // Allow other metadata properties
  };
  plan_object?: PaystackPlanObject; // plan_object for subscriptions
  paid_at?: string | number; // Can be ISO string or timestamp
  // Add other fields from Paystack charge.success event as needed
}

/**
 * Processes a successful charge event from Paystack.
 * Verifies the transaction and updates Firestore.
 * @param {PaystackChargeSuccessData} eventData The data from Paystack.
 * @return {Promise<void>}
 */
async function processChargeSuccessEvent(
  eventData: PaystackChargeSuccessData,
): Promise<void> {
  logger.info(
    "processChargeSuccessEvent: Starting for reference:", eventData.reference,
  );

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    logger.error(
      "processChargeSuccessEvent: PAYSTACK_SECRET_KEY env var is MISSING. "
      + "Cannot verify transaction.",
    );
    return; // Cannot proceed without SDK for verification
  }

  let paystackSdkInstance: Paystack;
  try {
    paystackSdkInstance = new Paystack(paystackSecretKey);
  } catch (e: unknown) {
    logger.error(
      "processChargeSuccessEvent: Failed to init Paystack SDK.", e,
    );
    return;
  }

  const {
    reference,
    customer,
    amount,
    currency,
    metadata, // Direct metadata from the event
    plan_object: planObject, // Metadata often lives here for subscriptions
    paid_at: paidAt,
  } = eventData;

  // Prioritize direct metadata, then plan_object metadata.
  const effectiveMetadata
    = metadata || planObject?.metadata || {};
  const userId = effectiveMetadata?.userId;
  const planId = effectiveMetadata?.planId;

  if (!userId || !planId) {
    const directMeta = JSON.stringify(metadata);
    const planObjMeta = JSON.stringify(planObject?.metadata);
    logger.error(
      `processChargeSuccessEvent: Missing userId/planId for ref ${reference}. `
      + `Direct metadata: ${directMeta}, Plan object: ${planObjMeta}`,
    );
    return;
  }

  try {
    logger.info(
      "processChargeSuccessEvent: Verifying transaction with Paystack "
      + "for reference:", reference,
    );
    const verification =
      await paystackSdkInstance.transaction.verify({reference});
    logger.info(
      "processChargeSuccessEvent: Paystack verification response for "
      + `reference ${reference}:`, verification,
    );

    if (!verification.status || verification.data.status !== "success") {
      logger.error(
        "processChargeSuccessEvent: Paystack transaction re-verification "
        + `failed for reference ${reference}:`,
        {
          verificationStatus: verification.data?.status,
          verificationMessage: verification.message,
        },
      );
      return;
    }
    logger.info(
      "processChargeSuccessEvent: Transaction re-verified "
      + "with Paystack for reference:", reference,
    );
  } catch (verifyError: unknown) {
    logger.error(
      "processChargeSuccessEvent: Error re-verifying transaction "
      + `with Paystack for reference ${reference}:`,
      (verifyError instanceof Error
        ? verifyError.message
        : String(verifyError)),
    );
    return;
  }

  const actualPaidAt = paidAt || Date.now();
  const paidAtDate
    = new Date(actualPaidAt);
  // Ensure currentPeriodEnd is distinctly after currentPeriodStart
  const currentPeriodEndDate
    = new Date(paidAtDate.getTime());
  currentPeriodEndDate.setDate(currentPeriodEndDate.getDate() + 30);


  const subscriptionData = {
    userId,
    planId,
    email: customer?.email,
    status: "active",
    currentPeriodStart: admin.firestore.Timestamp.fromDate(paidAtDate),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEndDate),
    paystackReference: reference,
    amountPaid: amount,
    currency: currency,
    lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("userSubscriptions").doc(userId).set(
      subscriptionData,
      {merge: true},
    );
    await db.collection("transactions").doc(reference).update({
      status: "success",
      paidAt: admin.firestore.Timestamp.fromDate(paidAtDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(
      `processChargeSuccessEvent: Subscription for ${userId} `
      + `(plan:${planId}, ref:${reference}) updated in Firestore.`,
    );
  } catch (dbError: unknown) {
    logger.error(
      "processChargeSuccessEvent: Error updating Firestore for "
      + `reference ${reference}, userId ${userId}:`,
      (dbError instanceof Error
        ? dbError.message
        : String(dbError)),
    );
  }
}


/**
 * Handles Paystack webhook events.
 * @param {onRequest.Request} req The Express request object.
 * @param {onRequest.Response} res The Express response object.
 * @return {Promise<void>}
 */
export const paystackWebhookHandler = onRequest(
  {region: "us-central1"},
  async (req, res) => {
    logger.info("paystackWebhookHandler invoked.");
    const paystackWebhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!paystackWebhookSecret) {
      logger.error(
        "Invocation: CRITICAL: PAYSTACK_WEBHOOK_SECRET process.env "
        + "var is MISSING.",
      );
      res.status(500).send(
        "Webhook secret configuration error. "
        + "[Code: WHS_ENV_MISSING]",
      );
      return;
    }
    logger.info(
      "Invocation: PAYSTACK_WEBHOOK_SECRET check passed at invocation.",
    );

    const requestBodyString = req.rawBody?.toString();
    if (!requestBodyString) {
      logger.error(
        "Raw request body missing for signature verification.",
      );
      res.status(400).send("Raw request body required.");
      return;
    }

    const hash = crypto.createHmac("sha512", paystackWebhookSecret)
      .update(requestBodyString)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      logger.warn(
        "Invalid Paystack webhook signature. "
        + `Expected: ${hash}, Got: ${req.headers["x-paystack-signature"]}`,
      );
      res.status(401).send("Invalid signature.");
      return;
    }

    const event = req.body;
    logger.info(
      "Received Paystack webhook event:",
      event.event,
      "for reference:",
      event.data?.reference || "N/A",
    );

    if (event.event === "charge.success") {
      // Acknowledge immediately
      res.status(200).send({
        message: "Webhook acknowledged. Processing in background.",
      });

      try {
        await processChargeSuccessEvent(
          event.data as PaystackChargeSuccessData,
        );
        logger.info(
          "Background processing for charge.success completed for "
          + `event reference: ${event.data?.reference || "N/A"}`,
        );
      } catch (processingError: unknown) {
        logger.error(
          "Error during background processing of charge.success for "
          + `event reference: ${event.data?.reference || "N/A"}`,
          processingError,
        );
        // Already sent 200 OK, cannot send error response here.
      }
    } else {
      logger.info(
        "Unhandled Paystack event type:",
        event.event,
      );
      res.status(200).send({
        message: "Event received and acknowledged "
        + "(unhandled type).",
      });
    }
  },
);

    