
'use server';
/**
 * @fileOverview A flow for generating images using Gemini.
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
    
    const { prompt, imageDataUris, style } = input;

    let finalPrompt;
    const promptParts = [];

    // If context images are provided, add them to the prompt
    if (imageDataUris && imageDataUris.length > 0) {
        imageDataUris.forEach(url => {
            promptParts.push({ media: { url } });
        });
    }

    // Add the text part of the prompt
    let textPrompt = prompt;
    if (style && (!imageDataUris || imageDataUris.length === 0)) {
        textPrompt += `, in the style of ${style}`;
    }
    promptParts.push({ text: textPrompt });
    
    finalPrompt = promptParts;

    try {
      const { media } = await ai.generate({
        // IMPORTANT: This is the correct model for image generation in this context.
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: finalPrompt,
        config: {
            // This configuration is required by the model.
            responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Image generation failed to return an image URL.');
      }

      // This model only generates one image at a time.
      return { imageUrls: [media.url] };

    } catch (error) {
      console.error('Image generation flow failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      throw new Error(`Failed to generate image: ${errorMessage}`);
    }
  }
);
