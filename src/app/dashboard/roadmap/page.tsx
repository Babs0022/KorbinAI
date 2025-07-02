
"use client";

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BarChartHorizontal, TestTubes, CopyPlus, Plug, Rocket, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Badge } from '@/components/ui/badge';

interface RoadmapItem {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'Launched' | 'In Progress' | 'Planned';
}

const launchedFeatures: RoadmapItem[] = [
  {
    title: "Team Collaboration Hub",
    description: "Securely share, manage, and discuss prompts in a real-time collaborative workspace with role-based access for admins, editors, and viewers.",
    icon: Users,
    status: "Launched",
  },
  {
    title: "Analytics Dashboard",
    description: "Track your prompt usage, performance trends, and average quality scores over time to gain valuable insights.",
    icon: BarChartHorizontal,
    status: "Launched",
  },
  {
    title: "A/B Model Testing",
    description: "Compare prompt variations across multiple AI models side-by-side to find the most effective version for your specific needs.",
    icon: TestTubes,
    status: "Launched",
  }
];

const nextFeatures: RoadmapItem[] = [
    {
        title: "Advanced Analytics & Cost Tracking",
        description: "An enhanced dashboard to monitor prompt API costs per user/prompt and track overall spending to optimize your budget.",
        icon: BarChartHorizontal,
        status: "In Progress",
    },
    {
        title: "Prompt Templating",
        description: "Create, save, and share reusable prompt templates across your team to streamline creation, ensure consistency, and boost productivity.",
        icon: CopyPlus,
        status: "Planned",
    },
    {
        title: "Platform Integrations",
        description: "Seamlessly connect BrieflyAI with the tools you already use, starting with popular platforms like Figma, Canva, and more.",
        icon: Plug,
        status: "Planned",
    },
];


const RoadmapStatusBadge = ({ status }: { status: RoadmapItem['status'] }) => {
  const statusClasses = {
    'Launched': 'bg-green-500/10 text-green-600 border-green-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'Planned': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };
  return <Badge variant="outline" className={`text-xs ${statusClasses[status]}`}>{status}</Badge>;
};

export default function RoadmapPage() {
  return (
    <DashboardLayout>
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
          
          <GlassCard className="mb-8 text-center">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl flex items-center justify-center">
                <Rocket className="mr-3 h-8 w-8 text-primary" />
                Our Product Roadmap
              </GlassCardTitle>
              <p className="mt-2 text-lg max-w-3xl mx-auto text-muted-foreground">
                Our vision for BrieflyAI is to build a comprehensive, enterprise-grade platform for prompt engineering. Here’s a look at what we’ve built and what’s coming next.
              </p>
            </GlassCardHeader>
          </GlassCard>
          
          <section className="mb-12">
            <h2 className="font-headline text-2xl font-semibold text-foreground mb-6 flex items-center">
              <CheckCircle className="mr-3 h-6 w-6 text-accent" />
              Launched & Live
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {launchedFeatures.map((item) => {
                const IconComponent = item.icon;
                return (
                  <GlassCard key={item.title} className="flex flex-col h-full border-accent/20">
                    <GlassCardHeader>
                      <div className="flex justify-between items-start">
                         <div className="p-2 rounded-lg mr-3 bg-accent/10 text-accent flex-shrink-0">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <RoadmapStatusBadge status={item.status} />
                      </div>
                      <h3 className="text-lg font-headline mt-2 text-foreground">{item.title}</h3>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </GlassCardContent>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">What We&apos;re Building Next</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nextFeatures.map((item) => {
                const IconComponent = item.icon;
                return (
                  <GlassCard key={item.title} className="flex flex-col h-full">
                    <GlassCardHeader>
                      <div className="flex justify-between items-start">
                         <div className="p-2 rounded-lg mr-3 bg-primary/10 text-primary flex-shrink-0">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <RoadmapStatusBadge status={item.status} />
                      </div>
                      <h3 className="text-lg font-headline mt-2 text-foreground">{item.title}</h3>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </GlassCardContent>
                  </GlassCard>
                );
              })}
            </div>
          </section>

        </Container>
      </main>
    </DashboardLayout>
  );
}
