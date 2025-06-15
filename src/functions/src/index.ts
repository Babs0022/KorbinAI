
import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https"; // Added onRequest
import * as logger from "firebase-functions/logger"; // Explicit logger import
import * as admin from "firebase-admin";
import Paystack from "paystack-node";
import * as crypto from "crypto";
import cors from "cors";


// Initialize CORS. Update with your actual app domain for production.
// For local testing, ensure "http://localhost:9002" (or your frontend's port)
// is included. For production, replace "https://brieflyai.xyz" with your
// actual live domain.
const corsHandler = cors({
  origin: ["http://localhost:9002", "https://brieflyai.xyz"],
});

admin.initializeApp();
const db = admin.firestore();

// --- IMPORTANT: SET THESE IN FIREBASE ENVIRONMENT CONFIGURATION ---
// In your terminal, run:
// firebase functions:config:set paystack.secret_key="YOUR_PAYSTACK_SECRET_KEY"
// firebase functions:config:set paystack.webhook_secret="YOUR_WEBHOOK_SECRET"
// firebase functions:config:set app.callback_url="YOUR_APP_CALLBACK_URL"
// Example for local dev: app.callback_url="http://localhost:9002/dashboard"
// Example for prod: app.callback_url="https://brieflyai.xyz/dashboard"
// ---

// It's safer to access config inside functions or ensure it's loaded before use.
// For global scope, this is generally okay for Firebase Functions config.
const functionsConfig = globalThis.functions?.config?.() || {}; // Helper to safely access config
const PAYSTACK_SECRET_KEY = functionsConfig.paystack?.secret_key;
const PAYSTACK_WEBHOOK_SECRET = functionsConfig.paystack?.webhook_secret;
const APP_CALLBACK_URL = functionsConfig.app?.callback_url;


let paystack: Paystack | null = null;

if (PAYSTACK_SECRET_KEY) {
  paystack = new Paystack(PAYSTACK_SECRET_KEY);
} else {
  logger.error( // Using imported logger
    "Paystack secret key not configured in Firebase functions environment. " +
    "Paystack SDK not initialized."
  );
}

// Define amounts (in Kobo) and plan codes for your plans
const planDetails: Record<string, {
  amount: number,
  name: string,
  plan_code: string
}> = {
  premium: {
    amount: 16000 * 100, // NGN 16,000 in Kobo
    name: "BrieflyAI Premium",
    plan_code: "PLN_c7d9pwc77ezn3a8", // YOUR_PREMIUM_PLAN_CODE_FROM_PAYSTACK
  },
  unlimited: {
    amount: 56000 * 100, // NGN 56,000 in Kobo
    name: "BrieflyAI Unlimited",
    plan_code: "PLN_kb83pnnocije9fz", // YOUR_UNLIMITED_PLAN_CODE_FROM_PAYSTACK
  },
};

export const createPaystackSubscription = onCall(
  { region: "us-central1" }, // It's good practice to specify region for v2
  async (request) => {
    // Extract data and auth from v2 request object
    const data = request.data as { email?: string; planId: string };
    const auth = request.auth;

    if (!paystack) {
      logger.error(
        "Paystack SDK not initialized due to missing secret key. " +
        "Cannot create subscription."
      );
      throw new HttpsError(
        "internal",
        "Payment system not configured on the server."
      );
    }
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to subscribe."
      );
    }
    if (!APP_CALLBACK_URL) {
      logger.error(
        "Application callback URL is not configured. " +
        "Cannot create subscription."
      );
      throw new HttpsError(
        "internal",
        "Application callback URL not configured."
      );
    }

    const userId = auth.uid;
    const clientProvidedEmail = data.email;
    const authenticatedUserEmail = auth.token?.email;
    const emailToUse = clientProvidedEmail || authenticatedUserEmail;
    const planId = data.planId;

    if (
      !emailToUse ||
      !planId ||
      !planDetails[planId] ||
      !planDetails[planId].plan_code
    ) {
      logger.error("Invalid data received for subscription:", {
        emailExists: !!emailToUse,
        planId,
        planDetailsExist: !!planDetails[planId],
        planCodeExists: !!planDetails[planId]?.plan_code,
      });
      throw new HttpsError(
        "invalid-argument",
        "Valid email, planId, and configured plan code are required."
      );
    }

    const plan = planDetails[planId];
    const reference = `briefly-${userId}-${planId}-${Date.now()}`;

    try {
      const transactionArgs = {
        email: emailToUse,
        plan: plan.plan_code, // Use the plan code from your Paystack dashboard
        reference: reference,
        callback_url:
          `${APP_CALLBACK_URL}&ref=${reference}&planId=${planId}`,
        metadata: {userId, planId, service: "BrieflyAI Subscription"},
      };

      const response = await paystack.transaction.initialize(transactionArgs);

      if (response.status && response.data) {
        await db.collection("transactions").doc(reference).set({
          userId,
          planId,
          email: emailToUse,
          amount: plan.amount,
          planCode: plan.plan_code,
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
        logger.error(
          "Paystack transaction.initialize failed:",
          response.message,
          response.data
        );
        const errorMessage =
          response.message || "Paystack initialization failed.";
        throw new HttpsError("internal", errorMessage);
      }
    } catch (error: unknown) {
      logger.error("Error initializing Paystack transaction:", error);
      const errorMessage =
        (error instanceof Error ? error.message : String(error)) ||
        "An unknown error occurred while initiating payment.";
      throw new HttpsError("internal", errorMessage);
    }
  }
);

