
import admin from 'firebase-admin';

// This file is intended for server-side code (e.g., Genkit flows, API routes).
// It initializes the Firebase Admin SDK, which has elevated privileges.

// Check if the app is already initialized to prevent errors in hot-reloading environments.
if (!admin.apps.length) {
  // Initialize by explicitly using Application Default Credentials.
  // This is the recommended and most reliable method for Google Cloud environments
  // like App Hosting and helps avoid issues with incorrect environment variable paths.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const firestoreDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { firestoreDb, adminAuth, adminStorage };
