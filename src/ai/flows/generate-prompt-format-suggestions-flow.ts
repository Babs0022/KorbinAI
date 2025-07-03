
'use server';
/**
 * @fileOverview A flow for generating output format suggestions for the prompt generator.
 *
 * - generatePromptFormatSuggestions - A function that suggests formats based on a task.
 * - GeneratePromptFormatSuggestionsInput - The input type for the function.
 * - GeneratePromptFormatSuggestionsOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GeneratePromptFormatSuggestionsInputSchema = z.object({
  taskDescription: z.string().describe('A plain English description of the task the user wants to accomplish.'),
});
export type GeneratePromptFormatSuggestionsInput = z.infer<typeof GeneratePromptFormatSuggestionsInputSchema>;

const GeneratePromptFormatSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe("An array of 3-4 suggested output formats (e.g., 'JSON', 'Markdown', 'Bulleted list')."),
});
export type GeneratePromptFormatSuggestionsOutput = z.infer<typeof GeneratePromptFormatSuggestionsOutputSchema>;

export async function generatePromptFormatSuggestions(input: GeneratePromptFormatSuggestionsInput): Promise<GeneratePromptFormatSuggestionsOutput> {
  return generatePromptFormatSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromptFormatSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GeneratePromptFormatSuggestionsInputSchema},
  output: {schema: GeneratePromptFormatSuggestionsOutputSchema},
  prompt: `You are a prompt engineering assistant. Based on the user's task description, suggest a list of 3-4 common and useful output formats.
  Return ONLY a JSON object with a "suggestions" array.
  Your suggestions should be short phrases.
  For example, if the task is "Create a list of 10 marketing ideas", you could suggest ["Bulleted List", "JSON array of strings", "CSV format"].
  If the task is "Write a short blog post", you could suggest ["Markdown", "Plain text"].

  User's Task Description: "{{taskDescription}}"
`,
});

const generatePromptFormatSuggestionsFlow = ai.defineFlow(
  {
    name: 'generatePromptFormatSuggestionsFlow',
    inputSchema: GeneratePromptFormatSuggestionsInputSchema,
    outputSchema: GeneratePromptFormatSuggestionsOutputSchema,
  },
  async (input) => {
    // Don't generate suggestions for very short descriptions
    if (input.taskDescription.trim().split(/\s+/).length < 3) {
      return { suggestions: [] };
    }
    const response = await prompt(input);
    return response.output ?? { suggestions: [] };
  }
);
