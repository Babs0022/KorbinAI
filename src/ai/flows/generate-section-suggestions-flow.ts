'use server';
/**
 * @fileOverview A flow for generating contextual section suggestions for building a web page.
 *
 * - generateSectionSuggestions - A function that suggests sections based on a description.
 * - GenerateSectionSuggestionsInput - The input type for the function.
 * - GenerateSectionSuggestionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateSectionSuggestionsInputSchema = z.object({
  description: z.string().describe('A plain English description of the application or page to build.'),
});
export type GenerateSectionSuggestionsInput = z.infer<typeof GenerateSectionSuggestionsInputSchema>;

const GenerateSectionSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe("An array of suggested sections (e.g., 'Hero', 'Features', 'FAQ', 'Contact Form')."),
});
export type GenerateSectionSuggestionsOutput = z.infer<typeof GenerateSectionSuggestionsOutputSchema>;

export async function generateSectionSuggestions(input: GenerateSectionSuggestionsInput): Promise<GenerateSectionSuggestionsOutput> {
  return generateSectionSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSectionSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateSectionSuggestionsInputSchema},
  output: {schema: GenerateSectionSuggestionsOutputSchema},
  prompt: `You are a web development assistant. Based on the user's description of a web page, suggest a list of common sections or components for that page.

  Return ONLY a JSON object with a "suggestions" array. Your suggestions should be short, one-to-three word phrases.

  For example, if the user says "A landing page for a new SaaS app", you should suggest things like "Hero Section", "Features", "Pricing Table", "Testimonials", "FAQ", "Contact Form", "Footer".
  If the user says "An e-commerce product page", you should suggest things like "Product Gallery", "Product Description", "Customer Reviews", "Add to Cart", "Related Products".

  User Description: "{{description}}"
`,
});

const generateSectionSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSectionSuggestionsFlow',
    inputSchema: GenerateSectionSuggestionsInputSchema,
    outputSchema: GenerateSectionSuggestionsOutputSchema,
  },
  async (input) => {
    // Don't generate suggestions for very short descriptions
    if (input.description.trim().split(/\s+/).length < 3) {
      return { suggestions: [] };
    }
    const response = await prompt(input);
    return response.output ?? { suggestions: [] };
  }
);
