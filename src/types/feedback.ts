

import { z } from 'zod';

export const FeedbackRatingSchema = z.enum(['good', 'bad']);
export type FeedbackRating = z.infer<typeof FeedbackRatingSchema>;

export const FeedbackSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string().describe("The ID of the project or chat session this feedback belongs to."),
  contentId: z.string().describe("A unique identifier for the content being rated, e.g., a message ID or a hash of the content."),
  rating: FeedbackRatingSchema,
  tags: z.array(z.string()).optional().describe("A list of tags selected by the user, like 'Factually Incorrect' or 'Creative'."),
  comment: z.string().optional(),
  createdAt: z.any(), // Firestore Timestamp
});

export type Feedback = z.infer<typeof FeedbackSchema>;


export const UserReportSchema = z.object({
    id: z.string(),
    userId: z.string(),
    email: z.string(),
    reportType: z.enum(['feedback', 'bug']),
    message: z.string(),
    page: z.string(),
    status: z.enum(['new', 'in-progress', 'resolved']),
    createdAt: z.any(), // Firestore Timestamp
});

export type UserReport = z.infer<typeof UserReportSchema>;
