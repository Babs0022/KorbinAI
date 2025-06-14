
'use server';
/**
 * @fileOverview A flow to generate AI prompts based on user-provided context text.
 *
 * - generatePromptFromContext - A function that calls the flow.
 * - GeneratePromptFromContextInput - The input type for the flow.
 * - GeneratePromptFromContextOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromptFromContextInputSchema = z.object({
  contextText: z.string().describe('The existing text or content provided by the user as context.'),
});
export type GeneratePromptFromContextInput = z.infer<typeof GeneratePromptFromContextInputSchema>;

const GeneratePromptFromContextOutputSchema = z.object({
  generatedPrompt: z.string().describe('The AI-generated prompt that is relevant to the provided context.'),
  analysis: z.string().describe('A brief explanation of how the generated prompt relates to the context text.'),
});
export type GeneratePromptFromContextOutput = z.infer<typeof GeneratePromptFromContextOutputSchema>;

export async function generatePromptFromContext(input: GeneratePromptFromContextInput): Promise<GeneratePromptFromContextOutput> {
  return contextualPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualPromptGenerator',
  input: {schema: GeneratePromptFromContextInputSchema},
  output: {schema: GeneratePromptFromContextOutputSchema},
  prompt: `You are an expert AI prompt engineer. Your task is to analyze the provided "Context Text" and generate a new, relevant AI prompt.

This new prompt could be:
1. A follow-up prompt that builds upon the ideas or information in the Context Text.
2. A prompt that could have been used to generate the Context Text itself (if the Context Text appears to be AI-generated or is a piece of creative writing).
3. A prompt to explore related topics or expand on a specific aspect of the Context Text.
4. A prompt that asks the AI to perform an action based on the Context Text (e.g., summarize, explain, critique).

Analyze the Context Text carefully.

Context Text:
"{{{contextText}}}"

Based on your analysis, generate:
- "generatedPrompt": A clear, concise, and actionable AI prompt.
- "analysis": A brief explanation (1-2 sentences) of how your generated prompt relates to the provided Context Text and why it's a good next step or relevant exploration.

If the context text is very short, unclear, or seems incomplete, try to generate a prompt that encourages the user to elaborate or clarify their intent based on the provided snippet.
Focus on creating practical and useful prompts.
`,
});

const contextualPromptFlow = ai.defineFlow(
  {
    name: 'contextualPromptFlow',
    inputSchema: GeneratePromptFromContextInputSchema,
    outputSchema: GeneratePromptFromContextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
