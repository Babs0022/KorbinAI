
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
import { saveToImageLibrary } from '@/services/imageLibraryService';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A detailed text description of the image to generate.'),
  count: z.number().min(1).max(4).default(1).describe('The number of images to generate.'),
  userId: z.string().optional().describe('The ID of the user performing the generation.'),
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
    const generationPromises = Array(input.count).fill(null).map(() => 
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const results = await Promise.all(generationPromises);

    const dataUris = results
      .map(response => response.media?.url)
      .filter((url): url is string => !!url);
      
    if (dataUris.length === 0) {
      throw new Error('Image generation failed to return any images. This may be due to a safety policy violation in the prompt or a network issue.');
    }

    let finalImageUrls = dataUris;

    if (input.userId) {
      // This service now uploads the data URIs to cloud storage
      // and returns an array of public, permanent URLs.
      finalImageUrls = await saveToImageLibrary({
        userId: input.userId,
        prompt: input.prompt,
        imageUrls: dataUris,
      });
    }

    // Return the public URLs to the client for display.
    const flowOutput: GenerateImageOutput = {
      imageUrls: finalImageUrls,
    };

    return flowOutput;
  }
);
