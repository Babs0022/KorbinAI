
'use server';
/**
 * @fileOverview A flow to generate contextual refinement suggestions for an AI prompt based on user's historical prompts.
 *
 * - getContextualRefinementSuggestions - A function that calls the flow.
 * - GetContextualRefinementSuggestionsInput - The input type for the flow.
 * - GetContextualRefinementSuggestionsOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const HistoricalPromptSchema = z.object({
  name: z.string().optional().describe('The name of the historical prompt.'),
  optimizedPrompt: z.string().describe('The text of the historical prompt.'),
  goal: z.string().optional().describe('The original goal of the historical prompt.'),
  tags: z.array(z.string()).optional().describe('Tags associated with the historical prompt.'),
  qualityScore: z.number().optional().describe('Quality score of the historical prompt (if available).')
});

const GetContextualRefinementSuggestionsInputSchema = z.object({
  currentPromptText: z.string().describe('The current text of the prompt being refined.'),
  originalGoal: z.string().optional().describe('The original goal or task the user wanted to accomplish with the prompt, if available.'),
  historicalPrompts: z.array(HistoricalPromptSchema).optional().describe('A list of the user\'s other relevant historical prompts to provide context.'),
});
export type GetContextualRefinementSuggestionsInput = z.infer<typeof GetContextualRefinementSuggestionsInputSchema>;

const GetContextualRefinementSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 2-4 actionable suggestions to improve the prompt, considering historical context. Each suggestion should be a complete sentence.'),
  insights: z.array(z.string()).optional().describe('Optional brief insights explaining why certain suggestions were made, possibly referencing historical data patterns.'),
  evolvedPrompt: z.string().optional().describe('A fully rewritten version of the prompt, automatically applying the best suggestions and leveraging insights from historical data. This is a ready-to-use, improved version.'),
});
export type GetContextualRefinementSuggestionsOutput = z.infer<typeof GetContextualRefinementSuggestionsOutputSchema>;

export async function getContextualRefinementSuggestions(input: GetContextualRefinementSuggestionsInput): Promise<GetContextualRefinementSuggestionsOutput> {
  return contextualRefinementSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualRefinementSuggestionsGenerator',
  input: {schema: GetContextualRefinementSuggestionsInputSchema},
  output: {schema: GetContextualRefinementSuggestionsOutputSchema},
  prompt: `You are an expert AI Prompt Engineering assistant.
Your task is to analyze the provided "Current Prompt Text" and its "Original Goal" (if available).
Crucially, also consider the "Historical Prompts" provided, which represent the user's past work.

Current Prompt Text:
"{{{currentPromptText}}}"

{{#if originalGoal}}
Original Goal for this prompt:
"{{{originalGoal}}}"
{{/if}}

{{#if historicalPrompts.length}}
Historical Prompts from the User (for context on their style and past successes):
{{#each historicalPrompts}}
---
Historical Prompt Name: {{this.name}}
Historical Prompt Goal: {{this.goal}}
Historical Prompt Text: "{{this.optimizedPrompt}}"
{{#if this.qualityScore}}Historical Quality Score: {{this.qualityScore}}/10{{/if}}
{{#if this.tags.length}}Historical Tags: {{#each this.tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
---
{{/each}}
{{/if}}

Based on all this information, provide:
1.  "suggestions": An array of 2-4 concise, actionable suggestions to improve the "Current Prompt Text". These suggestions should be highly relevant and, where possible, leverage insights from the historical prompts. For example, if the user often uses a certain structure or includes specific details in their high-scoring historical prompts, guide them similarly.
2.  "insights": (Optional) An array of 1-2 brief insights explaining the reasoning behind a key suggestion, especially if it relates to patterns observed in historical prompts. Example: "Consider adding specific examples, as your historical prompts on 'marketing' scored well when examples were included."
3.  "evolvedPrompt": A fully rewritten, "evolved" version of the prompt. Apply the most important suggestions you've identified directly to the "Current Prompt Text". The result should be a ready-to-use prompt that is a clear improvement, incorporating best practices seen in the user's successful historical prompts. If no significant improvements can be made, you can return the original prompt text.

Focus your suggestions and evolution on aspects like:
- Clarity, Specificity, Completeness, Persona, Output Format, Constraints, Actionability.
- Aligning with successful patterns from historical prompts if applicable.
- Addressing potential weaknesses in the current prompt when compared to stronger historical examples.

Each suggestion should be a complete sentence. If the current prompt is already excellent, provide reinforcing suggestions or minor tweaks for the "suggestions" field and return the original prompt for "evolvedPrompt".
If no historical prompts are provided, generate general refinement suggestions and an evolved prompt based on general best practices.
`,
});

const contextualRefinementSuggestionsFlow = ai.defineFlow(
  {
    name: 'contextualRefinementSuggestionsFlow',
    inputSchema: GetContextualRefinementSuggestionsInputSchema,
    outputSchema: GetContextualRefinementSuggestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return { 
        suggestions: output?.suggestions || [],
        insights: output?.insights || [],
        evolvedPrompt: output?.evolvedPrompt,
    };
  }
);
