
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
      const storedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (storedTheme === 'dark' || (storedTheme === 'system' && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(); // Apply on initial load

    // Listen for changes in system preference if theme is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('theme') === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key === 'theme') {
        applyTheme();
      }
    });
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', (event) => {
        if (event.key === 'theme') {
          applyTheme();
        }
      });
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Metadata can be defined in page.tsx or child layouts for more specificity */}
        <title>BrieflyAI - Optimize Your Prompts</title>
        <meta name="description" content="AI-powered prompt optimization for founders, marketers, and students. Achieve clarity and impact with BrieflyAI." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
