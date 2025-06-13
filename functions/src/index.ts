
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Paystack from "paystack-node";
import * as crypto from "crypto";

// Initialize CORS. 
// TODO: Replace "https://your-app-domain.com" with your actual app domain for production.
const corsHandler = require("cors")({ origin: ["http://localhost:9002", "https://your-app-domain.com"] });

admin.initializeApp();
const db = admin.firestore();

// --- IMPORTANT: SET THESE IN FIREBASE ENVIRONMENT CONFIGURATION ---
// In your terminal, run:
// firebase functions:config:set paystack.secret_key="sk_test_YOUR_PAYSTACK_TEST_SECRET_KEY"
// firebase functions:config:set paystack.webhook_secret="YOUR_CHOSEN_STRONG_WEBHOOK_SECRET"
// firebase functions:config:set app.callback_url="http://localhost:9002/dashboard?payment=success" // For local dev
// For production, callback_url should be: "https://your-app-domain.com/dashboard?payment=success" 
// (Ensure this matches the domain in corsHandler and your Paystack dashboard settings)
// ---

const PAYSTACK_SECRET_KEY = functions.config().paystack.secret_key;
const PAYSTACK_WEBHOOK_SECRET = functions.config().paystack.webhook_secret;
const APP_CALLBACK_URL = functions.config().app.callback_url;

if (!PAYSTACK_SECRET_KEY) {
    console.error("CRITICAL: Paystack secret key not configured in Firebase functions environment. Run `firebase functions:config:set paystack.secret_key=...`");
}
if (!PAYSTACK_WEBHOOK_SECRET) {
    console.error("CRITICAL: Paystack webhook secret not configured. Run `firebase functions:config:set paystack.webhook_secret=...`");
}
if (!APP_CALLBACK_URL) {
    console.error("CRITICAL: Application callback URL not configured. Run `firebase functions:config:set app.callback_url=...`");
}

const paystack = new Paystack(PAYSTACK_SECRET_KEY);

// TODO: CUSTOMIZE PLAN DETAILS
// Define amounts for your plans (in kobo for NGN, cents for USD, etc. - smallest currency unit)
// These should match what you expect for "premium" and "unlimited" planIds
const planDetails: Record<string, { amount: number, name: string, plan_code?: string }> = {
    premium: { 
        amount: 1000 * 100, // Example: N1000.00 (100000 kobo). Adjust to your pricing.
        name: "BrieflyAI Premium",
        // plan_code: "PLN_YOUR_PREMIUM_PLAN_CODE" // Uncomment and use if you have a Paystack Plan Code
    },
    unlimited: { 
        amount: 3500 * 100, // Example: N3500.00 (350000 kobo). Adjust to your pricing.
        name: "BrieflyAI Unlimited",
        // plan_code: "PLN_YOUR_UNLIMITED_PLAN_CODE" // Uncomment and use if you have a Paystack Plan Code
    },
};

export const createPaystackSubscription = functions.https.onCall(async (data, context) => {
    if (!PAYSTACK_SECRET_KEY) {
        throw new functions.https.HttpsError("internal", "Paystack integration is not configured on the server.");
    }
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to perform this action.");
    }

    const userId = context.auth.uid;
    const email = data.email || context.auth.token.email; // Use email from client or auth token
    const planId = data.planId as string;

    if (!email || !planId || !planDetails[planId]) {
        throw new functions.https.HttpsError("invalid-argument", "Valid email and planId are required.");
    }

    const plan = planDetails[planId];
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;

    try {
        const transactionArgs: any = {
            email: email,
            reference: reference,
            callback_url: `${APP_CALLBACK_URL}&ref=${reference}&plan=${planId}`, // Append reference and plan for client-side handling
            metadata: { 
                userId, 
                planId, 
                service: "BrieflyAI Subscription",
                // You can add more custom fields if needed by Paystack or your app
                // custom_fields: [ 
                //    { display_name: "User ID", variable_name: "user_id", value: userId }
                // ]
            },
        };

        // Use Paystack Plan Code if available, otherwise use amount
        if (plan.plan_code) {
            transactionArgs.plan = plan.plan_code;
        } else {
            transactionArgs.amount = plan.amount; // Amount in kobo/cents
        }
        
        const response = await paystack.transaction.initialize(transactionArgs);

        if (response.status && response.data) {
            // Log transaction attempt in Firestore
            await db.collection("transactions").doc(reference).set({
                userId, 
                planId, 
                email, 
                amount: plan.amount, // Store the intended amount
                status: "pending_paystack_redirect",
                paystackReference: response.data.reference, // This is Paystack's own reference for the transaction
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                authorization_url: response.data.authorization_url,
                access_code: response.data.access_code,
                reference: response.data.reference, // Return Paystack's reference
            };
        } else {
            console.error("Paystack initialization failed:", response.message, response.data);
            throw new functions.https.HttpsError("internal", response.message || "Paystack transaction initialization failed.");
        }
    } catch (error: any) {
        console.error("Error initializing Paystack transaction:", error);
        // Avoid leaking too much internal error detail to client
        throw new functions.https.HttpsError("internal", "Could not initiate payment. Please try again or contact support.");
    }
});

