
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let db: Firestore;

// Check for critical Firebase configuration variables
const requiredFirebaseEnvVars: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId'];
const missingVars = requiredFirebaseEnvVars.filter(key => !firebaseConfig[key]);

if (missingVars.length > 0) {
  console.error("********************************************************************************");
  console.error("CRITICAL: Missing values for Firebase environment variables:");
  missingVars.forEach(varName => console.error(` - NEXT_PUBLIC_FIREBASE_${String(varName).toUpperCase()} is missing or empty.`));
  console.error("Firebase services will NOT be initialized. This will cause app errors.");
  console.error("********************************************************************************");
} else {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("********************************************************************************");
    console.error("CRITICAL: Firebase initialization failed. Error details:", error);
    console.error("Check your Firebase project settings and .env file values carefully.");
    console.error("********************************************************************************");
  }
}

export { app, auth, storage, db };
