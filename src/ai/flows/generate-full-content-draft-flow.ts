
'use server';
/**
 * @fileOverview A flow for generating a full content draft from an outline.
 *
 * - generateFullContentDraft - Generates a complete piece of content.
 * - GenerateFullContentDraftInput - The input type for the function.
 * - GenerateFullContentDraftOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateFullContentDraftInputSchema = z.object({
  finalOutline: z.array(z.string()).describe("The finalized list of section titles for the content outline."),
  contentType: z.string().describe("The type of content (e.g., 'Blog Post')."),
  mainTopic: z.string().describe('The core topic of the content.'),
  purpose: z.string().describe('The goal or objective of the content.'),
  targetAudience: z.string().describe('The intended audience.'),
  desiredTone: z.string().describe('The desired tone of voice.'),
  desiredLength: z.string().describe('The approximate desired length.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords to include.'),
});
export type GenerateFullContentDraftInput = z.infer<typeof GenerateFullContentDraftInputSchema>;

const GenerateFullContentDraftOutputSchema = z.object({
  generatedContent: z.string().describe("The full, final generated content as a single markdown string."),
});
export type GenerateFullContentDraftOutput = z.infer<typeof GenerateFullContentDraftOutputSchema>;

export async function generateFullContentDraft(input: GenerateFullContentDraftInput): Promise<GenerateFullContentDraftOutput> {
  return generateFullContentDraftFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFullContentDraftPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: GenerateFullContentDraftInputSchema},
  output: {schema: GenerateFullContentDraftOutputSchema},
  prompt: `You are an expert copywriter and content creator, tasked with writing a complete piece of content based on a structured plan. Your writing style must be natural and engaging, avoiding common AI-generated phrases and structures.

**CRITICAL INSTRUCTION: Do NOT use the em dash (—) in your writing. Find alternative ways to structure your sentences.**

Return ONLY a JSON object that matches the schema, with the full content in the "generatedContent" field. The content should be a single, well-formatted markdown string.

**Content Type Guidance:**
You MUST adapt your final output based on the requested "{{contentType}}".
- **Blog Post / Article / Report / Website Page Copy:** Write in a standard long-form document format. Use markdown headings for each section from the outline.
- **Email Series:** For each outline item (which is an email subject), write a corresponding email body. Clearly label each email with "--- Email: [Subject] ---" as a separator.
- **Social Media Campaign:** For each outline item (which represents a post), write the social media post content. Clearly label each post with "--- Post: [Platform/Title] ---" as a separator and include relevant hashtags.

**Content Specifications:**
- **Main Topic:** "{{mainTopic}}"
- **Purpose:** "{{purpose}}"
- **Target Audience:** "{{targetAudience}}"
- **Tone:** "{{desiredTone}}"
- **Desired Length:** "{{desiredLength}}"
{{#if keywords}}
- **Keywords to Incorporate:** {{#each keywords}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

**Final Outline (You MUST follow this structure):**
{{#each finalOutline}}
- {{this}}
{{/each}}

Now, write the complete piece of content. Ensure it flows logically from one section to the next, adheres to the critical writing instructions, and meets all the specifications provided, especially the Content Type Guidance.
`,
});

const generateFullContentDraftFlow = ai.defineFlow(
  {
    name: 'generateFullContentDraftFlow',
    inputSchema: GenerateFullContentDraftInputSchema,
    outputSchema: GenerateFullContentDraftOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    return response.output ?? { generatedContent: '' };
  }
);
