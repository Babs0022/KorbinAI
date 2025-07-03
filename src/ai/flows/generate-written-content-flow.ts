'use server';
/**
 * @fileOverview A flow for generating written content based on user specifications.
 * 
 * - generateWrittenContent - A function that generates content like blog posts, emails, etc.
 * - GenerateWrittenContentInput - The input type for the function.
 * - GenerateWrittenContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const GenerateWrittenContentInputSchema = z.object({
  contentType: z.string().describe("The type of content to generate (e.g., 'Blog Post', 'Email')."),
  tone: z.string().describe("The desired tone of voice (e.g., 'Professional', 'Casual', 'Witty')."),
  topic: z.string().describe('The main topic or message of the content.'),
  audience: z.string().optional().describe('The target audience for the content.'),
  keywords: z.string().optional().describe('A comma-separated list of keywords to include.'),
});
export type GenerateWrittenContentInput = z.infer<typeof GenerateWrittenContentInputSchema>;

export const GenerateWrittenContentOutputSchema = z.object({
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
  prompt: `You are an expert copywriter. Your task is to generate high-quality written content based on the user's specifications.

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
