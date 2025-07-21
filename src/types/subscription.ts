
export type UserSubscription = {
  status: 'active' | 'cancelled' | 'past_due' | string; // Allow other statuses
  planId: 'pro' | 'premium' | 'unlimited' | string; // Allow other plan IDs
  billingCycle: 'monthly' | 'annually' | string;
  userId: string;
  email?: string;
  paymentMethod: 'card' | 'crypto' | string; // e.g., 'paystack', 'nowpayments'
  
  // Paystack specific fields
  paystackReference?: string;
  
  // NOWPayments specific fields
  nowpaymentsPaymentId?: string;
  
  // General fields
  amountPaid?: number;
  currency?: string;
  
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  lastEventTimestamp?: any; // Firestore timestamp
};
