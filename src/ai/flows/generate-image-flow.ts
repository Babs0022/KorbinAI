
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
import { saveWorkspace } from '@/services/workspaceService';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A detailed text description of the image to generate.'),
  count: z.number().min(1).max(4).default(4).describe('The number of images to generate.'),
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
    // The image generation model does not support the `candidates` parameter to generate
    // multiple images in a single call. Instead, we must call it multiple times in parallel.
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

    const imageUrls = results
      .map(response => response.media?.url)
      .filter((url): url is string => !!url);
      
    if (imageUrls.length === 0) {
      throw new Error('Image generation failed to return any images. This may be due to a safety policy violation in the prompt or a network issue.');
    }

    const flowOutput = { imageUrls };

    if (input.userId) {
      // The output saved to the workspace should be a plain object containing all image URLs.
      const workspaceOutput = { imageUrls: flowOutput.imageUrls };
      const { userId, ...workspaceInput } = input;
      await saveWorkspace({
        userId,
        type: 'image',
        input: workspaceInput,
        output: workspaceOutput,
        featurePath: '/image-generator',
      });
    }

    return flowOutput;
  }
);
