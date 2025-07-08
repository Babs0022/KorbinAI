"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function BillingPage() {
  return (
    <DashboardLayout>
      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-fit rounded-full bg-secondary p-4">
              <Construction className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">
              Billing Temporarily Unavailable
            </CardTitle>
            <CardDescription>
              We are currently performing maintenance on our billing system.
              Please check back later.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </DashboardLayout>
  );
}
