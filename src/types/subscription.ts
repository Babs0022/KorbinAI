export type UserSubscription = {
  status: 'active' | 'cancelled' | 'past_due';
  planId: 'pro' | 'premium' | 'unlimited';
  billingCycle: 'monthly' | 'annually';
  userId: string;
  provider: 'stripe' | 'paystack'; // Added provider
  paystack?: {
    customerCode: string;
    subscriptionCode: string;
    planCode: string;
  };
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  startedAt: Date;
};
