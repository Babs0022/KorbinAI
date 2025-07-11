

'use server';
/**
 * @fileOverview A flow for generating and refining structured data like JSON or CSV.
 * 
 * - generateStructuredData - A function that generates or refines data based on a description.
 * - GenerateStructuredDataInput - The input type for the function.
 * - GenerateStructuredDataOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateStructuredDataInputSchema = z.object({
  description: z.string().describe('A plain English description of the data to generate.'),
  format: z.string().describe("The desired output format (e.g., 'JSON', 'CSV', 'KML', 'XML')."),
  schemaDefinition: z.string().optional().describe('An optional schema or example of the desired structure (e.g., a JSON schema, an example XML/KML structure).'),
  imageDataUris: z.array(z.string()).optional().describe("An optional array of images provided as context, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  originalData: z.string().optional().describe('Existing data to be refined. If present, the flow will refine this data instead of generating new data from the topic.'),
  refinementInstruction: z.string().optional().describe("The instruction for refining the data (e.g., 'Add 10 more records', 'Add a unique ID field')."),
});
export type GenerateStructuredDataInput = z.infer<typeof GenerateStructuredDataInputSchema>;

const GenerateStructuredDataOutputSchema = z.object({
  generatedData: z.string().describe('The complete, formatted structured data (e.g., a JSON object, a CSV string, or an XML/KML document).'),
});
export type GenerateStructuredDataOutput = z.infer<typeof GenerateStructuredDataOutputSchema>;

export async function generateStructuredData(input: GenerateStructuredDataInput): Promise<GenerateStructuredDataOutput> {
  return generateStructuredDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStructuredDataPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: GenerateStructuredDataInputSchema},
  output: {schema: GenerateStructuredDataOutputSchema},
  prompt: `You are an expert data generation machine. Your task is to generate or refine structured data based on the user's request.
You must output ONLY the raw data, without any explanations, introductions, or markdown formatting like \`\`\`json\`\`\` or \`\`\`xml\`\`\`.

**Core Instructions:**
1.  **Strictly Adhere to Format:** The generated data must be valid for the requested format ({{format}}).
2.  **Use the Schema:** If a schema or example is provided, it is a strict guide. Your output structure MUST match it. For XML-based formats like KML, this means using the correct tags, namespaces, and nesting.
3.  **No Explanations:** Do not add any text before or after the data block.

---

{{#if originalData}}
**Task: Refine Existing Data**

-   **Refinement Instruction:** "{{refinementInstruction}}"
-   **Original Data (Format: {{format}}):**
    ---
    {{{originalData}}}
    ---

Refine the data now. Ensure the output is only the refined data in the same format.
{{else}}
**Task: Generate New Data**

{{#if imageDataUris}}
**Image Context:**
Use the following image(s) as the primary source of information for generating the data. For example, if the user asks for "a list of items in the image", you should extract them from the photo.
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

Generate the data now based on these instructions.
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
