
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
  // Throwing an error here prevents the function from deploying/starting if misconfigured.
  throw new Error("FATAL_ERROR: PAYSTACK_SECRET_KEY is not defined in environment variables. Function cannot start.");
}
if (!PAYSTACK_WEBHOOK_SECRET) {
  // We log an error but don't throw, so the function can start, but webhook verification will fail.
  logger.error("CRITICAL: PAYSTACK_WEBHOOK_SECRET env var is not set. Webhook verification will fail.");
}

// --- Firebase and Paystack SDK Initialization ---
try {
  admin.initializeApp();
} catch (e) {
  logger.warn("Firebase Admin SDK may have already been initialized:", e);
}
const db = admin.firestore();
// Initialize the SDK once, but ensure the key is present.
const paystack = new Paystack(PAYSTACK_SECRET_KEY);


// --- Plan Details ---
// This is the source of truth for mapping Paystack plan codes to internal plan IDs.
// Updated with correct plan codes from the user's dashboard screenshot.
const planDetails: Record<string, {
  name: string;
  monthly: { amount: number; plan_code: string; };
  annually: { amount: number; plan_code: string; };
}> = {
  premium: {
    name: "BrieflyAI Premium",
    monthly: {
      amount: 100 * 100, // NGN 100 in Kobo for testing
      plan_code: "PLN_c7d9pwc77ezn3a8", // From screenshot
    },
    annually: {
      amount: 100 * 100, // NGN 100 in Kobo for testing
      plan_code: "PLN_ipOrfr3kbnjdOoh", // From screenshot, assumes O is a letter not zero
    },
  },
  unlimited: {
    name: "BrieflyAI Unlimited",
    monthly: {
      amount: 100 * 100, // NGN 100 in Kobo for testing
      plan_code: "PLN_kb83pnnocije9fz", // From screenshot
    },
    annually: {
        amount: 100 * 100, // NGN 100 in Kobo for testing
        plan_code: "PLN_a90hrxjuodtw4ia", // From screenshot
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

// This interface now supports both `plan` (from one-time charges) and `plan_object` (from subscriptions)
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
    plan?: PaystackPlan; // For one-time payment page charges
    plan_object?: PaystackPlan; // For subscription charges
}

// This function is now more robust and has detailed logging.
async function processChargeSuccessEvent(eventData: PaystackChargeSuccessData): Promise<void> {
  logger.info(`[Webhook] Processing 'charge.success' for reference: ${eventData.reference}`);

  const { reference, customer, amount, currency, paid_at, plan, plan_object } = eventData;

  const email = customer?.email;
  // **THE FIX**: Check both `plan_object` (from subscriptions) and `plan` (from payment pages) for the plan code.
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
      return; // Stop processing if no user can be found
  }

  const userId = userRecord.uid;

  try {
    const paidAtDate = new Date(paid_at || Date.now());
    const currentPeriodEndDate = new Date(paidAtDate.getTime());
    
    // Set subscription end date based on the plan's interval.
    if (interval === 'annually') {
        currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
        logger.info(`[Webhook] Setting annual subscription end date for user ${userId}: ${currentPeriodEndDate.toISOString()}`);
    } else { // Default to monthly for 'monthly' or any other unexpected case
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Should only be set on creation
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
        
        // Handle both initial charge and recurring subscription charges with the same logic
        if (event.event === "charge.success" || event.event === "subscription.charge.success") {
            // Acknowledge the event immediately to prevent Paystack from retrying.
            res.status(200).send({ message: "Webhook acknowledged, processing in background." });
            // Process the event asynchronously.
            await processChargeSuccessEvent(event.data as PaystackChargeSuccessData);
        } else {
            logger.info(`[Webhook] Unhandled event type received and acknowledged: ${event.event}`);
            res.status(200).send({ message: "Event received and acknowledged (unhandled type)." });
        }
    });
});


// --- NOWPayments Integration ---
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET_KEY;

if (!NOWPAYMENTS_IPN_SECRET) {
  // Log a warning but don't crash the whole deployment if only this is missing
  logger.warn("Warning: NOWPAYMENTS_IPN_SECRET_KEY env var is not set. Crypto payments will fail.");
}

