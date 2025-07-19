
'use server';
/**
 * @fileOverview A flow for generating and refining structured data like JSON or CSV.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateStructuredDataInputSchema,
    GenerateStructuredDataOutputSchema,
    type GenerateStructuredDataInput,
    type GenerateStructuredDataOutput,
} from '@/types/ai';

export async function generateStructuredData(input: GenerateStructuredDataInput): Promise<GenerateStructuredDataOutput> {
  return generateStructuredDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStructuredDataPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: GenerateStructuredDataInputSchema},
  output: {schema: GenerateStructuredDataOutputSchema},
  prompt: `I am an expert data generation machine. My task is to generate or refine structured data based on the user's request.
I will output ONLY the raw data, without any explanations, introductions, or markdown formatting like \`\`\`json\`\`\` or \`\`\`xml\`\`\`.

**Core Instructions:**
1.  **Strictly Adhere to Format:** The generated data must be valid for the requested format ({{format}}).
2.  **Use the Schema:** If a schema or example is provided, it is a strict guide. Your output structure MUST match it. For XML-based formats like KML, this means using the correct tags, namespaces, and nesting.
3.  **No Explanations:** I will not add any text before or after the data block.

---

{{#if originalData}}
**Task: Refine Existing Data**

-   **Refinement Instruction:** "{{refinementInstruction}}"
-   **Original Data (Format: {{format}}):**
    ---
    {{{originalData}}}
    ---

I will refine the data now. The output will only be the refined data in the same format.
{{else}}
**Task: Generate New Data**

{{#if imageDataUris}}
**Image Context:**
I will use the following image(s) as the primary source of information for generating the data. For example, if asked for "a list of items in the image", I will extract them from the photo.
{{#each imageDataUris}}
{{media url=this}}
{{/each}}
{{/if}}

-   **Data Description:** "{{description}}"
-   **Output Format:** "{{format}}"

{{#if schemaDefinition}}
-   **Schema / Example Structure:**
    ---
    {{{schemaDefinition}}}
    ---
{{/if}}

I will generate the data now based on these instructions.
{{/if}}
  `,
});

const generateStructuredDataFlow = ai.defineFlow(
  {
    name: 'generateStructuredDataFlow',
    inputSchema: GenerateStructuredDataInputSchema,
    outputSchema: GenerateStructuredDataOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;

    if (!output?.generatedData) {
      console.error('AI response was empty or invalid. Raw text from model:', response.text);
      throw new Error('Failed to generate data because the AI response was empty or invalid.');
    }
    
    // Clean up the output to remove potential markdown code blocks
    const cleanedData = output.generatedData.replace(/^```(json|csv|xml|kml)?\n?/, '').replace(/\n?```$/, '');
    const finalOutput = { generatedData: cleanedData };

    return finalOutput;
  }
);
