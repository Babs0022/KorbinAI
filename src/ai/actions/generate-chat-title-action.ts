
'use server';
/**
 * @fileoverview A dedicated server action for generating a chat title using an AI model.
 * This keeps the Genkit dependency isolated to the server.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTitleInputSchema = z.object({
    userMessage: z.string(),
    aiResponse: z.string(),
});

const titlePrompt = ai.definePrompt({
    name: 'generateChatTitle',
    model: 'googleai/gemini-1.5-pro-latest', // Corrected model name
    input: { schema: GenerateTitleInputSchema },
    output: { schema: z.string() },
    prompt: `Summarize the following conversation into a concise title of 3-5 words. The title should reflect the core topic of the exchange.

For example:
- User: "Write a blog post about intermittent fasting"
- AI: "Of course, here is a draft..."
- Title: "Blog on Intermittent Fasting"

- User: "generate an image of a red panda wizard"
- AI: "I've generated an image for you..."
- Title: "Red Panda Wizard Image"

Conversation to summarize:
---
User Query: "{{userMessage}}"
AI Response: "{{aiResponse}}"
---
`,
});

/**
 * Generates a title for a new chat session using an AI model.
 * @param userMessage The first message from the user.
 * @param aiResponse The first response from the AI.
 * @returns A promise that resolves to a concise title string.
 */
export async function generateTitleForChat(userMessage: string, aiResponse: string): Promise<string> {
    if (!userMessage && !aiResponse) {
        return "New Chat";
    }

    // Handle case where user sends only an image
    if (!userMessage) {
        return "Chat about an image";
    }

    try {
        const response = await titlePrompt({ userMessage, aiResponse });
        // Use a fallback to ensure a title is always returned.
        return response.output() || userMessage.split(' ').slice(0, 5).join(' ') + '...';
    } catch (error) {
        console.error("Failed to generate chat title:", error);
        // Fallback to simple truncation if AI fails
        return userMessage.split(' ').slice(0, 5).join(' ') + '...';
    }
}
