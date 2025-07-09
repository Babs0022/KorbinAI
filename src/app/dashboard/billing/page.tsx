"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePaystackPayment } from 'react-paystack';
import { Check, LoaderCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// These plan details should match what's in your Paystack dashboard and Cloud Functions
const plans = {
  premium: {
    name: "Premium",
    monthly: {
      price: "$15",
      plan_code: "PLN_PREMIUM_MONTHLY_EXAMPLE",
    },
    annually: {
      price: "$150",
      plan_code: "PLN_PREMIUM_ANNUALLY_EXAMPLE",
    },
    features: [
      "Access to all AI generators",
      "Up to 50 generations per month",
      "Save unlimited projects",
      "Standard support",
    ],
  },
  unlimited: {
    name: "Unlimited",
    monthly: {
      price: "$30",
      plan_code: "PLN_UNLIMITED_MONTHLY_EXAMPLE",
    },
    annually: {
      price: "$300",
      plan_code: "PLN_UNLIMITED_ANNUALLY_EXAMPLE",
    },
    features: [
      "Everything in Premium",
      "Unlimited generations",
      "Priority AI processing",
      "Priority email support",
    ],
  },
};

type PlanName = keyof typeof plans;
type BillingCycle = 'monthly' | 'annually';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";


function PaystackButton({ plan, billingCycle }: { plan: PlanName, billingCycle: BillingCycle }) {
    const { user } = useAuth();
    const { toast } = useToast();

    const planDetails = plans[plan][billingCycle];

    const config = {
        publicKey: PAYSTACK_PUBLIC_KEY,
        email: user?.email || '',
        plan: planDetails.plan_code,
        metadata: {
            userId: user?.uid,
            plan: plan,
            billingCycle,
        },
    };

    const initializePayment = usePaystackPayment(config);

    const onPaymentSuccess = (reference: any) => {
        console.log("Paystack success reference:", reference);
        toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated. Please allow a moment for it to reflect on your account.",
        });
    };

    const onPaymentClose = () => {
        console.log('Paystack payment modal closed');
    };

    const handleSubscribe = () => {
        if (!user) {
             toast({ variant: 'destructive', title: 'You must be signed in to subscribe.' });
             return;
        }
        if (!PAYSTACK_PUBLIC_KEY) {
            toast({ variant: 'destructive', title: 'Billing Error', description: 'Payment system is not configured correctly. Please contact support.' });
            console.error("Paystack public key is not set.");
            return;
        }
        initializePayment({onSuccess: onPaymentSuccess, onClose: onPaymentClose});
    }

    return (
        <Button onClick={handleSubscribe} className="w-full text-lg">
            Subscribe to {plans[plan].name}
        </Button>
    )
}


export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <DashboardLayout>
      <main className="flex flex-1 flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-4xl">
            <div className="text-center">
                <h1 className="text-4xl font-bold md:text-5xl">Our Pricing Plans</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Choose the plan that's right for you and unlock the full power of BrieflyAI.
                </p>
            </div>
            
            <div className="my-10 flex justify-center">
                <RadioGroup 
                    value={billingCycle} 
                    onValueChange={(value: BillingCycle) => setBillingCycle(value)}
                    className="grid grid-cols-2 gap-2 rounded-full p-1 bg-secondary text-muted-foreground border"
                >
                     <div>
                        <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
                        <Label htmlFor="monthly" className="block w-full text-center cursor-pointer rounded-full px-6 py-2 transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                        Monthly
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="annually" id="annually" className="peer sr-only" />
                        <Label htmlFor="annually" className="block w-full text-center cursor-pointer rounded-full px-6 py-2 transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                        Annually <span className="text-primary-foreground/70">(Save 2 months)</span>
                        </Label>
                    </div>
                </RadioGroup>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.keys(plans).map((planKey) => {
                    const plan = plans[planKey as PlanName];
                    const isPopular = plan.name === 'Unlimited';
                    return (
                        <Card key={plan.name} className={cn("flex flex-col rounded-xl", isPopular && "border-primary shadow-lg")}>
                            {isPopular && (
                                <div className="py-1 px-4 text-sm bg-primary text-primary-foreground rounded-t-xl text-center font-semibold flex items-center justify-center gap-2">
                                    <Sparkles className="h-4 w-4" /> Most Popular
                                </div>
                            )}
                            <CardHeader className="text-center">
                                <CardTitle className="text-3xl">{plan.name}</CardTitle>
                                <p className="text-4xl font-bold">{plan[billingCycle].price}<span className="text-sm font-normal text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></p>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-4">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <Check className="h-4 w-4 text-green-400" />
                                            </div>
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                               <PaystackButton plan={planKey as PlanName} billingCycle={billingCycle} />
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
            
            <div className="mt-12 text-center text-sm text-muted-foreground">
                <p>Payments are securely processed by Paystack. By subscribing, you agree to our <Link href="/terms-of-service" className="underline hover:text-foreground">Terms of Service</Link>.</p>
            </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
