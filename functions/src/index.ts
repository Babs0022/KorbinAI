
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as functions from "firebase-functions"; // For top-level access and v2 onRequest
import { onCall as onCallV1, HttpsError, type CallableContext } from "firebase-functions/v1/https"; // Specific v1 imports for onCall

// Import Paystack using require for broader compatibility if 'paystack-node' causes issues with ES module resolution in Functions
// If you have "type": "module" in your functions/package.json, you might use: import Paystack from 'paystack-node';
const Paystack = require("paystack-node");


// Initialize CORS. Update with your actual app domain for production.
// For local testing, ensure "http://localhost:9002" (or your frontend's port) is included.
// For production, replace "https://brieflyai.xyz" with your actual live domain.
const corsHandler = require("cors")({ origin: ["http://localhost:9002", "https://brieflyai.xyz"] }); 

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

let paystack: any = null; // Initialize as null, type will be Paystack instance

if (PAYSTACK_SECRET_KEY) {
    paystack = new Paystack(PAYSTACK_SECRET_KEY);
} else {
    console.error("Paystack secret key not configured in Firebase functions environment. Paystack SDK not initialized.");
}

// Define amounts (in Kobo) and plan codes for your plans
const planDetails: Record<string, { amount: number, name: string, plan_code: string }> = {
    premium: { 
        amount: 16000 * 100, // NGN 16,000 in Kobo
        name: "BrieflyAI Premium", 
        plan_code: "PLN_c7d9pwc77ezn3a8" // TODO: Replace with your actual Premium plan code
    },
    unlimited: { 
        amount: 56000 * 100, // NGN 56,000 in Kobo
        name: "BrieflyAI Unlimited", 
        plan_code: "PLN_kb83pnnocije9fz" // TODO: Replace with your actual Unlimited plan code
    },
};

export const createPaystackSubscription = onCallV1(async (data: { email?: string; planId: string }, context: CallableContext) => {
    if (!paystack) { // Check if paystack was initialized
        console.error("Paystack SDK not initialized due to missing secret key. Cannot create subscription.");
        throw new HttpsError("internal", "Payment system not configured on the server.");
    }
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to subscribe.");
    }
    if (!APP_CALLBACK_URL) {
        console.error("Application callback URL is not configured. Cannot create subscription.");
        throw new HttpsError("internal", "Application callback URL not configured.");
    }

    const userId = context.auth.uid;
    const clientProvidedEmail = data.email;
    const authenticatedUserEmail = context.auth.token?.email;
    const emailToUse = clientProvidedEmail || authenticatedUserEmail; 
    const planId = data.planId; // planId from client payload

    if (!emailToUse || !planId || !planDetails[planId] || !planDetails[planId].plan_code) {
        console.error("Invalid data received for subscription:", {emailExists: !!emailToUse, planId, planDetailsExist: !!planDetails[planId], planCodeExists: !!planDetails[planId]?.plan_code });
        throw new HttpsError("invalid-argument", "Valid email, planId, and configured plan code are required.");
    }

    const plan = planDetails[planId];
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;

    try {
        const transactionArgs = {
            email: emailToUse,
            // amount: plan.amount, // Paystack uses amount from plan_code if provided
            plan: plan.plan_code, // Use the plan code from your Paystack dashboard
            reference: reference,
            callback_url: `${APP_CALLBACK_URL}&ref=${reference}&planId=${planId}`, // Ensure planId is passed back
            metadata: { userId, planId, service: "BrieflyAI Subscription" },
        };

        const response = await paystack.transaction.initialize(transactionArgs);

        if (response.status && response.data) {
            await db.collection("transactions").doc(reference).set({
                userId, planId, email: emailToUse, 
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
            const errorMessage = response.message || "Paystack initialization failed.";
            throw new HttpsError("internal", errorMessage);
        }
    } catch (error: any) {
        console.error("Error initializing Paystack transaction:", error);
        const errorMessage = error.message || "An unknown error occurred while initiating payment.";
        throw new HttpsError("internal", errorMessage);
    }
});

export const paystackWebhookHandler = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (!paystack || !PAYSTACK_WEBHOOK_SECRET) { // Check if paystack SDK initialized and webhook secret exists
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
                email: customer?.email, 
                status: "active",
                currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
                currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(new Date(actualPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000)), 
                paystackReference: reference,
                amountPaid: amount,
                currency: currency, // Added currency
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
    