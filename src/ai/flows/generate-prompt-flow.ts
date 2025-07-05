
'use server';
/**
 * @fileOverview A flow for generating optimized AI prompts based on user requirements.
 * 
 * - generatePrompt - A function that takes a description and generates a detailed prompt.
 * - GeneratePromptInput - The input type for the function.
 * - GeneratePromptOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { saveWorkspace } from '@/services/workspaceService';

// Define the input schema with Zod
const GeneratePromptInputSchema = z.object({
  taskDescription: z.string().describe('A plain English description of the task the user wants to accomplish.'),
  targetModel: z.string().optional().describe("The specific AI model this prompt is for (e.g., 'Gemini 1.5 Pro', 'Claude 3 Opus')."),
  outputFormat: z.string().optional().describe("The desired format for the AI's output (e.g., 'JSON', 'Markdown', 'a bulleted list')."),
  userId: z.string().optional().describe('The ID of the user performing the generation.'),
});
export type GeneratePromptInput = z.infer<typeof GeneratePromptInputSchema>;

// Define the output schema with Zod
const GeneratePromptOutputSchema = z.object({
  generatedPrompt: z.string().describe('The complete, optimized prompt ready to be used.'),
});
export type GeneratePromptOutput = z.infer<typeof GeneratePromptOutputSchema>;

// Export the main function that the client will call
export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptOutput> {
  return generatePromptFlow(input);
}

// Define the Genkit prompt template
const prompt = ai.definePrompt({
  name: 'generatePromptPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GeneratePromptInputSchema},
  output: {schema: GeneratePromptOutputSchema},
  prompt: `You are a world-class expert in prompt engineering. Your task is to take a user's simple description of a task and transform it into a highly effective, detailed, and optimized prompt for a large language model.

Follow these principles:
1.  **Clarity and Specificity:** Be explicit. Remove ambiguity.
2.  **Persona:** Assign a role or persona to the AI (e.g., "You are an expert copywriter...").
3.  **Context:** Provide all necessary background information.
4.  **Task Definition:** Clearly state the goal and the steps to achieve it.
5.  **Constraints & Format:** Specify the desired output format, length, style, and any negative constraints.

User's Task Description: "{{taskDescription}}"
{{#if targetModel}}
Target AI Model: "{{targetModel}}"
{{/if}}
{{#if outputFormat}}
Desired Output Format: "{{outputFormat}}"
{{/if}}

Generate the prompt now. Return only a JSON object that matches the schema.
`,
});

// Define the Genkit flow
const generatePromptFlow = ai.defineFlow(
  {
    name: 'generatePromptFlow',
    inputSchema: GeneratePromptInputSchema,
    outputSchema: GeneratePromptOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;

    if (!output?.generatedPrompt) {
      console.error('AI response was empty or invalid. Raw text from model:', response.text);
      throw new Error('Failed to generate prompt because the AI response was empty or invalid.');
    }
    
    if (input.userId) {
      const { userId, ...workspaceInput } = input;
      // Sanitize input to ensure it's a plain JS object before saving.
      const sanitizedInput = JSON.parse(JSON.stringify(workspaceInput));
      await saveWorkspace({
        userId,
        type: 'prompt',
        input: sanitizedInput,
        output: output.generatedPrompt,
        featurePath: '/prompt-generator',
      });
    }

    return output;
  }
);
