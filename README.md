# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Firestore Indexes

Ensure you have the necessary Firestore indexes created for optimal query performance. Key indexes include:
- For `promptHistory` subcollections: `timestamp` (Descending).

Refer to the Firebase documentation or specific error messages if you encounter query issues related to missing indexes.
