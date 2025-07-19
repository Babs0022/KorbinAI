
'use server';

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AgentLog } from '@/types/agent';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
  admin.firestore().settings({
    ignoreUndefinedProperties: true,
  });
}
const db = admin.firestore();


interface SaveAgentLogInput {
  userId?: string;
  type: AgentLog['type'];
  message: string;
  data?: any;
}

/**
 * Saves an agent's execution log to Firestore.
 * @param {SaveAgentLogInput} input - The log data to save.
 * @returns {Promise<string>} The ID of the newly created log document.
 */
export async function saveAgentLog({ userId, type, message, data }: SaveAgentLogInput): Promise<string> {
  const logRef = db.collection('agentLogs').doc();
  
  const newLogData: Omit<AgentLog, 'id'> = {
    type,
    message,
    timestamp: FieldValue.serverTimestamp(),
    ...(userId && { userId }),
    ...(data && { data }),
  };

  await logRef.set(newLogData);

  return logRef.id;
}


/**
 * Fetches all execution logs for a given user, ordered by most recent.
 * @param {string} userId - The ID of the user whose logs to fetch.
 * @returns {Promise<AgentLog[]>} An array of log objects.
 */
export async function getAgentLogsForUser(userId: string): Promise<AgentLog[]> {
  const snapshot = await db.collection('agentLogs')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => {
    const data = doc.data();
    const timestamp = (data.timestamp as admin.firestore.Timestamp)?.toDate()?.toISOString() || new Date().toISOString();
    return {
      id: doc.id,
      ...data,
      timestamp,
    } as AgentLog;
  });
}
