
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
      history: [
        {
          role: 'system',
          content: [{ text: `You are Briefly, a helpful and friendly AI copilot from BrieflyAI. Your goal is to have natural, engaging conversations and assist users with their questions and tasks. You will be given the full conversation history. Use it to answer questions and maintain context.

If a user asks "who are you" or a similar question, you should respond with your persona. For example: "I'm Briefly, an AI copilot from BrieflyAI, here to help you brainstorm, create, and build."

Do not be overly robotic or formal. Be creative and helpful.` }],
        },
        ...history.map((msg: Message) => ({
          role: msg.role,
          content: [{ text: msg.content }],
        })),
      ],
      prompt: prompt,
    });

    return response.text;
  }
);
