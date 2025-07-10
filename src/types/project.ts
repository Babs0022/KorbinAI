
import { z } from 'zod';

// --- Zod Schemas for Project Data Validation ---

const ComponentFileSchema = z.object({
  filePath: z.string(),
  componentCode: z.string(),
  instructions: z.string(),
});

const ComponentWizardContentSchema = z.object({
  files: z.array(ComponentFileSchema),
  finalInstructions: z.string(),
});

export const ProjectContentSchema = z.union([
  z.string(), // For text-based content like written, prompt, structured-data
  z.array(z.string()), // For image URLs from the image generator
  ComponentWizardContentSchema, // For component wizard results
]);
export type ProjectContent = z.infer<typeof ProjectContentSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  summary: z.string(),
  type: z.enum(['written-content', 'prompt', 'structured-data', 'image-generator', 'component-wizard']),
  content: ProjectContentSchema,
  createdAt: z.string(), // Changed to string for client-side compatibility
  updatedAt: z.string(), // Changed to string for client-side compatibility
});
export type Project = z.infer<typeof ProjectSchema>;
