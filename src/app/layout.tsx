
"use client"; // Add this to use useEffect for client-side theme application

import type { Metadata } from 'next'; // Keep this for server-side metadata
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import React, { useEffect } from 'react'; // Import useEffect

// Note: Metadata export is for server components. We can't directly set metadata title here if RootLayout is client.
// However, Next.js handles merging metadata from parent layouts. For simplicity, we'll keep it.
// Consider moving dynamic title updates to specific page components if needed.
// export const metadata: Metadata = {
// title: 'BrieflyAI - Optimize Your Prompts',
// description: 'AI-powered prompt optimization for founders, marketers, and students. Achieve clarity and impact with BrieflyAI.',
// };


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const applyTheme = () => {
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('[Layout] applyTheme called. Stored theme:', storedTheme, 'System prefers dark:', systemPrefersDark);

      let finalThemeDecision: 'light' | 'dark';

      if (storedTheme === 'dark') {
        finalThemeDecision = 'dark';
      } else if (storedTheme === 'light') {
        finalThemeDecision = 'light';
      } else { // 'system' or null (treat null as system default)
        finalThemeDecision = systemPrefersDark ? 'dark' : 'light';
      }
      
      console.log('[Layout] Final theme decision:', finalThemeDecision);

      if (finalThemeDecision === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('[Layout] Applied dark theme.');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('[Layout] Applied light theme (removed .dark class).');
      }
    };

    applyTheme(); // Apply on initial load

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      console.log('[Layout] OS color scheme changed.');
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'system' || !storedTheme) { // Also re-apply if theme isn't explicitly set (treat as system)
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    // Listen for changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        console.log('[Layout] Theme changed in another tab/window via localStorage.');
        applyTheme();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Metadata can be defined in page.tsx or child layouts for more specificity */}
        <title>BrieflyAI - Optimize Your Prompts</title>
        <meta name="description" content="AI-powered prompt optimization for founders, marketers, and students. Achieve clarity and impact with BrieflyAI." />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4B0082" />
      </head>
      <body className="font-body" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
