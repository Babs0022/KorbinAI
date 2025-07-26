
"use client";

import Link from 'next/link';
import { Feather, Bolt, Image as ImageIcon, Code2, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import LogoSpinner from '@/components/shared/LogoSpinner';

const creationTools = [
  {
    id: 'feature-written-content',
    icon: Feather,
    title: 'Briefly for Creators',
    description: 'Generate high-quality blog posts, emails, social media updates, and more from a simple description.',
    href: '/written-content',
    badge: 'Write',
  },
  {
    id: 'feature-prompt-generator',
    icon: Bolt,
    title: 'Briefly for Prompters',
    description: 'Need to use another AI? Craft detailed, optimized prompts for any model or task to get the best results.',
    href: '/prompt-generator',
    badge: 'Optimize',
  },
  {
    id: 'feature-image-generator',
    icon: ImageIcon,
    title: 'Briefly for Artists',
    description: 'Create unique, stunning images and art from a text description. You can even provide your own images for context.',
    href: '/image-generator',
    badge: 'Create',
  },
  {
    id: 'feature-structured-data',
    icon: Code2,
    title: 'Briefly for Analysts',
    description: 'Generate structured data like JSON or CSV from a plain-English description, perfect for populating components.',
    href: '/structured-data',
    badge: 'Build',
  },
];

export default function CreationHubPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-full w-full items-center justify-center">
                    <LogoSpinner />
                </div>
            </DashboardLayout>
        );
    }

    const userFirstName = user?.displayName?.split(' ')?.[0];
    const welcomeMessage = userFirstName ? `Welcome back, ${userFirstName}. What are we building today?` : 'What are we building today?';

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold">The Creation Hub</h1>
                        <p className="text-lg text-muted-foreground">{welcomeMessage}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {creationTools.map(tool => (
                            <Link href={tool.href} key={tool.id} id={tool.id} className="group">
                                <Card className={cn(
                                    "flex h-full transform flex-col justify-between text-left transition-all duration-300 rounded-xl",
                                    "bg-secondary/30",
                                    "hover:-translate-y-1 hover:border-primary/50"
                                )}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="text-primary bg-primary/10 p-3 rounded-lg">
                                                <tool.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex items-center text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                                <span className="text-sm font-semibold">{tool.badge}</span>
                                                <ArrowRight className="ml-1 h-4 w-4" />
                                            </div>
                                        </div>
                                        <CardTitle className="pt-4 text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
                                            {tool.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>{tool.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}
