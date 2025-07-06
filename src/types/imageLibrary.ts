export interface ImageLibraryEntry {
  id: string;
  userId: string;
  prompt: string;
  imageUrl: string;
  createdAt: any; // Firestore Timestamp
}
