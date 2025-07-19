
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
import { saveAgentLog } from '../../services/agentLogService';
import type { GenerateWrittenContentInput, GeneratePromptInput, GenerateImageInput, GenerateStructuredDataInput } from '@/types/ai';

// Written Content Tool
export const brieflyWrittenContentGenerator = ai.defineTool(
  {
    name: 'brieflyWrittenContentGenerator',
    description: 'Generates written content like blog posts, articles, emails, or social media updates.',
    inputSchema: z.object({
        userId: z.string().optional(),
        contentType: z.string(),
        tone: z.string(),
        topic: z.string(),
        audience: z.string().optional(),
        keywords: z.string().optional(),
    }).describe('The parameters for generating written content.'),
    outputSchema: z.string(),
  },
  async (input) => {
    await saveAgentLog({ userId: input.userId, type: 'tool_start', message: 'Executing Written Content Generator Tool.', data: input });
    const result = await generateWrittenContent(input as GenerateWrittenContentInput);
    await saveAgentLog({ userId: input.userId, type: 'tool_end', message: 'Written Content Generator Tool finished.' });
    return result.generatedContent;
  }
);

// Prompt Generator Tool
export const brieflyPromptGenerator = ai.defineTool(
  {
    name: 'brieflyPromptGenerator',
    description: 'Generates an optimized AI prompt based on a user\'s task description.',
    inputSchema: z.object({
        userId: z.string().optional(),
        taskDescription: z.string(),
        targetModel: z.string().optional(),
        outputFormat: z.string().optional(),
    }).describe('The parameters for generating an AI prompt.'),
    outputSchema: z.string(),
  },
  async (input) => {
    await saveAgentLog({ userId: input.userId, type: 'tool_start', message: 'Executing Prompt Generator Tool.', data: input });
    const result = await generatePrompt(input as GeneratePromptInput);
    await saveAgentLog({ userId: input.userId, type: 'tool_end', message: 'Prompt Generator Tool finished.' });
    return result.generatedPrompt;
  }
);

// Image Generator Tool
export const brieflyImageGenerator = ai.defineTool(
  {
    name: 'brieflyImageGenerator',
    description: 'Generates visual images from a text prompt.',
    inputSchema: z.object({
        userId: z.string().optional(),
        prompt: z.string(),
        count: z.number().optional().default(1),
    }).describe('The parameters for generating an image.'),
    outputSchema: z.string().describe('A single data URI for the generated image.'),
  },
  async (input) => {
    await saveAgentLog({ userId: input.userId, type: 'tool_start', message: 'Executing Image Generator Tool.', data: input });
    const result = await generateImage(input as GenerateImageInput);
    await saveAgentLog({ userId: input.userId, type: 'tool_end', message: 'Image Generator Tool finished.' });
    // For simplicity, the agent tool returns the first image URL.
    return result.imageUrls[0] || 'No image was generated.';
  }
);

// Structured Data Tool
export const brieflyStructuredDataGenerator = ai.defineTool(
  {
    name: 'brieflyStructuredDataGenerator',
    description: 'Generates structured data in formats like JSON, CSV, KML, or XML.',
    inputSchema: z.object({
        userId: z.string().optional(),
        description: z.string(),
        format: z.enum(['json', 'csv', 'kml', 'xml']),
        schemaDefinition: z.string().optional(),
    }).describe('The parameters for generating structured data.'),
    outputSchema: z.string(),
  },
  async (input) => {
    await saveAgentLog({ userId: input.userId, type: 'tool_start', message: 'Executing Structured Data Generator Tool.', data: input });
    const result = await generateStructuredData(input as GenerateStructuredDataInput);
    await saveAgentLog({ userId: input.userId, type: 'tool_end', message: 'Structured Data Generator Tool finished.' });
    return result.generatedData;
  }
);
