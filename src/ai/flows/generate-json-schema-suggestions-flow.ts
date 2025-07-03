
'use server';
/**
 * @fileOverview A flow for generating JSON schema suggestions based on a description.
 *
 * - generateJsonSchemaSuggestions - A function that suggests a schema.
 * - GenerateJsonSchemaSuggestionsInput - The input type for the function.
 * - GenerateJsonSchemaSuggestionsOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateJsonSchemaSuggestionsInputSchema = z.object({
  description: z.string().describe('A plain English description of the data to generate.'),
});
export type GenerateJsonSchemaSuggestionsInput = z.infer<typeof GenerateJsonSchemaSuggestionsInputSchema>;

const GenerateJsonSchemaSuggestionsOutputSchema = z.object({
  suggestedSchema: z.string().describe("A suggested JSON schema or example structure based on the description."),
});
export type GenerateJsonSchemaSuggestionsOutput = z.infer<typeof GenerateJsonSchemaSuggestionsOutputSchema>;

export async function generateJsonSchemaSuggestions(input: GenerateJsonSchemaSuggestionsInput): Promise<GenerateJsonSchemaSuggestionsOutput> {
  return generateJsonSchemaSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJsonSchemaSuggestionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateJsonSchemaSuggestionsInputSchema},
  output: {schema: GenerateJsonSchemaSuggestionsOutputSchema},
  prompt: `You are an expert data architect. Based on the user's description of the data they want, generate a simple and clear JSON schema or example structure.

  Return ONLY a JSON object with a "suggestedSchema" string field. The string should contain ONLY the raw JSON structure, without any markdown formatting like \`\`\`json.

  For example, if the user asks for "A list of products with name, price, and in-stock status", you should generate a schema like:
  {
    "products": [
      {
        "name": "string",
        "price": "number",
        "inStock": "boolean"
      }
    ]
  }

  User's Data Description: "{{description}}"
`,
});

const generateJsonSchemaSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateJsonSchemaSuggestionsFlow',
    inputSchema: GenerateJsonSchemaSuggestionsInputSchema,
    outputSchema: GenerateJsonSchemaSuggestionsOutputSchema,
  },
  async (input) => {
    // Don't generate suggestions for very short descriptions
    if (input.description.trim().split(/\s+/).length < 4) {
      return { suggestedSchema: '' };
    }
    const response = await prompt(input);
    const output = response.output ?? { suggestedSchema: '' };

    // Clean up the output just in case
    const cleanedSchema = output.suggestedSchema.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    
    return { suggestedSchema: cleanedSchema };
  }
);
