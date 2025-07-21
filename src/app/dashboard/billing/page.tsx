
"use client";

import { useState } from "react";
import { Check, CreditCard, Sparkles, LoaderCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserSubscription } from "@/types/subscription";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePaystackPayment } from "react-paystack";
import { useSubscription } from "@/hooks/useSubscription";

const planDetails = {
    monthly: {
        name: "Pro Plan (Monthly)",
        planId: "pro",
        billingCycle: "monthly" as const,
        price: 2000, // in kobo/cents
        priceString: "$20",
        priceSuffix: "/ month",
        paystackPlanCode: "PLN_apm944j0mz7armb",
        features: [
            "Billed month-to-month",
            "Unlimited Written Content Generation",
            "Unlimited Prompt Generation",
            "Unlimited Image Generation",
            "Unlimited Structured Data Generation",
            "Access to All Future Tools",
            "Priority Support",
        ],
    },
    annually: {
        name: "Pro Plan (Annually)",
        planId: "pro",
        billingCycle: "annually" as const,
        price: 21600, // in kobo/cents
        priceString: "$216",
        priceSuffix: "/ year",
        paystackPlanCode: "PLN_up61lgvt7wozomg",
        features: [
            "Billed annually (Save 10%)",
            "Unlimited Written Content Generation",
            "Unlimited Prompt Generation",
            "Unlimited Image Generation",
            "Unlimited Structured Data Generation",
            "Access to All Future Tools",
            "Priority Support",
        ],
    },
};

const CurrentPlanCard = ({ subscription }: { subscription: UserSubscription }) => (
    <Card className="border-primary bg-primary/5">
        <CardHeader>
            <CardTitle>Your Current Plan</CardTitle>
            <CardDescription>You have full access to all features.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <p className="font-semibold text-xl">
                    BrieflyAI Pro <Badge variant="outline" className="ml-2 align-middle capitalize">{subscription.billingCycle}</Badge>
                </p>
                {subscription.currentPeriodEnd && (
                    <p className="text-muted-foreground">
                        Your subscription will renew on {format(subscription.currentPeriodEnd, 'PPP')}.
                    </p>
                )}
            </div>
        </CardContent>
        <CardFooter>
             <p className="text-xs text-muted-foreground">To manage your subscription, please contact support.</p>
        </CardFooter>
    </Card>
);

const PaystackButton = ({ plan, billingCycle }: { plan: 'pro', billingCycle: 'monthly' | 'annually' }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { price, paystackPlanCode } = planDetails[billingCycle];

    const config = {
        reference: new Date().getTime().toString(),
        email: user?.email || '',
        amount: price,
        plan: paystackPlanCode,
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        metadata: {
            user_id: user?.uid,
            plan_id: plan,
            billing_cycle: billingCycle,
        }
    };

    const initializePayment = usePaystackPayment(config);

    const onSuccess = () => {
        toast({
            title: "Payment Successful!",
            description: "Your subscription is now active. Refreshing...",
        });
        setTimeout(() => window.location.reload(), 2000);
    };

    const onClose = () => {
        toast({
            title: "Payment Closed",
            description: "The payment window was closed.",
            variant: "destructive"
        });
    };
    
    return (
         <Button size="lg" className="w-full text-lg" onClick={() => initializePayment({onSuccess, onClose})}>
            <CreditCard className="mr-2 h-5 w-5" />
            Upgrade to Pro
        </Button>
    )
}


export default function BillingPage() {
    const { user, loading: authLoading } = useAuth();
    const { subscription, isLoading: subscriptionLoading } = useSubscription();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
    
    const isLoading = authLoading || subscriptionLoading;
    const selectedPlan = planDetails[billingCycle];
    
    if (isLoading) {
        return (
            <DashboardLayout>
                <main className="flex-1 p-4 md:p-8">
                     <div className="max-w-md mx-auto">
                        <Skeleton className="h-[500px] w-full" />
                    </div>
                </main>
            </DashboardLayout>
        );
    }
    
    if (subscription && subscription.status === 'active') {
         return (
             <DashboardLayout>
                <main className="flex-1 p-4 md:p-8">
                    <div className="max-w-md mx-auto">
                        <CurrentPlanCard subscription={subscription} />
                    </div>
                </main>
            </DashboardLayout>
         )
    }

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-md mx-auto">
                     <Card className="w-full text-center shadow-lg">
                        <CardHeader className="pb-4">
                            <div className="mx-auto w-fit rounded-full bg-primary/10 p-4 mb-4">
                                <Sparkles className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-3xl">BrieflyAI Pro</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">
                                Unlock all features and supercharge your creativity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="flex items-center justify-center gap-4">
                                <Label htmlFor="billing-cycle" className={billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}>Monthly</Label>
                                <Switch 
                                    id="billing-cycle"
                                    checked={billingCycle === 'annually'}
                                    onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
                                />
                                <Label htmlFor="billing-cycle" className={billingCycle === 'annually' ? 'text-foreground' : 'text-muted-foreground'}>
                                    Annually <Badge variant="secondary" className="ml-1 align-middle">Save 10%</Badge>
                                </Label>
                            </div>

                            <p className="text-5xl font-bold">
                                {selectedPlan.priceString}
                                <span className="text-lg font-normal text-muted-foreground">{selectedPlan.priceSuffix}</span>
                            </p>
                            <ul className="space-y-3 text-left">
                                {selectedPlan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-primary" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <PaystackButton plan="pro" billingCycle={billingCycle} />
                        </CardContent>
                         <CardFooter>
                            <p className="text-xs text-muted-foreground mx-auto">
                                Payments are securely processed by Paystack. You can cancel anytime.
                            </p>
                         </CardFooter>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
}
