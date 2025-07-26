
'use server';
/**
 * @fileOverview A flow for generating images using the Imagen 2 model.
 *
 * - generateImage - A function that handles image generation with various options.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateImageInputSchema, GenerateImageOutputSchema } from '@/types/ai';
import type { GenerateImageInput } from '@/types/ai';

export async function generateImage(input: GenerateImageInput): Promise<z.infer<typeof GenerateImageOutputSchema>> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input: z.infer<typeof GenerateImageInputSchema>) => {
    
    const { prompt, imageDataUris, count = 1, style, aspectRatio, negativePrompt } = input;

    // Base prompt for the model
    let finalPrompt = prompt;
    if (style) {
      finalPrompt += `, in the style of ${style}`;
    }
    if (aspectRatio) {
      finalPrompt += `, aspect ratio ${aspectRatio}`;
    }

    try {
      const llmResponse = await ai.generate({
        model: 'googleai/imagen-2',
        prompt: finalPrompt,
        config: {
          numImages: count,
          negativePrompt,
        },
        context: imageDataUris ? imageDataUris.map(url => ({ media: { url } })) : undefined,
      });

      if (!llmResponse.media) {
        throw new Error('Image generation failed to return any images.');
      }
      
      const imageUrl = llmResponse.media.url;

      if (!imageUrl) {
        throw new Error('Image generation failed to return an image URL.');
      }

      return { imageUrls: [imageUrl] };

    } catch (error) {
      console.error('Image generation flow failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      throw new Error(`Failed to generate image: ${errorMessage}`);
    }
  }
);
