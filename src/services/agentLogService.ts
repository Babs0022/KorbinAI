
'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AgentLog, AgentLogInput } from '@/types/agent';

/**
 * Saves a new log entry for an agent's execution to Firestore.
 * @param {AgentLogInput} logInput - The log data to save.
 * @returns {Promise<string>} The ID of the newly created log document.
 */
export async function saveAgentLog(logInput: AgentLogInput): Promise<string> {
  if (!logInput.message) {
    throw new Error('A log message is required.');
  }

  const logRef = db.collection('agentLogs').doc();

  // Explicitly build the data object to avoid undefined fields.
  const newLogData: { [key: string]: any } = {
    type: logInput.type,
    message: logInput.message,
    timestamp: FieldValue.serverTimestamp(),
  };

  if (logInput.userId) {
    newLogData.userId = logInput.userId;
  }
  if (logInput.data) {
    newLogData.data = logInput.data;
  }

  // Firestore does not allow `undefined` values.
  await logRef.set(newLogData);
  return logRef.id;
}


/**
 * Fetches all logs for a given user, ordered by most recent.
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
    return {
      id: doc.id,
      ...data,
      // Convert Timestamps to ISO strings for client-side date formatting
      timestamp: data.timestamp?.toDate().toISOString(),
    } as AgentLog;
  });
}
