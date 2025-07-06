'use server';

import { firestoreDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { ImageLibraryEntry } from '@/types/imageLibrary';

// Helper to serialize an image library entry
const serializeImageLibraryEntry = (doc: FirebaseFirestore.DocumentSnapshot): ImageLibraryEntry | null => {
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;

    const serializedData = { ...data };
    if (data.createdAt instanceof Timestamp) {
        serializedData.createdAt = data.createdAt.toDate().toISOString();
    }
    
    return {
        id: doc.id,
        ...serializedData,
    } as ImageLibraryEntry;
};


/**
 * Saves a generated image record to the user's library.
 */
export async function saveToImageLibrary({
  userId,
  prompt,
  imageUrls,
}: {
  userId: string;
  prompt: string;
  imageUrls: string[];
}): Promise<string> {
  if (!userId) {
    console.error('User ID is required to save to the image library.');
    throw new Error('User ID must be provided.');
  }

  const libraryRef = firestoreDb.collection('image_library').doc();

  const libraryData = {
    userId,
    prompt,
    imageUrls,
    createdAt: FieldValue.serverTimestamp(),
  };

  await libraryRef.set(libraryData);
  console.log(`Image saved to library for user ${userId} with ID: ${libraryRef.id}`);
  return libraryRef.id;
}

/**
 * Fetches all image library entries for a given user.
 */
export async function getImageLibrary({ userId }: { userId: string }): Promise<ImageLibraryEntry[]> {
    if (!userId) {
        throw new Error("User ID is required to fetch the image library.");
    }

    const libraryCollection = firestoreDb.collection('image_library');
    const q = libraryCollection.where('userId', '==', userId).orderBy('createdAt', 'desc');

    const snapshot = await q.get();

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => serializeImageLibraryEntry(doc)).filter(entry => entry !== null) as ImageLibraryEntry[];
}
