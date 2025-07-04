
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
import { saveWorkspace } from '@/services/workspaceService';

const GenerateAppInputSchema = z.object({
  description: z.string().describe('A plain English description of the application or page to build.'),
  style: z.string().describe("The visual style of the brand (e.g., 'Minimalist & Modern', 'Playful & Creative')."),
  dataPoints: z.string().optional().describe('A comma-separated list of specific page sections the app should include (e.g., Hero, Features, Testimonials). This is the primary guide for page structure.'),
  generationMode: z.enum(['new', 'existing']).describe("Determines whether to generate a full new application or add to an existing one."),
  userId: z.string().optional().describe('The ID of the user performing the generation.'),
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
  prompt: `You are an expert Next.js developer specializing in creating beautiful, production-ready applications using ShadCN UI and Tailwind CSS. Your task is to generate the files for a web application based on a structured request.

Pay close attention to the **Generation Mode** and the requested **Page Sections**.

---
### User Request
- **App Description:** "{{description}}"
- **Visual Style:** "{{style}}"
- **Generation Mode:** {{generationMode}}
{{#if dataPoints}}
- **Page Sections:** "{{dataPoints}}"
{{/if}}
---

### Core Instructions

1.  **Structure from Sections**: The "Page Sections" are your primary guide. For the main page, create one React component for EACH section listed in 'dataPoints'.
    -   Place new section components in \`src/components/sections/\`. For example, a "Hero" section becomes \`src/components/sections/HeroSection.tsx\`.
    -   The main page file (e.g., \`src/app/page.tsx\`) should import these section components and render them in order.

2.  **Use High-Quality UI Components**:
    -   Build the UI using **ShadCN components** (\`@/components/ui/*\`) like \`<Card>\`, \`<Button>\`, \`<Input>\`, etc. This is mandatory for professional results.
    -   Use **Lucide React icons** for iconography.
    -   Use Tailwind CSS for all styling. Do not use inline styles.
    -   Use placeholder images from \`https://placehold.co/<width>x<height>.png\`. Add a \`data-ai-hint\` attribute with one or two keywords for the image.

3.  **Generation Mode Logic**:

    -   **If Mode is 'existing'**:
        -   Generate ONLY the files for the new page and its section components.
        -   All file paths MUST start with \`src/\`. The main page should be at a new route like \`src/app/new-page/page.tsx\`, unless the description implies changing the homepage.
        -   DO NOT generate \`package.json\`, config files, or \`layout.tsx\`. Assume ShadCN is already installed.

    -   **If Mode is 'new'**:
        -   Generate ALL files for a COMPLETE, standalone Next.js app.
        -   **Root Files**: Paths like \`package.json\`, \`next.config.ts\`, \`tailwind.config.ts\`, \`components.json\` must be at the root (no \`src/\` prefix).
        -   **Source Files**: App code, components, and styles must be in \`src/\`.
        -   **Dependencies**: \`package.json\` must include everything needed for a ShadCN project: \`next\`, \`react\`, \`tailwindcss\`, \`lucide-react\`, \`class-variance-authority\`, \`clsx\`, \`tailwind-merge\`, \`tailwindcss-animate\`, and all necessary \`@radix-ui/*\` packages. Add TypeScript dev dependencies.
        -   **Configuration**: Generate valid configs, including \`components.json\` for ShadCN.
        -   **Styling**: Generate \`src/app/globals.css\` with a theme matching the user's chosen **Visual Style**.
        -   **Layout**: Generate a root \`src/app/layout.tsx\`.

4.  **Output Format**:
    -   You MUST return a valid JSON object matching the schema.
    -   Provide the FULL, complete code for every file.
    -   For each file, include a simple, one-sentence explanation of its purpose.

Generate the application files now based on these detailed instructions.
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
    
    // Construct a new, clean object to prevent passing complex Genkit objects to Firestore.
    const finalOutput: GenerateAppOutput = {
        files: cleanedFiles,
        finalInstructions: output.finalInstructions,
    };

    if (input.userId) {
      // Exclude userId from the input saved to the database
      const { userId, ...workspaceInput } = input;
      await saveWorkspace({
        userId,
        type: 'component-wizard',
        input: workspaceInput,
        output: finalOutput,
        featurePath: '/component-wizard',
      });
    }

    return finalOutput;
  }
);
