
import {
  onRequest,
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
      plan_code: "PLN_adn4uwot-5",
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
      plan_code: "PLN_cnfqzc7xw1",
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
    interval?: 'monthly' | 'annually' | string;
}

interface PaystackChargeSuccessData {
    reference: string;
    customer?: PaystackCustomer;
    amount: number;
    currency: string;
    paid_at?: string | number;
    plan?: PaystackPlan;
    plan_object?: PaystackPlan;
}

async function processChargeSuccessEvent(eventData: PaystackChargeSuccessData): Promise<void> {
  logger.info(`[Webhook] Processing 'charge.success' for reference: ${eventData.reference}`);

  const { reference, customer, amount, currency, paid_at, plan, plan_object } = eventData;

  const email = customer?.email;
  const planCode = plan_object?.plan_code || plan?.plan_code;
  const interval = plan_object?.interval || plan?.interval;

  if (!email || !planCode) {
    logger.error(`[Webhook] CRITICAL: Missing email or plan_code in payload for reference ${reference}. Cannot process.`, { email, planCode, data: eventData });
    return;
  }
  logger.info(`[Webhook] Found Email: ${email} and Plan Code: ${planCode}.`);

  const { planId } = findPlanDetailsByCode(planCode);

  if (!planId) {
      logger.error(`[Webhook] CRITICAL: Could not match plan code ${planCode} to a known plan.`);
      return;
  }
  logger.info(`[Webhook] Matched to Internal Plan ID: ${planId} with interval: ${interval}.`);

  let userRecord: admin.auth.UserRecord;
  try {
      userRecord = await admin.auth().getUserByEmail(email);
      logger.info(`[Webhook] Found user UID ${userRecord.uid} for email ${email}.`);
  } catch (error) {
      logger.error(`[Webhook] CRITICAL: Could not find a user with email ${email}. A user must sign up in BrieflyAI with this email first.`, { email, error });
      return;
  }

  const userId = userRecord.uid;

  try {
    const paidAtDate = new Date(paid_at || Date.now());
    const currentPeriodEndDate = new Date(paidAtDate.getTime());
    
    if (interval === 'annually') {
        currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
        logger.info(`[Webhook] Setting annual subscription end date for user ${userId}: ${currentPeriodEndDate.toISOString()}`);
    } else {
        currentPeriodEndDate.setMonth(currentPeriodEndDate.getMonth() + 1);
        logger.info(`[Webhook] Setting monthly subscription end date for user ${userId}: ${currentPeriodEndDate.toISOString()}`);
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

    logger.info(`[Webhook] Preparing to write subscription data for user ${userId}:`, subscriptionData);
    await db.collection("userSubscriptions").doc(String(userId)).set(subscriptionData, { merge: true });
    
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

    logger.info(`[Webhook] SUCCESS: Updated subscription for user ${userId} (plan: ${planId}, ref: ${reference}).`);

  } catch (error) {
    logger.error(`[Webhook] FIRESTORE ERROR: Failed to write subscription/transaction data for reference ${reference}:`, error);
  }
}

export const paystackWebhookHandler = onRequest({ region: "us-central1" }, (req, res) => {
    corsHandler(req, res, async () => {
        if (!PAYSTACK_WEBHOOK_SECRET) {
            logger.error("[Webhook] Handler called, but PAYSTACK_WEBHOOK_SECRET is not configured. Aborting.");
            res.status(500).send("Webhook secret is not configured on the server.");
            return;
        }

        const requestBodyString = req.rawBody?.toString();
        if (!requestBodyString) {
            logger.error("[Webhook] Received request with no raw body for signature verification.");
            res.status(400).send("Raw request body is required.");
            return;
        }
        
        const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
            .update(requestBodyString)
            .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            logger.warn("[Webhook] Invalid signature received. Potential security issue.", { signature: req.headers["x-paystack-signature"]});
            res.status(401).send("Invalid signature.");
            return;
        }
        
        const event = req.body;
        logger.info(`[Webhook] Received valid event: ${event.event}`, { reference: event.data?.reference || "N/A" });
        
        if (event.event === "charge.success" || event.event === "subscription.charge.success") {
            res.status(200).send({ message: "Webhook acknowledged, processing in background." });
            await processChargeSuccessEvent(event.data as PaystackChargeSuccessData);
        } else {
            logger.info(`[Webhook] Unhandled event type received and acknowledged: ${event.event}`);
            res.status(200).send({ message: "Event received and acknowledged (unhandled type)." });
        }
    });
});
