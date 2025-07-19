
import { z } from 'zod';

const AgentLogTypeSchema = z.enum([
    'start',
    'finish',
    'info',
    'tool_start',
    'tool_end',
    'result',
    'error',
]);

export const AgentLogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  type: AgentLogTypeSchema,
  message: z.string(),
  data: z.any().optional(), // To store tool inputs/outputs
  timestamp: z.any(), // Firestore Timestamp
});
export type AgentLog = z.infer<typeof AgentLogSchema>;


export const AgentLogInputSchema = z.object({
  userId: z.string().optional(),
  type: AgentLogTypeSchema,
  message: z.string(),
  data: z.any().optional(),
});
export type AgentLogInput = z.infer<typeof AgentLogInputSchema>;
