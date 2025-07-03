'use server';
/**
 * @fileOverview A flow for generating React components based on user descriptions.
 *
 * - generateComponent - A function that generates a React component.
 * - GenerateComponentInput - The input type for the generateComponent function.
 * - GenerateComponentOutput - The return type for the generateComponent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

export const GenerateComponentInputSchema = z.object({
  description: z.string().describe('A plain English description of the component to build.'),
  style: z.string().describe("The visual style of the brand (e.g., 'Minimalist & Modern', 'Playful & Creative')."),
  dataPoints: z.string().optional().describe('A comma-separated list of specific data points the component should display.'),
});
export type GenerateComponentInput = z.infer<typeof GenerateComponentInputSchema>;

export const GenerateComponentOutputSchema = z.object({
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
Your task is to generate the code for a single, self-contained React component file (.tsx).
Use TypeScript, Tailwind CSS, and components from shadcn/ui where appropriate.
Ensure the component is fully responsive and accessible.
Use placeholder images from \`https://placehold.co/<width>x<height>.png\` if images are needed. Add a data-ai-hint attribute to the image with one or two keywords for the image.
Do not add any explanations, introductory text, or markdown formatting around the code. Output only the raw code for the component file itself.

Component Description: "{{description}}"
Visual Style: "{{style}}"
{{#if dataPoints}}
Specific Data Points to include: "{{dataPoints}}"
{{/if}}

Generate the component code now.
`,
});

const generateComponentFlow = ai.defineFlow(
  {
    name: 'generateComponentFlow',
    inputSchema: GenerateComponentInputSchema,
    outputSchema: GenerateComponentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate component.');
    }
    // Clean up the output to remove markdown code blocks if the AI includes them
    const cleanedCode = output.componentCode.replace(/^```tsx\n/, '').replace(/\n```$/, '');
    return {
      ...output,
      componentCode: cleanedCode,
    };
  }
);
