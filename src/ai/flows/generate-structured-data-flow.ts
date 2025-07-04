
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
import { saveWorkspace } from '@/services/workspaceService';

const GenerateStructuredDataInputSchema = z.object({
  description: z.string().describe('A plain English description of the data to generate.'),
  format: z.string().describe("The desired output format (e.g., 'JSON', 'CSV')."),
  schemaDefinition: z.string().optional().describe('For JSON, an optional schema or example of the desired structure.'),
  originalData: z.string().optional().describe('Existing data to be refined. If present, the flow will refine this data instead of generating new data from the description.'),
  refinementInstruction: z.string().optional().describe("The instruction for refining the data (e.g., 'Add 10 more records', 'Add a unique ID field')."),
  userId: z.string().optional().describe('The ID of the user performing the generation.'),
});
export type GenerateStructuredDataInput = z.infer<typeof GenerateStructuredDataInputSchema>;

const GenerateStructuredDataOutputSchema = z.object({
  generatedData: z.string().describe('The complete, formatted structured data.'),
});
export type GenerateStructuredDataOutput = z.infer<typeof GenerateStructuredDataOutputSchema>;

export async function generateStructuredData(input: GenerateStructuredDataInput): Promise<GenerateStructuredDataOutput> {
  return generateStructuredDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStructuredDataPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateStructuredDataInputSchema},
  output: {schema: GenerateStructuredDataOutputSchema},
  prompt: `You are an expert data generation machine. Your task is to generate or refine structured data based on the user's request.
You must output ONLY the raw data, without any explanations, introductions, or markdown formatting like \`\`\`json.

{{#if originalData}}
Your task is to refine the following data based on a specific instruction.

Original Data (Format: {{format}}):
---
{{{originalData}}}
---

Refinement Instruction: "{{refinementInstruction}}"

Refine the data now. Ensure the output is only the refined data in the same format.
{{else}}
Your task is to generate structured data from scratch.

Data Description: "{{description}}"
Output Format: "{{format}}"

{{#if schemaDefinition}}
Use this schema or example to guide the structure of the JSON output:
{{{schemaDefinition}}}
{{/if}}

Generate the data now.
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
    const cleanedData = output.generatedData.replace(/^```(json|csv)?\n?/, '').replace(/\n?```$/, '');
    const finalOutput = { generatedData: cleanedData };
    
    // Only save brand new generations, not refinements
    if (input.userId && !input.originalData) {
      const { userId, ...workspaceInput } = input;
      await saveWorkspace({
        userId,
        type: 'structured-data',
        input: workspaceInput,
        output: finalOutput.generatedData,
        featurePath: '/structured-data',
      });
    }

    return finalOutput;
  }
);
