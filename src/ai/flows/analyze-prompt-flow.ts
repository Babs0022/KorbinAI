
'use server';
/**
 * @fileOverview A flow to analyze a user's prompt and provide feedback and a quality score.
 *
 * - analyzePromptText - A function that calls the flow.
 * - AnalyzePromptInput - The input type for the flow.
 * - AnalyzePromptOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePromptInputSchema = z.object({
  promptText: z.string().describe('The prompt text to be analyzed.'),
});
export type AnalyzePromptInput = z.infer<typeof AnalyzePromptInputSchema>;

const AnalyzePromptOutputSchema = z.object({
  qualityScore: z.number().min(0).max(10).describe('A numerical score from 0 (very poor) to 10 (excellent) representing the prompt quality.'),
  feedbackItems: z.array(z.string()).describe('An array of actionable feedback points or suggestions for improvement. Provide 2-4 items.'),
  overallAssessment: z.string().describe('A brief (1-2 sentence) overall assessment of the prompt.'),
});
export type AnalyzePromptOutput = z.infer<typeof AnalyzePromptOutputSchema>;

export async function analyzePromptText(input: AnalyzePromptInput): Promise<AnalyzePromptOutput> {
  return analyzePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePromptTextPrompt',
  input: {schema: AnalyzePromptInputSchema},
  output: {schema: AnalyzePromptOutputSchema},
  prompt: `You are an expert AI Prompt Analyzer. Your task is to evaluate the user's prompt based on the following criteria:
1.  **Clarity**: Is the prompt easy to understand? Is the language precise?
2.  **Specificity**: Does the prompt provide enough detail for the AI to generate a relevant and focused response?
3.  **Actionability**: Is it clear what the AI is supposed to do?
4.  **Conciseness**: Is the prompt free of unnecessary words or information?
5.  **Potential for Ambiguity**: Are there phrases or terms that could be interpreted in multiple ways?

User's Prompt to Analyze:
"{{{promptText}}}"

Based on your analysis:
- Provide a numerical 'qualityScore' between 0 (very poor) and 10 (excellent).
- Provide 2-4 concise, actionable 'feedbackItems' (strings). Each item should offer specific advice to improve the prompt or reinforce good practices if the prompt is already strong.
- Provide a brief 'overallAssessment' (1-2 sentences) summarizing the prompt's strengths and key areas for improvement.

Example good feedback item: "Consider specifying the desired length or format of the output."
Example good feedback item: "The prompt clearly states the persona for the AI, which is excellent."
Example poor feedback item: "Prompt is bad."

Focus on constructive and helpful feedback.
`,
});

const analyzePromptFlow = ai.defineFlow(
  {
    name: 'analyzePromptFlow',
    inputSchema: AnalyzePromptInputSchema,
    outputSchema: AnalyzePromptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

