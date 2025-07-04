
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
  prompt: `You are an expert copywriter.

{{#if originalContent}}
Your task is to refine the following content based on a specific instruction.

Original Content:
---
{{{originalContent}}}
---

Refinement Instruction: "{{refinementInstruction}}"

Refine the content now. Ensure the output is only the refined text, formatted nicely (e.g., with markdown).
{{else}}
Your task is to generate high-quality written content based on the user's specifications.

Content Type: "{{contentType}}"
Tone of Voice: "{{tone}}"
Main Topic/Message: "{{topic}}"
{{#if audience}}
Target Audience: "{{audience}}"
{{/if}}
{{#if keywords}}
Keywords to Include: "{{keywords}}"
{{/if}}
  
Generate the content now. Ensure it is well-written, engaging, and perfectly matches the requested tone and topic.
Format the output nicely. For example, use markdown for headings and lists for blog posts.
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

    // Only save brand new generations, not refinements
    if (input.userId && !input.originalContent) {
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
