
'use server';
/**
 * @fileOverview A flow to dynamically generate survey questions based on a user's goal and an optional image, PDF, or URL.
 *
 * - generateSurveyQuestions - A function that calls the flow to get tailored survey questions.
 * - GenerateSurveyQuestionsInput - The input type for the flow.
 * - GenerateSurveyQuestionsOutput - The return type for the flow, containing an array of questions.
 * - SurveyQuestionSchema - The Zod schema for a single survey question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchWebsiteContentTool } from '../tools/web-scraper';
import { extractTextFromPdfTool } from '../tools/pdf-parser';


// Define the schema for a single survey question
const SurveyQuestionSchema = z.object({
  id: z.string().describe('A unique identifier for the question (e.g., "q1", "q2_audience").'),
  text: z.string().describe('The text of the survey question.'),
  type: z.enum(['text', 'radio', 'checkbox']).describe('The type of input field for the question.'),
  options: z.array(z.string()).optional().describe('An array of string options, required if type is "radio" or "checkbox". Should contain 2-4 concise options.'),
});
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;

const GenerateSurveyQuestionsInputSchema = z.object({
  goal: z.string().describe("The user's initial goal or task for the AI prompt."),
  imageDataUri: z.string().optional().describe("An optional image provided by the user, as a data URI."),
  sourceUrl: z.string().url().optional().describe("An optional website URL provided by the user for context."),
  pdfDataUri: z.string().optional().describe("An optional PDF document provided by the user as a data URI for context."),
});
export type GenerateSurveyQuestionsInput = z.infer<typeof GenerateSurveyQuestionsInputSchema>;

const GenerateSurveyQuestionsOutputSchema = z.object({
  questions: z.array(SurveyQuestionSchema).describe('An array of 3-4 dynamically generated survey questions tailored to the user\'s goal. Ensure options are provided if type is radio or checkbox.'),
});
export type GenerateSurveyQuestionsOutput = z.infer<typeof GenerateSurveyQuestionsOutputSchema>;

export async function generateSurveyQuestions(input: GenerateSurveyQuestionsInput): Promise<GenerateSurveyQuestionsOutput> {
  return generateSurveyQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSurveyQuestionsPrompt',
  input: {schema: GenerateSurveyQuestionsInputSchema},
  output: {schema: GenerateSurveyQuestionsOutputSchema},
  tools: [fetchWebsiteContentTool, extractTextFromPdfTool],
  prompt: `You are an expert prompt engineering assistant. Based on the user's goal and any provided context (image, PDF, or URL), generate 3-4 insightful and concise survey questions to help clarify their intent and refine it into a more effective prompt for an AI model.

User's Goal: "{{goal}}"

{{#if sourceUrl}}
**External Context from Website:**
The user has provided a URL for context. Use the 'fetchWebsiteContentTool' with the URL "{{{sourceUrl}}}" to retrieve the website's text content. Your survey questions should be based on the user's goal AND the content of this website.
{{/if}}

{{#if pdfDataUri}}
**External Context from PDF:**
The user has provided a PDF document for context. Use the 'extractTextFromPdfTool' to retrieve the text content from the document. Your survey questions should be based on the user's goal AND the content of this document. The PDF is provided as a data URI.
{{/if}}

{{#if imageDataUri}}
**Image Context:**
The user has also provided the following image for context. Analyze it. Your questions can be about the image's style, subject, or how it should relate to the user's goal.
{{media url=imageDataUri}}
{{/if}}

For each question, you MUST provide:
- "id": A unique string identifier (e.g., "q1_audience", "q2_tone").
- "text": The question text. This should be clear and direct.
- "type": The type of question, which must be one of "text", "radio", or "checkbox".
- "options": (ONLY if type is "radio" or "checkbox") An array of 2-4 short, distinct string options. Do NOT provide options if type is "text".

Focus on questions that elicit details about:
- The desired output format or structure.
- Key constraints or elements to include/exclude.
- The intended audience or context, if applicable.
- The desired style, tone, or perspective.
- If context is provided (image, PDF, URL), ask about its role. (e.g., "What is the key takeaway from the provided document that should be highlighted?", "Describe the art style you want to replicate from this image.", "What is the primary call-to-action on the provided website?").

Generate exactly 3 or 4 questions.
Ensure each radio or checkbox question has an 'options' array. Text questions should NOT have an 'options' array.
`,
});

const generateSurveyQuestionsFlow = ai.defineFlow(
  {
    name: 'generateSurveyQuestionsFlow',
    inputSchema: GenerateSurveyQuestionsInputSchema,
    outputSchema: GenerateSurveyQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // Ensure questions are not null/undefined and provide a default empty array if needed
    return { questions: output?.questions || [] };
  }
);
