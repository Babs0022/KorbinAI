
"use client";

import { useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Footer } from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Palette, DownloadCloud, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-grow bg-gradient-to-br from-background via-indigo-50/30 to-mint-50/30 py-8">
        <Container>
          <h1 className="font-headline text-3xl font-bold text-foreground mb-8">Settings</h1>
          
          <div className="max-w-2xl mx-auto space-y-8">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5"/> Notifications</GlassCardTitle>
                <GlassCardDescription>Manage how you receive notifications from BrieflyAI.</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Receive updates about new features and important account activity.
                    </span>
                  </Label>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <Label htmlFor="promotional-emails" className="flex flex-col space-y-1">
                    <span>Promotional Emails</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Get occasional emails about special offers and tips.
                    </span>
                  </Label>
                  <Switch id="promotional-emails" />
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5"/> Appearance</GlassCardTitle>
                <GlassCardDescription>Customize the look and feel of BrieflyAI.</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select defaultValue="system">
                    <SelectTrigger id="theme" className="w-full mt-1">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </GlassCardContent>
            </GlassCard>
            
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5"/> Data Export</GlassCardTitle>
                <GlassCardDescription>Export your prompt history and account data.</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                 <Button variant="outline" className="w-full">Export All My Data</Button>
                 <p className="text-xs text-muted-foreground mt-2">You will receive an email with a download link when your export is ready.</p>
              </GlassCardContent>
            </GlassCard>

            <div className="text-center mt-8">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save All Settings</Button>
            </div>

          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
