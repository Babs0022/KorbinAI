
import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';

// This file is intended for server-side code (e.g., Genkit flows, API routes).
// It initializes the Firebase Admin SDK, which has elevated privileges.

// Check if the app is already initialized to prevent errors in hot-reloading environments.
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestoreDb = admin.firestore();
const adminAuth = admin.auth();
const storageBucket = getStorage().bucket(); // Get default bucket for file storage

export { firestoreDb, adminAuth, storageBucket };
