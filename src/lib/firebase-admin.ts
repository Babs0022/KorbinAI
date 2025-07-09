
import admin from 'firebase-admin';

// This file is intended for server-side code (e.g., Genkit flows, API routes).
// It initializes the Firebase Admin SDK, which has elevated privileges.

// Check if the app is already initialized to prevent errors in hot-reloading environments.
if (!admin.apps.length) {
  // Explicitly use Application Default Credentials. This is the recommended way
  // for Google Cloud environments like App Hosting (Cloud Run), as it ignores
  // any potentially incorrect GOOGLE_APPLICATION_CREDENTIALS env vars.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const firestoreDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { firestoreDb, adminAuth, adminStorage };
