
'use server';
/**
 * @fileOverview An AI flow that analyzes a generated prompt and suggests the best tool to execute it.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import {
    AnalyzePromptInputSchema,
    AnalyzePromptOutputSchema,
    type AnalyzePromptInput,
    type AnalyzePromptOutput
} from '@/types/ai';

export async function analyzePrompt(input: AnalyzePromptInput): Promise<AnalyzePromptOutput> {
  return analyzePromptFlow(input);
}

const promptTemplate = ai.definePrompt({
  name: 'analyzePromptPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: AnalyzePromptInputSchema},
  output: {schema: AnalyzePromptOutputSchema},
  prompt: `You are a helpful assistant that directs users to the correct tool for their task.
Based on the user's generated prompt, determine which of the following tools is the most appropriate.

Here are the available tools and their purposes:
- 'image-generator': Use for prompts that describe creating a visual image, photo, drawing, or any kind of visual art. Keywords: "image of", "photo of", "drawing of", "render", "picture".
- 'written-content': Use for prompts that ask to generate text like a blog post, email, social media update, ad copy, or any form of written document. Keywords: "write a", "create a post", "draft an email", "generate copy".
- 'component-wizard': Use for prompts related to building a web page, application, component, UI, or website. Keywords: "build a", "create a landing page", "generate a dashboard", "make a component".
- 'structured-data': Use for prompts that ask for data in a specific format like JSON or CSV. Keywords: "generate JSON", "create a CSV", "list of objects".
- 'none': If the prompt does not clearly fit into any of the above categories.

Your task:
1. Analyze the following prompt.
2. Choose the single best tool from the list.
3. Create a short, compelling call-to-action phrase suggesting the user execute the prompt with the chosen tool. For example, if you choose 'image-generator', the suggestion could be "Bring this to life with the Image Generator". If you choose 'none', the suggestion must be an empty string.

Return ONLY a JSON object that matches the schema.

Prompt to analyze:
"{{prompt}}"
`,
});

const analyzePromptFlow = ai.defineFlow(
  {
    name: 'analyzePromptFlow',
    inputSchema: AnalyzePromptInputSchema,
    outputSchema: AnalyzePromptOutputSchema,
  },
  async (input) => {
    // If the prompt is very short, it's unlikely to be specific enough for a tool.
    if (input.prompt.trim().split(/\s+/).length < 5) {
      return { tool: 'none', suggestion: '' };
    }
    const response = await promptTemplate(input);
    return response.output ?? { tool: 'none', suggestion: '' };
  }
);
