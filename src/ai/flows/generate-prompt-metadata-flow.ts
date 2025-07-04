
'use server';
/**
 * @fileOverview An AI flow that generates a name and summary for a piece of content.
 *
 * - generateWorkspaceMetadata - A function that generates metadata for a workspace.
 * - GenerateWorkspaceMetadataInput - Input type.
 * - GenerateWorkspaceMetadataOutput - Output type.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const WORKSPACE_TYPES = ['written-content', 'prompt', 'image', 'component-wizard', 'structured-data'] as const;

const GenerateWorkspaceMetadataInputSchema = z.object({
  type: z.enum(WORKSPACE_TYPES).describe('The type of content in the workspace.'),
  content: z.string().describe('The generated content to be summarized.'),
});
export type GenerateWorkspaceMetadataInput = z.infer<typeof GenerateWorkspaceMetadataInputSchema>;

const GenerateWorkspaceMetadataOutputSchema = z.object({
  name: z.string().describe("A short, descriptive name for the workspace (3-5 words)."),
  summary: z.string().describe("A one-sentence summary of the workspace content."),
});
export type GenerateWorkspaceMetadataOutput = z.infer<typeof GenerateWorkspaceMetadataOutputSchema>;

export async function generateWorkspaceMetadata(input: GenerateWorkspaceMetadataInput): Promise<GenerateWorkspaceMetadataOutput> {
  return generateWorkspaceMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkspaceMetadataPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateWorkspaceMetadataInputSchema},
  output: {schema: GenerateWorkspaceMetadataOutputSchema},
  prompt: `You are an expert at summarizing and naming content.
Your task is to analyze a piece of content and generate a short, descriptive name (3-5 words) and a concise one-sentence summary for it.

The content is for a '{{type}}' workspace.

Here are some examples:
- If type is 'prompt' and content is "Create a marketing campaign for a new coffee shop", a good name would be "Coffee Shop Marketing Prompt" and summary "A prompt to generate a marketing campaign for a new coffee business."
- If type is 'written-content' and content starts with "Introducing the new SuperWidget 5000...", a good name would be "SuperWidget 5000 Launch Announcement" and summary "A blog post announcing the launch of the new SuperWidget 5000 product."
- If type is 'image' and content is "A photorealistic image of a majestic lion in the savannah at sunset", a good name would be "Majestic Lion at Sunset" and summary "An image prompt for a photorealistic lion in the savannah."

Return ONLY a JSON object that matches the schema.

Content to analyze:
---
{{content}}
---
`,
});

const generateWorkspaceMetadataFlow = ai.defineFlow(
  {
    name: 'generateWorkspaceMetadataFlow',
    inputSchema: GenerateWorkspaceMetadataInputSchema,
    outputSchema: GenerateWorkspaceMetadataOutputSchema,
  },
  async (input) => {
    // Truncate content to avoid hitting token limits for very large outputs.
    const truncatedContent = input.content.substring(0, 2000);
    const response = await prompt({ ...input, content: truncatedContent });
    return response.output ?? { name: 'Untitled Workspace', summary: 'No summary available.' };
  }
);
