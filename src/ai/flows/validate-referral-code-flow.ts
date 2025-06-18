
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
import fs from 'fs'; // For reading the service account file
import path from 'path'; // For path manipulation

// Declare db variable, initialize to undefined. It will be set if admin init succeeds.
let db: admin.firestore.Firestore | undefined;

// Attempt to initialize Firebase Admin SDK only if no apps are already initialized.
// This block runs when the module is first loaded.
if (!admin.apps.length) {
  console.log("[validate-referral-code-flow]: Attempting Firebase Admin SDK initialization (module load)...");
  const credsEnvVar = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log(`[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS env var: ${credsEnvVar || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: FIREBASE_CONFIG env var: ${process.env.FIREBASE_CONFIG || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: GCLOUD_PROJECT env var: ${process.env.GCLOUD_PROJECT || "NOT SET"}`);

  try {
    if (credsEnvVar) {
      console.log(`[validate-referral-code-flow]: Attempting to load service account from: ${credsEnvVar}`);
      // Resolve path: If it's an absolute path, it will be used. If relative, it's relative to process.cwd().
      // For consistent behavior, especially if running from different directories (e.g. genkit dev vs next dev),
      // it's often better to ensure GOOGLE_APPLICATION_CREDENTIALS is an absolute path or relative to a fixed point.
      const serviceAccountPath = path.resolve(credsEnvVar); 
      console.log(`[validate-referral-code-flow]: Resolved service account path to: ${serviceAccountPath}`);

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountFileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountFileContent);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log("[validate-referral-code-flow]: Firebase Admin SDK initialized successfully using explicit credential from GOOGLE_APPLICATION_CREDENTIALS.");
      } else {
        console.error(`[validate-referral-code-flow]: Service account file NOT FOUND at resolved path: ${serviceAccountPath}. Falling back to default initialization which will likely fail if explicit path was intended.`);
        admin.initializeApp(); // Fallback to default discovery
        console.log("[validate-referral-code-flow]: Attempted Firebase Admin SDK initialization with default discovery (fallback after file not found). This may not work if credentials aren't available through other means.");
      }
    } else {
      console.warn("[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS not set. Attempting default Firebase Admin SDK initialization (likely to fail without other config).");
      admin.initializeApp(); // Default initialization
      console.log("[validate-referral-code-flow]: Firebase Admin SDK initialized with default discovery (no explicit creds path).");
    }

    // Now that an app should exist, try to get Firestore instance.
    if (admin.apps.length > 0 && admin.app().name) { 
        db = admin.firestore();
        console.log("[validate-referral-code-flow]: Firestore instance obtained successfully.");
    } else {
        console.error("[validate-referral-code-flow]: CRITICAL: Firebase Admin SDK initializeApp() called, but no usable app found. Firestore unavailable.");
        db = undefined;
    }
  } catch (e: any) {
    console.error("--------------------------------------------------------------------------------");
    console.error("[validate-referral-code-flow]: CRITICAL ERROR during Firebase Admin SDK initializeApp() or credential loading:", e.message);
    console.error("Stack:", e.stack);
    console.error("This usually means GOOGLE_APPLICATION_CREDENTIALS environment variable is NOT SET correctly, the service account key file is invalid/unreadable/malformed JSON, or the service account lacks necessary permissions.");
    console.error("Please ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid, readable service account JSON key file with correct permissions in your .env.local file and RESTART your development server.");
    console.error("--------------------------------------------------------------------------------");
    db = undefined; // Ensure db is undefined if init fails
  }
} else {
  console.log("[validate-referral-code-flow]: Firebase Admin SDK already has an initialized app (module load). Attempting to get Firestore.");
  try {
    if (admin.app().name) { 
        db = admin.firestore();
        console.log("[validate-referral-code-flow]: Firestore instance obtained from existing app.");
    } else {
        console.error("[validate-referral-code-flow]: Existing Firebase app found, but it seems unusable (e.g. unnamed). Firestore unavailable.");
        db = undefined;
    }
  } catch (e: any) {
     console.error("[validate-referral-code-flow]: CRITICAL ERROR obtaining Firestore instance from existing app:", e.message);
     db = undefined;
  }
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
    if (!db) { 
        console.error("[validateReferralCodeFlow - IN FLOW]: Firestore service is unavailable (db instance is undefined). Aborting validation.");
        console.error("[validateReferralCodeFlow - IN FLOW]: This indicates a problem with Firebase Admin SDK initialization. CHECK SERVER LOGS for details on GOOGLE_APPLICATION_CREDENTIALS and initialization errors.");
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
      console.log(`[validateReferralCodeFlow - IN FLOW]: Querying for code: ${upperCaseCode}`);
      const referralCodesRef = db.collection("referralCodes");
      const q = referralCodesRef
        .where("code", "==", upperCaseCode)
        .where("isActive", "==", true)
        .limit(1);

      const snapshot = await q.get();

      if (snapshot.empty) {
        console.log(`[validateReferralCodeFlow - IN FLOW]: Code ${upperCaseCode} not found or not active.`);
        return { isValid: false, message: "Invalid or inactive referral code.", referrerName: undefined, referrerId: undefined };
      }

      const referralDoc = snapshot.docs[0];
      const referralData = referralDoc.data();
      console.log(`[validateReferralCodeFlow - IN FLOW]: Found code ${upperCaseCode}, data:`, JSON.stringify(referralData));


      if (referralData.usesLeft !== undefined && referralData.usesLeft <= 0) {
        console.log(`[validateReferralCodeFlow - IN FLOW]: Code ${upperCaseCode} has no uses left.`);
        return { isValid: false, message: "This referral code has no uses left.", referrerName: undefined, referrerId: undefined };
      }

      if (referralData.userId) {
        const userDocRef = db.collection("users").doc(referralData.userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const displayName = userData?.displayName || "BrieflyAI User";
          const nameParts = displayName.split(" ");
          // If name has more than one word, take the last word. Otherwise, take the full name.
          const parsedReferrerName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : displayName;
          console.log(`[validateReferralCodeFlow - IN FLOW]: Code ${upperCaseCode} is valid. Referrer: ${parsedReferrerName}`);
          return {
            isValid: true,
            message: "Referral code is valid!",
            referrerName: parsedReferrerName,
            referrerId: referralData.userId,
          };
        } else {
           console.log(`[validateReferralCodeFlow - IN FLOW]: Code ${upperCaseCode} is valid, but referrer user doc ${referralData.userId} not found.`);
           return { isValid: true, message: "Referral code is valid!", referrerName: "a user", referrerId: referralData.userId };
        }
      }
      // Should not happen if userId is always set on referral codes, but as a fallback:
      console.log(`[validateReferralCodeFlow - IN FLOW]: Code ${upperCaseCode} is valid but has no associated userId in referralData.`);
      return { isValid: true, message: "Referral code is valid!", referrerName: undefined, referrerId: undefined };

    } catch (error) {
      console.error("[validateReferralCodeFlow - IN FLOW]: Error during Firestore query:", error);
      // Check for Firestore index missing error specifically
      if (error instanceof Error && (error.message.includes("INVALID_ARGUMENT") || error.message.includes("requires an index"))) {
          console.error("[validateReferralCodeFlow - IN FLOW]: Firestore query failed. This might be due to a MISSING INDEX. Please check your Firebase console for index creation suggestions for the 'referralCodes' collection querying 'code' (ASC) and 'isActive' (ASC).");
           return { isValid: false, message: "Error validating code. Index might be missing.", referrerName: undefined, referrerId: undefined };
      }
      return { isValid: false, message: "Error validating code. Please try again.", referrerName: undefined, referrerId: undefined };
    }
  }
);

    
