
'use server';
/**
 * @fileOverview A flow to reverse-engineer a prompt from AI-generated text.
 *
 * - reconstructPromptFromOutput - A function that calls the flow.
 * - ReconstructPromptInput - The input type for the flow.
 * - ReconstructPromptOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReconstructPromptInputSchema = z.object({
  aiOutputText: z.string().describe('The AI-generated text from which to reconstruct a prompt.'),
});
export type ReconstructPromptInput = z.infer<typeof ReconstructPromptInputSchema>;

const ReconstructPromptOutputSchema = z.object({
  reconstructedPrompt: z.string().describe('The AI\'s best guess for the prompt that might have created the input text.'),
  analysis: z.string().describe('A brief explanation of why the AI thinks this prompt is suitable or insights into the reconstruction process.'),
});
export type ReconstructPromptOutput = z.infer<typeof ReconstructPromptOutputSchema>;

export async function reconstructPromptFromOutput(input: ReconstructPromptInput): Promise<ReconstructPromptOutput> {
  return reversePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reversePromptGenerator',
  input: {schema: ReconstructPromptInputSchema},
  output: {schema: ReconstructPromptOutputSchema},
  prompt: `You are an expert AI prompt engineer with a knack for reverse engineering.
Your task is to analyze the provided "AI-Generated Text Output" and deduce the most plausible and effective prompt that could have been used to generate it.

AI-Generated Text Output:
"{{{aiOutputText}}}"

Based on your analysis:
- Generate a "reconstructedPrompt": This should be a clear, concise, and actionable prompt that an AI could use.
- Provide an "analysis": Briefly explain your reasoning. What elements in the output text led you to this prompt structure? What are the key characteristics of a prompt that would likely produce this output? (1-3 sentences).

Consider aspects like:
- The topic and subject matter.
- The tone, style, and voice of the output.
- The structure and format (e.g., list, paragraph, Q&A).
- Any specific instructions or constraints that might have been implied.
- The likely AI model type (e.g., text generation, summarization).

If the output text is very generic or too short to make a confident reconstruction, provide a general-purpose prompt that *could* have led to it, and mention the uncertainty in your analysis.
`,
});

const reversePromptFlow = ai.defineFlow(
  {
    name: 'reversePromptFlow',
    inputSchema: ReconstructPromptInputSchema,
    outputSchema: ReconstructPromptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
