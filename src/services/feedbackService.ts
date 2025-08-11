
'use server';

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { FeedbackRating } from '@/types/feedback';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Uploads a report attachment to Firebase Cloud Storage.
 * @param userId The ID of the user uploading the file.
 * @param file The file object to upload.
 * @returns A promise that resolves to the public URL of the uploaded file.
 */
async function uploadReportAttachment(userId: string, file: File): Promise<string> {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        console.error('Firebase Storage bucket name is not configured.');
        throw new Error('Storage service is not configured.');
    }
    const bucket = admin.storage().bucket(bucketName);

    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const filePath = `user-reports/${userId}/${fileId}.${fileExtension}`;
    const storageFile = bucket.file(filePath);

    // Convert the File object to a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    await storageFile.save(buffer, {
        metadata: { contentType: file.type },
    });
    
    // Make the file public to be viewable
    await storageFile.makePublic();

    return storageFile.publicUrl();
}


interface SubmitReportInput {
    userId: string;
    email: string;
    reportType: 'feedback' | 'bug';
    subject: string;
    message: string;
    page: string;
    attachmentFile?: File;
}

/**
 * Saves a user-submitted feedback or bug report to Firestore.
 * @param {SubmitReportInput} input - The report data.
 * @returns {Promise<string>} The ID of the newly created report document.
 */
export async function submitUserReport({ userId, email, reportType, subject, message, page, attachmentFile }: SubmitReportInput): Promise<string> {
    if (!userId || !reportType || !message || !subject) {
        throw new Error('User ID, report type, subject, and a message are required.');
    }

    let attachmentUrl: string | undefined = undefined;
    if (attachmentFile) {
        attachmentUrl = await uploadReportAttachment(userId, attachmentFile);
    }

    const reportRef = db.collection('userReports').doc();

    const newReportData = {
        userId,
        email,
        reportType,
        subject,
        message,
        page,
        status: 'new', // Default status for new reports
        createdAt: FieldValue.serverTimestamp(),
        ...(attachmentUrl && { attachmentUrl }),
    };

    await reportRef.set(newReportData);

    console.log(`Report ${reportRef.id} saved for user ${userId}.`);
    return reportRef.id;
}


interface SubmitVerificationRequestInput {
    userId: string;
    tweetUrl: string;
}

/**
 * Saves a user's verification request to Firestore for manual review.
 * @param {SubmitVerificationRequestInput} input - The verification request data.
 * @returns {Promise<string>} The ID of the newly created request document.
 */
export async function submitVerificationRequest({ userId, tweetUrl }: SubmitVerificationRequestInput): Promise<string> {
    if (!userId || !tweetUrl) {
        throw new Error('User ID and Tweet URL are required.');
    }

    const requestRef = db.collection('verificationRequests').doc(userId); // Use userId as doc ID to prevent duplicates

    const newRequestData = {
        userId,
        tweetUrl,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    // Use set with merge to create or update the request
    await requestRef.set(newRequestData, { merge: true });

    console.log(`Verification request for user ${userId} has been submitted.`);
    return requestRef.id;
}
