
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let auth;
let storage;
let db;

console.log("src/lib/firebase.ts: Attempting to load Firebase config...");
console.log(`src/lib/firebase.ts: NEXT_PUBLIC_FIREBASE_API_KEY value: ${firebaseConfig.apiKey ? "'********'" : firebaseConfig.apiKey}`);
console.log(`src/lib/firebase.ts: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN value: ${firebaseConfig.authDomain}`);
console.log(`src/lib/firebase.ts: NEXT_PUBLIC_FIREBASE_PROJECT_ID value: ${firebaseConfig.projectId}`);
console.log(`src/lib/firebase.ts: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET value: ${firebaseConfig.storageBucket}`);
console.log(`src/lib/firebase.ts: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID value: ${firebaseConfig.messagingSenderId}`);
console.log(`src/lib/firebase.ts: NEXT_PUBLIC_FIREBASE_APP_ID value: ${firebaseConfig.appId}`);
console.log(`src/lib/firebase.ts: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID value: ${firebaseConfig.measurementId}`);


// Check for critical Firebase configuration variables
const requiredFirebaseEnvVars: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId'];
const missingVars = requiredFirebaseEnvVars.filter(key => !firebaseConfig[key]);

if (missingVars.length > 0) {
  console.error("********************************************************************************");
  console.error("CRITICAL: Missing values for Firebase environment variables in .env file:");
  missingVars.forEach(varName => console.error(` - ${String(varName)} (expected from NEXT_PUBLIC_FIREBASE_${String(varName).toUpperCase()}) is missing or empty.`));
  console.error("Firebase services will NOT be initialized. This will likely cause 'Internal Server Error'.");
  console.error("Please ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set in your .env file.");
  console.error("********************************************************************************");
} else {
  console.log("src/lib/firebase.ts: All critical Firebase environment variables appear to have values.");
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);
    console.log("src/lib/firebase.ts: Firebase initialized successfully.");
  } catch (error) {
    console.error("********************************************************************************");
    console.error("CRITICAL: Firebase initialization failed EVEN WITH env vars present.");
    console.error("Error details:", error);
    console.error("This will likely cause 'Internal Server Error'.");
    console.error("Check your Firebase project settings and .env file values carefully.");
    console.error("********************************************************************************");
  }
}

export { app, auth, storage, db };
