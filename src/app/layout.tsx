
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

const figtree = Figtree({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BrieflyAI - AI-Powered Content Creation and Automation',
  description: 'BrieflyAI is an AI-powered platform for content creation, automation, and optimization. Boost your productivity with our suite of tools for writing, SEO, and more.',
  keywords: ['ai content creation', 'automation tools', 'seo optimization', 'content marketing', 'ai writing assistant'],
  authors: [{ name: 'BrieflyAI Team', url: 'https://brieflyai.xyz' }],
  creator: 'BrieflyAI',
  publisher: 'BrieflyAI',
  
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
    title: 'BrieflyAI - AI-Powered Content Creation and Automation',
    description: 'Boost your productivity with BrieflyAI, an AI-powered platform for content creation, automation, and SEO optimization.',
    url: 'https://brieflyai.xyz',
    siteName: 'BrieflyAI',
    images: [
      {
        url: 'https://brieflyai.xyz/og-image.png', // Update with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'BrieflyAI - AI-Powered Content Creation and Automation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'BrieflyAI - AI-Powered Content Creation and Automation',
    description: 'Boost your productivity with BrieflyAI, an AI-powered platform for content creation, automation, and SEO optimization.',
    creator: '@brieflyai', // Update with your Twitter handle
    images: ['https://brieflyai.xyz/og-image.png'], // Update with your actual OG image URL
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
    google: 'your-google-site-verification-code', // Update with your verification code
  },
  
  alternates: {
    canonical: 'https://brieflyai.xyz',
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
            <GoogleAnalytics />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
