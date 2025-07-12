
'use server';

import admin from 'firebase-admin';
import { generateProjectMetadata } from '@/ai/flows/generate-project-metadata-flow';
import { FieldValue } from 'firebase-admin/firestore';
import type { Project, ProjectContent } from '@/types/project';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This is a helper function to ensure the SDK is ready for use in server-side functions.
 */
function initializeAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
}

interface SaveProjectInput {
  userId: string;
  type: Project['type'];
  content: ProjectContent;
}

/**
 * Uploads an array of image data URIs to Firebase Cloud Storage.
 * @param userId The ID of the user uploading the images.
 * @param dataUris An array of strings, where each string is a data URI.
 * @returns A promise that resolves to an array of public URLs for the uploaded images.
 */
async function uploadImagesToStorage(userId: string, dataUris: string[]): Promise<string[]> {
  initializeAdmin();
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    console.error('Firebase Storage bucket name is not configured (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).');
    throw new Error('Storage service is not configured.');
  }
  const bucket = admin.storage().bucket(bucketName);

  const uploadPromises = dataUris.map(async (dataUri) => {
    const match = dataUri.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      console.error('Invalid data URI format provided for image upload.');
      throw new Error('An invalid image format was provided and could not be saved.');
    }
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileExtension = mimeType.split('/')[1] || 'png';
    const fileId = uuidv4();
    const filePath = `user-uploads/${userId}/images/${fileId}.${fileExtension}`;
    const file = bucket.file(filePath);

    await file.save(buffer, { metadata: { contentType: mimeType } });
    await file.makePublic();

    return file.publicUrl();
  });

  return Promise.all(uploadPromises);
}

/**
 * Saves a new project and its corresponding generation data to Firestore.
 * This function now uses two separate collections: `generations` for raw content
 * and `projects` for metadata, linked by a `generationId`.
 */
export async function saveProject({ userId, type, content }: SaveProjectInput): Promise<string> {
  initializeAdmin();
  if (!userId || !type || !content) {
    throw new Error('User ID, type, and content are required.');
  }

  let finalContent: ProjectContent = content;

  // Handle image uploads before saving generation data
  if (type === 'image-generator' && Array.isArray(content) && content.every(item => typeof item === 'string')) {
    finalContent = await uploadImagesToStorage(userId, content as string[]);
  }
  
  // 1. Save the raw content to the 'generations' collection
  const generationRef = admin.firestore().collection('generations').doc();
  await generationRef.set({
    userId,
    type,
    content: finalContent,
    createdAt: FieldValue.serverTimestamp(),
  });
  
  // 2. Generate metadata for the project
  let metadata: { name: string; summary: string };
  if (type === 'image-generator') {
      const urls = finalContent as string[];
      metadata = {
          name: `Generated Image Album`,
          summary: `An album containing ${urls.length} AI-generated image(s).`,
      };
  } else {
      let contentForMetadata: string;
      if (typeof content === 'string') {
          contentForMetadata = content;
      } else if (typeof content === 'object' && content && 'files' in content) {
          const fileList = (content.files as { filePath: string }[]).map(f => f.filePath).join(', ');
          contentForMetadata = `An application with files: ${fileList}`;
      } else {
          contentForMetadata = 'A saved project with unspecified content.';
      }
      metadata = await generateProjectMetadata({ type, content: contentForMetadata });
  }

  // 3. Save the metadata to the 'projects' collection, linking to the generation
  const projectRef = admin.firestore().collection('projects').doc();
  await projectRef.set({
    userId,
    generationId: generationRef.id,
    name: metadata.name,
    summary: metadata.summary,
    type,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Project ${projectRef.id} and Generation ${generationRef.id} saved for user ${userId}.`);
  return projectRef.id;
}


/**
 * Fetches all projects for a given user, ordered by most recently updated.
 * This is used by the "My Projects" page.
 */
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  initializeAdmin();
  const snapshot = await admin.firestore().collection('projects')
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
 * Fetches a single project by its ID and then retrieves its associated generation content.
 * @param projectId The ID of the project to fetch.
 * @returns A promise that resolves to the project with its content, or null if not found.
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
    initializeAdmin();
    const projectRef = admin.firestore().collection('projects').doc(projectId);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
        return null;
    }

    const projectData = projectSnap.data()!;
    
    // Fetch the associated generation content
    let content: ProjectContent | null = null;
    if (projectData.generationId) {
        const generationRef = admin.firestore().collection('generations').doc(projectData.generationId);
        const generationSnap = await generationRef.get();
        if (generationSnap.exists) {
            content = generationSnap.data()?.content;
        }
    } else {
        // Fallback for older data model for graceful migration
        content = projectData.content;
    }

    if (!content) {
        console.warn(`Project ${projectId} has a missing or invalid generation link.`);
        // To prevent crashes, we can return some default content structure based on type
        switch (projectData.type) {
            case 'written-content':
            case 'prompt':
            case 'structured-data':
                content = "Content could not be loaded."; break;
            case 'image-generator':
                content = []; break;
            case 'component-wizard':
                content = { files: [], finalInstructions: "Content could not be loaded."}; break;
            default:
                content = "Unknown or missing content.";
        }
    }

    return {
        id: projectSnap.id,
        ...projectData,
        content: content,
        createdAt: projectData.createdAt?.toDate().toISOString(),
        updatedAt: projectData.updatedAt?.toDate().toISOString(),
    } as Project;
}
