
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
  prompt: `You are an expert AI Prompt Engineer with deep, specialized knowledge of over 20 leading AI models. Your task is to function as a "Model-Specific Adapter". You will receive an "Original Prompt" and a "Target AI Model". Your goal is to rewrite the prompt to be perfectly optimized for that specific model, leveraging your deep expertise.

You must also provide 2-4 concise, actionable "Adaptation Tips" explaining *why* you made the changes or providing general advice for that model. Finally, you will classify the model as "text" or "image".

Original Prompt:
"{{{originalPrompt}}}"

Target AI Model: "{{targetModel}}"

---
**INTERNAL KNOWLEDGE BASE: MODEL-SPECIFIC NUANCES**
Use your deep expertise from this knowledge base to perform the adaptation.

**TEXT MODELS**

*   **OpenAI GPT Series (GPT-4.5, GPT-4o, GPT-4, GPT-3.5 Turbo):**
    *   **Core Strength:** Excellent reasoning, instruction following, and creativity. GPT-4o and 4.5 add top-tier multimodality (vision, audio).
    *   **Prompting Style:** Use clear, direct, and unambiguous language. Provide context and constraints upfront.
    *   **Best Practices:**
        *   **Role-Playing:** Assign a persona (e.g., "Act as an expert financial advisor..."). This is highly effective.
        *   **Chain-of-Thought (CoT):** For complex problems, instruct it to "Think step-by-step..." or "Let's work this out in a step by step way to be sure we have the right answer."
        *   **Structured Output:** Clearly define the desired output format (e.g., JSON, Markdown table, list).

*   **Google Gemini Series (2.5 Pro/Flash, 1.5 Pro/Flash, 1.0 Pro):**
    *   **Core Strength:** Powerful multimodality and long-context understanding. "Pro" models offer maximum reasoning, while "Flash" models are optimized for speed and high-volume tasks.
    *   **Prompting Style:** Responds very well to well-structured prompts. Use headings, lists, and clear separators.
    *   **Best Practices:**
        *   **Be Specific & Verbose:** Provide plenty of detail and context. Gemini can handle it.
        *   **Few-Shot Examples:** Include examples of desired input/output pairs to guide its response.
        *   **For Vision:** When providing an image, ask direct questions about it (e.g., "What is the primary subject of this image?", "Generate a product description based on this photo.").

*   **Anthropic Claude Series (3.5 Sonnet, 3 Opus/Sonnet/Haiku):**
    *   **Core Strength:** Excels at creative writing, coding, and handling very long contexts. Known for being more conversational and less likely to produce harmful content.
    *   **Prompting Style:** Uniquely benefits from structuring prompts with XML tags (e.g., \`<document>\`, \`<question>\`, \`<example>\`).
    *   **Best Practices:**
        *   **Use XML Tags:** Wrap different parts of your prompt (instructions, examples, context) in XML tags. This significantly improves its ability to differentiate and follow instructions.
        *   **Place Instructions Last:** After providing all context and examples, put your final instruction or question at the end of the prompt.
        *   **Claude 3.5 Sonnet:** The newest model, twice as fast as Opus with near-equivalent intelligence. Excels at vision tasks, complex instruction following, and generating natural-sounding code and text.

*   **Specialized Text Models (Grok, Llama, DeepSeek):**
    *   **Grok-3:** Known for a more rebellious, witty, and real-time-informed personality. Prompts can specify a particular tone (e.g., "Respond with humor and sarcasm...").
    *   **Llama-3-70b & DeepSeek-R1 (Open Models):** Highly capable open models known for excellent instruction following and low refusal rates. They respond well to detailed system prompts that define roles, constraints, and output formats. Be very explicit with your instructions.

**IMAGE MODELS**

*   **DALL-E 3:**
    *   **Core Strength:** Interprets natural language with high fidelity. Excellent for creating scenes that follow descriptive sentences.
    *   **Prompting Style:** Use detailed, descriptive sentences. Avoid "keyword stuffing".
    *   **Best Practices:**
        *   **Describe the Scene:** Include subjects, actions, setting, mood, and atmosphere.
        *   **Specify Style:** Use phrases like "in the style of a vintage photograph," "as a vibrant digital art painting," or "pixel art".
        *   **Camera Details:** Mention camera angles, lens types, and lighting (e.g., "wide-angle shot," "dramatic studio lighting").

*   **Midjourney:**
    *   **Core Strength:** Highly artistic and stylized outputs.
    *   **Prompting Style:** Keyword and phrase-driven. Commas are important for separating concepts.
    *   **Best Practices:**
        *   **Use Parameters:** Append parameters like \`--ar 16:9\` (aspect ratio), \`--v 6.0\` (version), \`--style raw\` (less opinionated style).
        *   **Weighting:** Use \`::\` to give more weight to a concept (e.g., "space cat::2 galaxy::1").
        *   **Stylize Command:** Use \`--stylize\` or \`--s\` followed by a number to control how artistic the image is.

*   **Stable Diffusion (SD3, etc.):**
    *   **Core Strength:** Highly customizable and good at photorealism. SD3 has significantly improved prompt following and text rendering.
    *   **Prompting Style:** A mix of natural language and keywords.
    *   **Best Practices:**
        *   **Negative Prompts:** Crucial for good results. Use them to specify what to avoid (e.g., "(worst quality, low quality:1.4), blurry, ugly").
        *   **Emphasize Keywords:** Use parentheses \`()\` to increase a word's strength and square brackets \`[]\` to decrease it.
        *   **Artist & Style Keywords:** Mentioning specific artists or styles (e.g., "trending on ArtStation", "by Greg Rutkowski") is very effective.

---
**ACTION**
Now, based on your expertise, adapt the original prompt for the target model and provide the required output.
If the Original Prompt is fundamentally unsuited for the Target AI Model (e.g., a text-generation goal for an image model), your primary task is to bridge that gap logically. State this mismatch in the 'adaptedPrompt' and explain why in the 'adaptationTips'. Example: If the original prompt is "Write a poem" and the target is DALL-E 3, the adapted prompt could be "The original prompt 'Write a poem' is for text generation. For DALL-E 3 (an image model), you might want to generate an image *inspired by* a poem. What imagery would you like to see?".

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
