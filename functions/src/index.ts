
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

// --- Firebase Admin SDK Initialization ---
try {
  admin.initializeApp();
} catch (e) {
  logger.warn("Firebase Admin SDK may have already been initialized:", e);
}
const db = admin.firestore();


// --- Plan Details ---
const planDetails: Record<string, {
  name: string;
  monthly: { amount: number; plan_code: string; };
  annually: { amount: number; plan_code: string; };
}> = {
  premium: {
    name: "BrieflyAI Premium",
    monthly: {
      amount: 16000 * 100, // NGN 16,000 in Kobo
      plan_code: "PLN_c7d9pwc77ezn3a8",
    },
    annually: {
      amount: 172800 * 100, // NGN 172,800 in Kobo (10% discount)
      plan_code: "PLN_ip0rfr3kbnjd0oh",
    },
  },
  unlimited: {
    name: "BrieflyAI Unlimited",
    monthly: {
      amount: 56000 * 100, // NGN 56,000 in Kobo
      plan_code: "PLN_kb83pnnocije9fz",
    },
    annually: {
        amount: 604800 * 100, // NGN 604,800 in Kobo (10% discount)
        plan_code: "PLN_a90hrxjuodtw4ia",
    }
  },
};


// --- Callable Function: createPaystackSubscription ---
interface CreateSubscriptionData {
  email?: string;
  planId: string;
  billingCycle: 'monthly' | 'annually';
}

export const createPaystackSubscription = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const APP_CALLBACK_URL = process.env.APP_CALLBACK_URL;
    
    if (!PAYSTACK_SECRET_KEY || !APP_CALLBACK_URL) {
        logger.error("Server Configuration Error: Paystack Secret Key or App Callback URL is missing.");
        throw new HttpsError("internal", "Payment system is not configured correctly. Please contact support.");
    }
    
    // Initialize Paystack SDK inside the function for robustness
    const paystack = new Paystack(PAYSTACK_SECRET_KEY);

    const { auth, data } = request;
    if (!auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to subscribe.");
    }

    const { planId, email: clientProvidedEmail, billingCycle } = data as CreateSubscriptionData;
    const userId = auth.uid;
    const authenticatedUserEmail = auth.token?.email;
    
    const emailToUse = clientProvidedEmail || authenticatedUserEmail;
    const plan = planDetails[planId];
    const selectedPlan = plan?.[billingCycle];

    if (!emailToUse || !plan || !selectedPlan || !selectedPlan.plan_code || selectedPlan.plan_code.includes('REPLACE_WITH')) {
      logger.error("Invalid subscription data provided or placeholder plan code used:", { userId, planId, billingCycle, emailExists: !!emailToUse });
      throw new HttpsError("invalid-argument", "A valid email, plan ID, and billing cycle are required, and plan codes must be configured.");
    }
    
    const reference = `briefly-${userId}-${planId}-${billingCycle}-${Date.now()}`;
    
    try {
      const transactionArgs = {
        email: emailToUse,
        plan: selectedPlan.plan_code,
        reference: reference,
        callback_url: `${APP_CALLBACK_URL}?ref=${reference}&planId=${planId}&uid=${userId}`,
        metadata: { userId, planId, billingCycle, service: "BrieflyAI Subscription" },
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
        billingCycle,
        email: emailToUse,
        amount: selectedPlan.amount,
        planCode: selectedPlan.plan_code,
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
interface PaystackPlanObject {
    interval?: 'monthly' | 'annually' | string;
    metadata?: { userId?: string; planId?: string; [key: string]: unknown; };
}
interface PaystackChargeSuccessData {
    reference: string;
    customer?: { email?: string };
    amount: number;
    currency: string;
    metadata?: { userId?: string; planId?: string; [key: string]: unknown; };
    plan_object?: PaystackPlanObject;
    paid_at?: string | number;
}

async function processChargeSuccessEvent(eventData: PaystackChargeSuccessData, paystackInstance: Paystack): Promise<void> {
  const { reference, customer, amount, currency, metadata, plan_object, paid_at } = eventData;
  logger.info(`Processing 'charge.success' for reference: ${reference}`);

  const effectiveMetadata = metadata || plan_object?.metadata || {};
  const { userId, planId } = effectiveMetadata;

  if (!userId || !planId) {
    logger.error(`Webhook Error: Missing userId or planId in metadata for reference ${reference}.`, { effectiveMetadata });
    return;
  }

  try {
    const verification = await paystackInstance.transaction.verify({ reference });
    if (!verification.status || verification.data.status !== "success") {
      logger.error(`Transaction re-verification failed for reference ${reference}. Status: ${verification.data?.status}`, { verification });
      return;
    }
    logger.info(`Transaction re-verified successfully for reference: ${reference}`);

    const paidAtDate = new Date(paid_at || Date.now());
    const currentPeriodEndDate = new Date(paidAtDate.getTime());
    
    // Set subscription end date based on plan interval from Paystack
    if (plan_object?.interval === 'annually') {
        currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
    } else {
        // Default to monthly for 'monthly' or any other interval string
        currentPeriodEndDate.setDate(currentPeriodEndDate.getDate() + 30);
    }

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
        const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

        if (!PAYSTACK_WEBHOOK_SECRET || !PAYSTACK_SECRET_KEY) {
            logger.error("Webhook handler called, but Paystack secrets are not configured.");
            res.status(500).send("Webhook secret is not configured on the server.");
            return;
        }

        // Initialize Paystack SDK inside the webhook handler as well
        const paystack = new Paystack(PAYSTACK_SECRET_KEY);

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
            res.status(200).send({ message: "Webhook acknowledged, processing in background." });
            await processChargeSuccessEvent(event.data as PaystackChargeSuccessData, paystack);
        } else {
            res.status(200).send({ message: "Event received and acknowledged (unhandled type)." });
        }
    });
});
