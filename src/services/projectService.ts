
'use server';

import { firestoreDb } from '@/lib/firebase-admin';
import { generateProjectMetadata } from '@/ai/flows/generate-project-metadata-flow';
import { FieldValue } from 'firebase-admin/firestore';
import type { Project, ProjectContent } from '@/types/project';

interface SaveProjectInput {
  userId: string;
  type: Project['type'];
  content: ProjectContent;
}

// --- Service Functions ---

/**
 * Generates metadata and saves a new project to Firestore.
 * This is called by client components when the user clicks "Save Project".
 */
export async function saveProject({ userId, type, content }: SaveProjectInput): Promise<string> {
  if (!userId || !type || !content) {
    throw new Error('User ID, type, and content are required to save a project.');
  }

  // The metadata generation flow needs a string representation of the content.
  let contentForMetadata: string;
  if (typeof content === 'string') {
    contentForMetadata = content;
  } else if (Array.isArray(content)) {
    contentForMetadata = `An album of ${content.length} generated images.`;
  } else if (typeof content === 'object' && 'files' in content) {
    const fileList = (content.files as { filePath: string }[]).map(f => f.filePath).join(', ');
    contentForMetadata = `An application with files: ${fileList}`;
  } else {
    contentForMetadata = 'A saved project with unspecified content.';
  }

  const metadata = await generateProjectMetadata({
    type: type,
    content: contentForMetadata,
  });
  
  const projectRef = firestoreDb.collection('projects').doc();

  const newProjectData = {
    userId,
    name: metadata.name,
    summary: metadata.summary,
    type,
    content,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await projectRef.set(newProjectData);

  console.log(`Project ${projectRef.id} of type ${type} saved for user ${userId}.`);
  return projectRef.id;
}

/**
 * Fetches all projects for a given user, ordered by most recently updated.
 * Used by the "My Projects" page.
 */
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  const snapshot = await firestoreDb.collection('projects')
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Timestamps to ISO strings for client-side date formatting
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
    } as Project;
  });
}

/**
 * Fetches a single project by its ID for the project viewer page.
 * Note: This does not check for user ownership. Page-level security should handle that.
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
    const docRef = firestoreDb.collection('projects').doc(projectId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return null;
    }

    const data = docSnap.data()!;
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
    } as Project;
}
