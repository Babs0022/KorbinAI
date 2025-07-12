
'use server';
/**
 * @fileOverview A flow for generating and refining written content based on user specifications.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateWrittenContentInputSchema,
    GenerateWrittenContentOutputSchema,
    type GenerateWrittenContentInput,
    type GenerateWrittenContentOutput,
} from '@/types/ai';

export async function generateWrittenContent(input: GenerateWrittenContentInput): Promise<GenerateWrittenContentOutput> {
  return generateWrittenContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWrittenContentPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: GenerateWrittenContentInputSchema},
  output: {schema: GenerateWrittenContentOutputSchema},
  prompt: `You are an expert copywriter and content creator.

{{#if originalContent}}
Your task is to refine the following content based on a specific instruction.

Original Content:
---
{{{originalContent}}}
---

Refinement Instruction: "{{refinementInstruction}}"

Refine the content now. Ensure the output is only the refined text, formatted nicely (e.g., with markdown).
{{else}}
You are a world-class AI content creation expert, acting as a {{tone}} writer. Your goal is to generate high-quality content based on the user's request.

{{#if imageDataUris}}
**Image Context:**
Use the following image(s) as the primary context for your writing. The user's topic should be interpreted in relation to these images.
{{#each imageDataUris}}
{{media url=this}}
{{/each}}
{{/if}}

**Core Task:**
Generate a "{{contentType}}" about the following topic: "{{topic}}".

**Audience:**
{{#if audience}}
The content should be tailored for the following audience: "{{audience}}".
{{else}}
The content should be written for a general audience.
{{/if}}

**Keywords:**
{{#if keywords}}
Incorporate the following keywords naturally into the content: {{keywords}}.
{{/if}}

**Output Format:**
{{#if outputFormat}}
The final output MUST be in well-formed {{outputFormat}} format.
{{else}}
The final output should be in well-formatted Markdown.
{{/if}}

{{#if examples}}
**Examples (Few-Shot Learning):**
Use the following input/output examples as a strict guide for the desired style and structure. Replicate the output format precisely.
{{#each examples}}
---
EXAMPLE INPUT:
\`{{this.input}}\`

EXAMPLE OUTPUT:
\`{{{this.output}}}\`
---
{{/each}}
{{/if}}

Generate the content now based on these instructions. Do not include any explanations or introductions, only the generated content itself.
{{/if}}
`,
});

const generateWrittenContentFlow = ai.defineFlow(
  {
    name: 'generateWrittenContentFlow',
    inputSchema: GenerateWrittenContentInputSchema,
    outputSchema: GenerateWrittenContentOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;

    if (!output?.generatedContent) {
      console.error('AI response was empty or invalid. Raw text from model:', response.text);
      throw new Error('Failed to generate content because the AI response was empty or invalid.');
    }

    return output;
  }
);
