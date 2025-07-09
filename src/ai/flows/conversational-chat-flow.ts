
'use server';
/**
 * @fileOverview A conversational chat flow for BrieflyAI.
 *
 * - conversationalChat - A function that handles a conversational turn.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Message, Part } from 'genkit';
import { ChatMessageSchema } from '@/types/chat';
import { generateImage } from './generate-image-flow';

// The input is now the entire chat history including the latest user message.
const ConversationalChatInputSchema = z.object({
  history: z.array(ChatMessageSchema),
});
type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

const ConversationalChatOutputSchema = z.object({
  role: z.literal('assistant'),
  content: z.string(),
  imageUrl: z.string().optional(),
});
export type ConversationalChatOutput = z.infer<typeof ConversationalChatOutputSchema>;


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
  * IMPORTANT: When asked to generate an image, illustration, or logo, you MUST respond ONLY with the exact text format: [IMAGE_GENERATION]A detailed text description of the image to generate.[/IMAGE_GENERATION]. Do not add any other words or pleasantries. For example: [IMAGE_GENERATION]A photorealistic image of a cat programming on a laptop, digital art style.[/IMAGE_GENERATION]

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
        const userHistory: Message[] = (input.history || []).map(msg => {
            const content: Part[] = [{ text: msg.content }];
            // If an imageUrl exists in the history, add it as a media part.
            if (msg.imageUrl) {
                content.push({ media: { url: msg.imageUrl } });
            }
            return {
                role: msg.role === 'assistant' ? 'model' : 'user',
                content,
            };
        });

        if (userHistory.length === 0) {
            throw new Error('At least one message is required in the history.');
        }

        // This is the correct pattern for models that don't support a 'system' role.
        // We embed the instructions as the first turn of the conversation.
        const historyWithSystemPrompt: Message[] = [
            { role: 'user', content: [{ text: systemPrompt }] },
            { role: 'model', content: [{ text: 'Understood. I will act as BrieflyAI and follow all instructions.' }] },
            ...userHistory
        ];

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest',
            history: historyWithSystemPrompt,
        });

        const assistantResponseText = response.text;
        const imageMatch = assistantResponseText.match(/\[IMAGE_GENERATION\](.*)\[\/IMAGE_GENERATION\]/s);

        if (imageMatch && imageMatch[1]) {
            const imagePrompt = imageMatch[1].trim();
            try {
                const imageResult = await generateImage({ prompt: imagePrompt, count: 1 });
                if (imageResult.imageUrls && imageResult.imageUrls.length > 0) {
                    return {
                        role: 'assistant',
                        content: `Here is the image you requested for "${imagePrompt}":`,
                        imageUrl: imageResult.imageUrls[0]
                    };
                } else {
                    throw new Error("AI failed to return an image.");
                }
            } catch (imgError) {
                 const errorMsg = imgError instanceof Error ? imgError.message : "An unknown error occurred during image generation.";
                 return {
                    role: 'assistant',
                    content: `Sorry, I couldn't generate the image. Reason: ${errorMsg}`
                 };
            }
        }
        
        return {
            role: 'assistant',
            content: assistantResponseText,
        };
    }
);
