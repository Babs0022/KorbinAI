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
  prompt: `You are an expert software architect and UI/UX designer. Your task is to analyze a user's description of a web page or application and break it down into a logical list of UI sections or components.

**Instructions:**
1.  **Analyze the Core Functionality:** First, deeply understand the user's goal. Are they building a marketing landing page, a data-heavy dashboard, a simple blog, an e-commerce site, or a specialized tool?
2.  **Suggest Relevant Components:** Based on your analysis, suggest a list of components that are *specifically relevant* to that type of application.
    *   **For a landing page:** Suggest sections like "Hero", "Features", "Pricing", "Testimonials", "FAQ", "Call to Action", "Footer".
    *   **For a dashboard:** Suggest components like "Sidebar Navigation", "Header with User Profile", "Key Metric Cards", "Data Table", "Chart Widgets", "Activity Feed".
    *   **For a blog:** Suggest sections like "Featured Post", "Post List", "Categories", "Author Bio".
    *   **For a specialized tool (like a smart contract deployer):** Think functionally. Suggest components like "Wallet Connection", "Contract Selection", "Function Inputs", "Transaction Status", "Gas Estimator".
3.  **Output Format:** Return ONLY a JSON object with a "suggestions" array. The suggestions should be short, descriptive phrases (2-4 words).

**Crucially, DO NOT suggest generic landing page sections (like 'FAQ' or 'Testimonials') for functional applications like dashboards or specialized tools.** Your suggestions must be tailored to the user's specific request.

User's Application Description: "{{description}}"
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
