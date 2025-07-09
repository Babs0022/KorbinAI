
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

const PROJECT_TYPES = ['written-content', 'prompt', 'component-wizard', 'structured-data', 'image-generator', 'chat'] as const;

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
- If type is 'image-generator' and content is "An album of 4 generated images.", a good name would be "Generated Image Album" and summary "An album containing multiple AI-generated images."
- If type is 'chat' and content starts with "user: Can you explain quantum computing?", a good name would be "Quantum Computing Chat" and summary "A conversation about the basics of quantum computing."


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
    const output = response.output;

    if (!output) {
      return { name: 'Untitled Project', summary: 'No summary available.' };
    }

    // Sanitize the AI output to ensure it's a plain JavaScript object before returning.
    // This prevents serialization errors when the result is used in server actions, e.g., saving to Firestore.
    const cleanOutput: GenerateProjectMetadataOutput = {
      name: String(output.name),
      summary: String(output.summary),
    };

    return cleanOutput;
  }
);
