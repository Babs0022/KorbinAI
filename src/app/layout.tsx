
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppFonts } from '@/components/shared/AppFonts';

export const metadata: Metadata = {
  title: 'BrieflyAI - Optimize Your Prompts',
  description: 'AI-powered prompt optimization for founders, marketers, and students. Achieve clarity and impact with BrieflyAI.',
  manifest: '/manifest.json',
  themeColor: '#4B0082', // Set to primary color for better PWA themeing
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <AppFonts />
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
