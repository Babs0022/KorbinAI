import * as admin from 'firebase-admin';

// This file initializes the Firebase Admin SDK for server-side operations.
// It checks if the app is already initialized to prevent errors in hot-reloading environments.
// Calling initializeApp() without arguments uses the default credentials provided by the
// hosting environment (like App Hosting or Cloud Functions), which is the standard practice.

if (!admin.apps.length) {
  admin.initializeApp();
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