export const paystackWebhookHandler = onRequest(
  { region: "us-central1" }, // Specify region for v2
  async (req, res) => {
    corsHandler(req, res, async () => {
      if (!paystack || !PAYSTACK_WEBHOOK_SECRET) {
        logger.error( // Using imported logger
          "Paystack SDK not initialized or webhook secret not configured. " +
          "Cannot process webhook."
        );
        res.status(500).send("Server configuration error for webhooks.");
        return;
      }

      const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        logger.warn("Invalid Paystack webhook signature received."); // Using imported logger
        res.status(401).send("Invalid signature.");
        return;
      }

      const event = req.body;
      logger.info("Received Paystack webhook:", event); // Using imported logger

      if (event.event === "charge.success") {
        const {
          reference,
          customer,
          amount,
          currency,
          metadata,
          plan_object: planObject, 
          paid_at: paidAt, 
        } = event.data;

        const effectiveMetadata = metadata || planObject?.metadata || {};

        const userId = effectiveMetadata?.userId;
        const planId = effectiveMetadata?.planId;

        if (!userId || !planId) {
          logger.error( // Using imported logger
            "Missing userId or planId in webhook metadata for charge.success",
            {effectiveMetadata, planObject}
          );
          res.status(400).send(
            "Missing user or plan identifier in metadata."
          );
          return;
        }

        try {
          const verification = await paystack.transaction.verify({reference});
          if (!verification.status || verification.data.status !== "success") {
            logger.error( // Using imported logger
              "Paystack transaction re-verification failed or not successful " +
              "for reference:",
              reference,
              verification
            );
            res.status(400).send("Transaction re-verification failed.");
            return;
          }
        } catch (verifyError: unknown) {
          logger.error( // Using imported logger
            "Error re-verifying transaction with Paystack:",
            (verifyError instanceof Error ?
              verifyError.message : String(verifyError))
          );
          res.status(500).send("Error during transaction re-verification.");
          return;
        }

        const actualPaidAt = paidAt || Date.now();

        const subscriptionData = {
          userId,
          planId,
          email: customer?.email,
          status: "active",
          currentPeriodStart:
            admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(
            new Date(new Date(actualPaidAt).getTime() +
              30 * 24 * 60 * 60 * 1000) // Approx 30 days
          ),
          paystackReference: reference,
          amountPaid: amount,
          currency: currency,
          lastEventTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        try {
          await db.collection("userSubscriptions").doc(userId).set(
            subscriptionData,
            {merge: true}
          );
          await db.collection("transactions").doc(reference).update({
            status: "success",
            paidAt: admin.firestore.Timestamp.fromDate(new Date(actualPaidAt)),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          logger.info( // Using imported logger
            `Subscription for ${userId}(plan:${planId}) processed successfully.`
          );
          res.status(200).send("Webhook processed successfully.");
        } catch (error: unknown) {
          logger.error( // Using imported logger
            "Error updating Firestore from webhook:",
            (error instanceof Error ? error.message : String(error))
          );
          res.status(500).send("Error processing subscription update.");
        }
      } else {
        logger.info( // Using imported logger
          "Unhandled Paystack event type received:",
          event.event
        );
        res.status(200).send("Event received but not processed.");
      }
    });
  }
);
