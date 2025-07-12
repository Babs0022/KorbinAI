
'use server';
/**
 * @fileOverview A flow for generating contextual refinement suggestions for structured data.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateDataRefinementSuggestionsInputSchema,
    GenerateDataRefinementSuggestionsOutputSchema,
    type GenerateDataRefinementSuggestionsInput,
    type GenerateDataRefinementSuggestionsOutput,
} from '@/types/ai';

export async function generateDataRefinementSuggestions(
  input: GenerateDataRefinementSuggestionsInput
): Promise<GenerateDataRefinementSuggestionsOutput> {
  return generateDataRefinementSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDataRefinementSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateDataRefinementSuggestionsInputSchema},
  output: {schema: GenerateDataRefinementSuggestionsOutputSchema},
  prompt: `You are an expert data architect. Your task is to analyze a block of structured data and provide a list of 3-4 relevant and useful refinement suggestions.

**Instructions:**
1.  **Analyze the Data Structure:** Carefully examine the provided data. Is it an array of objects? A single nested object? A simple list?
2.  **Generate Contextual Suggestions:** Based on the structure, generate relevant suggestions.
    *   If it's an array of items (e.g., users, products), suggest actions like "Add 5 more items", "Add a unique ID to each item", or "Sort the list by [a relevant key]".
    *   If it's a configuration object, suggest adding common keys like "version" or "lastUpdated".
    *   If the data contains things that could be translated, suggest "Translate all string values to [another language]".
    *   Always include a general suggestion like "Sanitize the data for professional presentation" or "Check for and fix any formatting errors".
3.  **Format the Output:** For each suggestion, provide a short, user-friendly `label` for a button and a clear, explicit `instruction` for another AI to execute.

**Example:**
-   **Input Data:** `[{"name": "Laptop", "price": 1200}, {"name": "Mouse", "price": 25}]`
-   **Output:**
    ```json
    {
      "suggestions": [
        { "label": "Add 5 more products", "instruction": "Add 5 more product records to the list, keeping the same structure." },
        { "label": "Add 'inStock' field", "instruction": "Add a new boolean field to each product called 'inStock'." },
        { "label": "Sort by price", "instruction": "Sort the list of products by the 'price' field in descending order." }
      ]
    }
    ```

Return ONLY a JSON object that matches the schema.

**Data Format:** {{format}}
**Data to Analyze:**
---
{{{data}}}
---
`,
});


const generateDataRefinementSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateDataRefinementSuggestionsFlow',
    inputSchema: GenerateDataRefinementSuggestionsInputSchema,
    outputSchema: GenerateDataRefinementSuggestionsOutputSchema,
  },
  async (input) => {
    // Truncate long data to avoid hitting model limits
    const truncatedData = input.data.substring(0, 3000);
    const response = await prompt({ ...input, data: truncatedData });
    return response.output ?? { suggestions: [] };
  }
);
