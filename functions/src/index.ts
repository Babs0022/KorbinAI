
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Paystack from "paystack-node";
import * as crypto from "crypto";

// Initialize CORS. Update with your actual app domain for production.
const corsHandler = require("cors")({ origin: ["http://localhost:9002", "https://your-app-domain.com"] }); // TODO: Replace "https://your-app-domain.com" with your actual live domain

admin.initializeApp();
const db = admin.firestore();

// --- IMPORTANT: SET THESE IN FIREBASE ENVIRONMENT CONFIGURATION ---
// In your terminal, run (replace placeholders with your actual values):
// firebase functions:config:set paystack.secret_key="sk_test_YOUR_PAYSTACK_TEST_SECRET_KEY"
// firebase functions:config:set paystack.webhook_secret="YOUR_CHOSEN_STRONG_WEBHOOK_SECRET"
// firebase functions:config:set app.callback_url="http://localhost:9002/dashboard?payment=success" // For local dev
// For production, callback_url: "https://your-production-app-domain.com/dashboard?payment=success"
// ---

const PAYSTACK_SECRET_KEY = functions.config().paystack?.secret_key;
const PAYSTACK_WEBHOOK_SECRET = functions.config().paystack?.webhook_secret;
const APP_CALLBACK_URL = functions.config().app?.callback_url;

if (!PAYSTACK_SECRET_KEY) {
    console.error("CRITICAL: Paystack secret key not configured in Firebase functions environment. Payment functions will fail.");
}
// Initialize Paystack SDK only if the secret key is available
const paystack = PAYSTACK_SECRET_KEY ? new Paystack(PAYSTACK_SECRET_KEY) : null;


// Define amounts (in Kobo) and plan codes for your plans
const planDetails: Record<string, { amount: number, name: string, plan_code: string }> = {
    premium: { 
        amount: 16000 * 100, // NGN 16,000 in Kobo
        name: "BrieflyAI Premium", 
        plan_code: "YOUR_PREMIUM_PLAN_CODE_FROM_PAYSTACK" // TODO: Replace with your actual Premium plan code
    },
    unlimited: { 
        amount: 56000 * 100, // NGN 56,000 in Kobo
        name: "BrieflyAI Unlimited", 
        plan_code: "YOUR_UNLIMITED_PLAN_CODE_FROM_PAYSTACK" // TODO: Replace with your actual Unlimited plan code
    },
};

export const createPaystackSubscription = functions.https.onCall(async (data, context) => {
    if (!paystack) { // Check if paystack was initialized
        console.error("Paystack SDK not initialized due to missing secret key. Cannot create subscription.");
        throw new functions.https.HttpsError("internal", "Payment system not configured on the server.");
    }
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to subscribe.");
    }
    if (!APP_CALLBACK_URL) {
        console.error("Application callback URL is not configured. Cannot create subscription.");
        throw new functions.https.HttpsError("internal", "Application callback URL not configured.");
    }

    const userId = context.auth.uid;
    const email = data.email || context.auth.token?.email; 
    const planId = data.planId as string;

    if (!email || !planId || !planDetails[planId] || !planDetails[planId].plan_code) {
        console.error("Invalid data received for subscription:", {emailExists: !!email, planId, planDetailsExist: !!planDetails[planId], planCodeExists: !!planDetails[planId]?.plan_code });
        throw new functions.https.HttpsError("invalid-argument", "Valid email, planId, and configured plan code are required.");
    }

    const plan = planDetails[planId];
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;

    try {
        const transactionArgs = {
            email: email,
            amount: plan.amount, // Paystack requires amount even with plan codes for some API versions or direct charges.
                                 // If your plan code handles the amount entirely on Paystack, this might be optional,
                                 // but it's safer to include it for consistency.
            plan: plan.plan_code, // Use the plan code from your Paystack dashboard
            reference: reference,
            callback_url: `${APP_CALLBACK_URL}&ref=${reference}&planId=${planId}`, // Ensure planId is passed back
            metadata: { userId, planId, service: "BrieflyAI Subscription" },
        };

        const response = await paystack.transaction.initialize(transactionArgs);

        if (response.status && response.data) {
            await db.collection("transactions").doc(reference).set({
                userId, planId, email, 
                amount: plan.amount, // Log the amount used for this transaction
                planCode: plan.plan_code, // Log the plan code used
                status: "pending_paystack_redirect",
                paystackReference: response.data.reference,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                authorization_url: response.data.authorization_url,
                access_code: response.data.access_code,
                reference: response.data.reference,
            };
        } else {
            console.error("Paystack transaction.initialize failed:", response.message, response.data);
            throw new functions.https.HttpsError("internal", response.message || "Paystack initialization failed.");
        }
    } catch (error: any) {
        console.error("Error initializing Paystack transaction:", error);
        const errorMessage = error.message || "An unknown error occurred while initiating payment.";
        throw new functions.https.HttpsError("internal", errorMessage);
    }
});

