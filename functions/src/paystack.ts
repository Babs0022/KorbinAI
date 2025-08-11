
import * as logger from "firebase-functions/logger";
import Paystack from "paystack-node";
import { PaystackChargeSuccessData } from "./types";
import { adminDb, adminAuth } from "./firebase-admin";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
    throw new Error("FATAL_ERROR: PAYSTACK_SECRET_KEY is not defined in environment variables. Function cannot start.");
}

const paystack = new Paystack(PAYSTACK_SECRET_KEY);

const planDetails: Record<string, {
    name: string;
    monthly: { amount: number; plan_code: string; };
    annually: { amount: number; plan_code: string; };
}> = {
    pro: {
        name: "KorbinAI Pro",
        monthly: {
            amount: 20 * 100, // $20 in cents
            plan_code: "PLN_apm944j0mz7armb",
        },
        annually: {
            amount: 216 * 100, // $216 in cents ($20/mo * 12, discounted 10%)
            plan_code: "PLN_up61lgvt7wozomg",
        },
    },
};

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

    const { planId, billingCycle } = findPlanDetailsByCode(planCode);

    if (!planId) {
        logger.error(`[Paystack] CRITICAL: Could not match plan code ${planCode} to a known plan.`);
        return;
    }
    logger.info(`[Paystack] Matched to Internal Plan ID: ${planId} with interval: ${interval}.`);

    let userRecord;
    try {
        userRecord = await adminAuth.getUserByEmail(email);
        logger.info(`[Paystack] Found user UID ${userRecord.uid} for email ${email}.`);
    } catch (error) {
        logger.error(`[Paystack] CRITICAL: Could not find a user with email ${email}. A user must sign up in KorbinAI with this email first.`, { email, error });
        return; // Stop processing if no user can be found
    }

    const userId = userRecord.uid;

    try {
        const paidAtDate = new Date(paid_at || Date.now());
        const currentPeriodEndDate = new Date(paidAtDate.getTime());

        if (interval === 'annually' || billingCycle === 'annually') {
            currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
            logger.info(`[Paystack] Setting annual subscription end date for user ${userId}: ${currentPeriodEndDate.toISOString()}`);
        } else {
            // Fallback for monthly
            currentPeriodEndDate.setMonth(currentPeriodEndDate.getMonth() + 1);
            logger.info(`[Paystack] Setting monthly subscription end date for user ${userId}: ${currentPeriodEndDate.toISOString()}`);
        }

        const subscriptionData = {
            userId,
            planId,
            email: customer?.email,
            status: "active",
            paymentMethod: "card",
            billingCycle,
            currentPeriodStart: adminDb.Timestamp.fromDate(paidAtDate),
            currentPeriodEnd: adminDb.Timestamp.fromDate(currentPeriodEndDate),
            paystackReference: reference,
            amountPaid: amount,
            currency,
            lastEventTimestamp: adminDb.FieldValue.serverTimestamp(),
        };

        logger.info(`[Paystack] Preparing to write subscription data for user ${userId}:`, subscriptionData);
        await adminDb.collection("userSubscriptions").doc(String(userId)).set(subscriptionData, { merge: true });

        const transactionRef = adminDb.collection("transactions").doc(reference);
        await transactionRef.set({
            userId,
            planId,
            email: customer?.email,
            amount,
            currency,
            status: "success",
            paymentMethod: "card",
            paystackReference: reference,
            paidAt: adminDb.Timestamp.fromDate(paidAtDate),
            createdAt: adminDb.FieldValue.serverTimestamp(),
            updatedAt: adminDb.FieldValue.serverTimestamp(),
        }, { merge: true });

        logger.info(`[Paystack] SUCCESS: Updated subscription for user ${userId} (plan: ${planId}, ref: ${reference}).`);

    } catch (error) {
        logger.error(`[Paystack] FIRESTORE ERROR: Failed to write subscription/transaction data for reference ${reference}:`, error);
    }
}
