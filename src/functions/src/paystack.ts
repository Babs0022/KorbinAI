import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import { https, logger } from "firebase-functions/v1";
import { PaystackChargeSuccessData } from "./types";

// Ensure Firebase Admin is initialized only once.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
    throw new Error("FATAL_ERROR: PAYSTACK_SECRET_KEY is not defined in environment variables. Function cannot start.");
}

const paystack = new Paystack(PAYSTACK_SECRET_KEY);

type PlanId = 'pro';
type BillingCycle = 'monthly' | 'annually';

const planDetails: Record<PlanId, {
    name: string;
    monthly: { amount: number; plan_code: string; };
    annually: { amount: number; plan_code: string; };
}> = {
    pro: {
        name: "BrieflyAI Pro",
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

export async function initializePayment(data: any, context: https.CallableContext) {
    if (!context.auth) {
        throw new https.HttpsError("unauthenticated", "You must be logged in to make a purchase.");
    }

    const { planId, billingCycle } = data;
    const { uid, email } = context.auth.token;

    if (!planId || !billingCycle || !planDetails[planId as PlanId] || !planDetails[planId as PlanId][billingCycle as BillingCycle]) {
        throw new https.HttpsError("invalid-argument", "The function must be called with a valid 'planId' and 'billingCycle'.");
    }
    
    if (!email) {
        throw new https.HttpsError("invalid-argument", "User email is not available.");
    }

    const plan = planDetails[planId as PlanId][billingCycle as BillingCycle];

    try {
        const response = await paystack.transaction.initialize({
            email: email,
            amount: plan.amount.toString(),
            plan: plan.plan_code,
            metadata: {
                user_id: uid,
                plan_id: planId,
                billing_cycle: billingCycle,
            },
        });

        if (response.status && response.data) {
            return { authorization_url: response.data.authorization_url };
        } else {
            throw new https.HttpsError("internal", "Could not initialize payment with Paystack.", response.message);
        }
    } catch (error) {
        logger.error("Paystack API call failed:", error);
        throw new https.HttpsError("internal", "An error occurred while initializing the payment.");
    }
}

export function findPlanDetailsByCode(planCode: string): { planId: PlanId | null; billingCycle: BillingCycle | null } {
    for (const planId in planDetails) {
        const details = planDetails[planId as PlanId];
        if (details.monthly.plan_code === planCode) {
            return { planId: planId as PlanId, billingCycle: 'monthly' };
        }
        if (details.annually.plan_code === planCode) {
            return { planId: planId as PlanId, billingCycle: 'annually' };
        }
    }
    return { planId: null, billingCycle: null };
}

export async function handleSuccessfulPayment(data: PaystackChargeSuccessData) {
    const { customer, plan: planCode, authorization, metadata } = data;
    const userId = metadata?.user_id;

    if (!userId) {
        logger.error("User ID not found in webhook metadata");
        return;
    }

    const { planId, billingCycle } = findPlanDetailsByCode(planCode);

    if (!planId || !billingCycle) {
        logger.error(`Plan details not found for plan code: ${planCode}`);
        return;
    }
    
    const expiresAt = new Date();
    if (billingCycle === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const subscriptionData = {
        userId,
        email: customer.email,
        planId,
        billingCycle,
        status: "active",
        provider: "paystack",
        paystack: {
            customerCode: customer.customer_code,
            subscriptionCode: authorization.authorization_code,
            planCode,
        },
        startedAt: admin.firestore.Timestamp.now(),
        currentPeriodStart: admin.firestore.Timestamp.now(),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(expiresAt),
    };

    await db.collection("users").doc(userId).collection("subscriptions").doc("paystack").set(subscriptionData, { merge: true });
    logger.info(`Subscription for user ${userId} has been created/updated.`);
}
