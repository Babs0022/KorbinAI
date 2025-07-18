
'use server';
/**
 * @fileOverview A flow for generating single-file HTML prototypes based on user descriptions.
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
  prompt: `[ROLE & MISSION]
You are the "BrieflyAI Architect," an expert AI system designer. Your mission is to take a user's high-level description of a web page and transform it into a single, complete, runnable, and visually impressive HTML prototype file.

[CORE WORKFLOW: From User Input to Single HTML File]
Your task is to generate a single HTML file based on the user's description.

[USER CONFIGURATION]
- **App Description:** "{{description}}"
- **Visual Style:** "{{style}}"
- **Page Sections / Components:** "{{dataPoints}}"

[GENERATION DIRECTIVES]
1.  **Single File Output:** You MUST generate a single file named \`index.html\`.
2.  **Self-Contained HTML:** The file MUST be a complete, self-contained HTML document.
    -   **Use Tailwind CSS via CDN:** Include the Tailwind CSS script in the \`<head>\` section: \`<script src="https://cdn.tailwindcss.com"></script>\`.
    -   **No External CSS:** Do NOT create a separate CSS file. All styling must be done with Tailwind classes directly in the HTML elements.
    -   **Dark Mode by Default:** The root \`<html>\` tag should have the \`class="dark"\` attribute.
    -   **Structure:** Combine all the requested "Page Sections / Components" into the \`<body>\` of the HTML file in a logical order.
3.  **Component Styling:**
    -   Use standard HTML tags (\`<div>\`, \`<h2>\`, \`<p>\`, \`<button>\`, etc.).
    -   Apply Tailwind CSS classes to replicate the visual appearance of professional UI components (like ShadCN). Use rounded corners, shadows, and modern color palettes.
    -   The background color of the body should be a dark gray (e.g., \`bg-gray-900\`) and text should be light (e.g., \`text-gray-200\`).
    -   Use Lucide React icons by embedding their SVG source directly. You can find SVG source for icons on the lucide.dev website. For example, a checkmark icon would be \`<svg ...><path d="M20 6 9 17l-5-5"/></svg>\`.
    -   Use placeholder images from \`https://placehold.co/<width>x<height>.png\`, and add a \`data-ai-hint\` attribute with one or two keywords.
4.  **Final Delivery (CRITICAL):**
    -   You MUST return a valid JSON object matching the output schema.
    -   The \`files\` array should contain ONLY ONE object for \`index.html\`.
    -   Provide the FULL, complete code for the \`index.html\` file.

Execute the generation based on these precise instructions.
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
        componentCode: String(file.componentCode).replace(/^```(html)?\n?/, '').replace(/\n?```$/, ''),
        instructions: String(file.instructions),
    }));
    
    const finalOutput: GenerateAppOutput = {
        files: cleanedFiles,
    };

    return finalOutput;
  }
);
