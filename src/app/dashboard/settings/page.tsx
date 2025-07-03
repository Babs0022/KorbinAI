"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <main className="flex flex-1 flex-col p-4 md:p-8">
        <div className="w-full max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2 mb-10">Manage your application settings.</p>
            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>This page is currently under construction.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>More settings and preferences will be available here in a future update.</p>
                </CardContent>
            </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
