
'use server';
/**
 * @fileOverview A flow to validate a referral code and fetch referrer details.
 *
 * - validateReferralCode - A function that calls the flow.
 * - ValidateReferralCodeInput - The input type for the flow.
 * - ValidateReferralCodeOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  console.log("[validate-referral-code-flow]: Attempting Firebase Admin SDK initialization...");
  console.log(`[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS env var: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: FIREBASE_CONFIG env var: ${process.env.FIREBASE_CONFIG || "NOT SET"}`); // Useful if using FIREBASE_CONFIG
  console.log(`[validate-referral-code-flow]: GCLOUD_PROJECT env var: ${process.env.GCLOUD_PROJECT || "NOT SET"}`); // Useful if in GCP env

  try {
    admin.initializeApp(); // In many server environments (like local dev with GOOGLE_APPLICATION_CREDENTIALS set, or deployed GCP), this auto-detects.
    console.log("[validate-referral-code-flow]: Firebase Admin SDK initialized successfully.");
  } catch (e: any) {
    if (e.code === 'app/duplicate-app') {
      console.warn("[validate-referral-code-flow]: Firebase Admin SDK already initialized by another module.");
    } else {
      console.error("--------------------------------------------------------------------------------");
      console.error("[validate-referral-code-flow]: CRITICAL ERROR initializing Firebase Admin SDK:", e.message);
      console.error("This usually means GOOGLE_APPLICATION_CREDENTIALS environment variable is NOT SET correctly for the server environment (e.g., in your .env file for local 'genkit dev'), or the service account key file is invalid, or the service account lacks permissions.");
      console.error("Please ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid service account JSON key file.");
      console.error("--------------------------------------------------------------------------------");
      // Depending on your error handling strategy, you might re-throw or handle differently.
      // For now, db access will fail later, making the issue apparent.
    }
  }
} else {
  console.log("[validate-referral-code-flow]: Firebase Admin SDK already has an initialized app.");
}

const db = admin.firestore();

const ValidateReferralCodeInputSchema = z.object({
  referralCode: z.string().min(1, { message: "Referral code cannot be empty." }),
});
export type ValidateReferralCodeInput = z.infer<typeof ValidateReferralCodeInputSchema>;

const ValidateReferralCodeOutputSchema = z.object({
  isValid: z.boolean(),
  message: z.string(),
  referrerName: z.string().optional(),
  referrerId: z.string().optional(), // Useful for associating with the new user if needed later
});
export type ValidateReferralCodeOutput = z.infer<typeof ValidateReferralCodeOutputSchema>;

export async function validateReferralCode(input: ValidateReferralCodeInput): Promise<ValidateReferralCodeOutput> {
  return validateReferralCodeFlow(input);
}

const validateReferralCodeFlow = ai.defineFlow(
  {
    name: 'validateReferralCodeFlow',
    inputSchema: ValidateReferralCodeInputSchema,
    outputSchema: ValidateReferralCodeOutputSchema,
  },
  async ({ referralCode }) => {
    // Ensure db is available; if initialization failed, this part might not execute or db interaction will fail.
    if (!admin.apps.length) {
        console.error("[validateReferralCodeFlow]: Firebase Admin not initialized. Cannot proceed.");
        return { isValid: false, message: "Server configuration error. Cannot validate code.", referrerName: undefined, referrerId: undefined };
    }
    
    const upperCaseCode = referralCode.trim().toUpperCase();

    if (!upperCaseCode) {
      return { isValid: false, message: "Referral code cannot be empty.", referrerName: undefined, referrerId: undefined };
    }

    try {
      const referralCodesRef = db.collection("referralCodes");
      const q = referralCodesRef
        .where("code", "==", upperCaseCode)
        .where("isActive", "==", true)
        .limit(1);

      const snapshot = await q.get();

      if (snapshot.empty) {
        return { isValid: false, message: "Invalid or inactive referral code.", referrerName: undefined, referrerId: undefined };
      }

      const referralDoc = snapshot.docs[0];
      const referralData = referralDoc.data();

      if (referralData.usesLeft !== undefined && referralData.usesLeft <= 0) {
        return { isValid: false, message: "This referral code has no uses left.", referrerName: undefined, referrerId: undefined };
      }

      // Fetch referrer's display name
      if (referralData.userId) {
        const userDocRef = db.collection("users").doc(referralData.userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const displayName = userData?.displayName || "BrieflyAI User";
          const nameParts = displayName.split(" ");
          const parsedReferrerName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : displayName;
          return {
            isValid: true,
            message: "Referral code is valid!",
            referrerName: parsedReferrerName,
            referrerId: referralData.userId,
          };
        } else {
          // Referrer user document not found, but code itself is valid.
           return { isValid: true, message: "Referral code is valid!", referrerName: "a user", referrerId: referralData.userId };
        }
      }
      // Code is valid but no userId associated (should not happen for user-generated codes)
      return { isValid: true, message: "Referral code is valid!", referrerName: undefined, referrerId: undefined };

    } catch (error) {
      console.error("[validateReferralCodeFlow]: Error during Firestore query:", error);
      // Check if the error is due to missing indexes
      if (error instanceof Error && (error.message.includes("INVALID_ARGUMENT") || error.message.includes("requires an index"))) {
          console.error("[validateReferralCodeFlow]: Firestore query failed. This might be due to a MISSING INDEX. Please check your Firestore console for index creation suggestions for the 'referralCodes' collection querying 'code' and 'isActive'.");
           return { isValid: false, message: "Error validating code. Index might be missing.", referrerName: undefined, referrerId: undefined };
      }
      return { isValid: false, message: "Error validating code. Please try again.", referrerName: undefined, referrerId: undefined };
    }
  }
);

