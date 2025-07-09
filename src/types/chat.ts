import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  imageUrl: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
