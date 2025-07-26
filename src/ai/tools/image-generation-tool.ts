
'use server';
/**
 * @fileOverview An AI tool for generating images.
 * This file defines a Genkit tool that the main conversational agent can use
 * to generate images based on a text prompt. It now acts as a wrapper
 * around the more powerful `generateImageFlow`.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateImage as generateImageFlow } from '../flows/generate-image-flow';
import { GenerateImageInputSchema, GenerateImageOutputSchema } from '@/types/ai';

export const generateImage = ai.defineTool(
  {
    name: 'generateImage',
    description: 'This tool generates an image from a text prompt. Use this tool whenever a user asks to generate an image, draw a picture, or create a photo. The user prompt will be used as the prompt for the image generation.',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    // This tool now simply calls the more powerful and flexible flow.
    return await generateImageFlow(input);
  }
);
