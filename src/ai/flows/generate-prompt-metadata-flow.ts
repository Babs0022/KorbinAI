

'use server';
/**
 * @fileOverview An AI flow that generates a name and summary for a piece of content.
 *
 * - generateProjectMetadata - A function that generates metadata for a project.
 * - GenerateProjectMetadataInput - Input type.
 * - GenerateProjectMetadataOutput - Output type.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const PROJECT_TYPES = ['written-content', 'prompt', 'component-wizard', 'structured-data'] as const;

const GenerateProjectMetadataInputSchema = z.object({
  type: z.enum(PROJECT_TYPES).describe('The type of content in the project.'),
  content: z.string().describe('The generated content to be summarized.'),
});
export type GenerateProjectMetadataInput = z.infer<typeof GenerateProjectMetadataInputSchema>;

const GenerateProjectMetadataOutputSchema = z.object({
  name: z.string().describe("A short, descriptive name for the project (3-5 words)."),
  summary: z.string().describe("A one-sentence summary of the project content."),
});
export type GenerateProjectMetadataOutput = z.infer<typeof GenerateProjectMetadataOutputSchema>;

export async function generateProjectMetadata(input: GenerateProjectMetadataInput): Promise<GenerateProjectMetadataOutput> {
  return generateProjectMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectMetadataPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateProjectMetadataInputSchema},
  output: {schema: GenerateProjectMetadataOutputSchema},
  prompt: `You are an expert at summarizing and naming content.
Your task is to analyze a piece of content and generate a short, descriptive name (3-5 words) and a concise one-sentence summary for it.

The content is for a '{{type}}' project.

Here are some examples:
- If type is 'prompt' and content is "Create a marketing campaign for a new coffee shop", a good name would be "Coffee Shop Marketing Prompt" and summary "A prompt to generate a marketing campaign for a new coffee business."
- If type is 'written-content' and content starts with "Introducing the new SuperWidget 5000...", a good name would be "SuperWidget 5000 Launch Announcement" and summary "A blog post announcing the launch of the new SuperWidget 5000 product."

Return ONLY a JSON object that matches the schema.

Content to analyze:
---
{{content}}
---
`,
});

const generateProjectMetadataFlow = ai.defineFlow(
  {
    name: 'generateProjectMetadataFlow',
    inputSchema: GenerateProjectMetadataInputSchema,
    outputSchema: GenerateProjectMetadataOutputSchema,
  },
  async (input) => {
    // Truncate content to avoid hitting token limits for very large outputs.
    const truncatedContent = input.content.substring(0, 2000);
    const response = await prompt({ ...input, content: truncatedContent });
    return response.output ?? { name: 'Untitled Project', summary: 'No summary available.' };
  }
);
