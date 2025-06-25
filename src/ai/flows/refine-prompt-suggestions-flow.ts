
'use server';
/**
 * @fileOverview A flow to generate refinement suggestions for an existing AI prompt.
 *
 * - getPromptRefinementSuggestions - A function that calls the flow.
 * - GetPromptRefinementSuggestionsInput - The input type for the flow.
 * - GetPromptRefinementSuggestionsOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetPromptRefinementSuggestionsInputSchema = z.object({
  currentPromptText: z.string().describe('The current text of the prompt being refined.'),
  originalGoal: z.string().optional().describe('The original goal or task the user wanted to accomplish with the prompt, if available.'),
});
export type GetPromptRefinementSuggestionsInput = z.infer<typeof GetPromptRefinementSuggestionsInputSchema>;

const GetPromptRefinementSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 2-4 actionable suggestions to improve the prompt. Each suggestion should be a complete sentence.'),
});
export type GetPromptRefinementSuggestionsOutput = z.infer<typeof GetPromptRefinementSuggestionsOutputSchema>;

export async function getPromptRefinementSuggestions(input: GetPromptRefinementSuggestionsInput): Promise<GetPromptRefinementSuggestionsOutput> {
  return refinePromptSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refinePromptSuggestionsGenerator',
  input: {schema: GetPromptRefinementSuggestionsInputSchema},
  output: {schema: GetPromptRefinementSuggestionsOutputSchema},
  prompt: `You are an expert AI Prompt Engineering assistant.
Your task is to analyze the provided "Current Prompt Text" and, if available, its "Original Goal".
Based on this analysis, provide 2-4 concise, actionable suggestions to improve the prompt's effectiveness.

Focus your suggestions on aspects like:
- Clarity: Is the language precise and unambiguous?
- Specificity: Does it provide enough detail for the AI? Could it be more targeted?
- Completeness: Are there any missing instructions or context?
- Persona: Could defining a role for the AI help?
- Output Format: Would specifying the desired output structure be beneficial?
- Constraints: Are there any implicit or explicit constraints that should be clarified or added (e.g., length, style, topics to avoid)?
- Actionability: Is it clear what the AI is supposed to do?

Each suggestion should be a complete sentence. If the prompt is already excellent, you can provide reinforcing suggestions or minor tweaks.

Current Prompt Text:
"{{{currentPromptText}}}"

{{#if originalGoal}}
Original Goal for this prompt:
"{{{originalGoal}}}"
{{/if}}

Provide your suggestions for refinement.
`,
});

const refinePromptSuggestionsFlow = ai.defineFlow(
  {
    name: 'refinePromptSuggestionsFlow',
    inputSchema: GetPromptRefinementSuggestionsInputSchema,
    outputSchema: GetPromptRefinementSuggestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return { suggestions: output?.suggestions || [] };
  }
);
