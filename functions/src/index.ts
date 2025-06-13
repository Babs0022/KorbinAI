
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Paystack from "paystack-node";
import * as crypto from "crypto";

// Initialize CORS. Update with your actual app domain for production.
const corsHandler = require("cors")({ origin: ["http://localhost:9002", "https://your-app-domain.com"] }); // Add your production domain

admin.initializeApp();
const db = admin.firestore();

// --- IMPORTANT: SET THESE IN FIREBASE ENVIRONMENT CONFIGURATION ---
// In your terminal, run:
// firebase functions:config:set paystack.secret_key="sk_test_YOUR_PAYSTACK_TEST_SECRET_KEY"
// firebase functions:config:set paystack.webhook_secret="YOUR_CHOSEN_STRONG_WEBHOOK_SECRET"
// firebase functions:config:set app.callback_url="http://localhost:9002/dashboard?payment=success" // For local dev
// For production, callback_url: "https://your-app-domain.com/dashboard?payment=success"
// ---

const PAYSTACK_SECRET_KEY = functions.config().paystack.secret_key;
const PAYSTACK_WEBHOOK_SECRET = functions.config().paystack.webhook_secret;
const APP_CALLBACK_URL = functions.config().app.callback_url;

if (!PAYSTACK_SECRET_KEY) {
    console.error("Paystack secret key not configured in Firebase functions environment.");
    // Consider not initializing paystack if key is missing to avoid runtime errors later
}
// Initialize Paystack SDK only if the secret key is available
const paystack = PAYSTACK_SECRET_KEY ? new Paystack(PAYSTACK_SECRET_KEY) : null;


// Define amounts for your plans (in kobo, e.g., N1000 = 100000 kobo)
// These should match what you expect for "premium" and "unlimited" planIds
const planDetails: Record<string, { amount: number, name: string, plan_code?: string }> = {
    premium: { amount: 1000 * 100, name: "BrieflyAI Premium" /*, plan_code: "PLN_..." */ }, // Example: N1000
    unlimited: { amount: 3500 * 100, name: "BrieflyAI Unlimited" /*, plan_code: "PLN_..." */ }, // Example: N3500
};

export const createPaystackSubscription = functions.https.onCall(async (data, context) => {
    if (!paystack) { // Check if paystack was initialized
        console.error("Paystack SDK not initialized due to missing secret key.");
        throw new functions.https.HttpsError("internal", "Paystack not configured on the server.");
    }
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const userId = context.auth.uid;
    const email = data.email || context.auth.token?.email; // Added nullish check for token
    const planId = data.planId as string;

    if (!email || !planId || !planDetails[planId]) {
        throw new functions.https.HttpsError("invalid-argument", "Email and valid planId are required.");
    }

    const plan = planDetails[planId];
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;

    try {
        const transactionArgs = {
            email: email,
            amount: plan.amount, // Amount in kobo
            reference: reference,
            callback_url: `${APP_CALLBACK_URL}&ref=${reference}&plan=${planId}`,
            metadata: { userId, planId, service: "BrieflyAI Subscription" },
            // If using Paystack's "Plans" feature, use 'plan: plan.plan_code' instead of 'amount'
            // plan: plan.plan_code 
        };

        const response = await paystack.transaction.initialize(transactionArgs);

        if (response.status && response.data) {
            await db.collection("transactions").doc(reference).set({
                userId, planId, email, amount: plan.amount,
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
            console.error("Paystack init failed:", response.message, response.data);
            throw new functions.https.HttpsError("internal", response.message || "Paystack initialization failed.");
        }
    } catch (error: any) {
        console.error("Error initializing Paystack transaction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while initiating payment.";
        throw new functions.https.HttpsError("internal", errorMessage);
    }
});

export const paystackWebhookHandler = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (!PAYSTACK_SECRET_KEY || !PAYSTACK_WEBHOOK_SECRET) {
            console.error("Paystack secret key or webhook secret not configured for webhook handler.");
            res.status(500).send("Server configuration error for webhooks.");
            return;
        }
        
        const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
                           .update(JSON.stringify(req.body))
                           .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            console.warn("Invalid Paystack webhook signature.");
            res.status(401).send("Invalid signature.");
            return;
        }

        const event = req.body;
        functions.logger.info("Received Paystack webhook:", event);

        if (event.event === "charge.success") {
            // Destructure with potential fallback for plan_object if metadata isn't directly on event.data
            const { reference, customer, amount, metadata: directMetadata, plan_object } = event.data;
            const effectiveMetadata = directMetadata || plan_object?.metadata || {};
            
            const userId = effectiveMetadata?.userId;
            const planId = effectiveMetadata?.planId;

            if (!userId || !planId) {
                console.error("Missing userId or planId in webhook metadata for charge.success", {directMetadata, plan_object});
                res.status(400).send("Missing user or plan identifier in metadata.");
                return;
            }
            
            // Optional: Verify transaction with Paystack again here before granting access
            // if (paystack) { // Ensure paystack is initialized
            //    try {
            //        const verification = await paystack.transaction.verify({ reference });
            //        if(!verification.status || verification.data.status !== 'success') {
            //            console.error("Paystack transaction re-verification failed or not successful for reference:", reference, verification);
            //            res.status(400).send("Transaction re-verification failed.");
            //            return;
            //        }
            //    } catch (verifyError) {
            //        console.error("Error re-verifying transaction with Paystack:", verifyError);
            //        res.status(500).send("Error during transaction re-verification.");
            //        return;
            //    }
            // }


            const subscriptionData = {
                userId, planId, email: customer.email,
                status: "active",
                currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(event.data.paid_at || Date.now())),
                currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(new Date(event.data.paid_at || Date.now()).getTime() + 30 * 24 * 60 * 60 * 1000)), // Approx 30 days
                paystackReference: reference,
                amountPaid: amount,
                currency: event.data.currency, // Added currency
                lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            };

            try {
                await db.collection("userSubscriptions").doc(userId).set(subscriptionData, { merge: true });
                await db.collection("transactions").doc(reference).update({
                    status: "success",
                    paidAt: admin.firestore.Timestamp.fromDate(new Date(event.data.paid_at || Date.now())), // Ensure paid_at is valid
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                functions.logger.info(`Subscription for ${userId} (plan: ${planId}) processed.`);
                res.status(200).send("Webhook processed successfully.");
            } catch (error) {
                console.error("Error updating Firestore from webhook:", error);
                res.status(500).send("Error processing subscription update.");
            }
        } else {
            functions.logger.info("Unhandled Paystack event type:", event.event);
            res.status(200).send("Event received but not processed.");
        }
    });
});

    