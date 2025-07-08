
"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePaystackPayment } from "react-paystack";
import { useToast } from "@/hooks/use-toast";

// These plan codes MUST match the ones in your Paystack dashboard and backend function.
const clientPlanDetails = {
  premium: {
    name: "Premium",
    monthly: { price: 1500, code: 'PLN_c7d9pwc77ezn3a8' }, // 15 USD in cents
    annually: { price: 15000, code: 'PLN_ipOrfr3kbnjdOoh' }, // 150 USD in cents
    features: [
      "500 generations/month",
      "Access to standard AI models",
      "All creation tools",
      "Standard support"
    ],
  },
  unlimited: {
    name: "Unlimited",
    monthly: { price: 3000, code: 'PLN_kb83pnnocije9fz' }, // 30 USD in cents
    annually: { price: 30000, code: 'PLN_a90hrxjuodtw4ia' }, // 300 USD in cents
    features: [
      "Unlimited generations",
      "Access to advanced AI models",
      "All creation tools",
      "Priority support",
      "Early access to new features"
    ],
  },
};

const PlanCard = ({ plan, isAnnual, isCurrentPlan = false, user }: { plan: typeof clientPlanDetails.premium, isAnnual: boolean, isCurrentPlan?: boolean, user: any }) => {
  const { toast } = useToast();
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
  const selectedPlan = isAnnual ? plan.annually : plan.monthly;
  const price = selectedPlan.price / 100;

  const config = {
      reference: new Date().getTime().toString(),
      email: user?.email || '',
      amount: selectedPlan.price,
      plan: selectedPlan.code,
      publicKey: publicKey,
      currency: 'USD',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
      toast({
          title: "Payment Successful!",
          description: `Your subscription is being activated. Ref: ${reference.reference}`,
      });
  };

  const onClose = () => {
      // User closed the popup
  };

  const handleUpgrade = () => {
      if (!user) {
          toast({ variant: 'destructive', title: 'Not Signed In', description: 'You must be signed in to upgrade your plan.' });
          return;
      }
      if (!publicKey) {
          console.error("Paystack public key not configured.");
          toast({ variant: 'destructive', title: 'Configuration Error', description: 'The payment system is not properly configured.' });
          return;
      }
      initializePayment(onSuccess, onClose);
  };
  
  return (
    <Card className={cn("flex flex-col", plan.name === 'Unlimited' && 'border-primary shadow-lg')}>
        {plan.name === 'Unlimited' && (
            <div className="py-1 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold rounded-t-lg">
                Most Popular
            </div>
        )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
            {plan.name} {plan.name === 'Unlimited' && <Star className="text-primary fill-primary" />}
        </CardTitle>
        <CardDescription>
          <span className="text-4xl font-bold text-foreground">${price}</span>
          <span className="text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <ul className="space-y-3">
          {plan.features.map(feature => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full text-lg" disabled={isCurrentPlan} onClick={handleUpgrade}>
          {isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`}
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function BillingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { user } = useAuth();
  
  // TODO: Fetch user's current subscription status from Firestore
  // and use it to set `isCurrentPlan` on the appropriate PlanCard.

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold md:text-5xl">Our Pricing Plans</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you and unlock the full power of BrieflyAI.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 my-10">
            <Label htmlFor="billing-cycle">Monthly</Label>
            <Switch
              id="billing-cycle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-cycle">
                Annual <span className="text-green-500 font-semibold">(Save 16%)</span>
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PlanCard plan={clientPlanDetails.premium} isAnnual={isAnnual} user={user} />
            <PlanCard plan={clientPlanDetails.unlimited} isAnnual={isAnnual} user={user} />
          </div>

          <div className="mt-12 text-center text-muted-foreground">
            <p>All payments are securely processed. You can change your plan or cancel at any time.</p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
