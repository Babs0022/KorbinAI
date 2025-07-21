
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
import { getCurrentTime } from '@/ai/tools/time-tool';
import { generateImage } from '@/ai/tools/image-generation-tool';
import { scrapeWebPage } from '@/ai/tools/web-scraper-tool';


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
  async ({ history }) => {
    
    if (!history || history.length === 0) {
      return "I'm sorry, but I can't respond to an empty message. Please tell me what's on your mind!";
    }

    const systemPrompt = `You are Briefly, a helpful and friendly AI copilot. Your goal is to have natural, engaging conversations and assist users with their questions and tasks. You are a multi-modal assistant, which means you can process text and images. When a user uploads an image, you can "see" it and answer questions about it. You can also access the internet to view links and websites.

If a user asks "who are you" or a similar question, you should respond with your persona. For example: "I am Briefly, your AI copilot, here to help you brainstorm, create, and build."

If you generate an image, you MUST tell the user you have created it and that it is now available. Do not just return the image data. For example: "I've generated an image based on your description. Here it is:" followed by the image data.

Do not be overly robotic or formal. Be creative and helpful.`;
    
    // 1. Filter out any malformed messages
    const validMessages = history.filter((msg): msg is Message => msg && (typeof msg.content === 'string' || (Array.isArray(msg.imageUrls) && msg.imageUrls.length > 0)));

    // 2. Enforce that roles must alternate, starting with 'user'.
    const alternatingHistory: Message[] = [];
    if (validMessages.length > 0) {
        const firstUserIndex = validMessages.findIndex(msg => msg.role === 'user');
        
        if (firstUserIndex !== -1) {
            alternatingHistory.push(validMessages[firstUserIndex]);
            for (let i = firstUserIndex + 1; i < validMessages.length; i++) {
                if (validMessages[i].role !== alternatingHistory[alternatingHistory.length - 1].role) {
                    alternatingHistory.push(validMessages[i]);
                }
            }
        }
    }

    // 3. Map to the format the model expects
    const messages = alternatingHistory.map((msg) => {
        const content: ({text: string} | {media: {url: string}})[] = [];
        if (msg.content) {
            content.push({ text: msg.content });
        }
        if (msg.imageUrls) {
            msg.imageUrls.forEach(url => {
                content.push({ media: { url } });
            });
        }
        return {
            role: msg.role === 'user' ? 'user' : 'model',
            content,
        };
    });

    // 4. If, after all filtering, there are no messages left, return a helpful message.
    if (messages.length === 0) {
        return "It seems there are no valid messages in our conversation. Could you please start over?";
    }

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      system: systemPrompt,
      messages: messages,
      tools: [getCurrentTime, generateImage, scrapeWebPage],
    });

    return response.text;
  }
);
