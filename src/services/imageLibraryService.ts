
'use server';

import { firestoreDb, adminStorage } from '@/lib/firebase-admin';
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
 * Saves generated images by first uploading them to Cloud Storage,
 * then saving the public URL to the user's Firestore library.
 * Creates one document per image.
 * @returns A promise that resolves with an array of public URLs for the saved images.
 */
export async function saveToImageLibrary({
  userId,
  prompt,
  imageUrls, // These are the raw data URIs from the image generation model
}: {
  userId: string;
  prompt: string;
  imageUrls: string[];
}): Promise<string[]> {
  if (!userId) {
    console.error('User ID is required to save to the image library.');
    throw new Error('User ID must be provided.');
  }

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    console.error("Firebase Storage bucket name is not configured on the server.");
    throw new Error("Server configuration error: Storage bucket name is missing.");
  }
  const storageBucket = adminStorage.bucket(bucketName);
  
  // Step 1: Upload all images to Cloud Storage and get their public URLs
  const uploadPromises = imageUrls.map(async (dataUri) => {
    const matches = dataUri.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      console.error('Invalid data URI format received from generation model.');
      throw new Error('Invalid data URI format');
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create a unique file name
    const fileName = `image_library/${userId}/${Date.now()}_${Math.round(Math.random() * 1E9)}.png`;
    const file = storageBucket.file(fileName);

    // Save the buffer to the file
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000', // Cache image for 1 year
      },
    });

    // Make the file public
    await file.makePublic();
    
    // Return the public URL
    return file.publicUrl();
  });

  const publicUrls = await Promise.all(uploadPromises);

  // Step 2: Save the public URLs to Firestore in a batch
  const batch = firestoreDb.batch();
  const libraryCollection = firestoreDb.collection('image_library');

  publicUrls.forEach(url => {
    const libraryRef = libraryCollection.doc();
    const libraryData = {
      userId,
      prompt,
      imageUrl: url, // This is now a short, public URL
      createdAt: FieldValue.serverTimestamp(),
    };
    batch.set(libraryRef, libraryData);
  });

  await batch.commit();

  console.log(`Saved ${publicUrls.length} image URLs to library for user ${userId}`);
  
  // Return the public URLs so the flow can pass them to the client
  return publicUrls;
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
