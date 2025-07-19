
import { z } from 'zod';

// Expanded LogLevel to include more descriptive levels for agent thought process
export const LogLevelSchema = z.enum([
    'info',
    'warn',
    'error',
    'debug',
    'verbose', // For detailed step-by-step narration
]);

// Expanded LogStatus to reflect the agent's lifecycle
export const LogStatusSchema = z.enum([
    'started',
    'completed',
    'failed',
    'retrying', // For self-correction loops
    'waiting',  // For user input or other external dependencies
]);

// Represents the phase of the agent's operation
export const AgentPhaseSchema = z.enum([
    'Thinking',
    'Planning',
    'Executing',
    'Waiting',
    'Correcting',
    'Completed',
]);

// Optional schema to structure tool call data
export const ToolCallSchema = z.object({
    toolName: z.string().describe("The name of the tool being called."),
    toolInput: z.any().optional().describe("The input parameters for the tool call."),
});

export const BrieflyLogSchema = z.object({
  id: z.string().describe("The unique ID of the log entry."),
  traceId: z.string().describe("The ID that groups all logs for a single execution run."),
  flowName: z.string().describe("The name of the Genkit flow being executed (e.g., 'agentExecutorFlow')."),
  userId: z.string().optional().describe("The ID of the user who initiated the action."),
  
  // New & Enhanced Fields for Agent Logging
  phase: AgentPhaseSchema.describe("The current operational phase of the agent."),
  stepName: z.string().describe("A descriptive name for the current step (e.g., 'AnalyzeRequest', 'GenerateOutline')."),

  level: LogLevelSchema.describe("The severity level of the log."),
  status: LogStatusSchema.describe("The status of this specific log entry/step."),
  
  message: z.string().describe("A human-readable narration of the agent's action or thought."),
  
  // Structured data for tool calls and other relevant info
  data: z.object({
    toolCall: ToolCallSchema.optional(),
    errorDetails: z.any().optional().describe("Detailed error information, if any."),
    otherData: z.any().optional(),
  }).optional().describe("An object for storing structured data like tool inputs or error details."),

  metadata: z.object({
    source: z.string().describe("The file path or component where the log originated."),
    timestamp: z.any().describe("The server timestamp of the log event."),
    executionTimeMs: z.number().optional().describe("For 'completed' or 'failed' logs, the total execution time in milliseconds."),
  }).describe("Additional metadata about the log entry."),
});
export type BrieflyLog = z.infer<typeof BrieflyLogSchema>;


// The input schema for creating a new log entry
export const LogInputSchema = z.object({
  traceId: z.string(), // Required for grouping
  flowName: z.string(),
  userId: z.string().optional(),
  
  // New fields must be provided for agent logs
  phase: AgentPhaseSchema,
  stepName: z.string(),
  
  level: LogLevelSchema.optional().default('info'),
  status: LogStatusSchema.optional().default('started'),
  
  message: z.string(),
  data: z.any().optional(),
  source: z.string(),
  executionTimeMs: z.number().optional(),
});
export type LogInput = z.infer<typeof LogInputSchema>;
