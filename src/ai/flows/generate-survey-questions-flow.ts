'use server';
/**
 * @fileOverview A flow to dynamically generate survey questions based on a user's goal and an optional image.
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

// This is the public-facing input for the flow.
const GenerateSurveyQuestionsInputSchema = z.object({
  goal: z.string().describe("The user's initial goal or task for the AI prompt."),
  imageDataUri: z.string().optional().describe("An optional image provided by the user, as a data URI."),
  targetModel: z.string().optional().describe("The AI model the user wants to target. Use this to tailor questions."),
});
export type GenerateSurveyQuestionsInput = z.infer<typeof GenerateSurveyQuestionsInputSchema>;

const GenerateSurveyQuestionsOutputSchema = z.object({
  questions: z.array(SurveyQuestionSchema).describe('An array of 3-4 dynamically generated survey questions tailored to the user\'s goal. Ensure options are provided if type is radio or checkbox.'),
});
export type GenerateSurveyQuestionsOutput = z.infer<typeof GenerateSurveyQuestionsOutputSchema>;

export async function generateSurveyQuestions(input: GenerateSurveyQuestionsInput): Promise<GenerateSurveyQuestionsOutput> {
  return generateSurveyQuestionsFlow(input);
}

const generateSurveyQuestionsPrompt = ai.definePrompt({
  name: 'generateSurveyQuestionsPrompt',
  input: {schema: GenerateSurveyQuestionsInputSchema},
  output: {schema: GenerateSurveyQuestionsOutputSchema},
  prompt: `You are an expert prompt engineering assistant. Your task is to generate 3-4 insightful and concise survey questions to help a user refine their goal into a more effective AI prompt.

Base your survey questions on the user's goal and any additional context provided.

Goal: "{{goal}}"

{{#if imageDataUri}}
Image Context:
{{media url=imageDataUri}}
{{/if}}

{{#if targetModel}}
Target AI Model: "{{targetModel}}"
**IMPORTANT**: Tailor your questions to be especially relevant for this model. For example, for image models like Stable Diffusion, ask about style, artists, or negative prompts. For text models like Claude, you might ask about structuring the prompt with XML tags. For GPT, ask about personas or chain-of-thought.
{{/if}}

For each generated question, you MUST provide: "id", "text", "type" (text, radio, or checkbox), and "options" (only for radio/checkbox).
Focus questions on clarifying: desired output format, key constraints, target audience, style/tone, and the role of any provided context.
Generate exactly 3 or 4 questions.
Ensure radio/checkbox questions have an 'options' array.`,
});

const generateSurveyQuestionsFlow = ai.defineFlow(
  {
    name: 'generateSurveyQuestionsFlow',
    inputSchema: GenerateSurveyQuestionsInputSchema,
    outputSchema: GenerateSurveyQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await generateSurveyQuestionsPrompt(input);
    return { questions: output?.questions || [] };
  }
);