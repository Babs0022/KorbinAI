
'use server';
/**
 * @fileOverview A flow for generating images from a text prompt, optionally with image context.
 * 
 * - generateImage - A function that takes a prompt and generates one or more images.
 * - GenerateImageInput - The input type for the function.
 * - GenerateImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import type {Part} from 'genkit';
import {z} from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A detailed text description of the image to generate, or instructions on how to modify the context images.'),
  imageDataUris: z.array(z.string()).optional().describe("An optional array of images to use as context for the generation, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  count: z.number().min(1).max(4).default(1).describe('The number of images to generate.'),
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