export const paystackWebhookHandler = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => { // Wrap with corsHandler
        if (!PAYSTACK_SECRET_KEY || !PAYSTACK_WEBHOOK_SECRET) {
            console.error("Paystack secret key or webhook secret is not configured for webhook handler.");
            res.status(500).send("Server configuration error: Paystack secrets missing.");
            return;
        }
        
        // Validate Paystack signature
        const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
                           .update(JSON.stringify(req.body)) // Stringify the raw request body
                           .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            console.warn("Invalid Paystack webhook signature received.");
            res.status(401).send("Invalid signature.");
            return;
        }

        const event = req.body;
        functions.logger.info("Received Paystack webhook event:", { event_type: event.event, reference: event.data?.reference });

        if (event.event === "charge.success") {
            const { reference, customer, amount, metadata, paid_at } = event.data;
            
            // Extract userId and planId from metadata (ensure your initialize call includes these)
            const userId = metadata?.userId;
            const planId = metadata?.planId;

            if (!reference) {
                console.error("Webhook Error: 'charge.success' event missing transaction reference.", event.data);
                res.status(400).send("Transaction reference missing in webhook payload.");
                return;
            }
            if (!userId || !planId) {
                console.error("Webhook Error: Missing userId or planId in webhook metadata for charge.success. Reference:", reference, "Metadata:", metadata);
                res.status(400).send("Missing user or plan identifier in metadata.");
                return;
            }
            
            // Optional: Verify the transaction again with Paystack to be absolutely sure
            // try {
            //     const verification = await paystack.transaction.verify({ reference });
            //     if(!verification.status || verification.data.status !== 'success' || verification.data.amount !== amount) {
            //        console.error("Webhook Error: Transaction verification failed or mismatch for reference:", reference, verification.data);
            //        res.status(400).send("Transaction verification failed or data mismatch.");
            //        return;
            //     }
            // } catch (verifyError) {
            //     console.error("Webhook Error: Error during Paystack transaction verification for reference:", reference, verifyError);
            //     res.status(500).send("Error verifying transaction.");
            //     return;
            // }

            const subscriptionEndDate = new Date(paid_at || Date.now());
            // TODO: Set subscription end date accurately based on plan (e.g., 30 days for monthly)
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // Example: Add 30 days

            const subscriptionData = {
                userId, 
                planId, 
                email: customer?.email,
                status: "active", // Mark as active
                currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(paid_at || Date.now())),
                currentPeriodEnd: admin.firestore.Timestamp.fromDate(subscriptionEndDate),
                paystackReference: reference,
                paystackCustomerId: customer?.customer_code,
                amountPaid: amount, // Amount is in kobo/cents
                lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            };

            try {
                // Store/Update subscription in Firestore (e.g., /userSubscriptions/{userId})
                // Using set with {merge: true} to create or update.
                await db.collection("userSubscriptions").doc(userId).set(subscriptionData, { merge: true });
                
                // Update original transaction log status
                await db.collection("transactions").doc(reference).update({
                    status: "success",
                    paidAt: admin.firestore.Timestamp.fromDate(new Date(paid_at || Date.now())),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                functions.logger.info(`Subscription for ${userId} (plan: ${planId}, ref: ${reference}) successfully processed and Firestore updated.`);
                res.status(200).send("Webhook processed successfully for charge.success.");
            } catch (error) {
                console.error("Webhook Error: Error updating Firestore for charge.success. Reference:", reference, error);
                res.status(500).send("Error processing subscription update in database.");
            }
        } else if (event.event === "subscription.create") {
            // Handle Paystack subscription object creation if you use that flow
            functions.logger.info("Paystack event: subscription.create", event.data);
            // You might store subscription details here, like subscription code, customer code etc.
            res.status(200).send("Event: subscription.create received.");
        } else if (event.event === "subscription.disable") {
            // Handle subscription cancellation
            functions.logger.info("Paystack event: subscription.disable", event.data);
            // const customerCode = event.data.customer.customer_code;
            // Find user by customerCode and update their subscription status to "cancelled" or "inactive"
            res.status(200).send("Event: subscription.disable received.");
        } else {
            functions.logger.info("Received unhandled Paystack event type:", event.event);
            res.status(200).send("Event received but not specifically processed.");
        }
    });
});

    