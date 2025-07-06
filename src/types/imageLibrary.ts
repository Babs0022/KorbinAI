export interface ImageLibraryEntry {
  id: string;
  userId: string;
  prompt: string;
  imageUrls: string[];
  createdAt: any; // Firestore Timestamp
}
