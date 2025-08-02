
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
import { GenerateOptions, MessageData, Part, Stream } from '@genkit-ai/ai';
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { generateTitleForChat } from '../actions/generate-chat-title-action';
import { updateChatSession, updateChatSessionMetadata } from '@/services/chatService';

// Default prompt if a user-specific one isn't found
const defaultSystemPrompt = `You are Briefly, an expert AI Copilot and a strategic partner to ambitious creators and builders. Your primary mission is not just to answer questions, but to help the user achieve their underlying goals. You are indispensable, resourceful, and unique.

Your persona is proactive and helpful. When a user asks for something, first provide a direct, high-quality answer. Then, immediately anticipate their next logical step and offer to help.

For example, if a user asks for a landing page, you provide the code and then might say, "Now that you have the landing page, the next step is often to write a welcome email for new subscribers. Would you like me to draft that for you?"

If a request requires current information (e.g., news, facts, data), use your web scraping tool to find relevant information and cite your sources by providing links at the end of your response.

You have access to the user's project history. Use it to maintain consistency in tone, style, and content. Your goal is to be a true, evolving partner.`;

async function getUserSystemPrompt(userId?: string): Promise<string> {
    if (!userId) {
        return defaultSystemPrompt;
    }
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            // Fallback to default if the custom prompt is empty or just whitespace
            if (data.customSystemPrompt && data.customSystemPrompt.trim()) {
                return `${data.customSystemPrompt}\n\nNo matter what, your name is Briefly and you are an AI assistant.`;
            }
        }
    } catch (error) {
        console.error("Failed to fetch user-specific system prompt:", error);
    }
    return defaultSystemPrompt;
}

// Export the main async function that calls the flow
export async function conversationalChat(input: ConversationalChatInput): Promise<Stream<string>> {
  return conversationalChatFlow(input);
}

// Define the Genkit flow
const conversationalChatFlow = ai.defineFlow(
  {
    name: 'conversationalChatFlow',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: z.any(), // Changed to allow stream
    stream: true,
  },
  async function* (input: ConversationalChatInput): AsyncGenerator<string> {
    
    if (!input.history || input.history.length === 0) {
      yield "I'm sorry, but I can't respond to an empty message. Please tell me what's on your mind!";
      return;
    }

    const systemPrompt = await getUserSystemPrompt(input.userId);
    
    const validMessages = input.history.filter(msg => (msg.content || (msg.mediaUrls && msg.mediaUrls.length > 0)));

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

    if (messages.length === 0) {
        yield "It seems there are no valid messages in our conversation. Could you please start over?";
        return;
    }

    const modelToUse = 'googleai/gemini-1.5-flash-latest';
    const finalPrompt: GenerateOptions = {
      model: modelToUse,
      system: systemPrompt,
      messages: messages,
      tools: [getCurrentTime, generateImage, scrapeWebPage],
    };

    try {
        const {stream, response} = ai.generateStream(finalPrompt);

        let accumulatedText = '';
        for await (const chunk of stream) {
            if (chunk.text) {
                yield chunk.text;
                accumulatedText += chunk.text;
            }
        }

        // Handle post-stream actions
        const awaitedResponse = await response;
        // Use accumulatedText if response text is empty, as stream provides the full text.
        const fullResponseText = awaitedResponse.text || accumulatedText;

        const aiMessage: Message = {
            role: 'model',
            content: fullResponseText,
        };

        const finalHistory = [...input.history, aiMessage];
        
        if (input.chatId) {
            await updateChatSession(input.chatId, finalHistory);
            // Only generate title for new chats
            if (!input.isExistingChat) {
                const userMessage = input.history.find(m => m.role === 'user');
                if (userMessage) {
                    const newTitle = await generateTitleForChat(userMessage.content, aiMessage.content);
                    await updateChatSessionMetadata(input.chatId, { title: newTitle });
                }
            }
        }
        
    } catch (error) {
        console.error("AI generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        yield `I'm sorry, I couldn't generate a response due to an error: ${errorMessage}. Please try rephrasing your message.`;
    }
  }
);
