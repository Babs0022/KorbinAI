
'use server';

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { BrieflyLog, LogInput } from '@/types/logs';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Saves a new structured log entry to Firestore.
 * This provides more detailed and queryable logs than the previous agentLogService.
 * 
 * @param {LogInput} logInput - The structured log data to save.
 * @returns {Promise<string>} The ID of the newly created log document.
 */
export async function createLog(logInput: LogInput): Promise<string> {
    if (!logInput.traceId) {
        console.warn('createLog called without a traceId. This log will not be grouped.');
        logInput.traceId = uuidv4();
    }
    
    if (!logInput.flowName || !logInput.message || !logInput.source) {
        throw new Error('Flow name, message, and source are required for logging.');
    }

    const logId = uuidv4();
    const logRef = db.collection('logs').doc(logId);

    const newLogData: Omit<BrieflyLog, 'id'> = {
        traceId: logInput.traceId,
        flowName: logInput.flowName,
        level: logInput.level || 'info',
        status: logInput.status || 'completed',
        message: logInput.message,
        metadata: {
            source: logInput.source,
            timestamp: FieldValue.serverTimestamp(),
            ...(logInput.executionTimeMs && { executionTimeMs: logInput.executionTimeMs }),
        },
        ...(logInput.userId && { userId: logInput.userId }),
        ...(logInput.data && { data: logInput.data }),
    };

    await logRef.set(newLogData);
    return logRef.id;
}


/**
 * Fetches all logs for a given user, ordered by most recent.
 * 
 * @param {string} userId - The ID of the user to fetch logs for.
 * @returns {Promise<BrieflyLog[]>} An array of log objects.
 */
export async function getLogsForUser(userId: string): Promise<BrieflyLog[]> {
    const snapshot = await db.collection('logs')
      .where('userId', '==', userId)
      .orderBy('metadata.timestamp', 'desc')
      .limit(100) // Limit to the last 100 log entries to avoid performance issues
      .get();
  
    if (snapshot.empty) {
      return [];
    }
  
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        metadata: {
          ...data.metadata,
          timestamp: (data.metadata.timestamp as admin.firestore.Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        }
      } as BrieflyLog;
    });

    // Sort by timestamp again client-side to ensure proper ordering
    return logs.sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime());
}
