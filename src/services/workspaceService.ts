
'use server';
/**
 * @fileOverview A server-side service for managing user workspaces in Firestore.
 * This service implements a content/metadata split pattern for performance.
 * - Workspace metadata (name, summary, etc.) is stored in the `workspaces` collection.
 * - Large content (input, output) is stored in a separate `workspace_content` collection.
 * This makes querying for lists of workspaces fast and efficient.
 */

import { firestoreDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { generateWorkspaceMetadata } from '@/ai/flows/generate-prompt-metadata-flow';
import type { Workspace, WorkspaceType } from '@/types/workspace';

// Helper to convert a Firestore document to a serializable Workspace object
const serializeWorkspace = (doc: FirebaseFirestore.DocumentSnapshot): Workspace | null => {
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;

    // Convert Firestore Timestamps to ISO strings for serialization
    const serializedData = { ...data };
    if (data.createdAt instanceof Timestamp) {
        serializedData.createdAt = data.createdAt.toDate().toISOString();
    }
    if (data.updatedAt instanceof Timestamp) {
        serializedData.updatedAt = data.updatedAt.toDate().toISOString();
    }

    return {
        id: doc.id,
        ...serializedData,
    } as Workspace;
};


/**
 * Saves or updates a user's workspace, splitting data between metadata and content collections.
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
    console.log('No user ID provided, skipping workspace save.');
    return '';
  }

  const workspaceRef = firestoreDb.collection('workspaces').doc(); // Create ref to get ID first
  const contentRef = firestoreDb.collection('workspace_content').doc(workspaceRef.id);

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

  const metadata = await generateWorkspaceMetadata({ type, content: contentForMetadata });

  const workspaceData = {
    userId,
    type,
    name: metadata.name,
    summary: metadata.summary,
    featurePath,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const contentData = {
    input: JSON.parse(JSON.stringify(input)),
    output: JSON.parse(JSON.stringify(output)), // Ensure plain object
  };

  // Use a batch write to ensure both documents are created atomically
  const batch = firestoreDb.batch();
  batch.set(workspaceRef, workspaceData);
  batch.set(contentRef, contentData);
  await batch.commit();

  console.log(`Workspace saved for user ${userId} with ID: ${workspaceRef.id}`);
  return workspaceRef.id;
}


/**
 * Deletes a workspace document and its associated content document.
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

  const workspaceRef = firestoreDb.collection('workspaces').doc(workspaceId);
  const contentRef = firestoreDb.collection('workspace_content').doc(workspaceId);
  const doc = await workspaceRef.get();

  if (!doc.exists) {
    console.warn(`Workspace with ID ${workspaceId} not found. Nothing to delete.`);
    return;
  }

  const workspaceData = doc.data();
  if (workspaceData?.userId !== userId) {
    console.error(`User ${userId} attempted to delete workspace ${workspaceId} owned by ${workspaceData?.userId}.`);
    throw new Error('Permission denied. You can only delete your own workspaces.');
  }

  // Use a batch to delete both documents atomically
  const batch = firestoreDb.batch();
  batch.delete(workspaceRef);
  batch.delete(contentRef);
  await batch.commit();

  console.log(`Workspace ${workspaceId} and its content successfully deleted for user ${userId}.`);
}


/**
 * Fetches a single workspace, combining its metadata and content from two collections.
 */
export async function getWorkspace({
  workspaceId,
  userId,
}: {
  workspaceId:string;
  userId: string;
}): Promise<Workspace | null> {
  if (!userId || !workspaceId) {
    console.error('User ID and Workspace ID are required to fetch a workspace.');
    throw new Error('User ID and Workspace ID are required.');
  }

  const workspaceRef = firestoreDb.collection('workspaces').doc(workspaceId);
  const contentRef = firestoreDb.collection('workspace_content').doc(workspaceId);
  
  const [workspaceDoc, contentDoc] = await Promise.all([
      workspaceRef.get(),
      contentRef.get()
  ]);
  
  const workspace = serializeWorkspace(workspaceDoc);

  if (!workspace) {
    console.warn(`Workspace with ID ${workspaceId} not found.`);
    return null;
  }
  
  if (workspace.userId !== userId) {
    console.error(`User ${userId} attempted to access workspace ${workspaceId} owned by ${workspace.userId}.`);
    throw new Error('Permission denied.');
  }

  const contentData = contentDoc.data();
  if (contentData) {
      workspace.input = contentData.input;
      workspace.output = contentData.output;
  } else {
      console.error(`Content for workspace ${workspaceId} not found.`);
      throw new Error('Failed to load workspace content. The data may have been corrupted or deleted.');
  }
  
  return workspace;
}
