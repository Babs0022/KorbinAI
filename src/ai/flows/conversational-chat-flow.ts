
'use server';
/**
 * @fileOverview A flow for handling conversational chat with history.
 *
 * - conversationalChat - A function that handles a single turn of a conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
    ConversationalChatInputSchema,
    type ConversationalChatInput,
    type Message,
} from '@/types/ai';


// Export the main async function that calls the flow
export async function conversationalChat(input: ConversationalChatInput): Promise<string> {
  return conversationalChatFlow(input);
}

// Define the Genkit flow
const conversationalChatFlow = ai.defineFlow(
  {
    name: 'conversationalChatFlow',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: z.string(),
  },
  async ({ history, prompt }) => {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: "You are Briefly, a friendly and helpful AI assistant from BrieflyAI. Your goal is to have natural, engaging conversations and assist users with their questions and tasks. Don't be overly robotic or formal. Be creative and helpful.",
      history: history.map((msg: Message) => ({
          role: msg.role,
          content: [{ text: msg.content }],
      })),
      prompt: prompt,
    });

    return response.text;
  }
);
