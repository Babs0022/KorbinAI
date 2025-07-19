
'use server';

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { BrieflyLog, LogInput, BrieflyLogSchema } from '@/types/logs'; // Import the new schema

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Saves a new, detailed agent log entry to Firestore.
 * This function is designed to capture the "thought process" of the agent.
 * 
 * @param {LogInput} logInput - The structured log data conforming to the new schema.
 * @returns {Promise<string>} The ID of the newly created log document.
 */
export async function createLog(logInput: LogInput): Promise<string> {
    // Validate required fields for agent logging
    if (!logInput.traceId || !logInput.flowName || !logInput.phase || !logInput.stepName || !logInput.message || !logInput.source) {
        throw new Error('traceId, flowName, phase, stepName, message, and source are required fields for logging.');
    }

    const logId = uuidv4();
    const logRef = db.collection('logs').doc(logId);

    // Construct the log object according to the new BrieflyLogSchema
    const newLogData: Omit<BrieflyLog, 'id'> = {
        traceId: logInput.traceId,
        flowName: logInput.flowName,
        userId: logInput.userId,
        
        // Agent-specific fields
        phase: logInput.phase,
        stepName: logInput.stepName,
        
        level: logInput.level || 'info',
        status: logInput.status || 'started',
        message: logInput.message,
        
        // Ensure data is structured correctly
        data: logInput.data || {},

        metadata: {
            source: logInput.source,
            timestamp: FieldValue.serverTimestamp(),
            ...(logInput.executionTimeMs && { executionTimeMs: logInput.executionTimeMs }),
        },
    };

    // Validate the constructed object against the Zod schema before sending it to Firestore
    const validation = BrieflyLogSchema.omit({ id: true }).safeParse(newLogData);

    if (!validation.success) {
        console.error("Log validation failed:", validation.error.errors);
        throw new Error(`Log data failed validation: ${validation.error.message}`);
    }

    await logRef.set(validation.data);
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
