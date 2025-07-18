
'use server';
/**
 * @fileOverview A flow for generating single-file interactive HTML prototypes based on user descriptions.
 * This file contains the server-side logic and exports functions for both streaming and non-streaming generation.
 * Type definitions are in `src/types/ai.ts`.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  GenerateAppInputSchema,
  GenerateAppOutputSchema,
  type GenerateAppInput,
  type GenerateAppOutput,
} from '@/types/ai';

const promptTemplate = `
[ROLE & MISSION]
You are the "BrieflyAI Architect," an expert AI system designer. Your mission is to take a user's high-level description and transform it into a single, complete, runnable, and interactive HTML file.

[CORE WORKFLOW: From User Input to Single Interactive HTML File]
You will generate a single file named \`index.html\`. This file must contain all the necessary HTML for structure, CSS for styling (inside a <style> tag), and JavaScript for interactivity (inside a <script> tag).

[CRITICAL RULES]
1.  **Self-Contained:** The generated file MUST be a single HTML file. Do NOT use any external CSS or JavaScript files.
2.  **No External Libraries:** Do NOT use frameworks like React, Vue, or jQuery. All logic must be in vanilla JavaScript.
3.  **No Build Steps:** The generated code must run directly in a browser without any compilation or build steps.
4.  **Dark Mode & Styling:** Implement a clean, modern, dark-mode visual style. Use Flexbox or Grid for layout and ensure the design is responsive.
5.  **RAW HTML ONLY:** Your entire output must be ONLY the raw HTML code for the \`index.html\` file. Do not wrap it in markdown, JSON, or any other format. Do not include any explanations, headings, or introductory text.

[USER CONFIGURATION]
- **App Description:** "{{description}}"
- **Page Sections / Components:** {{#if dataPoints}}{{dataPoints}}{{else}}User did not specify sections.{{/if}}

Execute the generation based on these precise instructions. Start generating the \`<!DOCTYPE html>\` now.
`;

/**
 * [NON-STREAMING] Generates the full application code at once.
 * This is used for saving the final project to the database.
 */
export async function generateApp(input: GenerateAppInput): Promise<GenerateAppOutput> {
  const response = await ai.generate({
    model: 'googleai/gemini-2.5-pro',
    prompt: promptTemplate,
    input,
    output: {
      format: 'text',
    },
  });

  const generatedCode = response.text.replace(/^```(html)?\n?/, '').replace(/\n?```$/, '');
  
  return {
    files: [{
      filePath: 'index.html',
      componentCode: generatedCode,
      instructions: "A self-contained HTML file with structure, styling, and interactive JavaScript.",
    }],
  };
}

/**
 * [STREAMING] Generates the application code and yields it in chunks.
 * This is the primary function used by the API to provide a real-time experience.
 */
export async function generateAppStream(input: GenerateAppInput): Promise<ReadableStream<string>> {
  const { stream } = await ai.generate({
    model: 'googleai/gemini-2.5-pro',
    prompt: promptTemplate,
    input,
    stream: true,
  });
  
  // Directly return the raw stream of text chunks
  return stream;
}
