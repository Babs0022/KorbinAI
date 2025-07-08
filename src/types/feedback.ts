
import { z } from 'zod';

export const FeedbackRatingSchema = z.enum(['good', 'bad']);
export type FeedbackRating = z.infer<typeof FeedbackRatingSchema>;

export const FeedbackSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string(),
  rating: FeedbackRatingSchema,
  comment: z.string().optional(),
  createdAt: z.any(), // Firestore Timestamp
});

export type Feedback = z.infer<typeof FeedbackSchema>;
