
'use server';
/**
 * @fileOverview A flow for generating a content outline from a detailed idea.
 *
 * - generateContentOutline - Generates a structured outline.
 * - GenerateContentOutlineInput - The input type for the function.
 * - GenerateContentOutlineOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateContentOutlineInputSchema = z.object({
  contentType: z.string().describe("The type of content (e.g., 'Blog Post')."),
  mainTopic: z.string().describe('The core topic of the content.'),
  purpose: z.string().describe('The goal or objective of the content.'),
  targetAudience: z.string().describe('The intended audience.'),
  desiredTone: z.string().describe('The desired tone of voice.'),
  desiredLength: z.string().describe('The approximate desired length.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords to include.'),
});
export type GenerateContentOutlineInput = z.infer<typeof GenerateContentOutlineInputSchema>;

const GenerateContentOutlineOutputSchema = z.object({
  outline: z.array(z.string()).describe("An array of logical section titles for the content outline."),
});
export type GenerateContentOutlineOutput = z.infer<typeof GenerateContentOutlineOutputSchema>;

export async function generateContentOutline(input: GenerateContentOutlineInput): Promise<GenerateContentOutlineOutput> {
  return generateContentOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentOutlinePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateContentOutlineInputSchema},
  output: {schema: GenerateContentOutlineOutputSchema},
  prompt: `You are an expert content strategist and copywriter. Your task is to create a detailed, logical content outline based on the user's specifications. The outline should be a list of section titles that will form the structure of the final piece of content.

Return ONLY a JSON object that matches the schema, with an "outline" key containing an array of strings.

Content Details:
- Type: "{{contentType}}"
- Main Topic: "{{mainTopic}}"
- Purpose: "{{purpose}}"
- Target Audience: "{{targetAudience}}"
- Tone: "{{desiredTone}}"
- Desired Length: "{{desiredLength}}"
{{#if keywords}}
- Keywords to include: {{#each keywords}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

Based on these details, generate a comprehensive and logical outline. The outline should have a clear beginning, middle, and end.
`,
});

const generateContentOutlineFlow = ai.defineFlow(
  {
    name: 'generateContentOutlineFlow',
    inputSchema: GenerateContentOutlineInputSchema,
    outputSchema: GenerateContentOutlineOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    return response.output ?? { outline: [] };
  }
);
