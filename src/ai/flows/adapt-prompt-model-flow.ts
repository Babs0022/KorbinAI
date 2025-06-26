
'use server';
/**
 * @fileOverview A flow to adapt a given prompt for a specific AI model.
 *
 * - adaptPromptForModel - A function that calls the flow.
 * - AdaptPromptForModelInput - The input type for the flow.
 * - AdaptPromptForModelOutput - The return type for the flow.
 * - AIModelEnum - TypeScript enum for AI model selection.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the Zod schema locally, but do not export it.
const AIModelEnumSchema = z.enum([
  "gpt-4.5",
  "gpt-4o",
  "gpt-4",
  "gpt-3.5-turbo",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.0-pro",
  "claude-3.5-sonnet",
  "claude-3-opus",
  "claude-3-sonnet",
  "claude-3-haiku",
  "llama-3-70b",
  "grok-3",
  "deepseek-r1",
  "dall-e-3",
  "stable-diffusion-3",
  "stable-diffusion",
  "midjourney"
]).describe("The target AI model for which the prompt should be adapted.");

// Export the TypeScript type derived from the schema.
export type AIModelEnum = z.infer<typeof AIModelEnumSchema>;

const AdaptPromptForModelInputSchema = z.object({
  originalPrompt: z.string().describe('The initial prompt text provided by the user.'),
  targetModel: AIModelEnumSchema, // Use the local schema here for input validation
});
export type AdaptPromptForModelInput = z.infer<typeof AdaptPromptForModelInputSchema>;

const AdaptPromptForModelOutputSchema = z.object({
  adaptedPrompt: z.string().describe('The prompt text adapted for the specified AI model.'),
  adaptationTips: z.array(z.string()).describe('An array of tips explaining the adaptations made or general advice for the target model.'),
  modelType: z.enum(["text", "image", "unknown"]).describe("The general type of the target model (text or image generation).")
});
export type AdaptPromptForModelOutput = z.infer<typeof AdaptPromptForModelOutputSchema>;

export async function adaptPromptForModel(input: AdaptPromptForModelInput): Promise<AdaptPromptForModelOutput> {
  return adaptPromptForModelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptPromptForModelPrompt',
  input: {schema: AdaptPromptForModelInputSchema},
  output: {schema: AdaptPromptForModelOutputSchema},
  prompt: `You are an expert AI Prompt Engineer. Your task is to adapt the "Original Prompt" to be highly effective for the specified "Target AI Model".
Additionally, provide 2-4 concise "Adaptation Tips" that explain the key changes made or offer general advice for using this type of prompt with the target model.
Determine if the target model is primarily for 'text' generation or 'image' generation and set the 'modelType' field accordingly.

Original Prompt:
"{{{originalPrompt}}}"

Target AI Model: "{{targetModel}}"

Consider these model-specific nuances:
- **GPT-4.5 / GPT-4o / GPT-4 / GPT-3.5-Turbo:**
  - These models excel with clear, direct instructions. GPT-4.5 and GPT-4o are top-tier multi-modal models.
  - For complex tasks, use "chain-of-thought" or "think step-by-step" instructions.
  - Defining a specific role or persona (e.g., "Act as an expert financial advisor") is highly effective.
- **Gemini Models (2.5 Pro, 2.5 Flash, 2.0 Flash, 1.5 Pro, 1.5 Flash, 1.0 Pro):**
  - The Gemini family is highly capable with multi-modal inputs (text, image, video).
  - "Flash" versions are optimized for speed and high-volume tasks, while "Pro" versions offer maximum reasoning power.
  - Benefit from well-structured prompts. Use clear headings and lists.
- **Claude Models (3.5 Sonnet, 3 Opus, 3 Sonnet, 3 Haiku):**
  - **Claude 3.5 Sonnet:** The newest, fastest model in the family. It's twice as fast as Claude 3 Opus with near-equivalent intelligence, and excels at vision tasks, complex instruction following, and generating natural-sounding code and text.
  - **Claude 3 Opus/Sonnet/Haiku:** This family varies in speed and power (Opus > Sonnet > Haiku). They excel when instructions are wrapped in XML tags (e.g., <example>...</example>) and for long-context tasks.
- **Grok 3:**
  - Known for its potential access to real-time information and a more edgy or humorous tone.
  - Tailor prompts to leverage this by asking for timely information or specifying a particular witty persona.
- **Llama 3 & DeepSeek R1 (Open Models):**
  - Highly capable open models that are excellent at following complex instructions and have a low refusal rate.
  - Respond well to detailed system prompts that define roles, constraints, and output formats.
- **DALL-E 3 (Image Model):**
  - Descriptive Language: Use vivid adjectives and nouns in full sentences.
  - Scene Details: Include objects, characters, setting, atmosphere.
  - Artistic Style: Suggest styles (e.g., "photorealistic", "impressionist painting", "pixel art").
  - Camera View/Angle: (e.g., "close-up", "wide-angle shot").
  - Lighting: (e.g., "soft morning light", "dramatic studio lighting").
  - Avoid Midjourney-style keyword lists and parameters.
- **Midjourney (Image Model):**
  - Keyword and Phrase Driven: Often relies on comma-separated keywords.
  - Artistic Styles & Mediums: (e.g., "impressionism", "cyberpunk", "watercolor").
  - Influences: Mention specific artists or art styles.
  - Parameters: Use Midjourney parameters like --ar 16:9 (aspect ratio), --v 6.0 (version), --style raw.
  - Subject Emphasis: Use :: for weighting, e.g., "cat::2 dog::1".
- **Stable Diffusion (SD3, etc.):**
  - Stable Diffusion 3 has significantly improved prompt following and text rendering capabilities compared to older versions.
  - Detailed Descriptions: Can be a mix of natural language and keywords.
  - Negative Prompts: Often benefits from specifying what *not* to include (e.g., \`(worst quality, low quality:1.4)\`).
  - Artist Names & Styles: Effective for guiding the output.
  - Technical Terms: (e.g., "8k", "UHD", "trending on ArtStation").

If the Original Prompt seems fundamentally unsuited for the Target AI Model's primary function (e.g., a text-generation goal for an image model), state this in the 'adaptedPrompt' and explain why in the 'adaptationTips'. For example, if the original prompt is "Write a poem" and the target is DALL-E 3, the adapted prompt could be "The original prompt 'Write a poem' is for text generation. For DALL-E 3 (an image model), you might want to generate an image *inspired by* a poem. What imagery would you like to see?".

Return the adapted prompt and 2-4 unique, actionable tips.
Determine the 'modelType' based on the 'targetModel':
- gpt-4.5, gpt-4o, gpt-4, gpt-3.5-turbo, gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro, claude-3.5-sonnet, claude-3-opus, claude-3-sonnet, claude-3-haiku, llama-3-70b, grok-3, deepseek-r1 are 'text' models.
- dall-e-3, midjourney, stable-diffusion-3, stable-diffusion are 'image' models.
- If unsure, use 'unknown'.
`,
});

const adaptPromptForModelFlow = ai.defineFlow(
  {
    name: 'adaptPromptForModelFlow',
    inputSchema: AdaptPromptForModelInputSchema,
    outputSchema: AdaptPromptForModelOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
