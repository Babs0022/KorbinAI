
"use client";

import { CreditCard } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                     <Card className="w-full text-center mt-16 border-dashed">
                        <CardHeader>
                            <div className="mx-auto w-fit rounded-full bg-primary/10 p-4 mb-4">
                                <CreditCard className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-3xl">Billing is Coming Soon!</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">
                                We're preparing a simple and clear billing system for you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>Soon, you'll be able to manage your subscription and payment details right here.</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
}
