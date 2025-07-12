
'use server';
/**
 * @fileOverview A flow for optimizing written content in various ways.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */
import {ai} from '@/ai/genkit';
import {
    OptimizeContentInputSchema,
    OptimizeContentOutputSchema,
    type OptimizeContentInput,
    type OptimizeContentOutput,
} from '@/types/ai';

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
    
    const instructions: string[] = [];

    if (input.optimizations.seo) {
        instructions.push(`- **SEO Optimization:** Rewrite the content to be better optimized for search engines. Focus on naturally incorporating relevant keywords, improving semantic structure, and ensuring the language targets user search intent. The core message must remain the same.`);
    }
    if (input.optimizations.readability) {
        instructions.push(`- **Improve Readability:** Rewrite the content to be more readable. Focus on simplifying complex sentences, breaking up long paragraphs, and reducing jargon.`);
    }
    if (input.optimizations.tone && input.toneParameter) {
        instructions.push(`- **Adjust Tone:** Rewrite the content to have a '${input.toneParameter}' tone. The core message and information must be preserved, but the style and vocabulary should be adjusted to match the new tone.`);
    }
    if (input.optimizations.cta) {
        instructions.push(`- **Generate CTAs:** Based on the content, generate a list of 3-5 compelling and relevant call-to-action (CTA) phrases.`);
    }
    if (input.optimizations.headlines) {
        instructions.push(`- **Suggest Headlines:** Based on the content, generate a list of 5-7 engaging and relevant headlines or titles.`);
    }

    // Determine the primary task: rewriting the content or generating suggestions.
    const isRewriting = input.optimizations.seo || input.optimizations.readability || input.optimizations.tone;
    const isSuggesting = input.optimizations.cta || input.optimizations.headlines;

    let finalInstruction;
    if (isRewriting) {
        finalInstruction = `Please perform the following tasks on the original content. Combine all content-rewriting tasks (SEO, readability, tone) into a single, cohesive, rewritten piece of text. If suggestion tasks (CTAs, headlines) are also selected, append them at the very end, separated by '---'. Your writing style must be natural and engaging. **CRITICAL: Do NOT use the em dash (—).**\n\n${instructions.join('\n')}`;
    } else if (isSuggesting) {
        finalInstruction = `Please generate suggestions based on the original content, following these instructions. Present each set of suggestions under its own markdown heading (e.g., '### Call-to-Action Suggestions').\n\n${instructions.join('\n')}`;
    } else {
        return { optimizedContent: "No optimization was selected." };
    }

    const prompt = `You are an expert copy editor and content strategist. Your task is to optimize the following text based on a specific set of instructions.

Return ONLY a JSON object that matches the schema, with the result in the "optimizedContent" field. The result should be a markdown-formatted string.

Original Content:
---
${input.content}
---

Instructions:
${finalInstruction}
`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      prompt: prompt,
      output: { schema: OptimizeContentOutputSchema },
    });

    return response.output ?? { optimizedContent: "" };
  }
);
