
"use client";

import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <SidebarProvider>
        <Sidebar>
            <DashboardHeader variant="sidebar" />
        </Sidebar>
        <SidebarInset>
            <DashboardHeader variant="main" />
            <main className="flex flex-1 flex-col p-4 md:p-8">
                <div className="w-full max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2 mb-10">
                    Manage your application settings and preferences. (Functionality
                    coming soon)
                </p>

                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">Notifications</h2>
                    <p className="text-muted-foreground">
                        Manage how you receive notifications from us.
                    </p>
                    <Separator />
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <Label htmlFor="product-updates">Product Updates</Label>
                        <p className="text-xs text-muted-foreground">
                            Receive emails about new features and updates.
                        </p>
                        </div>
                        <Switch id="product-updates" disabled />
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <Label htmlFor="weekly-digest">Weekly Digest</Label>
                        <p className="text-xs text-muted-foreground">
                            Get a summary of your activity once a week.
                        </p>
                        </div>
                        <Switch id="weekly-digest" disabled />
                    </div>
                </div>
                </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
