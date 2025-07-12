
'use server';
/**
 * @fileOverview A flow for generating images from a text prompt, optionally with image context.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */

import {ai} from '@/ai/genkit';
import type {Part} from 'genkit';
import {
    GenerateImageInputSchema,
    GenerateImageOutputSchema,
    type GenerateImageInput,
    type GenerateImageOutput,
} from '@/types/ai';

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
    const promptParts: Part[] = [];

    // If context images are provided, add them to the prompt parts.
    if (input.imageDataUris && input.imageDataUris.length > 0) {
        input.imageDataUris.forEach(uri => {
            promptParts.push({ media: { url: uri } });
        });
    }

    // Always add the text prompt.
    promptParts.push({ text: input.prompt });
    
    const generationPromises = Array(input.count).fill(null).map(() => 
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: promptParts,
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

    const flowOutput: GenerateImageOutput = {
      imageUrls: dataUris,
    };

    return flowOutput;
  }
);
