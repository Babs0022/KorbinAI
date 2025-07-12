
'use server';
/**
 * @fileOverview A flow for generating optimized AI prompts based on user requirements.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import {
    GeneratePromptInputSchema,
    GeneratePromptOutputSchema,
    type GeneratePromptInput,
    type GeneratePromptOutput,
} from '@/types/ai';

// Export the main function that the client will call
export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptOutput> {
  return generatePromptFlow(input);
}

// Define the Genkit prompt template
const prompt = ai.definePrompt({
  name: 'generatePromptPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: GeneratePromptInputSchema},
  output: {schema: GeneratePromptOutputSchema},
  prompt: `You are a world-class expert in prompt engineering. Your task is to take a user's simple description of a task and transform it into a highly effective, detailed, and optimized prompt for a large language model.

Follow these principles:
1.  **Clarity and Specificity:** Be explicit. Remove ambiguity.
2.  **Persona:** Assign a role or persona to the AI (e.g., "You are an expert copywriter...").
3.  **Context:** Provide all necessary background information.
4.  **Task Definition:** Clearly state the goal and the steps to achieve it.
5.  **Constraints & Format:** Specify the desired output format, length, style, and any negative constraints.

{{#if imageDataUris}}
**Image Context:**
The user has provided image(s) as context. Your generated prompt should incorporate this image. For example, by instructing the target model to analyze or describe it.
{{#each imageDataUris}}
{{media url=this}}
{{/each}}
{{/if}}

User's Task Description: "{{taskDescription}}"
{{#if targetModel}}
Target AI Model: "{{targetModel}}"
{{/if}}
{{#if outputFormat}}
Desired Output Format: "{{outputFormat}}"
{{/if}}

Generate the prompt now. Return only a JSON object that matches the schema.
`,
});

// Define the Genkit flow
const generatePromptFlow = ai.defineFlow(
  {
    name: 'generatePromptFlow',
    inputSchema: GeneratePromptInputSchema,
    outputSchema: GeneratePromptOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;

    if (!output?.generatedPrompt) {
      console.error('AI response was empty or invalid. Raw text from model:', response.text);
      throw new Error('Failed to generate prompt because the AI response was empty or invalid.');
    }

    return output;
  }
);
