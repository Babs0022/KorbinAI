
'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import type { BrieflyLog, LogInput } from '@/types/logs';


/**
 * Saves a new structured log entry to Firestore.
 * This provides more detailed and queryable logs than the previous agentLogService.
 * 
 * @param {LogInput} logInput - The structured log data to save.
 * @returns {Promise<string>} The ID of the newly created log document.
 */
export async function createLog(logInput: LogInput): Promise<string> {
    if (!logInput.traceId || !logInput.flowName || !logInput.message || !logInput.source) {
        throw new Error('Trace ID, flow name, message, and source are required for logging.');
    }

    const logId = nanoid();
    const logRef = db.collection('logs').doc(logId);

    const newLogData: BrieflyLog = {
        id: logId,
        traceId: logInput.traceId,
        flowName: logInput.flowName,
        level: logInput.level,
        status: logInput.status,
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
      .get();
  
    if (snapshot.empty) {
      return [];
    }
  
    return snapshot.docs.map(doc => {
      const data = doc.data() as BrieflyLog; // Cast to BrieflyLog
      return {
        ...data,
        // Convert Timestamps to ISO strings for easier use on the client
        metadata: {
          ...data.metadata,
          timestamp: (data.metadata.timestamp as any)?.toDate().toISOString(),
        }
      };
    });
}
