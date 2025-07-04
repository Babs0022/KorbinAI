
'use server';
/**
 * @fileOverview A flow for generating and refining written content based on user specifications.
 * 
 * - generateWrittenContent - A function that generates or refines content like blog posts, emails, etc.
 * - GenerateWrittenContentInput - The input type for the function.
 * - GenerateWrittenContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { saveWorkspace } from '@/services/workspaceService';

const GenerateWrittenContentInputSchema = z.object({
  contentType: z.string().describe("The type of content to generate (e.g., 'Blog Post', 'Email')."),
  tone: z.string().describe("The desired tone of voice (e.g., 'Professional', 'Casual', 'Witty')."),
  topic: z.string().describe('The main topic or message of the content.'),
  audience: z.string().optional().describe('The target audience for the content.'),
  keywords: z.string().optional().describe('A comma-separated list of keywords to include.'),
  outputFormat: z.string().optional().describe("The desired output format (e.g., 'JSON', 'Markdown', 'HTML'). Defaults to Markdown if not specified."),
  examples: z.array(z.object({
    input: z.string().describe("An example of a user's input."),
    output: z.string().describe("The corresponding desired output for the example input.")
  })).optional().describe("An array of few-shot examples to guide the model's response style and structure."),
  originalContent: z.string().optional().describe('Existing content to be refined. If present, the flow will refine this content instead of generating new content from the topic.'),
  refinementInstruction: z.string().optional().describe("The instruction for refining the content (e.g., 'Make it shorter', 'Change the tone to witty')."),
  userId: z.string().optional().describe('The ID of the user performing the generation.'),
});
export type GenerateWrittenContentInput = z.infer<typeof GenerateWrittenContentInputSchema>;

const GenerateWrittenContentOutputSchema = z.object({
  generatedContent: z.string().describe('The complete, formatted written content.'),
});
export type GenerateWrittenContentOutput = z.infer<typeof GenerateWrittenContentOutputSchema>;

export async function generateWrittenContent(input: GenerateWrittenContentInput): Promise<GenerateWrittenContentOutput> {
  return generateWrittenContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWrittenContentPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
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

    // Save every generation to the workspace if a user is logged in.
    if (input.userId) {
      const { userId, ...workspaceInput } = input;
      await saveWorkspace({
        userId,
        type: 'written-content',
        input: workspaceInput,
        output: output.generatedContent,
        featurePath: '/written-content',
      });
    }

    return output;
  }
);
