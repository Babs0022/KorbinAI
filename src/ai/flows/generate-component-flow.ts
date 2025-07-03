'use server';
/**
 * @fileOverview A flow for generating multi-file React applications based on user descriptions.
 *
 * - generateApp - A function that generates a React application structure.
 * - GenerateAppInput - The input type for the generateApp function.
 * - GenerateAppOutput - The return type for the generateApp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateAppInputSchema = z.object({
  description: z.string().describe('A plain English description of the application or page to build.'),
  style: z.string().describe("The visual style of the brand (e.g., 'Minimalist & Modern', 'Playful & Creative')."),
  dataPoints: z.string().optional().describe('A comma-separated list of specific data points or sections the app should include.'),
});
export type GenerateAppInput = z.infer<typeof GenerateAppInputSchema>;

const FileOutputSchema = z.object({
    filePath: z.string().describe("The full, absolute path for the file, e.g., 'src/app/page.tsx' or 'src/components/sections/HeroSection.tsx'."),
    componentCode: z.string().describe("The full TSX/TS code for the file, including all necessary imports and content."),
    instructions: z.string().describe("A brief, user-friendly explanation of this file's purpose and how it connects to other files."),
});

const GenerateAppOutputSchema = z.object({
  files: z.array(FileOutputSchema).describe("An array of all the files needed for the application."),
  finalInstructions: z.string().describe("A final summary of what the user should do next, like running 'npm run dev' to see the page. Do not tell them to run npm install."),
});
export type GenerateAppOutput = z.infer<typeof GenerateAppOutputSchema>;


export async function generateApp(input: GenerateAppInput): Promise<GenerateAppOutput> {
  return generateAppFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAppPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateAppInputSchema},
  output: {schema: GenerateAppOutputSchema},
  prompt: `You are an expert Next.js developer and architect. Your task is to generate the full file structure for a web application based on a user's description.
You MUST return the output as a valid JSON object that adheres to the defined schema. The JSON object must contain an array of file objects and final instructions.

- For each file, provide a complete file path (e.g., 'src/app/page.tsx'), the full code, and a brief instruction for the user.
- Use TypeScript, Next.js App Router, Tailwind CSS, and components from shadcn/ui where appropriate.
- Create separate, reusable components for different sections of a page and place them in 'src/components/sections/'.
- Ensure all components are self-contained and import any dependencies they need.
- The main page route should always be 'src/app/page.tsx'.
- Use placeholder images from \`https://placehold.co/<width>x<height>.png\` if images are needed. Add a data-ai-hint attribute to the image with one or two keywords for the image.
- Do not add any explanations or introductory text. Output ONLY the raw JSON object.

App Description: "{{description}}"
Visual Style: "{{style}}"
{{#if dataPoints}}
Specific Sections/Data to include: "{{dataPoints}}"
{{/if}}

Generate the JSON output for the entire application now.
`,
});

const generateAppFlow = ai.defineFlow(
  {
    name: 'generateAppFlow',
    inputSchema: GenerateAppInputSchema,
    outputSchema: GenerateAppOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;

    if (!output?.files || output.files.length === 0) {
      console.error('AI response was empty or invalid. Raw text from model:', response.text);
      throw new Error('Failed to generate application because the AI response was empty or invalid.');
    }
    
    // Clean up the code in each file to remove markdown blocks if the AI includes them
    const cleanedFiles = output.files.map(file => ({
        ...file,
        componentCode: file.componentCode.replace(/^```(tsx|typescript|ts|jsx|js|json)?\n?/, '').replace(/\n?```$/, '')
    }));

    return {
        ...output,
        files: cleanedFiles,
    };
  }
);
