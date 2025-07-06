

'use server';
/**
 * @fileOverview A server-side service for managing user projects in Firestore.
 * This service implements a content/metadata split pattern for performance.
 * - Project metadata (name, summary, etc.) is stored in the `projects` collection.
 * - Large content (input, output) is stored in a separate `project_content` collection.
 * This makes querying for lists of projects fast and efficient.
 */

import { firestoreDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { generateProjectMetadata } from '@/ai/flows/generate-prompt-metadata-flow';
import type { Project, ProjectType } from '@/types/workspace';

// Helper to convert a Firestore document to a serializable Project object
const serializeProject = (doc: FirebaseFirestore.DocumentSnapshot): Project | null => {
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
    } as Project;
};


/**
 * Saves or updates a user's project, splitting data between metadata and content collections.
 * This function expects the input and output to be pre-sanitized plain JavaScript objects.
 */
export async function saveProject({
  userId,
  type,
  input,
  output,
  featurePath,
}: {
  userId: string;
  type: ProjectType;
  input: object;
  output: string | object;
  featurePath: string;
}): Promise<string> {
  if (!userId) {
    console.log('No user ID provided, skipping project save.');
    return '';
  }

  const projectRef = firestoreDb.collection('projects').doc();
  const contentRef = firestoreDb.collection('project_content').doc(projectRef.id);

  let contentForMetadata: string;
  if (type === 'component-wizard') {
    contentForMetadata = (input as { description: string }).description;
  } else if (typeof output === 'string') {
    contentForMetadata = output;
  } else {
    contentForMetadata = JSON.stringify(output);
  }

  // Generate metadata. The result from this flow is a Genkit proxy object.
  const metadataResultProxy = await generateProjectMetadata({ type, content: contentForMetadata });

  // Sanitize the Genkit proxy object into a plain JavaScript object before using it.
  const metadataResult = JSON.parse(JSON.stringify(metadataResultProxy));
  
  const projectData = {
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
  batch.set(projectRef, projectData);
  batch.set(contentRef, contentData);
  await batch.commit();

  console.log(`Project saved for user ${userId} with ID: ${projectRef.id}`);
  return projectRef.id;
}


/**
 * Deletes a project document and its associated content document.
 */
export async function deleteProject({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}): Promise<void> {
  if (!userId || !projectId) {
    throw new Error('User ID and Project ID are required for deletion.');
  }

  const projectRef = firestoreDb.collection('projects').doc(projectId);
  const contentRef = firestoreDb.collection('project_content').doc(projectId);
  const doc = await projectRef.get();

  if (!doc.exists) {
    console.warn(`Project with ID ${projectId} not found. Nothing to delete.`);
    return;
  }

  const projectData = doc.data();
  if (projectData?.userId !== userId) {
    console.error(`User ${userId} attempted to delete project ${projectId} owned by ${projectData?.userId}.`);
    throw new Error('Permission denied. You can only delete your own projects.');
  }

  // Use a batch to delete both documents atomically
  const batch = firestoreDb.batch();
  batch.delete(projectRef);
  batch.delete(contentRef);
  await batch.commit();

  console.log(`Project ${projectId} and its content successfully deleted for user ${userId}.`);
}


/**
 * Fetches a single project, combining its metadata and content from two collections.
 */
export async function getProject({
  projectId,
  userId,
}: {
  projectId:string;
  userId: string;
}): Promise<Project | null> {
  if (!userId || !projectId) {
    console.error('User ID and Project ID are required to fetch a project.');
    throw new Error('User ID and Project ID are required.');
  }

  const projectRef = firestoreDb.collection('projects').doc(projectId);
  const contentRef = firestoreDb.collection('project_content').doc(projectId);
  
  const [projectDoc, contentDoc] = await Promise.all([
      projectRef.get(),
      contentRef.get()
  ]);
  
  const project = serializeProject(projectDoc);

  if (!project) {
    console.warn(`Project with ID ${projectId} not found.`);
    return null;
  }
  
  if (project.userId !== userId) {
    console.error(`User ${userId} attempted to access project ${projectId} owned by ${project.userId}.`);
    throw new Error('Permission denied.');
  }

  const contentData = contentDoc.data();
  if (contentData) {
      project.input = contentData.input;
      project.output = contentData.output;
  } else {
      console.error(`Content for project ${projectId} not found.`);
      throw new Error('Failed to load project content. The data may have been corrupted or deleted.');
  }
  
  return project;
}


/**
 * Fetches and aggregates analytics data for a user's projects.
 */
export async function getProjectAnalytics({ userId }: { userId: string }) {
  if (!userId) {
    throw new Error('User ID is required to fetch analytics.');
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

  const projectsRef = firestoreDb.collection('projects');
  const q = projectsRef.where('userId', '==', userId)
  
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
    const data = doc.data() as Project;
    if (data.type) {
      generationsByType[data.type] = (generationsByType[data.type] || 0) + 1;
    }
  });

  const activityMap = new Map<string, number>();
  snapshotLast7Days.forEach(doc => {
    const data = doc.data() as Project;
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
