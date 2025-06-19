
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
import fs from 'fs'; 
import path from 'path'; 

let db: admin.firestore.Firestore | undefined;
let firebaseAdminAppInitialized = false;

if (!admin.apps.length) {
  console.log("[validate-referral-code-flow]: Attempting Firebase Admin SDK initialization (module load)...");
  const credsEnvVar = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log(`[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS env var: ${credsEnvVar || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: FIREBASE_CONFIG env var: ${process.env.FIREBASE_CONFIG || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: GCLOUD_PROJECT env var: ${process.env.GCLOUD_PROJECT || "NOT SET"}`);

  try {
    if (credsEnvVar) {
      let serviceAccountPath = credsEnvVar;
      // Check if the path is relative and adjust if necessary
      if (!path.isAbsolute(serviceAccountPath)) {
          // Try resolving relative to current file's directory, then CWD as fallback
          const pathRelativeToCurrentFile = path.resolve(__dirname, serviceAccountPath);
          const pathRelativeToCwd = path.resolve(process.cwd(), serviceAccountPath);

          if (fs.existsSync(pathRelativeToCurrentFile)) {
              serviceAccountPath = pathRelativeToCurrentFile;
              console.log(`[validate-referral-code-flow]: Resolved relative GOOGLE_APPLICATION_CREDENTIALS path to (relative to __dirname): ${serviceAccountPath}`);
          } else if (fs.existsSync(pathRelativeToCwd)) {
              serviceAccountPath = pathRelativeToCwd;
              console.log(`[validate-referral-code-flow]: Resolved relative GOOGLE_APPLICATION_CREDENTIALS path to (relative to CWD): ${serviceAccountPath}`);
          } else {
             console.error(`[validate-referral-code-flow]: Relative service account path from GOOGLE_APPLICATION_CREDENTIALS (${credsEnvVar}) NOT FOUND relative to __dirname OR CWD.`);
             throw new Error(`Service account file specified by GOOGLE_APPLICATION_CREDENTIALS (${credsEnvVar}) not found.`);
          }
      } else {
           console.log(`[validate-referral-code-flow]: Using absolute GOOGLE_APPLICATION_CREDENTIALS path: ${serviceAccountPath}`);
      }


      if (fs.existsSync(serviceAccountPath)) {
        console.log(`[validate-referral-code-flow]: Service account file FOUND at: ${serviceAccountPath}`);
        const serviceAccountFileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountFileContent);
        console.log("[validate-referral-code-flow]: Service account JSON parsed successfully.");
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        console.log("[validate-referral-code-flow]: admin.initializeApp() called with explicit credential.");
        if (admin.apps.length > 0 && admin.app().name) {
            console.log(`[validate-referral-code-flow]: Firebase Admin SDK initialized successfully. App name: ${admin.app().name}. Total apps: ${admin.apps.length}`);
            db = admin.firestore();
            firebaseAdminAppInitialized = true;
            console.log("[validate-referral-code-flow]: Firestore instance obtained successfully.");
        } else {
            console.error("[validate-referral-code-flow]: CRITICAL: admin.initializeApp() called, but no usable app found or app is unnamed. Firestore unavailable.");
            db = undefined;
        }
      } else {
        console.error(`[validate-referral-code-flow]: Service account file NOT FOUND at resolved path: ${serviceAccountPath}. Falling back to default initialization, which will likely fail if explicit path was intended or default discovery fails.`);
        admin.initializeApp(); 
        console.log("[validate-referral-code-flow]: Attempted Firebase Admin SDK initialization with default discovery (fallback after file not found). This may not work if credentials aren't available through other means.");
         if (admin.apps.length > 0 && admin.app().name) {
            console.log(`[validate-referral-code-flow]: Default Firebase Admin SDK initialization succeeded. App name: ${admin.app().name}. Total apps: ${admin.apps.length}`);
            db = admin.firestore();
            firebaseAdminAppInitialized = true;
            console.log("[validate-referral-code-flow]: Firestore instance obtained after default init fallback.");
        } else {
            console.error("[validate-referral-code-flow]: CRITICAL: Default admin.initializeApp() called, but no usable app found. Firestore unavailable.");
            db = undefined;
        }
      }
    } else {
      console.warn("[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS not set. Attempting default Firebase Admin SDK initialization (likely to fail without other config).");
      admin.initializeApp(); 
      console.log("[validate-referral-code-flow]: Firebase Admin SDK default initialization attempted (no explicit creds path).");
      if (admin.apps.length > 0 && admin.app().name) {
            console.log(`[validate-referral-code-flow]: Default Firebase Admin SDK initialization succeeded. App name: ${admin.app().name}. Total apps: ${admin.apps.length}`);
            db = admin.firestore();
            firebaseAdminAppInitialized = true;
            console.log("[validate-referral-code-flow]: Firestore instance obtained after default init.");
        } else {
            console.error("[validate-referral-code-flow]: CRITICAL: Default admin.initializeApp() called, but no usable app found. Firestore unavailable.");
            db = undefined;
        }
    }
  } catch (e: any) {
    console.error("--------------------------------------------------------------------------------");
    console.error("[validate-referral-code-flow]: CRITICAL ERROR during Firebase Admin SDK initializeApp() or credential loading:", e.message);
    console.error("Stack:", e.stack);
    console.error("This usually means GOOGLE_APPLICATION_CREDENTIALS environment variable is NOT SET correctly, the service account key file is invalid/unreadable/malformed JSON, or the service account lacks necessary permissions.");
    console.error("Please ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid, readable service account JSON key file with correct permissions in your .env.local file and RESTART your development server.");
    console.error("--------------------------------------------------------------------------------");
    db = undefined; 
  }
} else {
  console.log("[validate-referral-code-flow]: Firebase Admin SDK already has an initialized app (module load). Attempting to get Firestore.");
  try {
    // Check if the default app exists and has a name (basic check for usability)
    if (admin.app().name) { 
        db = admin.firestore();
        firebaseAdminAppInitialized = true;
        console.log("[validate-referral-code-flow]: Firestore instance obtained from existing app.");
    } else {
        console.error("[validate-referral-code-flow]: Existing Firebase app found, but it seems unusable (e.g. unnamed or default app not properly configured). Firestore unavailable.");
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
    if (!firebaseAdminAppInitialized || !db) { 
        console.error("[validateReferralCodeFlow - IN FLOW]: Firestore service is unavailable (db instance is undefined or app not initialized). Aborting validation.");
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
      console.log(`[validateReferralCodeFlow - IN FLOW]: Code ${upperCaseCode} is valid but has no associated userId in referralData.`);
      return { isValid: true, message: "Referral code is valid!", referrerName: undefined, referrerId: undefined };

    } catch (error) {
      console.error("[validateReferralCodeFlow - IN FLOW]: Error during Firestore query:", error);
      if (error instanceof Error && (error.message.includes("INVALID_ARGUMENT") || error.message.includes("requires an index"))) {
          console.error("[validateReferralCodeFlow - IN FLOW]: Firestore query failed. This might be due to a MISSING INDEX. Please check your Firebase console for index creation suggestions for the 'referralCodes' collection querying 'code' (ASC) and 'isActive' (ASC).");
           return { isValid: false, message: "Error validating code. Index might be missing.", referrerName: undefined, referrerId: undefined };
      }
      return { isValid: false, message: "Error validating code. Please try again.", referrerName: undefined, referrerId: undefined };
    }
  }
);
