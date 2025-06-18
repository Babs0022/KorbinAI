
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

// Attempt to initialize Firebase Admin SDK only if no apps are already initialized.
if (!admin.apps.length) {
  console.log("[validate-referral-code-flow]: Attempting Firebase Admin SDK initialization...");
  console.log(`[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS env var: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: FIREBASE_CONFIG env var: ${process.env.FIREBASE_CONFIG || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: GCLOUD_PROJECT env var: ${process.env.GCLOUD_PROJECT || "NOT SET"}`);

  try {
    admin.initializeApp(); // For server environments, this typically relies on GOOGLE_APPLICATION_CREDENTIALS
    console.log("[validate-referral-code-flow]: Firebase Admin SDK initialized successfully.");
  } catch (e: any) {
    if (e.code === 'app/duplicate-app') {
      console.warn("[validate-referral-code-flow]: Firebase Admin SDK already initialized by another module (duplicate app error caught).");
    } else {
      console.error("--------------------------------------------------------------------------------");
      console.error("[validate-referral-code-flow]: CRITICAL ERROR initializing Firebase Admin SDK:", e.message);
      console.error("This usually means GOOGLE_APPLICATION_CREDENTIALS environment variable is NOT SET correctly for the server environment (e.g., in your .env.local file for Next.js, or .env for 'genkit dev'), or the service account key file is invalid/unreadable, or the service account lacks necessary permissions.");
      console.error("Please ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid service account JSON key file with correct permissions.");
      console.error("--------------------------------------------------------------------------------");
      // The app will likely fail when trying to use Firebase services.
    }
  }
} else {
  console.log("[validate-referral-code-flow]: Firebase Admin SDK already has an initialized app.");
}

// Declare db variable, attempt to initialize it after the app initialization logic.
let db: admin.firestore.Firestore;
try {
  // This line *must* come after initializeApp() has had a chance to run.
  // It will still throw if initializeApp failed silently or if the app object is not valid.
  if (admin.apps.length > 0) { // Only try to get firestore if an app is initialized
    db = admin.firestore();
    console.log("[validate-referral-code-flow]: Firestore instance obtained successfully.");
  } else {
    console.error("[validate-referral-code-flow]: Cannot obtain Firestore instance because no Firebase app is initialized. Check previous errors.");
    // @ts-ignore // db will be undefined, and the flow will handle it
    db = undefined; 
  }
} catch (e: any) {
  console.error("[validate-referral-code-flow]: CRITICAL ERROR obtaining Firestore instance after app init attempt:", e.message);
  console.error("[validate-referral-code-flow]: This points to a fundamental issue with Firebase Admin SDK setup or credentials.");
  // @ts-ignore
  db = undefined; // Ensure db is undefined so the flow can check
}


const ValidateReferralCodeInputSchema = z.object({
  referralCode: z.string().min(1, { message: "Referral code cannot be empty." }),
});
export type ValidateReferralCodeInput = z.infer<typeof ValidateReferralCodeInputSchema>;

const ValidateReferralCodeOutputSchema = z.object({
  isValid: z.boolean(),
  message: z.string(),
  referrerName: z.string().optional(),
  referrerId: z.string().optional(),
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
    if (!db) { // Check if db was successfully initialized
        console.error("[validateReferralCodeFlow]: Firestore service is unavailable. Aborting validation.");
        return { 
            isValid: false, 
            message: "Server configuration error. Unable to validate referral code at this moment. Please contact support if this persists.", 
            referrerName: undefined, 
            referrerId: undefined 
        };
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
           return { isValid: true, message: "Referral code is valid!", referrerName: "a user", referrerId: referralData.userId };
        }
      }
      return { isValid: true, message: "Referral code is valid!", referrerName: undefined, referrerId: undefined };

    } catch (error) {
      console.error("[validateReferralCodeFlow]: Error during Firestore query:", error);
      if (error instanceof Error && (error.message.includes("INVALID_ARGUMENT") || error.message.includes("requires an index"))) {
          console.error("[validateReferralCodeFlow]: Firestore query failed. This might be due to a MISSING INDEX. Please check your Firebase console for index creation suggestions for the 'referralCodes' collection querying 'code' and 'isActive'.");
           return { isValid: false, message: "Error validating code. Index might be missing.", referrerName: undefined, referrerId: undefined };
      }
      return { isValid: false, message: "Error validating code. Please try again.", referrerName: undefined, referrerId: undefined };
    }
  }
);

