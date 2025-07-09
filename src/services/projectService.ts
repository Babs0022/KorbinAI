
'use server';

import { firestoreDb, adminStorage } from '@/lib/firebase-admin';
import { generateProjectMetadata } from '@/ai/flows/generate-project-metadata-flow';
import { FieldValue } from 'firebase-admin/firestore';
import type { Project, ProjectContent } from '@/types/project';
import type { ChatMessage } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

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
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    console.error('Firebase Storage bucket name is not configured in environment variables (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).');
    throw new Error('Firebase Storage bucket name is not configured on the server.');
  }
  const bucket = adminStorage.bucket(bucketName);

  const uploadPromises = dataUris.map(async (dataUri) => {
    // Extract mime type and base64 data from the data URI
    const match = dataUri.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      console.error('Invalid data URI format provided for image upload.');
      // Fail gracefully for the user without exposing technical details.
      throw new Error('An invalid image format was provided and could not be saved.');
    }
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine file extension and create a unique path
    const fileExtension = mimeType.split('/')[1] || 'png';
    const fileId = uuidv4();
    const filePath = `user-uploads/${userId}/images/${fileId}.${fileExtension}`;
    const file = bucket.file(filePath);

    // Save the file buffer to Cloud Storage
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
    });

    // Make the file publicly accessible to get a URL
    await file.makePublic();

    // Return the public URL
    return file.publicUrl();
  });

  return Promise.all(uploadPromises);
}


// --- Service Functions ---

/**
 * Generates metadata and saves a new project to Firestore.
 * If the project is image-based, it uploads images to storage first.
 * This is called by client components when the user clicks "Save Project".
 */
export async function saveProject({ userId, type, content }: SaveProjectInput): Promise<string> {
  if (!userId || !type || !content) {
    throw new Error('User ID, type, and content are required to save a project.');
  }

  let finalContent: ProjectContent = content;
  let contentForMetadata: string;

  // If the project is an image generation, upload images to storage first
  if (type === 'image-generator' && Array.isArray(content) && content.every(item => typeof item === 'string')) {
    const publicUrls = await uploadImagesToStorage(userId, content as string[]);
    finalContent = publicUrls; // The content to be saved is now the array of public URLs
    contentForMetadata = `An album of ${publicUrls.length} generated images.`;
  } else if (typeof content === 'string') {
    contentForMetadata = content;
  } else if (Array.isArray(content)) {
    // This case would be for other potential array content types in the future.
    contentForMetadata = `An album of ${content.length} items.`;
  } else if (typeof content === 'object' && content && 'files' in content) {
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
    content: finalContent, // Use the potentially modified content
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await projectRef.set(newProjectData);

  console.log(`Project ${projectRef.id} of type ${type} saved for user ${userId}.`);
  return projectRef.id;
}


/**
 * Saves or updates a chat conversation in Firestore.
 * @param userId The ID of the user.
 * @param messages The full array of messages in the conversation.
 * @param projectId The ID of the project if it exists, otherwise null.
 * @returns The ID of the saved or updated project, and the full project object if it was newly created.
 */
export async function saveChatConversation(
  userId: string,
  messages: ChatMessage[],
  projectId: string | null
): Promise<{id: string; newProject?: Project}> {
  if (!userId || messages.length === 0) {
    throw new Error('User ID and messages are required.');
  }
  
  // Explicitly create plain objects for Firestore to avoid 'undefined' values.
  const plainMessages = messages.map(m => {
      const message: { role: 'user' | 'assistant'; content: string; imageUrl?: string } = {
          role: m.role,
          content: m.content,
      };
      if (m.imageUrl) {
          message.imageUrl = m.imageUrl;
      }
      return message;
  });

  if (projectId) {
    // Update existing project
    const projectRef = firestoreDb.collection('projects').doc(projectId);
    await projectRef.update({
      content: plainMessages,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`Chat project ${projectId} updated for user ${userId}.`);
    return { id: projectId };
  } else {
    // Create new project
    const contentForMetadata = messages
      .slice(0, 4) // Use first few messages for summary
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
      
    const metadata = await generateProjectMetadata({
      type: 'chat',
      content: contentForMetadata,
    });

    const projectRef = firestoreDb.collection('projects').doc();
    const now = new Date();
    
    // This is the data that will be written to Firestore
    const newProjectDataForDb = {
      userId,
      name: metadata.name,
      summary: metadata.summary,
      type: 'chat' as const,
      content: plainMessages,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await projectRef.set(newProjectDataForDb);
    console.log(`New chat project ${projectRef.id} created for user ${userId}.`);
    
    // This is the clean Project object that will be returned to the client.
    // It must conform to the ChatMessage[] type for content.
    const newProjectForClient: Project = {
        id: projectRef.id,
        userId: userId,
        name: metadata.name,
        summary: metadata.summary,
        type: 'chat',
        // The content is now the clean `plainMessages` array which won't have `undefined` properties.
        content: plainMessages,
        createdAt: now.toISOString(), // Convert date to string for client-side serialization
        updatedAt: now.toISOString(),
    };
    
    return { id: projectRef.id, newProject: newProjectForClient };
  }
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
