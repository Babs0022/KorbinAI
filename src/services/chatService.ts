
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Use the client-side Firebase instance
import type { ChatSession } from '@/types/chat';
import type { Message } from '@/types/ai';
import { generateTitleForChat } from '@/ai/actions/generate-chat-title-action';

interface CreateChatSessionInput {
  userId: string;
  firstUserMessage: Message;
  firstAiResponse: Message;
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
        mediaUrls: message.mediaUrls ?? [],
    };
    return sanitized;
}


/**
 * Creates a new chat session in Firestore using the client SDK.
 * Generates a title from the first message exchange.
 */
export async function createChatSession({ userId, firstUserMessage, firstAiResponse }: CreateChatSessionInput): Promise<ChatSession> {
  const sanitizedUserMessage = sanitizeMessageForFirestore(firstUserMessage);
  const sanitizedAiMessage = sanitizeMessageForFirestore(firstAiResponse);
  const messages = [sanitizedUserMessage, sanitizedAiMessage];

  const title = await generateTitleForChat(sanitizedUserMessage.content, sanitizedAiMessage.content);

  const newSessionData = {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages,
    isPinned: false,
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
  } as ChatSession;
}


/**
 * Fetches a single chat session by its ID using the client SDK.
 */
export async function getChatSession(chatId: string): Promise<ChatSession | null> {
    const docRef = doc(db, 'chatSessions', chatId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    const data = docSnap.data()!;
    return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
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
 * Deletes a chat session from Firestore.
 */
export async function deleteChatSession(chatId: string): Promise<void> {
  const docRef = doc(db, 'chatSessions', chatId);
  await deleteDoc(docRef);
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
