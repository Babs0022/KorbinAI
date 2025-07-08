
'use server';
/**
 * @fileOverview A flow for optimizing written content in various ways.
 *
 * - optimizeContent - Optimizes content for SEO, readability, tone, etc.
 * - OptimizeContentInput - The input type for the function.
 * - OptimizeContentOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const OptimizationTypeSchema = z.enum(['seo', 'readability', 'tone', 'cta', 'headlines']);

const OptimizeContentInputSchema = z.object({
  content: z.string().describe('The current content string to be optimized.'),
  optimizationType: OptimizationTypeSchema.describe("The type of optimization to perform."),
  toneParameter: z.string().optional().describe("The new tone, required if optimizationType is 'tone'."),
});
export type OptimizeContentInput = z.infer<typeof OptimizeContentInputSchema>;

const OptimizeContentOutputSchema = z.object({
  optimizedContent: z.string().describe("The optimized content or a list of suggestions, formatted as a markdown string."),
});
export type OptimizeContentOutput = z.infer<typeof OptimizeContentOutputSchema>;

export async function optimizeContent(input: OptimizeContentInput): Promise<OptimizeContentOutput> {
  return optimizeContentFlow(input);
}

const optimizeContentFlow = ai.defineFlow(
  {
    name: 'optimizeContentFlow',
    inputSchema: OptimizeContentInputSchema,
    outputSchema: OptimizeContentOutputSchema,
  },
  async (input) => {
    let instruction = '';

    switch (input.optimizationType) {
      case 'seo':
        instruction = `Analyze the original content and rewrite it to be better optimized for search engines (SEO). Focus on naturally incorporating relevant keywords, improving semantic structure with clear headings if appropriate, and ensuring the language is clear and targets user search intent. The core message must remain the same. Return ONLY the fully rewritten, SEO-optimized content.`;
        break;
      case 'readability':
        instruction = `Analyze the original content and rewrite it to improve readability. Focus on simplifying complex sentences, breaking up long paragraphs, reducing jargon, and improving the overall flow. The goal is to make the content easier for a general audience to understand. Return ONLY the fully rewritten, more readable content.`;
        break;
      case 'tone':
        if (!input.toneParameter) {
          throw new Error("toneParameter is required for 'tone' optimization type.");
        }
        instruction = `Rewrite the original content to have a '${input.toneParameter}' tone. The core message and information must be preserved, but the style, voice, and vocabulary should be adjusted to match the new tone. Return ONLY the fully rewritten content in the new tone.`;
        break;
      case 'cta':
        instruction = `Based on the original content, generate a list of 3-5 compelling and relevant call-to-action (CTA) phrases that would be appropriate for the end of the content. The CTAs should encourage the reader to take the next logical step. Return ONLY a markdown-formatted list of the CTA suggestions.`;
        break;
      case 'headlines':
        instruction = `Based on the original content, generate a list of 5-7 engaging and relevant headlines or titles for this piece of content. The headlines should be attention-grabbing and accurately reflect the content's topic. Return ONLY a markdown-formatted list of the headline suggestions.`;
        break;
      default:
        throw new Error(`Unsupported optimization type: ${input.optimizationType}`);
    }

    const prompt = `You are an expert copy editor and content strategist. Your task is to optimize the following text based on a specific instruction.

Return ONLY a JSON object that matches the schema, with the result in the "optimizedContent" field. The result should be a markdown-formatted string.

Original Content:
---
${input.content}
---

Instruction:
${instruction}
`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: prompt,
      output: { schema: OptimizeContentOutputSchema },
    });

    return response.output ?? { optimizedContent: "" };
  }
);
