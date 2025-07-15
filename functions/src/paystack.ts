
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import { PaystackChargeSuccessData } from "./types";

const db = admin.firestore();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
    throw new Error("FATAL_ERROR: PAYSTACK_SECRET_KEY is not defined in environment variables. Function cannot start.");
}

const paystack = new Paystack(PAYSTACK_SECRET_KEY);

const planDetails: Record<string, {
    name: string;
    annually: { amount: number; plan_code: string; };
}> = {
    pro: {
        name: "BrieflyAI Pro",
        annually: {
            amount: 15 * 100, // 15 USD in cents
            plan_code: "PLN_PRO_ANNUAL_BRIEFLYAI",
        },
    },
};

function findPlanDetailsByCode(planCode: string): { planId: string | null; billingCycle: 'annually' | null } {
    for (const [planId, details] of Object.entries(planDetails)) {
        if (details.annually.plan_code === planCode) {
            return { planId, billingCycle: 'annually' };
        }
    }
    return { planId: null, billingCycle: null };
}

export async function processChargeSuccessEvent(eventData: PaystackChargeSuccessData): Promise<void> {
    logger.info(`[Paystack] Processing 'charge.success' for reference: ${eventData.reference}`);

    try {
        const verification = await paystack.transaction.verify({ reference: eventData.reference });
        if (!verification.status || verification.data?.status !== 'success') {
            logger.error(`[Paystack] Transaction verification failed or status was not success for reference: ${eventData.reference}`, verification);
            return;
        }
         logger.info(`[Paystack] Transaction successfully verified for reference: ${eventData.reference}`);
    } catch (error) {
        logger.error(`[Paystack] Error during transaction verification for reference: ${eventData.reference}`, error);
        return;
    }


    const { reference, customer, amount, currency, paid_at, plan, plan_object } = eventData;

    const email = customer?.email;
    const planCode = plan_object?.plan_code || plan?.plan_code;
    const interval = plan_object?.interval || plan?.interval;

    if (!email || !planCode) {
        logger.error(`[Paystack] CRITICAL: Missing email or plan_code in payload for reference ${reference}. Cannot process.`, { email, planCode, data: eventData });
        return;
    }
    logger.info(`[Paystack] Found Email: ${email} and Plan Code: ${planCode}.`);

    const { planId } = findPlanDetailsByCode(planCode);

    if (!planId) {
        logger.error(`[Paystack] CRITICAL: Could not match plan code ${planCode} to a known plan.`);
        return;
    }
    logger.info(`[Paystack] Matched to Internal Plan ID: ${planId} with interval: ${interval}.`);

    let userRecord: admin.auth.UserRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
        logger.info(`[Paystack] Found user UID ${userRecord.uid} for email ${email}.`);
    } catch (error) {
        logger.error(`[Paystack] CRITICAL: Could not find a user with email ${email}. A user must sign up in BrieflyAI with this email first.`, { email, error });
        return; // Stop processing if no user can be found
    }

    const userId = userRecord.uid;

    try {
        const paidAtDate = new Date(paid_at || Date.now());
        const currentPeriodEndDate = new Date(paidAtDate.getTime());

        if (interval === 'annually') {
            currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
            logger.info(`[Paystack] Setting annual subscription end date for user ${userId}: ${currentPeriodEndDate.toISOString()}`);
        } else {
            // Fallback for monthly if ever re-introduced, or default
            currentPeriodEndDate.setMonth(currentPeriodEndDate.getMonth() + 1);
            logger.info(`[Paystack] Setting monthly subscription end date for user ${userId}: ${currentPeriodEndDate.toISOString()}`);
        }

        const subscriptionData = {
            userId,
            planId,
            email: customer?.email,
            status: "active",
            paymentMethod: "card",
            currentPeriodStart: admin.firestore.Timestamp.fromDate(paidAtDate),
            currentPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEndDate),
            paystackReference: reference,
            amountPaid: amount,
            currency,
            lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        logger.info(`[Paystack] Preparing to write subscription data for user ${userId}:`, subscriptionData);
        await db.collection("userSubscriptions").doc(String(userId)).set(subscriptionData, { merge: true });

        const transactionRef = db.collection("transactions").doc(reference);
        await transactionRef.set({
            userId,
            planId,
            email: customer?.email,
            amount,
            currency,
            status: "success",
            paymentMethod: "card",
            paystackReference: reference,
            paidAt: admin.firestore.Timestamp.fromDate(paidAtDate),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        logger.info(`[Paystack] SUCCESS: Updated subscription for user ${userId} (plan: ${planId}, ref: ${reference}).`);

    } catch (error) {
        logger.error(`[Paystack] FIRESTORE ERROR: Failed to write subscription/transaction data for reference ${reference}:`, error);
    }
}
