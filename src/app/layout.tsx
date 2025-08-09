
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

const figtree = Figtree({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'KorbinAI',
  description: 'An AI assistant that actually gets it.',
  keywords: ['ai content creation', 'automation tools', 'ai copilot', 'content marketing', 'ai writing assistant'],
  authors: [{ name: 'KorbinAI Team', url: 'https://korbinai.com' }],
  creator: 'KorbinAI',
  publisher: 'KorbinAI',
  
  manifest: '/manifest.json',

  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/icon.png',
    },
  },
  
  openGraph: {
    title: 'KorbinAI',
    description: 'An AI assistant that actually gets it.',
    url: 'https://korbinai.com',
    siteName: 'KorbinAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KorbinAI - An AI assistant that actually gets it.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'KorbinAI',
    description: 'An AI assistant that actually gets it.',
    creator: '@korbinai',
    images: ['/og-image.png'],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  verification: {
    google: 'your-google-site-verification-code',
  },
  
  alternates: {
    canonical: 'https://korbinai.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={figtree.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={null}>
              <GoogleAnalytics />
            </Suspense>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
