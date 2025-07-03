"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <main className="flex flex-1 flex-col p-4 md:p-8">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2 mb-10">
            Manage your application settings and preferences. (Functionality
            coming soon)
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    The app is currently in dark mode. Light mode is coming
                    soon.
                  </p>
                </div>
                <div>
                  <Switch defaultChecked={true} disabled id="theme" />
                </div>
              </div>
            </CardContent>

            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications from us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
