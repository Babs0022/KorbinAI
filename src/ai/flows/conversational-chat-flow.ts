
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
    MessageSchema,
    type ConversationalChatInput,
    type Message,
} from '@/types/ai';
import { getCurrentTime } from '@/ai/tools/time-tool';
import { generateImage } from '@/ai/tools/image-generation-tool';
import { scrapeWebPage } from '@/ai/tools/web-scraper-tool';
import { GenerateOptions, MessageData, Part } from '@genkit-ai/ai';
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

// Default prompt if a user-specific one isn't found
const defaultSystemPrompt = `You are Briefly, a helpful and friendly AI copilot. Your goal is to have natural, engaging conversations and assist users with their questions and tasks. You are a multi-modal assistant, which means you can process text, images, and videos. When a user uploads media, you can "see" it and answer questions about it.

You can also access the internet. If a user asks for a link, provides a URL, or asks you to search for something, you should use your knowledge to construct the most likely URL (e.g., 'OpenAI website' becomes 'https://openai.com') and then use the 'scrapeWebPage' tool to get information.

If a user asks "who are you" or a similar question, you should respond with your persona. For example: "I am Briefly, your AI copilot, here to help you brainstorm, create, and build."

If you generate an image, you MUST tell the user you have created it and that it is now available. Do not just return the image data. For example: "I've generated an image based on your description. Here it is:" followed by the image data.

Do not be overly robotic or formal. Be creative and helpful.`;

async function getUserSystemPrompt(userId?: string): Promise<string> {
    if (!userId) {
        return defaultSystemPrompt;
    }
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            return `${data.customSystemPrompt}

No matter what, your name is Briefly and you are an AI assistant.`;
        }
    } catch (error) {
        console.error("Failed to fetch user-specific system prompt:", error);
    }
    return defaultSystemPrompt;
}

// Export the main async function that calls the flow
export async function conversationalChat(input: ConversationalChatInput): Promise<Message> {
  return conversationalChatFlow(input);
}

// Define the Genkit flow
const conversationalChatFlow = ai.defineFlow(
  {
    name: 'conversationalChatFlow',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: MessageSchema,
  },
  async ({ history, userId }): Promise<Message> => {
    
    if (!history || history.length === 0) {
      return { role: "model", content: "I'm sorry, but I can't respond to an empty message. Please tell me what's on your mind!" };
    }

    const systemPrompt = await getUserSystemPrompt(userId);
    
    // 1. Filter out any malformed messages
    const validMessages = history.filter(msg => (msg.content || (msg.mediaUrls && msg.mediaUrls.length > 0)));

    // 2. Map to the format the model expects
    const messages = validMessages.map((msg): MessageData => {
        const content: Part[] = [];
        if (msg.content) {
            content.push({ text: msg.content });
        }
        if (msg.mediaUrls) {
            msg.mediaUrls.forEach(url => {
                content.push({ media: { url } });
            });
        }
        return {
            role: msg.role === 'user' ? 'user' : 'model',
            content,
        };
    });

    // 3. If there are no valid messages, return a helpful response
    if (messages.length === 0) {
        return { role: "model", content: "It seems there are no valid messages in our conversation. Could you please start over?" };
    }

    const modelToUse = 'googleai/gemini-1.5-flash';
    const finalPrompt: GenerateOptions = {
      model: modelToUse,
      system: systemPrompt,
      messages: messages,
      tools: [getCurrentTime, generateImage, scrapeWebPage],
    };

    try {
        const response = await ai.generate(finalPrompt);

        const textContent = response.text || '';
        let imageUrls: string[] = [];

        // Cast to any to safely access properties that might not be in the type definition
        const responseAsAny = response as any;

        if (responseAsAny.candidates && Array.isArray(responseAsAny.candidates)) {
            for (const candidate of responseAsAny.candidates) {
                if (candidate.message && Array.isArray(candidate.message.content)) {
                    for (const part of candidate.message.content) {
                        if (part.toolResponse && part.toolResponse.name === 'generateImage') {
                            const toolOutput = part.toolResponse.output as { imageUrls: string[] };
                            if (toolOutput && Array.isArray(toolOutput.imageUrls)) {
                                imageUrls.push(...toolOutput.imageUrls);
                            }
                        }
                    }
                }
            }
        }
        
        return {
            role: 'model',
            content: textContent,
            mediaUrls: imageUrls.length > 0 ? imageUrls : undefined,
        };

    } catch (error) {
        console.error("AI generation failed:", error);
        return { role: 'model', content: "I'm sorry, I couldn't generate a response. Please try rephrasing your message." };
    }
  }
);
