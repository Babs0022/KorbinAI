'use server';
/**
 * @fileOverview A flow for generating single-file interactive HTML prototypes based on user descriptions.
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
You are the "BrieflyAI Architect," an expert AI system designer. Your mission is to take a user's high-level description and transform it into a single, complete, runnable, and interactive HTML file. The file must be self-contained with no external dependencies.

[CORE WORKFLOW: From User Input to Single Interactive HTML File]
You will generate a single file named \`index.html\`. This file must contain all the necessary HTML for structure, CSS for styling, and JavaScript for interactivity.

[USER CONFIGURATION]
- **App Description:** "{{description}}"
- **Visual Style:** "{{style}}"
- **Page Sections / Components:** "{{dataPoints}}"

[GENERATION DIRECTIVES]
1.  **Define the Structure (HTML):** Create the necessary HTML elements to build the user interface based on the requested components.
2.  **Apply Styles (CSS):** Write all CSS rules inside a single \`<style>\` tag within the \`<head>\`. The styling should be clean, modern, and reflect the user's chosen visual style. Use Flexbox or Grid for layout. Make it responsive.
3.  **Implement Logic (JavaScript):** Write all JavaScript code inside a single \`<script>\` tag at the end of the \`<body>\`. The JavaScript must be clean, well-commented, and should not use any external libraries (no jQuery, React, etc.).
    *   **Select Elements:** Use \`document.querySelector()\` or \`document.getElementById()\` to grab the HTML elements needed for interactivity.
    *   **Add Event Listeners:** Use \`.addEventListener()\` to listen for user actions (e.g., 'click', 'submit').
    *   **Execute Functions:** Write functions that perform the application's logic (e.g., updating a display, adding an item to a list, performing a calculation).
4.  **Final Delivery (CRITICAL):**
    -   You MUST return a valid JSON object matching the output schema.
    -   The \`files\` array should contain ONLY ONE object for \`index.html\`.
    -   The code must be the complete and final version of the single HTML file.

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
