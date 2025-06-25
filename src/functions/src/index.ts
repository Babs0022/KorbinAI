
import {
  HttpsError, onCall, onRequest,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";

// Initialize CORS middleware to be used in the webhook
const corsHandler = cors({ origin: true });

// --- Environment Variable Validation ---
// Validate these at startup to fail early and prevent runtime errors.
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const APP_CALLBACK_URL = process.env.APP_CALLBACK_URL;

if (!PAYSTACK_SECRET_KEY) {
  logger.error("CRITICAL: PAYSTACK_SECRET_KEY env var is not set. Payment functions will fail.");
}
if (!PAYSTACK_WEBHOOK_SECRET) {
  logger.error("CRITICAL: PAYSTACK_WEBHOOK_SECRET env var is not set. Webhook verification will fail.");
}
if (!APP_CALLBACK_URL) {
  logger.error("CRITICAL: APP_CALLBACK_URL env var is not set. Subscription callbacks will fail.");
}

// --- Firebase and Paystack SDK Initialization ---
try {
  admin.initializeApp();
} catch (e) {
  logger.warn("Firebase Admin SDK may have already been initialized:", e);
}
const db = admin.firestore();

// Initialize Paystack SDK once. The function will fail to deploy if the key is missing.
if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Cannot initialize Paystack SDK: PAYSTACK_SECRET_KEY is not defined in environment variables.");
}
const paystack = new Paystack(PAYSTACK_SECRET_KEY);


// --- Plan Details ---
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


// --- Callable Function: createPaystackSubscription ---
interface CreateSubscriptionData {
  email?: string;
  planId: string;
}

export const createPaystackSubscription = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    if (!PAYSTACK_SECRET_KEY || !APP_CALLBACK_URL) {
        logger.error("Server Configuration Error: Paystack Secret Key or App Callback URL is missing.");
        throw new HttpsError("internal", "Payment system is not configured correctly. Please contact support.");
    }
    
    const { auth, data } = request;
    if (!auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to subscribe.");
    }

    const { planId, email: clientProvidedEmail } = data as CreateSubscriptionData;
    const userId = auth.uid;
    const authenticatedUserEmail = auth.token?.email;
    
    const emailToUse = clientProvidedEmail || authenticatedUserEmail;
    const plan = planDetails[planId];

    if (!emailToUse || !plan || !plan.plan_code) {
      logger.error("Invalid subscription data provided:", { userId, planId, emailExists: !!emailToUse });
      throw new HttpsError("invalid-argument", "A valid email and plan ID are required.");
    }
    
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;
    
    try {
      const transactionArgs = {
        email: emailToUse,
        plan: plan.plan_code,
        reference: reference,
        callback_url: `${APP_CALLBACK_URL}?ref=${reference}&planId=${planId}&uid=${userId}`,
        metadata: { userId, planId, service: "BrieflyAI Subscription" },
      };

      logger.info("Initializing Paystack transaction with args:", transactionArgs);
      const response = await paystack.transaction.initialize(transactionArgs);

      if (!response.status || !response.data) {
        logger.error("Paystack initialization failed:", response.message);
        throw new HttpsError("internal", response.message || "Failed to initialize payment.");
      }

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

    } catch (error) {
      logger.error("Error in createPaystackSubscription:", error);
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      throw new HttpsError("internal", errorMessage);
    }
  }
);


// --- Webhook Handler: paystackWebhookHandler ---
interface PaystackChargeSuccessData {
    reference: string;
    customer?: { email?: string };
    amount: number;
    currency: string;
    metadata?: { userId?: string; planId?: string; [key: string]: unknown; };
    plan_object?: { metadata?: { userId?: string; planId?: string; [key: string]: unknown; }; };
    paid_at?: string | number;
}

async function processChargeSuccessEvent(eventData: PaystackChargeSuccessData): Promise<void> {
  const { reference, customer, amount, currency, metadata, plan_object, paid_at } = eventData;
  logger.info(`Processing 'charge.success' for reference: ${reference}`);

  // Prioritize metadata source
  const effectiveMetadata = metadata || plan_object?.metadata || {};
  const { userId, planId } = effectiveMetadata;

  if (!userId || !planId) {
    logger.error(`Webhook Error: Missing userId or planId in metadata for reference ${reference}.`, { effectiveMetadata });
    return;
  }

  try {
    const verification = await paystack.transaction.verify({ reference });
    if (!verification.status || verification.data.status !== "success") {
      logger.error(`Transaction re-verification failed for reference ${reference}. Status: ${verification.data?.status}`, { verification });
      return;
    }
    logger.info(`Transaction re-verified successfully for reference: ${reference}`);

    const paidAtDate = new Date(paid_at || Date.now());
    const currentPeriodEndDate = new Date(paidAtDate.getTime());
    currentPeriodEndDate.setDate(currentPeriodEndDate.getDate() + 30); // Add 30 days for subscription period

    const subscriptionData = {
      userId,
      planId,
      email: customer?.email,
      status: "active",
      currentPeriodStart: admin.firestore.Timestamp.fromDate(paidAtDate),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEndDate),
      paystackReference: reference,
      amountPaid: amount,
      currency,
      lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("userSubscriptions").doc(String(userId)).set(subscriptionData, { merge: true });
    await db.collection("transactions").doc(reference).update({
      status: "success",
      paidAt: admin.firestore.Timestamp.fromDate(paidAtDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Successfully updated subscription for user ${userId} (plan: ${planId}, ref: ${reference}).`);

  } catch (error) {
    logger.error(`Error processing charge success event for reference ${reference}:`, error);
  }
}

export const paystackWebhookHandler = onRequest({ region: "us-central1" }, (req, res) => {
    corsHandler(req, res, async () => {
        if (!PAYSTACK_WEBHOOK_SECRET) {
            logger.error("Webhook handler called, but PAYSTACK_WEBHOOK_SECRET is not configured.");
            res.status(500).send("Webhook secret is not configured on the server.");
            return;
        }

        const requestBodyString = req.rawBody?.toString();
        if (!requestBodyString) {
            logger.error("Webhook received with no raw body for signature verification.");
            res.status(400).send("Raw request body is required.");
            return;
        }
        
        const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
            .update(requestBodyString)
            .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            logger.warn("Invalid webhook signature received.");
            res.status(401).send("Invalid signature.");
            return;
        }
        
        const event = req.body;
        logger.info(`Webhook received: ${event.event}`, { reference: event.data?.reference || "N/A" });
        
        if (event.event === "charge.success") {
            // Acknowledge immediately to prevent Paystack from retrying.
            res.status(200).send({ message: "Webhook acknowledged, processing in background." });
            // Process the event asynchronously.
            await processChargeSuccessEvent(event.data as PaystackChargeSuccessData);
        } else {
            res.status(200).send({ message: "Event received and acknowledged (unhandled type)." });
        }
    });
});
