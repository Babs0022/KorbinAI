
'use server';
/**
 * @fileOverview A flow for handling conversational chat with history.
 *
 * - conversationalChat - A function that handles a single turn of a conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
    ConversationalChatInputSchema as OriginalConversationalChatInputSchema,
    MessageSchema,
    type Message,
} from '@/types/ai';
import { getCurrentTime } from '@/ai/tools/time-tool';
import { generateImage } from '@/ai/tools/image-generation-tool';
import { scrapeWebPage } from '@/ai/tools/web-scraper-tool';
import { GenerateOptions, MessageData, Part } from '@genkit-ai/ai';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateTitleForChat } from '../actions/generate-chat-title-action';

// Define the schema for the structured streaming chunks
export const StreamPartSchema = z.object({
    type: z.enum(['thinking_start', 'thinking_end', 'tool_code', 'tool_output', 'answer_chunk', 'sources']),
    payload: z.any(),
});
export type StreamPart = z.infer<typeof StreamPartSchema>;

// Extend the input schema to include the optional onStream callback
const ConversationalChatInputSchema = OriginalConversationalChatInputSchema.extend({
    onStream: z.function().args(StreamPartSchema).returns(z.void()).optional(),
});

type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

// Default prompt (remains the same)
const defaultSystemPrompt = `You are Korbin, an expert AI Copilot...`; // Truncated for brevity

async function getUserSystemPrompt(userId?: string): Promise<string> {
    if (!userId) {
        return defaultSystemPrompt;
    }
    try {
        const userDocRef = adminDb.collection("users").doc(userId);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            const data = userDoc.data();
            if (data && data.customSystemPrompt && data.customSystemPrompt.trim()) {
                return `${data.customSystemPrompt}\n\nNo matter what, your name is Korbin and you are an AI assistant.`;
            }
        }
    } catch (error) {
        console.error("Failed to fetch user-specific system prompt:", error);
    }
    return defaultSystemPrompt;
}

export const conversationalChat = ai.defineFlow(
  {
    name: 'conversationalChat',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: z.string(),
  },
  async (input: ConversationalChatInput) => {
    
    if (!input.history || input.history.length === 0) {
      return "I'm sorry, but I can't respond to an empty message.";
    }

    const systemPrompt = await getUserSystemPrompt(input.userId);
    const validMessages = input.history.filter(msg => (msg.content || (msg.mediaUrls && msg.mediaUrls.length > 0)));

    const messages = validMessages.map((msg): MessageData => {
        const content: Part[] = [];
        if (msg.content) { content.push({ text: msg.content }); }
        if (msg.mediaUrls) { msg.mediaUrls.forEach(url => content.push({ media: { url } })); }
        return { role: msg.role === 'user' ? 'user' : 'model', content };
    });

    if (messages.length === 0) {
      return "No valid messages to process.";
    }

    const modelToUse = 'googleai/gemini-1.5-pro';
    const tools = [getCurrentTime, generateImage, scrapeWebPage];
    const sources: any[] = [];
    
    try {
        input.onStream?.({ type: 'thinking_start', payload: {} });

        const response = await ai.generate({
            model: modelToUse,
            system: defaultSystemPrompt,
            messages: messages,
            tools: tools,
            streamingCallback: (chunk) => {
                if (!input.onStream) return;
                if (chunk.content) {
                    for (const part of chunk.content) {
                        if (part.toolRequest) {
                            input.onStream({ type: 'tool_code', payload: { toolName: part.toolRequest.name, args: part.toolRequest.input } });
                        } else if (part.toolResponse) {
                            input.onStream({ type: 'tool_output', payload: part.toolResponse.output });
                            if (part.toolResponse.name === 'scrapeWebPage' && part.toolResponse.output) {
                                sources.push(...(Array.isArray(part.toolResponse.output) ? part.toolResponse.output : [part.toolResponse.output]));
                            }
                        } else if (part.text) {
                            input.onStream({ type: 'answer_chunk', payload: part.text });
                        }
                    }
                }
            },
        });

        input.onStream?.({ type: 'thinking_end', payload: {} });
        if (sources.length > 0) {
            input.onStream?.({ type: 'sources', payload: sources });
        }

        const fullResponseText = response.text;

        // Fire-and-forget database updates
        (async () => {
            if (!fullResponseText.trim() || !input.chatId) return;
            try {
                const aiMessage: Message = { role: 'model', content: fullResponseText };
                const finalHistory = [...input.history, aiMessage];
                const chatRef = adminDb.collection('chatSessions').doc(input.chatId);
                const sanitizedMessages = finalHistory.map(message => ({
                    role: message.role,
                    content: message.content ?? '',
                    ...(message.mediaUrls && { mediaUrls: message.mediaUrls }),
                }));

                const updateData: { messages: Message[], updatedAt: FieldValue, title?: string } = {
                    messages: sanitizedMessages,
                    updatedAt: FieldValue.serverTimestamp(),
                };

                if (!input.isExistingChat) {
                    const userMessage = input.history.find(m => m.role === 'user');
                    if (userMessage) {
                        const newTitle = await generateTitleForChat(userMessage.content, aiMessage.content);
                        updateData.title = newTitle;
                    }
                }
                
                await chatRef.update(updateData);
            } catch (dbError) {
                console.error("Failed to save chat session:", dbError);
            }
        })();
        
        return fullResponseText;
    } catch (error) {
        console.error("AI generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        input.onStream?.({ type: 'answer_chunk', payload: `Sorry, an error occurred: ${errorMessage}` });
        return `Sorry, an error occurred: ${errorMessage}`;
    }
  }
);

    