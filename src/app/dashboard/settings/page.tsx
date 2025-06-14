
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bell, Palette, DownloadCloud, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { PromptHistory } from '@/components/dashboard/PromptHistoryItem';
import Link from 'next/link'; // Added Link import

interface UserSettings {
  emailNotifications: boolean;
  promotionalEmails: boolean;
  theme: string;
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  promotionalEmails: false,
  theme: 'system',
};

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingSettings(false);
      setSettings(defaultSettings); // Reset to defaults if user logs out
      return;
    }
    setIsLoadingSettings(true);
    try {
      const settingsDocRef = doc(db, `userSettings/${currentUser.uid}`);
      const docSnap = await getDoc(settingsDocRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as UserSettings);
      } else {
        // No settings saved yet, use defaults (and optionally save them)
        setSettings(defaultSettings);
        // await setDoc(settingsDocRef, defaultSettings); // Optionally save defaults immediately
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({ title: "Error Loading Settings", description: "Could not load your saved settings. Using defaults.", variant: "destructive" });
      setSettings(defaultSettings);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      fetchSettings();
    }
  }, [currentUser, authLoading, router, fetchSettings]);

  const handleSettingChange = (key: keyof UserSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to save settings.", variant: "destructive" });
      return;
    }
    setIsSavingSettings(true);
    try {
      const settingsDocRef = doc(db, `userSettings/${currentUser.uid}`);
      await setDoc(settingsDocRef, settings, { merge: true });
      toast({ title: "Settings Saved", description: "Your preferences have been updated." });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Save Failed", description: "Could not save your settings. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportData = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to export your data.", variant: "destructive" });
      return;
    }
    setIsExportingData(true);
    try {
      const q = query(collection(db, `users/${currentUser.uid}/promptHistory`), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const firestorePrompts = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let timestampStr = data.timestamp;
        if (data.timestamp instanceof Timestamp) {
          timestampStr = data.timestamp.toDate().toISOString();
        } else if (typeof data.timestamp === 'object' && data.timestamp.seconds) {
          timestampStr = new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds).toDate().toISOString();
        }
        return {
          id: docSnap.id,
          goal: data.goal,
          optimizedPrompt: data.optimizedPrompt,
          timestamp: timestampStr,
          tags: data.tags || [],
        } as PromptHistory;
      });

      if (firestorePrompts.length === 0) {
        toast({ title: "No Data to Export", description: "You don't have any prompt history to export yet.", variant: "default"});
        setIsExportingData(false);
        return;
      }

      const jsonData = JSON.stringify(firestorePrompts, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `brieflyai_prompt_history_${currentUser.uid}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Data Exported", description: "Your prompt history has been downloaded as a JSON file." });

    } catch (error) {
      console.error("Error exporting data:", error);
      toast({ title: "Export Failed", description: "Could not export your prompt history. Please try again.", variant: "destructive" });
    } finally {
      setIsExportingData(false);
    }
  };


  if (authLoading || isLoadingSettings || (!currentUser && !authLoading)) {
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
          <div className="mb-6">
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
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
                  <Switch 
                    id="email-notifications" 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    aria-label="Toggle email notifications"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <Label htmlFor="promotional-emails" className="flex flex-col space-y-1">
                    <span>Promotional Emails</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Get occasional emails about special offers and tips.
                    </span>
                  </Label>
                  <Switch 
                    id="promotional-emails" 
                    checked={settings.promotionalEmails}
                    onCheckedChange={(checked) => handleSettingChange('promotionalEmails', checked)}
                    aria-label="Toggle promotional emails"
                  />
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
                  <Select 
                    value={settings.theme} 
                    onValueChange={(value) => handleSettingChange('theme', value)}
                  >
                    <SelectTrigger id="theme" className="w-full mt-1" aria-label="Select theme">
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
                <GlassCardDescription>Export your prompt history.</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                 <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleExportData}
                    disabled={isExportingData}
                  >
                    {isExportingData ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
                    ) : (
                       <> <DownloadCloud className="mr-2 h-4 w-4" /> Export Prompt History</>
                    )}
                 </Button>
                 <p className="text-xs text-muted-foreground mt-2">Download your prompt history as a JSON file.</p>
              </GlassCardContent>
            </GlassCard>

            <div className="text-center mt-8">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90" 
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || isLoadingSettings}
                >
                  {isSavingSettings ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save All Settings</>
                  )}
                </Button>
            </div>

          </div>
        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}

    
