
import {
  HttpsError, onRequest,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";

// Initialize CORS middleware to be used in the webhook
const corsHandler = cors({ origin: true });

// --- Environment Variable Validation ---
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

if (!PAYSTACK_SECRET_KEY) {
  logger.error("CRITICAL: PAYSTACK_SECRET_KEY env var is not set. Payment functions will fail.");
  throw new Error("FATAL_ERROR: PAYSTACK_SECRET_KEY is not defined in environment variables. Function cannot start.");
}
if (!PAYSTACK_WEBHOOK_SECRET) {
  logger.error("CRITICAL: PAYSTACK_WEBHOOK_SECRET env var is not set. Webhook verification will fail.");
}

// --- Firebase and Paystack SDK Initialization ---
try {
  admin.initializeApp();
} catch (e) {
  logger.warn("Firebase Admin SDK may have already been initialized:", e);
}
const db = admin.firestore();
const paystack = new Paystack(PAYSTACK_SECRET_KEY);


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

/**
 * Finds the internal plan ID (e.g., 'premium') and billing cycle from a Paystack plan code.
 * @param {string} planCode The plan code from Paystack.
 * @returns An object containing the planId and billingCycle, or null if not found.
 */
function findPlanDetailsByCode(planCode: string): { planId: string | null; billingCycle: 'monthly' | 'annually' | null } {
    for (const [planId, details] of Object.entries(planDetails)) {
        if (details.monthly.plan_code === planCode) {
            return { planId, billingCycle: 'monthly' };
        }
        if (details.annually.plan_code === planCode) {
            return { planId, billingCycle: 'annually' };
        }
    }
    return { planId: null, billingCycle: null };
}

// --- Webhook Handler: paystackWebhookHandler ---
interface PaystackCustomer {
    email?: string;
}

interface PaystackPlan {
    plan_code?: string;
    name?: string;
}

interface PaystackChargeSuccessData {
    reference: string;
    customer?: PaystackCustomer;
    amount: number;
    currency: string;
    paid_at?: string | number;
    plan?: PaystackPlan; // For subscription charge events
}

async function processChargeSuccessEvent(eventData: PaystackChargeSuccessData): Promise<void> {
  const { reference, customer, amount, currency, paid_at, plan } = eventData;
  logger.info(`Processing 'charge.success' or 'subscription.charge.success' for reference: ${reference}`);

  const email = customer?.email;
  const planCode = plan?.plan_code;

  if (!email || !planCode) {
    logger.error(`Webhook Error: Missing email or plan_code in payload for reference ${reference}.`, { email, planCode });
    return;
  }
  
  const { planId } = findPlanDetailsByCode(planCode);

  if (!planId) {
      logger.error(`Webhook Error: Could not match plan code ${planCode} to a known plan.`);
      return;
  }

  let userRecord: admin.auth.UserRecord;
  try {
      userRecord = await admin.auth().getUserByEmail(email);
      logger.info(`Found user UID ${userRecord.uid} for email ${email}.`);
  } catch (error) {
      logger.error(`Webhook Error: Could not find a user with email ${email}. A user must sign up in BrieflyAI with this email first.`, { email, error });
      return; // Stop processing if no user can be found
  }

  const userId = userRecord.uid;

  try {
    const paidAtDate = new Date(paid_at || Date.now());
    const currentPeriodEndDate = new Date(paidAtDate.getTime());
    
    // Determine subscription interval from the plan name in the payload if available.
    // This is a fallback; a more robust method is checking against our plan codes.
    const planName = plan?.name?.toLowerCase() || '';
    if (planName.includes('annual') || planName.includes('yearly')) {
        currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
    } else {
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
    
    // Also log the transaction itself for auditing purposes
    const transactionRef = db.collection("transactions").doc(reference);
    await transactionRef.set({
      userId,
      planId,
      email: customer?.email,
      amount,
      currency,
      status: "success",
      paystackReference: reference,
      paidAt: admin.firestore.Timestamp.fromDate(paidAtDate),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });


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
        
        // Paystack sends 'charge.success' for one-time payments and initial subscription payments.
        // It sends 'subscription.charge.success' for recurring subscription payments.
        // We can handle both with the same logic.
        if (event.event === "charge.success" || event.event === "subscription.charge.success") {
            res.status(200).send({ message: "Webhook acknowledged, processing in background." });
            await processChargeSuccessEvent(event.data as PaystackChargeSuccessData);
        } else {
            logger.info(`Unhandled event type received: ${event.event}`);
            res.status(200).send({ message: "Event received and acknowledged (unhandled type)." });
        }
    });
});
