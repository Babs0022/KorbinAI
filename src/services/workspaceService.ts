
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
 * This function expects the input and output to be pre-sanitized plain JavaScript objects.
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

  const workspaceRef = firestoreDb.collection('workspaces').doc();
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

  // Generate metadata. The result from this flow is a Genkit proxy object.
  const metadataResultProxy = await generateWorkspaceMetadata({ type, content: contentForMetadata });

  // Sanitize the Genkit proxy object into a plain JavaScript object before using it.
  const metadataResult = JSON.parse(JSON.stringify(metadataResultProxy));
  
  const workspaceData = {
    userId,
    type,
    name: metadataResult.name,
    summary: metadataResult.summary,
    featurePath,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const contentData = {
    input, // Assumes input is a pre-sanitized plain object
    output, // Assumes output is a pre-sanitized plain object or string
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


/**
 * Fetches and aggregates analytics data for a user's workspaces.
 */
export async function getWorkspaceAnalytics({ userId }: { userId: string }) {
  if (!userId) {
    throw new Error('User ID is required to fetch analytics.');
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

  const workspacesRef = firestoreDb.collection('workspaces');
  const q = workspacesRef.where('userId', '==', userId)
  
  const snapshot = await q.get();
  const snapshotLast7Days = await q.where('createdAt', '>=', sevenDaysAgoTimestamp).get();


  if (snapshot.empty) {
    return {
      totalGenerations: 0,
      generationsByType: {},
      activityLast7Days: [],
      favoriteTool: 'N/A',
    };
  }

  const generationsByType: { [key: string]: number } = {};
  
  snapshot.forEach(doc => {
    const data = doc.data() as Workspace;
    if (data.type) {
      generationsByType[data.type] = (generationsByType[data.type] || 0) + 1;
    }
  });

  const activityMap = new Map<string, number>();
  snapshotLast7Days.forEach(doc => {
    const data = doc.data() as Workspace;
    if (data.createdAt && data.createdAt instanceof Timestamp) {
        const date = data.createdAt.toDate().toISOString().split('T')[0]; // YYYY-MM-DD
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
    }
  });


  // Find favorite tool
  const favoriteTool = Object.entries(generationsByType).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
  
  // Format daily activity for charts
  const activityLast7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    return {
      date: dateString,
      count: activityMap.get(dateString) || 0,
    };
  }).reverse();

  return {
    totalGenerations: snapshot.size,
    generationsByType,
    activityLast7Days,
    favoriteTool,
  };
}
