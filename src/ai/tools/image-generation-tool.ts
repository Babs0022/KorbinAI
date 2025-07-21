
'use server';
/**
 * @fileOverview An AI tool for generating images.
 * This file defines a Genkit tool that the main conversational agent can use
 * to generate images based on a text prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const generateImage = ai.defineTool(
  {
    name: 'generateImage',
    description: 'Generates an image from a text prompt. Use this when the user asks to "create an image", "draw a picture", "generate a photo", or similar requests for visual content.',
    inputSchema: z.object({
      prompt: z.string().describe('A detailed text description of the image to generate.'),
    }),
    outputSchema: z.string().describe("A markdown string for the generated image, e.g., '![Generated Image](data:image/png;base64,...)'"),
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const imageUrl = media?.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to return an image.');
    }

    // Return a markdown-formatted string to embed the image directly.
    return `![Generated image for prompt: ${input.prompt}](${imageUrl})`;
  }
);
