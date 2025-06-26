# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Firestore Indexes

For the app to function correctly, specific Firestore indexes must be created on the backend. The definitions for these indexes are located in the `firestore.indexes.json` file.

If you encounter a "query requires an index" error, it means the indexes defined in that file have not yet been deployed to your Firebase project. Deploying your application will create them.

Key indexes include:
- **promptHistory (Collection Group):**
  - `timestamp` (Descending) - For sorting prompts by date.
  - `qualityScore` (Descending), `timestamp` (Descending) - A composite index for sorting prompts by quality and date, used in the Refinement Hub.

- **sharedPrompts (Collection Group):**
  - `timestamp` (Descending) - For sorting shared prompts.
