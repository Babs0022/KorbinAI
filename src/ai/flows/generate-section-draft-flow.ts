
'use server';
/**
 * @fileOverview A flow for drafting a single section of content based on a full outline.
 *
 * - generateSectionDraft - Generates the written content for a single outline section.
 * - GenerateSectionDraftInput - The input type for the function.
 * - GenerateSectionDraftOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateSectionDraftInputSchema = z.object({
  sectionToDraft: z.string().describe('The specific outline section title to be drafted.'),
  fullOutline: z.array(z.string()).describe('The complete list of all section titles in the outline.'),
  mainTopic: z.string().describe('The main topic of the entire piece of content.'),
  priorContent: z.string().optional().describe('The content that was generated for the previous sections, to ensure a smooth transition.'),
  contentType: z.string().describe("The type of content (e.g., 'Blog Post')."),
  purpose: z.string().describe('The goal or objective of the content.'),
  targetAudience: z.string().describe('The intended audience.'),
  desiredTone: z.string().describe('The desired tone of voice.'),
});
export type GenerateSectionDraftInput = z.infer<typeof GenerateSectionDraftInputSchema>;

const GenerateSectionDraftOutputSchema = z.object({
  generatedSectionContent: z.string().describe("The written content for the specified section, formatted as a markdown string."),
});
export type GenerateSectionDraftOutput = z.infer<typeof GenerateSectionDraftOutputSchema>;

export async function generateSectionDraft(input: GenerateSectionDraftInput): Promise<GenerateSectionDraftOutput> {
  return generateSectionDraftFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSectionDraftPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateSectionDraftInputSchema},
  output: {schema: GenerateSectionDraftOutputSchema},
  prompt: `You are an expert copywriter tasked with writing one section of a larger document. Your goal is to write a well-crafted piece of content for the specified section, ensuring it flows logically from the previous content and fits within the overall structure. Your output format MUST be adapted to the requested "Content Type".

Return ONLY a JSON object that matches the schema, with the generated content in the "generatedSectionContent" field. The content should be a single, well-formatted markdown string. Do not include the section title itself in the output, only the body content.

**Content Type Guidance:**
You MUST adapt your output based on the requested "{{contentType}}".
- **Blog Post / Article / Report / Website Page Copy:** Write the content for this section in a standard long-form document format.
- **Email Series:** The section title is an email subject. Write the body content for that single email.
- **Social Media Campaign:** The section title represents a single social media post. Write the content for that post, including relevant hashtags.

**Overall Content Context:**
- **Main Topic:** "{{mainTopic}}"
- **Content Type:** "{{contentType}}"
- **Purpose:** "{{purpose}}"
- **Target Audience:** "{{targetAudience}}"
- **Desired Tone:** "{{desiredTone}}"

**Full Content Outline:**
{{#each fullOutline}}
- {{this}}
{{/each}}

{{#if priorContent}}
**Content from Previous Sections (for context and flow):**
---
{{{priorContent}}}
---
{{/if}}

**Your Current Task:**
Write the content ONLY for the following section: **"{{sectionToDraft}}"**.
Ensure your writing is engaging, fits the desired tone, and seamlessly continues from the prior content if it exists. Pay close attention to the Content Type Guidance.
`,
});

const generateSectionDraftFlow = ai.defineFlow(
  {
    name: 'generateSectionDraftFlow',
    inputSchema: GenerateSectionDraftInputSchema,
    outputSchema: GenerateSectionDraftOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    return response.output ?? { generatedSectionContent: '' };
  }
);
