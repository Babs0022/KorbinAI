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
    instructions: z.string().describe("A one-sentence, beginner-friendly explanation of this file's purpose. Assume the user has never coded before. For example: 'This is the main page of your app.' or 'This component defines the top section of your landing page.'"),
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
  prompt: `You are an expert Next.js developer and architect. Your task is to generate the necessary files to create a new page or feature within an *existing* Next.js application.
You will be modifying a project that already has its root configuration files (like package.json, next.config.ts, etc.) set up.
Therefore, you MUST NOT generate any root-level configuration files. All file paths you generate must start within the 'src/' directory.

You MUST return the output as a valid JSON object that adheres to the defined schema. The JSON object must contain an array of file objects and final instructions.

Key Instructions:
1.  **File Paths:** All generated files must have an absolute path starting from the 'src/' directory (e.g., 'src/app/new-feature/page.tsx', 'src/components/ui/MyButton.tsx'). Do not generate files outside of 'src/'.
2.  **File Content:** For each file, provide the full, complete TSX/TS code.
3.  **User Instructions:** For each file, include a simple, one-sentence explanation of its purpose for a non-technical user.
4.  **Technology Stack:** Use TypeScript, the Next.js App Router, Tailwind CSS, and components from shadcn/ui where appropriate. The project is already configured for these.
5.  **Component Structure:** Create separate, reusable components for different sections of a page. Place new page components in 'src/components/sections/'.
6.  **Main Route:** The primary page for this new feature should typically be located at a new route like 'src/app/new-page/page.tsx'. Use 'src/app/page.tsx' only if the user explicitly asks to replace the main homepage.
7.  **Placeholders:** Use placeholder images from \`https://placehold.co/<width>x<height>.png\` where needed. Add a \`data-ai-hint\` attribute with one or two keywords for the image.
8.  **Output Format:** Do not add any explanations or introductory text in your response. Output ONLY the raw JSON object.

App Description: "{{description}}"
Visual Style: "{{style}}"
{{#if dataPoints}}
Specific Sections/Data to include: "{{dataPoints}}"
{{/if}}

Generate the JSON output for the application files now.
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
