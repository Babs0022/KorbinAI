
'use server';
/**
 * @fileOverview This file defines the core application features as Genkit Tools
 * that the autonomous agent can interact with. Each tool is a wrapper around an
 * existing AI flow and includes logging capabilities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateWrittenContent } from '@/ai/flows/generate-written-content-flow';
import { generatePrompt } from '@/ai/flows/generate-prompt-flow';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { generateStructuredData } from '@/ai/flows/generate-structured-data-flow';
import { createLog } from '@/services/loggingService';
import type { GenerateWrittenContentInput, GeneratePromptInput, GenerateImageInput, GenerateStructuredDataInput } from '@/types/ai';

const toolInputSchema = z.object({
  userId: z.string().optional(),
  traceId: z.string().optional(), // traceId is now optional but expected
});

const writtenContentInputSchema = toolInputSchema.extend({
  contentType: z.string(),
  tone: z.string(),
  topic: z.string(),
  audience: z.string().optional(),
  keywords: z.string().optional(),
}).describe('The parameters for generating written content.');

const promptGeneratorInputSchema = toolInputSchema.extend({
  taskDescription: z.string(),
  targetModel: z.string().optional(),
  outputFormat: z.string().optional(),
}).describe('The parameters for generating an AI prompt.');

const imageGeneratorInputSchema = toolInputSchema.extend({
  prompt: z.string(),
  count: z.number().optional().default(1),
}).describe('The parameters for generating an image.');

const structuredDataInputSchema = toolInputSchema.extend({
  description: z.string(),
  format: z.enum(['json', 'csv', 'kml', 'xml']),
  schemaDefinition: z.string().optional(),
}).describe('The parameters for generating structured data.');

// Written Content Tool
export const brieflyWrittenContentGenerator = ai.defineTool(
  {
    name: 'brieflyWrittenContentGenerator',
    description: 'Generates written content like blog posts, articles, emails, or social media updates.',
    inputSchema: writtenContentInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { traceId, userId } = input;
    await createLog({ traceId, userId, flowName: 'brieflyWrittenContentGenerator', phase: 'Executing', stepName: 'ToolStarted', level: 'info', status: 'started', message: 'Executing tool.', source: 'briefly-tools.ts', data: input });
    const result = await generateWrittenContent(input as GenerateWrittenContentInput);
    await createLog({ traceId, userId, flowName: 'brieflyWrittenContentGenerator', phase: 'Executing', stepName: 'ToolCompleted', level: 'info', status: 'completed', message: 'Tool finished.', source: 'briefly-tools.ts' });
    return result.generatedContent;
  }
);

// Prompt Generator Tool
export const brieflyPromptGenerator = ai.defineTool(
  {
    name: 'brieflyPromptGenerator',
    description: 'Generates an optimized AI prompt based on a user\'s task description.',
    inputSchema: promptGeneratorInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { traceId, userId } = input;
    await createLog({ traceId, userId, flowName: 'brieflyPromptGenerator', phase: 'Executing', stepName: 'ToolStarted', level: 'info', status: 'started', message: 'Executing tool.', source: 'briefly-tools.ts', data: input });
    const result = await generatePrompt(input as GeneratePromptInput);
    await createLog({ traceId, userId, flowName: 'brieflyPromptGenerator', phase: 'Executing', stepName: 'ToolCompleted', level: 'info', status: 'completed', message: 'Tool finished.', source: 'briefly-tools.ts' });
    return result.generatedPrompt;
  }
);

// Image Generator Tool
export const brieflyImageGenerator = ai.defineTool(
  {
    name: 'brieflyImageGenerator',
    description: 'Generates visual images from a text prompt.',
    inputSchema: imageGeneratorInputSchema,
    outputSchema: z.string().describe('A single data URI for the generated image.'),
  },
  async (input) => {
    const { traceId, userId } = input;
    await createLog({ traceId, userId, flowName: 'brieflyImageGenerator', phase: 'Executing', stepName: 'ToolStarted', level: 'info', status: 'started', message: 'Executing tool.', source: 'briefly-tools.ts', data: input });
    const result = await generateImage(input as GenerateImageInput);
    await createLog({ traceId, userId, flowName: 'brieflyImageGenerator', phase: 'Executing', stepName: 'ToolCompleted', level: 'info', status: 'completed', message: 'Tool finished.', source: 'briefly-tools.ts' });
    // For simplicity, the agent tool returns the first image URL.
    return result.imageUrls[0] || 'No image was generated.';
  }
);

// Structured Data Tool
export const brieflyStructuredDataGenerator = ai.defineTool(
  {
    name: 'brieflyStructuredDataGenerator',
    description: 'Generates structured data in formats like JSON, CSV, KML, or XML.',
    inputSchema: structuredDataInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { traceId, userId } = input;
    await createLog({ traceId, userId, flowName: 'brieflyStructuredDataGenerator', phase: 'Executing', stepName: 'ToolStarted', level: 'info', status: 'started', message: 'Executing tool.', source: 'briefly-tools.ts', data: input });
    const result = await generateStructuredData(input as GenerateStructuredDataInput);
    await createLog({ traceId, userId, flowName: 'brieflyStructuredDataGenerator', phase: 'Executing', stepName: 'ToolCompleted', level: 'info', status: 'completed', message: 'Tool finished.', source: 'briefly-tools.ts' });
    return result.generatedData;
  }
);

