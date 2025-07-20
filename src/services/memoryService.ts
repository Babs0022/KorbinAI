
'use server';

import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This service implements the Long-Term Memory module of the agent's Cognitive Core.

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();
const memoryCollection = db.collection('agentMemory');

const MemorySchema = z.object({
  userId: z.string(),
  takeaway: z.string(),
  embedding: z.array(z.number()),
  createdAt: z.any(),
});
type Memory = z.infer<typeof MemorySchema>;

/**
 * Saves a key takeaway to the agent's long-term memory.
 * This function generates an embedding for the takeaway and stores it in Firestore.
 * @param userId The user associated with this memory.
 * @param takeaway A concise summary of a lesson learned or a user preference.
 */
export async function saveMemory(userId: string, takeaway: string): Promise<void> {
  try {
    const embeddingResponse = await ai.embed({
      embedder: 'googleai/text-embedding-004',
      content: takeaway,
    });
    const embedding = embeddingResponse.embedding;

    const memoryRecord: Omit<Memory, 'createdAt'> = {
      userId,
      takeaway,
      embedding,
    };
    
    await memoryCollection.add({
      ...memoryRecord,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Saved memory for user ${userId}: "${takeaway}"`);
  } catch (error) {
    console.error(`Failed to save memory for user ${userId}:`, error);
  }
}

/**
 * Retrieves relevant memories for a given user query.
 * It generates an embedding for the query and finds the most similar memories in Firestore.
 * @param userId The user making the query.
 * @param query The user's current request.
 * @returns A string containing the most relevant memories, or null.
 */
export async function getMemory(userId: string, query: string): Promise<string | null> {
  try {
    const queryEmbeddingResponse = await ai.embed({
      embedder: 'googleai/text-embedding-004',
      content: query,
    });
    const queryEmbedding = queryEmbeddingResponse.embedding;

    const snapshot = await memoryCollection
      .where('userId', '==', userId)
      .orderBy('embedding')
      .nearest({
        vector: queryEmbedding,
        limit: 3,
        distanceMeasure: 'COSINE'
      })
      .get();
      
    if (snapshot.empty) {
      return null;
    }

    const memories = snapshot.docs.map(doc => doc.data().takeaway as string);
    return memories.join('\n- ');

  } catch (error) {
    console.error(`Failed to retrieve memory for user ${userId}:`, error);
    return null; // Fail gracefully
  }
}

// Define the Genkit tool for the agent to save memories
export const saveMemoryTool = ai.defineTool(
  {
    name: 'saveMemory',
    description: "Saves a key takeaway from the conversation to your long-term memory to improve future interactions. Use this at the end of a successful task to remember user preferences or context.",
    inputSchema: z.object({
      userId: z.string().describe("The ID of the user this memory belongs to."),
      takeaway: z.string().describe("A concise sentence summarizing a user preference, a fact, or a lesson learned. For example: 'User prefers responses in a witty tone' or 'User is building an e-commerce app'.")
    }),
    outputSchema: z.void(),
  },
  async ({ userId, takeaway }) => {
    await saveMemory(userId, takeaway);
  }
);

    
