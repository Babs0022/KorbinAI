import * as admin from 'firebase-admin';

// This file initializes the Firebase Admin SDK for server-side operations.
// It checks if the app is already initialized to prevent errors in hot-reloading environments.

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };