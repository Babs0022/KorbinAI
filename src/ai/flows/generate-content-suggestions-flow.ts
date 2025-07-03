'use server';
/**
 * @fileOverview A flow for generating intelligent suggestions for the written content creator.
 *
 * - generateContentSuggestions - Suggests audience and keywords based on a topic.
 * - GenerateContentSuggestionsInput - Input type.
 * - GenerateContentSuggestionsOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateContentSuggestionsInputSchema = z.object({
  topic: z.string().describe('The main topic or message of the content.'),
});
export type GenerateContentSuggestionsInput = z.infer<typeof GenerateContentSuggestionsInputSchema>;

const GenerateContentSuggestionsOutputSchema = z.object({
  suggestedAudience: z.string().describe("A suggested target audience for this topic (e.g., 'Software Developers', 'Small Business Owners')."),
  suggestedKeywords: z.array(z.string()).describe("An array of 3-5 suggested keywords relevant to the topic."),
});
export type GenerateContentSuggestionsOutput = z.infer<typeof GenerateContentSuggestionsOutputSchema>;

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
