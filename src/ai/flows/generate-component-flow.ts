
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
  generationMode: z.enum(['new', 'existing']).describe("Determines whether to generate a full new application or add to an existing one."),
});
export type GenerateAppInput = z.infer<typeof GenerateAppInputSchema>;

const FileOutputSchema = z.object({
    filePath: z.string().describe("The full, absolute path for the file, e.g., 'src/app/page.tsx' or 'package.json' for new apps."),
    componentCode: z.string().describe("The full TSX/TS/JSON code for the file, including all necessary imports and content."),
    instructions: z.string().describe("A one-sentence, beginner-friendly explanation of this file's purpose. Assume the user has never coded before. For example: 'This is the main page of your app.' or 'This file lists your project's dependencies.'"),
});

const GenerateAppOutputSchema = z.object({
  files: z.array(FileOutputSchema).describe("An array of all the files needed for the application."),
  finalInstructions: z.string().describe("A final summary of what the user should do next, like running 'npm install && npm run dev'. Do not tell them to just run npm install."),
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
  prompt: `You are an expert Next.js developer and architect. Your task is to generate the files for a web application based on the user's request.

Pay close attention to the **Generation Mode**.

---
### Generation Mode: {{generationMode}}
---

**If the Generation Mode is 'new':**
Your task is to generate ALL the necessary files to create a COMPLETE, standalone Next.js application from scratch.
- **File Paths:** This is critical. You must generate both root-level files and files inside the 'src' directory.
    - **Root Files:** Paths like 'package.json', 'next.config.ts', and 'tailwind.config.ts' MUST NOT start with 'src/'.
    - **Source Files:** All application code (pages, components, styles) MUST have paths starting with 'src/'. For example: 'src/app/page.tsx'.
- **Dependencies:** The 'package.json' MUST include 'next', 'react', 'react-dom', 'tailwindcss'. You can also add 'lucide-react' for icons and 'clsx' for utility classes. DO NOT generate a 'devDependencies' section. The 'scripts' must include "dev", "build", and "start".
- **Configuration:** Generate valid, standard 'next.config.ts' and 'tailwind.config.ts' files.
- **Base Styles:** Provide 'src/app/globals.css' with Tailwind directives.
- **Root Layout:** Create a 'src/app/layout.tsx' file.

**If the Generation Mode is 'existing':**
Your task is to generate ONLY the files to create a new page or feature within an *existing* Next.js application.
- **File Paths:** All generated files MUST have an absolute path starting from the 'src/' directory (e.g., 'src/app/new-feature/page.tsx'). DO NOT generate root-level files like 'package.json' or any configuration files.
- **Main Route:** The primary page for this new feature should be at a new route like 'src/app/new-page/page.tsx'. Use 'src/app/page.tsx' only if the user explicitly asks to replace the homepage.

---
### General Instructions (Apply to Both Modes)
- **Output Format:** You MUST return the output as a valid JSON object that adheres to the defined schema. The JSON object must contain an array of file objects and final instructions. Do not add any explanations or introductory text in your response. Output ONLY the raw JSON object.
- **File Content:** For each file, provide the full, complete TSX/TS/JSON code.
- **User Instructions:** For each file, include a simple, one-sentence explanation of its purpose for a non-technical user.
- **Technology Stack:** Use TypeScript, the Next.js App Router, and Tailwind CSS. For 'new' mode, do not assume shadcn/ui is installed; generate simple components.
- **Component Structure:** Create separate, reusable components for different sections of a page. Place new components in 'src/components/sections/'.
- **Placeholders:** Use placeholder images from \`https://placehold.co/<width>x<height>.png\` where needed. Add a \`data-ai-hint\` attribute with one or two keywords for the image.

---
### User Request
App Description: "{{description}}"
Visual Style: "{{style}}"
{{#if dataPoints}}
Specific Sections/Data to include: "{{dataPoints}}"
{{/if}}

Generate the JSON output for the application files now based on the specified Generation Mode.
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
