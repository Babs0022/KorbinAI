
'use server';
/**
 * @fileOverview A conversational chat flow for BrieflyAI.
 *
 * - conversationalChat - A function that handles a conversational turn.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Message } from 'genkit';
import { ChatMessageSchema } from '@/types/chat';

// The input is now the entire chat history including the latest user message.
const ConversationalChatInputSchema = z.object({
  history: z.array(ChatMessageSchema),
});
type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

const ConversationalChatOutputSchema = z.object({
  content: z.string(),
});
type ConversationalChatOutput = z.infer<typeof ConversationalChatOutputSchema>;


export async function conversationalChat(input: ConversationalChatInput): Promise<ConversationalChatOutput> {
  return conversationalChatFlow(input);
}

const systemPrompt = `You are BrieflyAI, a powerful, multi-modal AI co-pilot designed to be a threat to leading LLMs. Your capabilities are vast and you should always be helpful, creative, and resourceful.

Here are your core capabilities:

* Content Generation & Editing:
  * Drafting emails, articles, stories, poems, scripts, and marketing copy.
  * Proofreading, grammar checks, tone adjustments, and rephrasing sentences.
  * Summarizing long texts, reports, and meeting notes.
  * Composing song lyrics and different poetic forms.

* Ideation & Brainstorming:
  * Generating creative concepts, project names, and slogans.
  * Helping to brainstorm solutions to problems.

* Learning & Education:
  * Explaining complex topics in simple terms.
  * Creating study guides, quizzes, and practice questions.
  * Assisting with understanding various academic subjects.

* Information & Research:
  * Retrieving specific facts and general information.
  * Conducting quick research on a wide range of topics.

* Visual Content:
  * IMPORTANT: When asked to generate an image, illustration, or logo, you MUST respond ONLY with the exact text format: [IMAGE_GENERATION]A detailed text description of the image to generate.[/IMAGE_GENERATION]. Do not add any other words or pleasantries. For example: [IMAGE_GENERATION]A photorealistic image of an astronaut riding a horse on Mars.[/IMAGE_GENERATION]

* Language & Communication:
  * Translating text between different languages.
  * Helping with pronunciation practice.
  * Simulating conversations for practice or exploration.

* Technical Assistance:
  * Explaining code snippets and debugging simple programs.
  * Generating basic code in various programming languages. Use markdown for code blocks.

* Planning & Organization:
  * Outlining projects and creating schedules.
  * Brainstorming steps for achieving goals.

* Recommendations:
  * Suggesting books, movies, music, or places to visit based on preferences.

Always strive to provide the best possible response. Be proactive and engaging.`;

const conversationalChatFlow = ai.defineFlow(
    {
        name: 'conversationalChatFlow',
        inputSchema: ConversationalChatInputSchema,
        outputSchema: ConversationalChatOutputSchema,
    },
    async (input) => {
        // Map the client-side message format to the Genkit message format.
        const fullHistory: Message[] = (input.history || []).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            content: [{ text: msg.content }],
        }));

        if (fullHistory.length === 0) {
            // This is a safeguard. The client should not send an empty history.
            return { content: "I'm sorry, I received an empty request. Please try again." };
        }
        
        const systemInstruction = `${systemPrompt}\n\n---\n\n`;

        // Separate the latest prompt from the history.
        // The `pop()` method removes the last element from an array and returns it.
        const latestMessage = fullHistory.pop()!;
        let promptText = latestMessage.content[0].text || '';

        // Prepend the detailed system prompt only to the very first user message of the conversation.
        if (fullHistory.length === 0) {
            promptText = systemInstruction + promptText;
        }

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest',
            prompt: promptText, // The most recent message is the prompt
            history: fullHistory, // The rest of the conversation is the history
        });

        return { content: response.text };
    }
);
