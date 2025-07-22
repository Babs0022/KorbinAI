

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
} from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Use the client-side Firebase instance
import type { ChatSession } from '@/types/chat';
import type { Message } from '@/types/ai';

interface CreateChatSessionInput {
  userId: string;
  firstMessage: Message;
}

/**
 * Creates a new chat session in Firestore using the client SDK.
 * Generates a title from the first message.
 */
export async function createChatSession({ userId, firstMessage }: CreateChatSessionInput): Promise<ChatSession> {
  // Sanitize the first message to prevent Firestore errors with undefined fields.
  const sanitizedFirstMessage = {
    ...firstMessage,
    content: firstMessage.content || '', // Ensure content is at least an empty string.
  };

  // Create a simple title from the first message content.
  const title = sanitizedFirstMessage.content.split(' ').slice(0, 5).join(' ') + (sanitizedFirstMessage.content.split(' ').length > 5 ? '...' : '');

  const newSessionData = {
    userId,
    title: title || 'New Chat',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages: [sanitizedFirstMessage],
  };

  const chatRef = await addDoc(collection(db, 'chatSessions'), newSessionData);
  
  const now = new Date();
  return {
    id: chatRef.id,
    userId,
    title: title || 'New Chat',
    messages: [sanitizedFirstMessage],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
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
  await updateDoc(chatRef, {
    messages,
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
