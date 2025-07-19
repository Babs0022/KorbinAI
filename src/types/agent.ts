
import { z } from 'zod';

export const AgentLogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  type: z.enum(['start', 'tool_start', 'tool_end', 'info', 'result', 'finish', 'error']),
  message: z.string(),
  data: z.any().optional(),
  timestamp: z.any(), // Firestore Timestamp
});

export type AgentLog = z.infer<typeof AgentLogSchema>;
