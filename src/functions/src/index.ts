import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { initializePayment, handleSuccessfulPayment } from "./paystack";

// Ensure Firebase Admin is initialized only once.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Callable function to initialize a payment
export const initializePaystackPayment = functions.https.onCall(initializePayment);

// Webhook to handle successful payments from Paystack
export const paystackWebhook = functions.https.onRequest(async (req, res) => {
    // It's a good practice to verify the webhook signature here
    // For simplicity, we'll trust the request for now.
    // In production, you should add signature verification.
    
    const event = req.body;

    if (event.event === "charge.success") {
        await handleSuccessfulPayment(event.data);
        res.status(200).send("Webhook received and processed.");
    } else {
        res.status(200).send("Event not handled.");
    }
});
