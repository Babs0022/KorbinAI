
'use server';
/**
 * @fileOverview A flow for drafting a single section of content based on a full outline.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */
import {ai} from '@/ai/genkit';
import {
    GenerateSectionDraftInputSchema,
    GenerateSectionDraftOutputSchema,
    type GenerateSectionDraftInput,
    type GenerateSectionDraftOutput,
} from '@/types/ai';

export async function generateSectionDraft(input: GenerateSectionDraftInput): Promise<GenerateSectionDraftOutput> {
  return generateSectionDraftFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSectionDraftPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateSectionDraftInputSchema},
  output: {schema: GenerateSectionDraftOutputSchema},
  prompt: `You are an expert copywriter tasked with writing one section of a larger document. Your goal is to write a well-crafted piece of content for the specified section, ensuring it flows logically from the previous content and fits within the overall structure. Your writing style must be natural and engaging.

**CRITICAL INSTRUCTION: Do NOT use the em dash (—) in your writing. Find alternative ways to structure your sentences.**

Return ONLY a JSON object that matches the schema, with the generated content in the "generatedSectionContent" field. **Do not include the section title itself in the output, only the body content.**

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
Ensure your writing is engaging, fits the desired tone, adheres to the critical writing instructions, and seamlessly continues from the prior content if it exists. Pay close attention to the Content Type Guidance.
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
