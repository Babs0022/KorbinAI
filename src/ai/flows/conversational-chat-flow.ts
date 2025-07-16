
'use server';
/**
 * @fileOverview A flow for handling conversational chat with history.
 *
 * - conversationalChat - A function that handles a single turn of a conversation.
 * - Message - The type definition for a single message in the chat history.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for a single message in the conversation history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

// Define the input schema for the conversational chat flow
export const ConversationalChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe('The latest user prompt.'),
});
export type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

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
    const model = ai.getModel('googleai/gemini-1.5-pro-latest');

    const response = await model.generate({
      system: "You are Briefly, a friendly and helpful AI assistant from BrieflyAI. Your goal is to have natural, engaging conversations and assist users with their questions and tasks. Don't be overly robotic or formal. Be creative and helpful.",
      history: history.map(msg => ({
          role: msg.role,
          content: [{ text: msg.content }],
      })),
      prompt: prompt,
    });

    return response.text;
  }
);
