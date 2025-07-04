
'use server';
/**
 * @fileOverview A server-side service for managing user workspaces in Firestore.
 * This service implements a hybrid storage strategy: small content is stored
 * directly in Firestore for speed, while large content (>10KB or specific types)
 * is offloaded to Cloud Storage to avoid hitting the 1 MiB document size limit.
 */

import { firestoreDb, storageBucket } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { generateWorkspaceMetadata } from '@/ai/flows/generate-prompt-metadata-flow';
import type { Workspace, WorkspaceType } from '@/types/workspace';

const LARGE_CONTENT_TYPES: WorkspaceType[] = ['component-wizard', 'image'];
const MAX_INLINE_OUTPUT_SIZE_BYTES = 10000; // Store outputs under 10KB inline

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
 * Saves or updates a user's workspace, storing large outputs in Cloud Storage.
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

  const docRef = firestoreDb.collection('workspaces').doc(); // Create ref to get ID first

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
  
  let finalOutput;
  const stringifiedOutput = typeof output === 'string' ? output : JSON.stringify(output);

  // Decide whether to store in Firestore or Cloud Storage
  if (LARGE_CONTENT_TYPES.includes(type) || stringifiedOutput.length > MAX_INLINE_OUTPUT_SIZE_BYTES) {
      const storagePath = `workspaces/${userId}/${docRef.id}/output.json`;
      try {
          await storageBucket.file(storagePath).save(stringifiedOutput, {
              contentType: 'application/json'
          });
          console.log(`Large workspace output saved to Cloud Storage at ${storagePath}`);
          finalOutput = { storagePath }; // Store the reference
      } catch (error) {
          console.error("Error saving to Cloud Storage:", error);
          throw new Error("Failed to save large workspace content to storage.");
      }
  } else {
      finalOutput = JSON.parse(JSON.stringify(output)); // Ensure it's a plain object
  }

  const workspaceData = {
    userId,
    type,
    name: metadata.name,
    summary: metadata.summary,
    input: JSON.parse(JSON.stringify(input)),
    output: finalOutput,
    featurePath,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(workspaceData);
  console.log(`Workspace saved for user ${userId} with ID: ${docRef.id}`);
  return docRef.id;
}


/**
 * Deletes a workspace document and its associated Cloud Storage file, if any.
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
    console.error(`User ${userId} attempted to delete workspace ${workspaceId} owned by ${workspaceData?.userId}.`);
    throw new Error('Permission denied. You can only delete your own workspaces.');
  }

  // Check for and delete associated Cloud Storage file
  if (workspaceData?.output?.storagePath) {
      try {
          await storageBucket.file(workspaceData.output.storagePath).delete();
          console.log(`Deleted Cloud Storage file: ${workspaceData.output.storagePath}`);
      } catch (error: any) {
          // Log error but don't block Firestore deletion. 404 means file is already gone, which is fine.
          if (error.code !== 404) {
               console.error(`Failed to delete Cloud Storage file ${workspaceData.output.storagePath}, it may be orphaned:`, error);
          }
      }
  }

  await docRef.delete();
  console.log(`Workspace ${workspaceId} successfully deleted for user ${userId}.`);
}


/**
 * Fetches a single workspace, hydrating it with content from Cloud Storage if necessary.
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

  const docRef = firestoreDb.collection('workspaces').doc(workspaceId);
  const doc = await docRef.get();
  
  const workspace = serializeWorkspace(doc);

  if (!workspace) {
    console.warn(`Workspace with ID ${workspaceId} not found.`);
    return null;
  }
  
  if (workspace.userId !== userId) {
    console.error(`User ${userId} attempted to access workspace ${workspaceId} owned by ${workspace.userId}.`);
    return null;
  }

  // If output is stored in Cloud Storage, fetch and replace it
  const outputRef = workspace.output as any;
  if (outputRef?.storagePath) {
      try {
          const [fileContents] = await storageBucket.file(outputRef.storagePath).download();
          workspace.output = JSON.parse(fileContents.toString('utf-8'));
          console.log(`Hydrated workspace ${workspaceId} with content from ${outputRef.storagePath}`);
      } catch (error) {
          console.error(`Failed to fetch workspace content from Cloud Storage (${outputRef.storagePath}):`, error);
          workspace.output = { error: "Failed to load content from storage." };
      }
  }

  return workspace;
}
