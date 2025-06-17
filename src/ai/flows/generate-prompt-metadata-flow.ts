
'use server';
/**
 * @fileOverview A flow to generate a descriptive name and relevant tags for an AI prompt.
 *
 * - generatePromptMetadata - A function that calls the flow.
 * - GeneratePromptMetadataInput - The input type for the flow.
 * - GeneratePromptMetadataOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromptMetadataInputSchema = z.object({
  optimizedPrompt: z.string().describe('The optimized AI prompt text for which metadata is needed.'),
  originalGoal: z.string().describe('The original goal the user had for this prompt.'),
});
export type GeneratePromptMetadataInput = z.infer<typeof GeneratePromptMetadataInputSchema>;

const GeneratePromptMetadataOutputSchema = z.object({
  suggestedName: z.string().describe('A concise and descriptive name for the prompt (e.g., 3-7 words).'),
  suggestedTags: z.array(z.string()).describe('An array of 2-4 relevant, concise tags for the prompt.'),
});
export type GeneratePromptMetadataOutput = z.infer<typeof GeneratePromptMetadataOutputSchema>;

export async function generatePromptMetadata(input: GeneratePromptMetadataInput): Promise<GeneratePromptMetadataOutput> {
  return generatePromptMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromptMetadataPrompt',
  input: {schema: GeneratePromptMetadataInputSchema},
  output: {schema: GeneratePromptMetadataOutputSchema},
  prompt: `You are an expert in organizing and categorizing AI prompts.
Based on the "Original Goal" and the "Optimized Prompt Text" provided below, generate:
1.  A "suggestedName": This should be a concise and descriptive name for the prompt, ideally 3-7 words long. It should capture the essence of what the prompt is for.
2.  A "suggestedTags": An array of 2-4 relevant, concise tags (1-2 words each). These tags should help categorize the prompt for later retrieval.

Original Goal:
"{{{originalGoal}}}"

Optimized Prompt Text:
"{{{optimizedPrompt}}}"

Examples for suggestedName:
- "Marketing Email for SaaS Launch"
- "Python Function for List Sorting"
- "Blog Post Outline on AI Ethics"
- "Image Prompt: Surreal Landscape"

Examples for suggestedTags:
- ["marketing", "email", "saas"]
- ["python", "code", "sorting"]
- ["blog", "outline", "ai ethics"]
- ["image", "dall-e", "surrealism"]

Provide your output in the specified format. Ensure the tags are individual strings in the array.
`,
});

const generatePromptMetadataFlow = ai.defineFlow(
  {
    name: 'generatePromptMetadataFlow',
    inputSchema: GeneratePromptMetadataInputSchema,
    outputSchema: GeneratePromptMetadataOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return {
        suggestedName: output?.suggestedName || 'Untitled Prompt',
        suggestedTags: output?.suggestedTags || []
    };
  }
);

