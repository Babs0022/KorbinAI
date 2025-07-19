
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  // Initialize the app
  admin.initializeApp();
  // Set the firestore settings right after initialization
  admin.firestore().settings({
    ignoreUndefinedProperties: true,
  });
}

// Export the initialized firestore instance
export const db = admin.firestore();
