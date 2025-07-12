
'use server';
/**
 * @fileOverview A flow for generating multi-file React applications based on user descriptions.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateAppInputSchema,
    GenerateAppOutputSchema,
    type GenerateAppInput,
    type GenerateAppOutput
} from '@/types/ai';


export async function generateApp(input: GenerateAppInput): Promise<GenerateAppOutput> {
  return generateAppFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAppPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
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
    const aiOutput = response.output;

    if (!aiOutput?.files || aiOutput.files.length === 0) {
      console.error('AI response was empty or invalid. Raw text from model:', response.text);
      throw new Error('Failed to generate application because the AI response was empty or invalid.');
    }
    
    // Clean up the code and ensure plain objects by explicitly creating them.
    const cleanedFiles = aiOutput.files.map(file => ({
        filePath: String(file.filePath),
        componentCode: String(file.componentCode).replace(/^```(tsx|typescript|ts|jsx|js|json)?\n?/, '').replace(/\n?```$/, ''),
        instructions: String(file.instructions),
    }));
    
    // Construct a new, clean object to prevent passing complex Genkit objects.
    const finalOutput: GenerateAppOutput = {
        files: cleanedFiles,
        finalInstructions: String(aiOutput.finalInstructions),
    };

    return finalOutput;
  }
);
