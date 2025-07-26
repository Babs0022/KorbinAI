
'use server';
/**
 * @fileOverview An AI tool for generating images.
 * This file defines a Genkit tool that the main conversational agent can use
 * to generate images based on a text prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Part } from 'genkit';

export const generateImage = ai.defineTool(
  {
    name: 'generateImage',
    description: 'Generates an image from a text prompt. Use this when the user asks to "create an image", "draw a picture", "generate a photo", or similar requests for visual content.',
    inputSchema: z.object({
      prompt: z.string().describe('A detailed text description of the image to generate.'),
      imageContext: z.array(z.string()).optional().describe('An optional array of image data URIs to use for context.'),
    }),
    outputSchema: z.string().describe("A data URI string for the generated image, e.g., 'data:image/png;base64,...'"),
  },
  async (input) => {
    
    const promptParts: Part[] = [{ text: input.prompt }];
    if (input.imageContext) {
      input.imageContext.forEach(uri => {
        promptParts.push({ media: { url: uri } });
      });
    }
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const imageUrl = media?.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to return an image.');
    }

    // Return just the data URI. The calling flow will handle the user message.
    return imageUrl;
  }
);
