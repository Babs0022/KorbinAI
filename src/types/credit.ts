
import { z } from 'zod';

// This schema can be extended as more user-specific data is stored.
export const UserCreditsSchema = z.object({
  credits: z.number().int().nonnegative().optional(),
  isVerified: z.boolean().optional(),
});

export type UserCredits = z.infer<typeof UserCreditsSchema>;
