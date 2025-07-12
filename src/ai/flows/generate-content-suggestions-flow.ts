
'use server';
/**
 * @fileOverview A flow for generating intelligent suggestions for the written content creator.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateContentSuggestionsInputSchema,
    GenerateContentSuggestionsOutputSchema,
    type GenerateContentSuggestionsInput,
    type GenerateContentSuggestionsOutput,
} from '@/types/ai';

export async function generateContentSuggestions(input: GenerateContentSuggestionsInput): Promise<GenerateContentSuggestionsOutput> {
  return generateContentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateContentSuggestionsInputSchema},
  output: {schema: GenerateContentSuggestionsOutputSchema},
  prompt: `You are a marketing expert. Based on the user's content topic, suggest a single, specific target audience and a list of 3-5 relevant keywords.

  Return ONLY a JSON object that matches the schema.

  For example, if the topic is "A blog post about the benefits of server-side rendering for SEO", you might suggest:
  - Audience: "Web developers and SEO specialists"
  - Keywords: ["SSR", "Next.js", "SEO", "Web Performance"]

  User's Topic: "{{topic}}"
`,
});

const generateContentSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateContentSuggestionsFlow',
    inputSchema: GenerateContentSuggestionsInputSchema,
    outputSchema: GenerateContentSuggestionsOutputSchema,
  },
  async (input) => {
    // Don't generate suggestions for very short topics
    if (input.topic.trim().split(/\s+/).length < 4) {
      return { suggestedAudience: '', suggestedKeywords: [] };
    }
    const response = await prompt(input);
    return response.output ?? { suggestedAudience: '', suggestedKeywords: [] };
  }
);
