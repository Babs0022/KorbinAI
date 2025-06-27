
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirestore, type Firestore } from 'firebase/firestore';

// In a Firebase App Hosting environment, the SDK is automatically configured
// by passing an empty object to initializeApp().
// This removes the dependency on NEXT_PUBLIC_ environment variables during build.

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let db: Firestore;

try {
  // Let Firebase auto-configure the SDK.
  app = !getApps().length ? initializeApp({}) : getApp();
  auth = getAuth(app);
  storage = getStorage(app);
  db = getFirestore(app);
  console.log("Firebase initialized successfully via auto-configuration.");
} catch (error) {
  console.error("********************************************************************************");
  console.error("CRITICAL: Firebase initialization failed. This will cause app errors.");
  console.error("Error details:", error);
  console.error("********************************************************************************");
}

export { app, auth, storage, db };
