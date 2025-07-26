

import { z } from 'zod';
import { MessageSchema } from './ai';

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  createdAt: z.string(), // ISO string date
  updatedAt: z.string(), // ISO string date
  messages: z.array(MessageSchema),
  isPinned: z.boolean().optional(), // Add optional isPinned flag
  isDeleted: z.boolean().optional(),
  deletedAt: z.string().optional(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;
