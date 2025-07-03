'use server';
/**
 * @fileOverview A flow for generating React components based on user descriptions.
 *
 * - generateComponent - A function that generates a React component.
 * - GenerateComponentInput - The input type for the generateComponent function.
 * - GenerateComponentOutput - The return type for the generateComponent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateComponentInputSchema = z.object({
  description: z.string().describe('A plain English description of the component to build.'),
  style: z.string().describe("The visual style of the brand (e.g., 'Minimalist & Modern', 'Playful & Creative')."),
  dataPoints: z.string().optional().describe('A comma-separated list of specific data points the component should display.'),
});
export type GenerateComponentInput = z.infer<typeof GenerateComponentInputSchema>;

const GenerateComponentOutputSchema = z.object({
  componentName: z.string().describe('A PascalCase name for the component, e.g., ContactForm.'),
  componentCode: z.string().describe('The full TSX code for the React component, including all necessary imports.'),
});
export type GenerateComponentOutput = z.infer<typeof GenerateComponentOutputSchema>;


export async function generateComponent(input: GenerateComponentInput): Promise<GenerateComponentOutput> {
  return generateComponentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateComponentPrompt',
  input: {schema: GenerateComponentInputSchema},
  output: {schema: GenerateComponentOutputSchema},
  prompt: `You are an expert Next.js developer specializing in creating beautiful and functional React components.
Your task is to generate the code for a single, self-contained React component file (.tsx) and a name for it.
You MUST return the output as a valid JSON object that conforms to this Zod schema:
\`\`\`json
{
  "componentName": "A PascalCase name for the component, e.g., ContactForm.",
  "componentCode": "The full TSX code for the React component, including all necessary imports."
}
\`\`\`

The component should use TypeScript, Tailwind CSS, and components from shadcn/ui where appropriate.
Ensure the component is fully responsive and accessible.
Use placeholder images from \`https://placehold.co/<width>x<height>.png\` if images are needed. Add a data-ai-hint attribute to the image with one or two keywords for the image.
Do not add any explanations, introductory text, or markdown formatting around the JSON. Output only the raw JSON object.

Component Description: "{{description}}"
Visual Style: "{{style}}"
{{#if dataPoints}}
Specific Data Points to include: "{{dataPoints}}"
{{/if}}

Generate the JSON output now.
`,
});

const generateComponentFlow = ai.defineFlow(
  {
    name: 'generateComponentFlow',
    inputSchema: GenerateComponentInputSchema,
    outputSchema: GenerateComponentOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;

    if (!output) {
      console.error('AI response was empty or invalid.', { fullResponse: response });
      throw new Error('Failed to generate component because the AI response was empty or invalid.');
    }
    // Clean up the output to remove markdown code blocks if the AI includes them
    const cleanedCode = output.componentCode.replace(/^```tsx\n/, '').replace(/\n```$/, '');
    return {
      ...output,
      componentCode: cleanedCode,
    };
  }
);
