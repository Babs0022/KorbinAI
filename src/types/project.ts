
import { z } from 'zod';

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
  z.string(), 
  z.array(z.string()),
  ComponentWizardContentSchema,
]);
export type ProjectContent = z.infer<typeof ProjectContentSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  summary: z.string(),
  type: z.enum(['written-content', 'prompt', 'structured-data', 'image-generator', 'component-wizard']),
  content: ProjectContentSchema,
  createdAt: z.string(), 
  updatedAt: z.string(), 
});
export type Project = z.infer<typeof ProjectSchema>;
