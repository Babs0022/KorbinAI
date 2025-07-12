
'use server';
/**
 * @fileOverview A flow for generating output format suggestions for the prompt generator.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */
import {ai} from '@/ai/genkit';
import {
    GeneratePromptFormatSuggestionsInputSchema,
    GeneratePromptFormatSuggestionsOutputSchema,
    type GeneratePromptFormatSuggestionsInput,
    type GeneratePromptFormatSuggestionsOutput,
} from '@/types/ai';

export async function generatePromptFormatSuggestions(input: GeneratePromptFormatSuggestionsInput): Promise<GeneratePromptFormatSuggestionsOutput> {
  return generatePromptFormatSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromptFormatSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GeneratePromptFormatSuggestionsInputSchema},
  output: {schema: GeneratePromptFormatSuggestionsOutputSchema},
  prompt: `You are a prompt engineering assistant. Based on the user's task description, suggest a list of 3-4 common and useful output formats.
  Return ONLY a JSON object with a "suggestions" array.
  Your suggestions should be short phrases.
  For example, if the task is "Create a list of 10 marketing ideas", you could suggest ["Bulleted List", "JSON array of strings", "CSV format"].
  If the task is "Write a short blog post", you could suggest ["Markdown", "Plain text"].

  User's Task Description: "{{taskDescription}}"
`,
});

const generatePromptFormatSuggestionsFlow = ai.defineFlow(
  {
    name: 'generatePromptFormatSuggestionsFlow',
    inputSchema: GeneratePromptFormatSuggestionsInputSchema,
    outputSchema: GeneratePromptFormatSuggestionsOutputSchema,
  },
  async (input) => {
    // Don't generate suggestions for very short descriptions
    if (input.taskDescription.trim().split(/\s+/).length < 3) {
      return { suggestions: [] };
    }
    const response = await prompt(input);
    return response.output ?? { suggestions: [] };
  }
);
