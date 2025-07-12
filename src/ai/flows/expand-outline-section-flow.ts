
'use server';
/**
 * @fileOverview A flow for expanding a single section of a content outline.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */
import {ai} from '@/ai/genkit';
import {
    ExpandOutlineSectionInputSchema,
    ExpandOutlineSectionOutputSchema,
    type ExpandOutlineSectionInput,
    type ExpandOutlineSectionOutput,
} from '@/types/ai';

export async function expandOutlineSection(input: ExpandOutlineSectionInput): Promise<ExpandOutlineSectionOutput> {
  return expandOutlineSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandOutlineSectionPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: ExpandOutlineSectionInputSchema},
  output: {schema: ExpandOutlineSectionOutputSchema},
  prompt: `You are an expert content writer and strategist, tasked with fleshing out a section of a content outline.

Your goal is to generate 3-5 detailed sub-points or a brief, well-structured paragraph that elaborates on the given section title. The output should be directly usable as draft content for that section. Use markdown for formatting (e.g., bullet points).

Return ONLY a JSON object that matches the schema.

Here is the context for the entire piece of content:
- Main Topic: "{{fullContentTopic}}"
- Full Outline:
{{#each fullContentOutline}}
  - {{this}}
{{/each}}

Now, focus ONLY on the following section and generate its detailed sub-points or a brief paragraph:
- Section to Expand: "{{currentOutlineSectionText}}"
`,
});

const expandOutlineSectionFlow = ai.defineFlow(
  {
    name: 'expandOutlineSectionFlow',
    inputSchema: ExpandOutlineSectionInputSchema,
    outputSchema: ExpandOutlineSectionOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    return response.output ?? { expandedContent: '' };
  }
);