export const paystackWebhookHandler = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (!paystack || !PAYSTACK_WEBHOOK_SECRET) {
            console.error("Paystack SDK not initialized or webhook secret not configured. Cannot process webhook.");
            res.status(500).send("Server configuration error for webhooks.");
            return;
        }
        
        const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
                           .update(JSON.stringify(req.body)) // Ensure req.body is stringified for accurate hash
                           .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            console.warn("Invalid Paystack webhook signature received.");
            res.status(401).send("Invalid signature.");
            return;
        }

        const event = req.body;
        functions.logger.info("Received Paystack webhook:", event);

        if (event.event === "charge.success") {
            const { reference, customer, amount, currency, metadata, plan_object, paid_at } = event.data;
            // Prefer metadata directly on event.data, fallback to plan_object.metadata
            const effectiveMetadata = metadata || plan_object?.metadata || {}; 
            
            const userId = effectiveMetadata?.userId;
            const planId = effectiveMetadata?.planId;

            if (!userId || !planId) {
                console.error("Missing userId or planId in webhook metadata for charge.success", {effectiveMetadata, plan_object});
                res.status(400).send("Missing user or plan identifier in metadata.");
                return;
            }
            
            // Optional: Verify transaction with Paystack again here before granting access
            // This ensures the webhook is not stale or replayed, and data is consistent.
            try {
               const verification = await paystack.transaction.verify({ reference });
               if(!verification.status || verification.data.status !== 'success') {
                   console.error("Paystack transaction re-verification failed or not successful for reference:", reference, verification);
                   res.status(400).send("Transaction re-verification failed.");
                   return;
               }
               // You could add more checks here, e.g., verify amount matches verification.data.amount
            } catch (verifyError: any) {
               console.error("Error re-verifying transaction with Paystack:", verifyError.message);
               res.status(500).send("Error during transaction re-verification.");
               return;
            }

            const actualPaidAt = paid_at || Date.now(); // Fallback if paid_at is missing

            const subscriptionData = {
                userId, planId, 
                email: customer?.email, // customer object might not always be present on all charge.success events
                status: "active",
                currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
                // For simplicity, setting a 30-day period. For actual recurring subscriptions,
                // you'd manage this based on Paystack's subscription events or plan details.
                currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(new Date(actualPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000)), 
                paystackReference: reference,
                amountPaid: amount,
                currency: currency,
                lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            };

            try {
                await db.collection("userSubscriptions").doc(userId).set(subscriptionData, { merge: true });
                await db.collection("transactions").doc(reference).update({
                    status: "success",
                    paidAt: admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                functions.logger.info(`Subscription for ${userId} (plan: ${planId}) processed successfully.`);
                res.status(200).send("Webhook processed successfully.");
            } catch (error: any) {
                console.error("Error updating Firestore from webhook:", error.message);
                res.status(500).send("Error processing subscription update.");
            }
        } else {
            functions.logger.info("Unhandled Paystack event type received:", event.event);
            res.status(200).send("Event received but not processed.");
        }
    });
});

