export interface PaystackCustomer {
    email?: string;
}

export interface PaystackPlan {
    plan_code?: string;
    name?: string;
    interval?: 'monthly' | 'annually' | string;
}

export interface PaystackChargeSuccessData {
    reference: string;
    customer?: PaystackCustomer;
    amount: number;
    currency: string;
    paid_at?: string | number;
    plan?: PaystackPlan; // For one-time payment page charges
    plan_object?: PaystackPlan; // For subscription charges
}
