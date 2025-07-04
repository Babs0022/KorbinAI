
import admin from 'firebase-admin';

// This file is intended for server-side code (e.g., Genkit flows, API routes).
// It initializes the Firebase Admin SDK, which has elevated privileges.

// Check if the app is already initialized to prevent errors in hot-reloading environments.
// By not catching the error, we ensure that if initialization fails for a real reason
// (like missing credentials), the actual error is thrown, rather than a subsequent
// "default app does not exist" error.
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestoreDb = admin.firestore();
const adminAuth = admin.auth();

export { firestoreDb, adminAuth };
