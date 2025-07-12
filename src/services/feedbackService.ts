
'use server';

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { FeedbackRating } from '@/types/feedback';

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This is a helper function to ensure the SDK is ready for use in server-side functions.
 */
function initializeAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
}

interface SubmitFeedbackInput {
  userId: string;
  projectId: string;
  rating: FeedbackRating;
  comment?: string;
}

/**
 * Saves user feedback for a specific project to Firestore.
 * This is called from the client when a user provides feedback.
 * @param {SubmitFeedbackInput} input - The feedback data.
 * @returns {Promise<string>} The ID of the newly created feedback document.
 */
export async function submitFeedback({ userId, projectId, rating, comment }: SubmitFeedbackInput): Promise<string> {
  initializeAdmin();
  if (!userId || !projectId || !rating) {
    throw new Error('User ID, Project ID, and rating are required to submit feedback.');
  }

  const feedbackRef = admin.firestore().collection('feedback').doc();

  const newFeedbackData = {
    userId,
    projectId,
    rating,
    ...(comment && { comment }), // Only include comment if it exists
    createdAt: FieldValue.serverTimestamp(),
  };

  await feedbackRef.set(newFeedbackData);

  console.log(`Feedback ${feedbackRef.id} saved for project ${projectId} by user ${userId}.`);
  return feedbackRef.id;
}
