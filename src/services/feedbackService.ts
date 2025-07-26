
'use server';

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { FeedbackRating } from '@/types/feedback';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

interface SubmitFeedbackInput {
  userId: string;
  projectId: string; // The ID of the project/chat session this feedback is for
  contentId: string; // A unique identifier for the content being reviewed (e.g., message hash or ID)
  rating: FeedbackRating;
  tags?: string[];
  comment?: string;
}

/**
 * Saves user feedback for a specific piece of content to Firestore.
 * @param {SubmitFeedbackInput} input - The feedback data.
 * @returns {Promise<string>} The ID of the newly created feedback document.
 */
export async function submitFeedback({ userId, projectId, contentId, rating, tags, comment }: SubmitFeedbackInput): Promise<string> {
  if (!userId || !projectId || !contentId || !rating) {
    throw new Error('User ID, Project ID, content ID, and rating are required to submit feedback.');
  }

  const feedbackRef = db.collection('feedback').doc();

  const newFeedbackData = {
    userId,
    projectId,
    contentId,
    rating,
    ...(tags && { tags }),
    ...(comment && { comment }),
    createdAt: FieldValue.serverTimestamp(),
  };

  await feedbackRef.set(newFeedbackData);

  console.log(`Feedback ${feedbackRef.id} saved for project ${projectId} by user ${userId}.`);
  return feedbackRef.id;
}
