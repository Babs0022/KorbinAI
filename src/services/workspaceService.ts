
'use server';
/**
 * @fileOverview A server-side service for managing user workspaces in Firestore.
 */

import { firestoreDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateWorkspaceMetadata } from '@/ai/flows/generate-prompt-metadata-flow';
import type { WorkspaceType } from '@/types/workspace';

/**
 * Saves or updates a user's workspace in Firestore.
 * It automatically generates a name and summary for the workspace using an AI flow.
 *
 * @param userId - The UID of the user.
 * @param type - The type of workspace being saved.
 * @param input - The user's original input to the generation tool.
 * @param output - The generated output from the tool.
 * @param featurePath - The path to the tool used, e.g., '/written-content'.
 * @returns The ID of the saved workspace document.
 */
export async function saveWorkspace({
  userId,
  type,
  input,
  output,
  featurePath,
}: {
  userId: string;
  type: WorkspaceType;
  input: object;
  output: string | object;
  featurePath: string;
}): Promise<string> {
  if (!userId) {
    // Don't throw an error, just log and exit gracefully if user is not logged in.
    console.log('No user ID provided, skipping workspace save.');
    return '';
  }

  // Determine the content to send to the AI for naming/summarizing.
  let contentForMetadata: string;
  if (type === 'image') {
    contentForMetadata = (input as { prompt: string }).prompt;
  } else if (type === 'component-wizard') {
    contentForMetadata = (input as { description: string }).description;
  } else if (typeof output === 'string') {
    contentForMetadata = output;
  } else {
    contentForMetadata = JSON.stringify(output);
  }

  // Generate metadata (name, summary) for the workspace
  const metadata = await generateWorkspaceMetadata({ type, content: contentForMetadata });

  // Ensure the objects being saved are plain and serializable to prevent Firestore errors.
  const serializableInput = JSON.parse(JSON.stringify(input));
  const serializableOutput = typeof output === 'string'
    ? output.substring(0, 10000) // Truncate very long strings
    : JSON.parse(JSON.stringify(output));

  const workspaceData = {
    userId,
    type,
    name: metadata.name,
    summary: metadata.summary,
    input: serializableInput,
    output: serializableOutput,
    featurePath,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await firestoreDb.collection('workspaces').add(workspaceData);
  console.log(`Workspace saved for user ${userId} with ID: ${docRef.id}`);

  return docRef.id;
}


/**
 * Deletes a user's workspace from Firestore after verifying ownership.
 *
 * @param workspaceId - The ID of the workspace document to delete.
 * @param userId - The UID of the user requesting the deletion.
 */
export async function deleteWorkspace({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  if (!userId || !workspaceId) {
    throw new Error('User ID and Workspace ID are required for deletion.');
  }

  const docRef = firestoreDb.collection('workspaces').doc(workspaceId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.warn(`Workspace with ID ${workspaceId} not found. Nothing to delete.`);
    return;
  }

  const workspaceData = doc.data();
  if (workspaceData?.userId !== userId) {
    // This is a server-side check to enforce security rules.
    console.error(`User ${userId} attempted to delete workspace ${workspaceId} owned by ${workspaceData?.userId}.`);
    throw new Error('Permission denied. You can only delete your own workspaces.');
  }

  await docRef.delete();
  console.log(`Workspace ${workspaceId} successfully deleted for user ${userId}.`);
}
