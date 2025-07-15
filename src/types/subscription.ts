
import { z } from 'zod';

export const UserSubscriptionSchema = z.object({
  userId: z.string(),
  planId: z.enum(['pro', 'premium', 'unlimited']),
  email: z.string().email().optional(),
  status: z.enum(['active', 'cancelled', 'past_due']),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  paystackReference: z.string().optional(),
  nowpaymentsPaymentId: z.string().optional(),
  paymentMethod: z.enum(['card', 'crypto']).optional(),
  amountPaid: z.number(),
  currency: z.string(),
  lastEventTimestamp: z.any(), // Firestore Timestamp
});

export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;
