"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the event type for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}


export function InstallPwaButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: "App Installed!", description: "BrieflyAI has been added to your home screen." });
      } else {
        toast({ title: "Installation Cancelled", description: "You can install the app later from the header." });
      }
    } catch (error) {
        console.error('Error during PWA installation:', error);
        toast({ title: "Installation Failed", description: "Could not install the app.", variant: "destructive" });
    } finally {
        setInstallPrompt(null);
    }
  };

  if (!installPrompt) {
    return null;
  }

  return (
    <Button onClick={handleInstallClick} variant="outline" size="sm" className="hidden sm:inline-flex bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent hover:text-accent-foreground">
      <DownloadCloud className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