/**
 * Handles Instant Payment Notifications (IPN) from NOWPayments.
 * Verifies the payment and updates the user's subscription in Firestore.
 * This function expects an 'order_id' in the format: 'userId_planId_billingCycle'
 * e.g., 'aBcDeFg123_premium_monthly'
 */
export const nowpaymentsWebhookHandler = onRequest({ region: "us-central1" }, async (req, res) => {
    if (!NOWPAYMENTS_IPN_SECRET) {
        logger.error("[NOWPayments] Handler called, but IPN secret is not configured.");
        res.status(500).send("IPN secret is not configured on the server.");
        return;
    }

    const signature = req.headers["x-nowpayments-sig"] as string;
    if (!signature) {
        logger.warn("[NOWPayments] Received request without signature.");
        res.status(401).send("Missing signature.");
        return;
    }
    
    // NOWPayments requires the body to be stringified with sorted keys for signature verification
    const requestBodyString = JSON.stringify(req.body, Object.keys(req.body).sort());
    
    try {
        const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET);
        const expectedSignature = hmac.update(requestBodyString).digest("hex");

        if (signature !== expectedSignature) {
            logger.warn("[NOWPayments] Invalid signature received.", { received: signature });
            res.status(401).send("Invalid signature.");
            return;
        }
    } catch (error) {
        logger.error("[NOWPayments] Error during signature verification:", error);
        res.status(500).send("Signature verification failed.");
        return;
    }

    const event = req.body;
    logger.info(`[NOWPayments] Received valid IPN for payment ID: ${event.payment_id}, status: ${event.payment_status}`);
    
    // We only care about successfully completed payments
    if (event.payment_status !== "finished" && event.payment_status !== "paid") {
      logger.info(`[NOWPayments] Ignoring unhandled payment status: ${event.payment_status}`);
      res.status(200).send("Webhook received (unhandled status).");
      return;
    }

    const orderId = event.order_id;
    if (!orderId || typeof orderId !== "string" || orderId.split("_").length !== 3) {
      logger.error(`[NOWPayments] Invalid or missing order_id format in payload: ${orderId}`);
      res.status(400).send("Invalid order_id format.");
      return;
    }
    
    const [userId, planId, billingCycle] = orderId.split("_");
    
    logger.info(`[NOWPayments] Processing successful payment for User ID: ${userId}, Plan: ${planId}, Cycle: ${billingCycle}`);

    try {
        const userRef = await admin.auth().getUser(userId);
        if (!userRef) {
            logger.error(`[NOWPayments] User with ID ${userId} not found in Firebase Auth.`);
            res.status(404).send("User not found.");
            return;
        }

        const paidAtDate = new Date(event.created_at || Date.now());
        const currentPeriodEndDate = new Date(paidAtDate.getTime());
        
        if (billingCycle === 'annually') {
            currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
        } else { // default to monthly
            currentPeriodEndDate.setMonth(currentPeriodEndDate.getMonth() + 1);
        }

        const subscriptionData = {
          userId,
          planId,
          email: userRef.email, // Get email from the user record
          status: "active",
          paymentMethod: "crypto",
          currentPeriodStart: admin.firestore.Timestamp.fromDate(paidAtDate),
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEndDate),
          nowpaymentsPaymentId: event.payment_id,
          amountPaid: event.price_amount,
          currency: event.price_currency,
          lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("userSubscriptions").doc(userId).set(subscriptionData, { merge: true });

        const transactionRef = db.collection("transactions").doc(String(event.payment_id));
        await transactionRef.set({
          userId,
          planId,
          email: userRef.email,
          amount: event.price_amount,
          currency: event.price_currency,
          status: "success",
          paymentMethod: "crypto",
          nowpaymentsPaymentId: event.payment_id,
          paidAt: admin.firestore.Timestamp.fromDate(paidAtDate),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        logger.info(`[NOWPayments] SUCCESS: Updated crypto subscription for user ${userId}.`);
        res.status(200).send("Webhook processed successfully.");

    } catch (error) {
        logger.error(`[NOWPayments] FIRESTORE/AUTH ERROR: Failed to write subscription data for order ${orderId}:`, error);
        res.status(500).send("Internal server error while updating subscription.");
    }
});
