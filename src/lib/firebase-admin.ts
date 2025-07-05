
import admin from 'firebase-admin';

// This file is intended for server-side code (e.g., Genkit flows, API routes).
// It initializes the Firebase Admin SDK, which has elevated privileges.

// Check if the app is already initialized to prevent errors in hot-reloading environments.
if (!admin.apps.length) {
  // When running in a Firebase environment like App Hosting or Cloud Functions,
  // the SDK is automatically configured from environment variables.
  admin.initializeApp();
}

const firestoreDb = admin.firestore();
const adminAuth = admin.auth();

// NOTE: Storage-related code has been removed. The previous attempt to initialize
// Cloud Storage here was causing errors because it was not being used by the
// services that import this module.

export { firestoreDb, adminAuth };
