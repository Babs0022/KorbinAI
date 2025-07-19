
import { z } from 'zod';

const LogLevelSchema = z.enum([
    'info',
    'warn',
    'error',
    'debug',
]);

const LogStatusSchema = z.enum([
    'started',
    'completed',
    'failed',
]);

export const BrieflyLogSchema = z.object({
  id: z.string().describe("The unique ID of the log entry."),
  traceId: z.string().describe("The ID that groups all logs for a single execution run."),
  flowName: z.string().describe("The name of the Genkit flow being executed (e.g., 'agentExecutorFlow')."),
  userId: z.string().optional().describe("The ID of the user who initiated the action."),
  level: LogLevelSchema.describe("The severity level of the log (e.g., 'info', 'error')."),
  status: LogStatusSchema.describe("The current status of the operation being logged."),
  message: z.string().describe("A human-readable description of the event."),
  data: z.any().optional().describe("An object for storing arbitrary data like tool inputs or API responses."),
  metadata: z.object({
    source: z.string().describe("The file path or component where the log originated."),
    timestamp: z.any().describe("The server timestamp of the log event."),
    executionTimeMs: z.number().optional().describe("For 'completed' or 'failed' logs, the total execution time in milliseconds."),
  }).describe("Additional metadata about the log entry."),
});
export type BrieflyLog = z.infer<typeof BrieflyLogSchema>;


export const LogInputSchema = z.object({
  traceId: z.string().optional(), // Now optional
  flowName: z.string(),
  userId: z.string().optional(),
  level: LogLevelSchema.optional(),
  status: LogStatusSchema.optional(),
  message: z.string(),
  data: z.any().optional(),
  source: z.string(),
  executionTimeMs: z.number().optional(),
});
export type LogInput = z.infer<typeof LogInputSchema>;
