
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

// Attempt to initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  console.log("[validate-referral-code-flow]: Attempting Firebase Admin SDK initialization (module load)...");
  const credsEnvVar = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log(`[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS env var: ${credsEnvVar || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: FIREBASE_CONFIG env var: ${process.env.FIREBASE_CONFIG || "NOT SET"}`);
  console.log(`[validate-referral-code-flow]: GCLOUD_PROJECT env var: ${process.env.GCLOUD_PROJECT || "NOT SET"}`);

  try {
    if (credsEnvVar) {
      let serviceAccountPath = credsEnvVar;
      if (!path.isAbsolute(serviceAccountPath)) {
        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
        if (fs.existsSync(resolvedPath)) {
          serviceAccountPath = resolvedPath;
          console.log(`[validate-referral-code-flow]: Resolved relative GOOGLE_APPLICATION_CREDENTIALS path to: ${serviceAccountPath}`);
        } else {
          console.error(`[validate-referral-code-flow]: Relative service account path from GOOGLE_APPLICATION_CREDENTIALS (${credsEnvVar}) NOT FOUND relative to CWD (${process.cwd()}).`);
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
          console.error("[validate-referral-code-flow]: CRITICAL: admin.initializeApp() with explicit credential succeeded, but no usable app found or app is unnamed. Firestore will be unavailable.");
          db = undefined;
        }
      } else {
        console.error(`[validate-referral-code-flow]: Service account file NOT FOUND at resolved path: ${serviceAccountPath}. Falling back to default initialization (will likely fail if explicit path was intended or default discovery fails).`);
        admin.initializeApp(); // Default initialization as a last resort
        if (admin.apps.length > 0 && admin.app().name) {
            console.log(`[validate-referral-code-flow]: Default Firebase Admin SDK initialization (fallback) succeeded. App name: ${admin.app().name}. Total apps: ${admin.apps.length}`);
            db = admin.firestore();
            firebaseAdminAppInitialized = true;
        } else {
            console.error("[validate-referral-code-flow]: CRITICAL: Default Firebase Admin SDK initialization (fallback) failed or no usable app found. Firestore unavailable.");
            db = undefined;
        }
      }
    } else {
      console.warn("[validate-referral-code-flow]: GOOGLE_APPLICATION_CREDENTIALS not set. Attempting default Firebase Admin SDK initialization (likely to fail without other config).");
      admin.initializeApp();
      if (admin.apps.length > 0 && admin.app().name) {
            console.log(`[validate-referral-code-flow]: Default Firebase Admin SDK initialization (no GOOGLE_APPLICATION_CREDENTIALS) succeeded. App name: ${admin.app().name}. Total apps: ${admin.apps.length}`);
            db = admin.firestore();
            firebaseAdminAppInitialized = true;
      } else {
            console.error("[validate-referral-code-flow]: CRITICAL: Default Firebase Admin SDK initialization (no GOOGLE_APPLICATION_CREDENTIALS) failed or no usable app found. Firestore unavailable.");
            db = undefined;
      }
    }
  } catch (e: any) {
    console.error("--------------------------------------------------------------------------------");
    console.error("[validate-referral-code-flow]: CRITICAL ERROR during Firebase Admin SDK initializeApp() or credential loading:", e.message);
    if (e.stack) console.error("Stack:", e.stack);
    console.error("This usually means GOOGLE_APPLICATION_CREDENTIALS environment variable is NOT SET correctly for the server environment (e.g., in your .env.local file for Next.js), or the service account key file is invalid/unreadable/malformed JSON, or the service account lacks necessary permissions.");
    console.error("Please ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid, readable service account JSON key file with correct permissions in your .env.local file and RESTART your development server.");
    console.error("--------------------------------------------------------------------------------");
    db = undefined;
  }
} else if (admin.apps.length > 0 && admin.app().name) {
  console.log("[validate-referral-code-flow]: Firebase Admin SDK already has an initialized app. Obtaining Firestore instance.");
  try {
      db = admin.firestore();
      firebaseAdminAppInitialized = true;
      console.log("[validate-referral-code-flow]: Firestore instance obtained from existing app.");
  } catch (e: any) {
      console.error("[validate-referral-code-flow]: CRITICAL ERROR obtaining Firestore instance from existing app:", e.message);
      db = undefined;
  }
} else {
    console.error("[validate-referral-code-flow]: Firebase Admin SDK has apps, but the default app might be problematic (e.g. unnamed or not fully configured). Firestore might be unavailable.");
    db = undefined;
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

      // IMPORTANT: This query requires a composite index in Firestore:
      // Collection: referralCodes
      // Fields:
      // 1. code (Ascending)
      // 2. isActive (Ascending)
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

    