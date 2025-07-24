
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
  contentId: string; // Generic ID for the content being reviewed (e.g., message hash or ID)
  rating: FeedbackRating;
  tags?: string[];
  comment?: string;
}

/**
 * Saves user feedback for a specific piece of content to Firestore.
 * @param {SubmitFeedbackInput} input - The feedback data.
 * @returns {Promise<string>} The ID of the newly created feedback document.
 */
export async function submitFeedback({ userId, contentId, rating, tags, comment }: SubmitFeedbackInput): Promise<string> {
  if (!userId || !contentId || !rating) {
    throw new Error('User ID, content ID, and rating are required to submit feedback.');
  }

  const feedbackRef = db.collection('feedback').doc();

  const newFeedbackData = {
    userId,
    contentId,
    rating,
    ...(tags && { tags }),
    ...(comment && { comment }),
    createdAt: FieldValue.serverTimestamp(),
  };

  await feedbackRef.set(newFeedbackData);

  console.log(`Feedback ${feedbackRef.id} saved for content ${contentId} by user ${userId}.`);
  return feedbackRef.id;
}
