
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

// Defines the shape of the raw generated content.
export const ProjectContentSchema = z.union([
  z.string(), 
  z.array(z.string()),
  ComponentWizardContentSchema,
]);
export type ProjectContent = z.infer<typeof ProjectContentSchema>;


// Defines the shape of the project metadata document.
export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  generationId: z.string(), // Links to the document in the 'generations' collection.
  name: z.string(),
  summary: z.string(),
  type: z.enum(['written-content', 'prompt', 'structured-data', 'image-generator', 'component-wizard', 'chat']),
  createdAt: z.string(), 
  updatedAt: z.string(),
  // The 'content' is now fetched separately from the 'generations' collection.
  // It's added back to the Project object in the service layer for client-side use.
  content: ProjectContentSchema.optional(), 
});
export type Project = z.infer<typeof ProjectSchema>;

// Defines the shape of a document in the 'generations' collection.
export const GenerationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['written-content', 'prompt', 'structured-data', 'image-generator', 'component-wizard', 'chat']),
  content: ProjectContentSchema,
  createdAt: z.any(), // Firestore Timestamp
});
export type Generation = z.infer<typeof GenerationSchema>;
