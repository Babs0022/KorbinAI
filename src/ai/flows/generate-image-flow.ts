
'use server';
/**
 * @fileOverview A flow for generating images from a text prompt.
 * 
 * - generateImage - A function that takes a prompt and generates one or more images.
 * - GenerateImageInput - The input type for the function.
 * - GenerateImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A detailed text description of the image to generate.'),
  count: z.number().min(1).max(4).default(4).describe('The number of images to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('An array of data URIs for the generated images.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
      candidates: input.count,
    });

    if (!response.candidates || !Array.isArray(response.candidates)) {
      throw new Error('Image generation failed: The AI model did not return any image candidates. This may be due to a safety policy violation in the prompt.');
    }

    const imageUrls = response.candidates
      .map(candidate => candidate.output?.media?.url)
      .filter((url): url is string => !!url);
      
    if (!imageUrls.length) {
      throw new Error('Image generation failed to return any images.');
    }

    return { imageUrls };
  }
);
