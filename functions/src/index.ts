import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import cors from "cors";
import { processChargeSuccessEvent } from "./paystack";
import { processNowPaymentsWebhook } from "./nowpayments";
import { PaystackChargeSuccessData } from "./types";

// --- Initialization ---
const corsHandler = cors({ origin: true });

// Initialize without arguments to automatically use Application Default Credentials.
// This is the standard and most reliable method for Cloud Functions.
if (!admin.apps.length) {
    admin.initializeApp();
}

// --- Webhook Handlers ---

// Paystack Webhook
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

if (!PAYSTACK_WEBHOOK_SECRET) {
    logger.error("CRITICAL: PAYSTACK_WEBHOOK_SECRET env var is not set. Webhook verification will fail.");
}

export const paystackWebhookHandler = onRequest({ region: "us-central1" }, (req, res) => {
    corsHandler(req, res, async () => {
        if (!PAYSTACK_WEBHOOK_SECRET) {
            logger.error("[Paystack] Handler called, but PAYSTACK_WEBHOOK_SECRET is not configured. Aborting.");
            res.status(500).send("Webhook secret is not configured on the server.");
            return;
        }

        const requestBodyString = req.rawBody?.toString();
        if (!requestBodyString) {
            logger.error("[Paystack] Received request with no raw body for signature verification.");
            res.status(400).send("Raw request body is required.");
            return;
        }

        const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
            .update(requestBodyString)
            .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            logger.warn("[Paystack] Invalid signature received. Potential security issue.", { signature: req.headers["x-paystack-signature"] });
            res.status(401).send("Invalid signature.");
            return;
        }

        const event = req.body;
        logger.info(`[Paystack] Received valid event: ${event.event}`, { reference: event.data?.reference || "N/A" });

        if (event.event === "charge.success" || event.event === "subscription.charge.success") {
            res.status(200).send({ message: "Webhook acknowledged, processing in background." });
            await processChargeSuccessEvent(event.data as PaystackChargeSuccessData);
        } else {
            logger.info(`[Paystack] Unhandled event type received and acknowledged: ${event.event}`);
            res.status(200).send({ message: "Event received and acknowledged (unhandled type)." });
        }
    });
});


// NOWPayments Webhook
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET_KEY;

if (!NOWPAYMENTS_IPN_SECRET) {
    logger.warn("Warning: NOWPAYMENTS_IPN_SECRET_KEY env var is not set. Crypto payments will fail.");
}

export const nowpaymentsWebhookHandler = onRequest({ region: "us-central1" }, (req, res) => {
    corsHandler(req, res, async () => {
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

        if (event.payment_status !== "finished" && event.payment_status !== "paid") {
            logger.info(`[NOWPayments] Ignoring unhandled payment status: ${event.payment_status}`);
            res.status(200).send("Webhook received (unhandled status).");
            return;
        }

        try {
            await processNowPaymentsWebhook(event);
            res.status(200).send("Webhook processed successfully.");
        } catch (error) {
            logger.error(`[NOWPayments] Error processing webhook:`, error);
            res.status(500).send("Internal server error while processing webhook.");
        }
    });
});
