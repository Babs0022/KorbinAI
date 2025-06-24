
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
  system: `You are an expert prompt engineering assistant. Your task is to generate 3-4 insightful and concise survey questions to help a user refine their goal into a more effective AI prompt.

If a 'sourceUrl' is provided in the input, you MUST use the 'fetchWebsiteContentTool' to retrieve the website's text content.
If a 'pdfDataUri' is provided in the input, you MUST use the 'extractTextFromPdfTool' with the provided data URI to retrieve the document's text content.
If an 'imageDataUri' is provided, you must analyze the image.

Base your survey questions on the user's goal and any content retrieved from the tools or image.

For each generated question, you MUST provide: "id", "text", "type" (text, radio, or checkbox), and "options" (only for radio/checkbox).
Focus questions on clarifying: desired output format, key constraints, target audience, style/tone, and the role of any provided context.
Generate exactly 3 or 4 questions.
Ensure radio/checkbox questions have an 'options' array.`,
  prompt: `Please generate survey questions for the following goal: "{{goal}}"
  
  {{#if imageDataUri}}
  Also consider the attached image.
  {{media url=imageDataUri}}
  {{/if}}
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
