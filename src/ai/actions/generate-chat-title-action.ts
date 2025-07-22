
'use server';
/**
 * @fileoverview A dedicated server action for generating a chat title using an AI model.
 * This keeps the Genkit dependency isolated to the server.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Message } from '@/types/ai';

const titlePrompt = ai.definePrompt({
    name: 'generateChatTitle',
    input: { schema: z.string() },
    output: { schema: z.string() },
    prompt: `Summarize the following user query into a concise title of 3-5 words. For example, if the query is "Write a blog post about the benefits of intermittent fasting", the title could be "Blog Post on Intermittent Fasting".

    User Query: "{{query}}"`,
});

/**
 * Generates a title for a new chat session using an AI model.
 * @param firstMessage The first message from the user.
 * @returns A promise that resolves to a concise title string.
 */
export async function generateTitleForChat(firstMessage: Message): Promise<string> {
    if (!firstMessage.content) {
        return "Chat about an image";
    }

    try {
        const response = await titlePrompt({ query: firstMessage.content });
        return response.output() || "New Chat";
    } catch (error) {
        console.error("Failed to generate chat title:", error);
        // Fallback to simple truncation if AI fails
        return firstMessage.content.split(' ').slice(0, 5).join(' ') + '...';
    }
}
