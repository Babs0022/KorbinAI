
'use server';
/**
 * @fileOverview A flow to dynamically generate survey questions based on a user's goal.
 * This flow is currently not used in the main prompt creation workflow but is kept for potential future use or modular features.
 *
 * - generateSurveyQuestions - A function that calls the flow to get tailored survey questions.
 * - GenerateSurveyQuestionsInput - The input type for the flow.
 * - GenerateSurveyQuestionsOutput - The return type for the flow, containing an array of questions.
 * - SurveyQuestionSchema - The Zod schema for a single survey question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  prompt: `You are an expert prompt engineering assistant. Based on the user's goal, generate 3-4 insightful and concise survey questions to help clarify their intent and refine it into a more effective prompt for an AI model.

User's Goal: "{{goal}}"

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

Example for a coding goal like "Generate Python code for a web scraper":
A good question might be: "What specific website(s) should the scraper target?" (type: text)

Example for a marketing goal like "Write a tweet about a new product":
A good question might be: "What is the desired call to action?" (type: text)

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
