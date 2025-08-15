
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
    model: 'googleai/gemini-2.5-pro', // Align with main model
    input: { schema: GenerateTitleInputSchema },
    output: { schema: z.string() },
    prompt: `Generate a short, descriptive conversation title (3-6 words) based on the user's request and the AI's response.
- Use Title Case.
- Do not include quotes, trailing punctuation, or emojis.
- Avoid generic words like "Chat" or "Conversation".

Examples:
- User: "Write a blog post about intermittent fasting"
- AI: "Of course, here is a draft..."
- Title: Intermittent Fasting Blog

- User: "generate an image of a red panda wizard"
- AI: "I've generated an image for you..."
- Title: Red Panda Wizard Image

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
        return 'Untitled Conversation';
    }

    const fallbackTitle = 'Untitled Conversation';

    try {
        const response = await titlePrompt({ userMessage, aiResponse });

        // Ensure we access .text as a property and sanitize the output
        const generatedTitle = (response.text || '').trim().replace(/^\s*["']|["']\s*$/g, '');

        return generatedTitle || fallbackTitle;

    } catch (error) {
        console.error('Failed to generate chat title:', error);
        return fallbackTitle;
    }
}