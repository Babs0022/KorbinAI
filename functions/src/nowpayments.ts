
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const db = admin.firestore();

export async function processNowPaymentsWebhook(event: any): Promise<void> {
    const orderId = event.order_id;
    if (!orderId || typeof orderId !== "string" || orderId.split("_").length !== 3) {
        logger.error(`[NOWPayments] Invalid or missing order_id format in payload: ${orderId}`);
        throw new Error("Invalid order_id format.");
    }

    const [userId, planId, billingCycle] = orderId.split("_");

    logger.info(`[NOWPayments] Processing successful payment for User ID: ${userId}, Plan: ${planId}, Cycle: ${billingCycle}`);

    try {
        const userRef = await admin.auth().getUser(userId);
        if (!userRef) {
            logger.error(`[NOWPayments] User with ID ${userId} not found in Firebase Auth.`);
            throw new Error("User not found.");
        }

        const paidAtDate = new Date(event.created_at || Date.now());
        const currentPeriodEndDate = new Date(paidAtDate.getTime());

        if (billingCycle === 'annually') {
            currentPeriodEndDate.setFullYear(currentPeriodEndDate.getFullYear() + 1);
        } else {
            currentPeriodEndDate.setMonth(currentPeriodEndDate.getMonth() + 1);
        }

        const subscriptionData = {
            userId,
            planId,
            email: userRef.email,
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

    } catch (error) {
        logger.error(`[NOWPayments] FIRESTORE/AUTH ERROR: Failed to write subscription data for order ${orderId}:`, error);
        throw error;
    }
}
