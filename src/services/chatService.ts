
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Use the client-side Firebase instance
import type { ChatSession } from '@/types/chat';
import type { Message } from '@/types/ai';
// Title generation happens server-side after the first AI response

interface CreateChatSessionInput {
  userId: string;
  firstUserMessage: Message;
  firstAiResponse?: Message;
}

/**
 * Creates a new, sanitized message object for Firestore.
 * Firestore does not allow `undefined` values.
 * This function removes any keys where the value is undefined.
 * @param message The message object to sanitize.
 * @returns A new message object safe to store in Firestore.
 */
function sanitizeMessageForFirestore(message: Message): Message {
    const sanitized: Message = {
        role: message.role,
        content: message.content ?? '',
    };
    if (message.mediaUrls && message.mediaUrls.length > 0) {
        sanitized.mediaUrls = message.mediaUrls;
    }
    return sanitized;
}


/**
 * Creates a new chat session in Firestore using the client SDK.
 * It sets a temporary title, which will be updated by the backend flow later.
 */
export async function createChatSession({ userId, firstUserMessage }: CreateChatSessionInput): Promise<ChatSession> {
  const sanitizedUserMessage = sanitizeMessageForFirestore(firstUserMessage);
  const messages = [sanitizedUserMessage];
  const title = "Untitled Conversation"; // Placeholder title; updated asynchronously after AI reply

  const newSessionData = {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages,
    isPinned: false,
    isDeleted: false,
    deletedAt: null,
  };

  const chatRef = await addDoc(collection(db, 'chatSessions'), newSessionData);
  
  const now = new Date();
  return {
    id: chatRef.id,
    userId,
    title,
    messages: messages as Message[],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    isPinned: false,
    isDeleted: false,
  };
}


/**
 * Fetches a single chat session by its ID using the client SDK.
 */
export async function getChatSession(chatId: string): Promise<ChatSession | null> {
    const docRef = doc(db, 'chatSessions', chatId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().isDeleted) {
        return null;
    }

    const data = docSnap.data()!;
    return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
        deletedAt: (data.deletedAt as Timestamp)?.toDate().toISOString() || undefined,
    } as ChatSession;
}


/**
 * Updates an existing chat session with new messages using the client SDK.
 */
export async function updateChatSession(chatId: string, messages: Message[]): Promise<void> {
  const chatRef = doc(db, 'chatSessions', chatId);
  // Sanitize every message in the array before updating
  const sanitizedMessages = messages.map(sanitizeMessageForFirestore);

  await updateDoc(chatRef, {
    messages: sanitizedMessages,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Listens for real-time updates to a user's recent chat sessions using the client SDK.
 */
export function listRecentChatsForUser(userId: string, callback: (chats: ChatSession[]) => void): () => void {
  const q = query(
    collection(db, 'chatSessions'),
    where('userId', '==', userId),
    where('isDeleted', '==', false),
    orderBy('updatedAt', 'desc'),
    limit(20)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const chats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
      } as ChatSession;
    });
    callback(chats);
  });

  return unsubscribe;
}

/**
 * Moves a chat session to the trash by marking it as deleted.
 */
export async function deleteChatSession(chatId: string): Promise<void> {
  const docRef = doc(db, 'chatSessions', chatId);
  await updateDoc(docRef, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
  });
}


/**
 * Restores a chat session from the trash.
 */
export async function restoreChatSession(chatId: string): Promise<void> {
    const docRef = doc(db, 'chatSessions', chatId);
    await updateDoc(docRef, {
        isDeleted: false,
        deletedAt: null, // Or use deleteField() if you prefer
    });
}

/**
 * Permanently deletes a chat session from Firestore.
 */
export async function permanentlyDeleteChatSession(chatId: string): Promise<void> {
    const docRef = doc(db, 'chatSessions', chatId);
    await deleteDoc(docRef);
}

/**
 * Fetches all trashed chat sessions for a given user.
 */
export function listTrashedChatsForUser(userId: string, callback: (chats: ChatSession[]) => void): () => void {
    const q = query(
        collection(db, 'chatSessions'),
        where('userId', '==', userId),
        where('isDeleted', '==', true),
        orderBy('deletedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chats = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
                deletedAt: (data.deletedAt as Timestamp)?.toDate().toISOString(),
            } as ChatSession;
        });
        callback(chats);
    });

    return unsubscribe;
}


/**
 * Updates the metadata of a chat session (e.g., title, isPinned).
 */
export async function updateChatSessionMetadata(chatId: string, data: { title?: string; isPinned?: boolean }): Promise<void> {
    const docRef = doc(db, 'chatSessions', chatId);
    const updateData: { [key: string]: any } = {
        updatedAt: serverTimestamp(),
    };
    if (data.title !== undefined) {
        updateData.title = data.title;
    }
    if (data.isPinned !== undefined) {
        updateData.isPinned = data.isPinned;
    }
    await updateDoc(docRef, updateData);
}
