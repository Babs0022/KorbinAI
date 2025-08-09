
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


interface SubmitReportInput {
    userId: string;
    email: string;
    reportType: 'feedback' | 'bug';
    message: string;
    page: string;
}

/**
 * Saves a user-submitted feedback or bug report to Firestore.
 * @param {SubmitReportInput} input - The report data.
 * @returns {Promise<string>} The ID of the newly created report document.
 */
export async function submitUserReport({ userId, email, reportType, message, page }: SubmitReportInput): Promise<string> {
    if (!userId || !reportType || !message) {
        throw new Error('User ID, report type, and a message are required.');
    }

    const reportRef = db.collection('userReports').doc();

    const newReportData = {
        userId,
        email,
        reportType,
        message,
        page,
        status: 'new', // Default status for new reports
        createdAt: FieldValue.serverTimestamp(),
    };

    await reportRef.set(newReportData);

    console.log(`Report ${reportRef.id} saved for user ${userId}.`);
    return reportRef.id;
}
