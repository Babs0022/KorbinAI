
'use server';
/**
 * @fileOverview A flow for expanding a single section of a content outline.
 *
 * - expandOutlineSection - Generates detailed points for a specific outline section.
 * - ExpandOutlineSectionInput - The input type for the function.
 * - ExpandOutlineSectionOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const ExpandOutlineSectionInputSchema = z.object({
  currentOutlineSectionText: z.string().describe('The specific section title to be expanded.'),
  fullContentTopic: z.string().describe('The main topic of the entire piece of content.'),
  fullContentOutline: z.array(z.string()).describe('The complete list of all section titles in the outline.'),
});
export type ExpandOutlineSectionInput = z.infer<typeof ExpandOutlineSectionInputSchema>;

const ExpandOutlineSectionOutputSchema = z.object({
  expandedContent: z.string().describe("A markdown-formatted string containing detailed sub-points or a brief paragraph for the given section."),
});
export type ExpandOutlineSectionOutput = z.infer<typeof ExpandOutlineSectionOutputSchema>;

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
