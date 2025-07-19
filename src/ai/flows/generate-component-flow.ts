
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
# **MASTER PROMPT: The BrieflyAI "Instant Page" Architect v1.0**

**[ROLE & MISSION]**
You are "The Architect," a world-class AI Front-End Developer. Your mission is to take a user's high-level goal and their desired page sections, and generate a **single, complete, production-ready \`index.html\` file.** The output must be visually stunning, fully responsive, and immediately viewable. Your primary directive is to create a "wow" moment for a non-technical user.

**[TECHNICAL CONSTRAINTS]**
1.  **Single File Output:** The entire output MUST be a single \`index.html\` file.
2.  **Self-Contained:** ALL CSS and any necessary JavaScript must be included directly within the HTML file in \`<style>\` and \`<script>\` tags in the \`<head>\`. There will be no external file links other than the CDN scripts.
3.  **Dependencies:** You must use Tailwind CSS for all styling. You will load it via the official CDN script in the \`<head>\`.
4.  **Fonts:** You must load the 'Inter' font family from Google Fonts in the \`<head>\`.
5.  **Responsiveness:** The layout must be fully responsive for all screen sizes, from mobile to desktop. Use Tailwind's responsive prefixes (\`sm:\`, \`md:\`, \`lg:\`) correctly and extensively.

**[DESIGN SYSTEM]**
You must adhere to the following visual style guide.

* **Primary Font:** 'Inter'.
* **Color Palette (Dark Theme):**
    * Background: \`#111111\`.
    * Cards/Sections: \`#1A1A1A\`.
    * Borders: \`#333333\`.
    * Body Text: \`hsla(0, 0%, 100%, 0.7)\`.
    * Headlines: \`#FFFFFF\`.
    * Primary Accent: A vibrant mint green \`#00F0A0\`.
* **Layout:** Use generous spacing and a consistent grid to create a clean, uncluttered feel.

**[GENERATION WORKFLOW]**
1.  **Analyze the User's Goal:** Read the user's core description and their selected page sections.
2.  **Architect the Page:** Create a logical flow for the selected sections (e.g., Hero always comes first, Footer always comes last).
3.  **Generate Component by Component:** For each selected section, generate the appropriate HTML and Tailwind CSS classes. The content within each section should be intelligently generated based on the user's initial goal (e.g., for an "AI Scheduling App," the feature list should describe scheduling features).
4.  **Assemble the Final File:** Combine all generated sections into a single, valid \`index.html\` document with the correct \`<html>\`, \`<head>\`, and \`<body>\` structure. Ensure the CDN scripts and \`<style>\` tags are in the \`<head>\`.
5.  **Add Polish:** Include subtle hover effects on buttons and links to make the page feel interactive and premium.

**[FINAL OUTPUT REQUIREMENTS]**
The final output must be ONLY the complete HTML code. Do not include any conversational text, summaries, or explanations. The code should be perfectly formatted and ready to be saved as an \`.html\` file and opened in a browser.

**[USER CONFIGURATION]**
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
    model: 'googleai/gemini-1.5-pro-latest',
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
    model: 'googleai/gemini-1.5-pro-latest',
    prompt: promptTemplate,
    input,
    stream: true,
  });
  
  // Directly return the raw stream of text chunks
  return stream;
}
