
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, BarChartHorizontal, TestTubes, CopyPlus, Plug, Code, FileJson, LayoutDashboard, Rocket } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Badge } from '@/components/ui/badge';

interface RoadmapItem {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'In Progress' | 'Planned' | 'Future';
}

interface IntegrationItem {
    name: string;
    description: string;
    icon: React.ElementType;
}

const roadmapPhases: { phase: string; title: string; items: RoadmapItem[] }[] = [
  {
    phase: "Phase 1: Team Foundations",
    title: "Current Focus: Building for Collaboration",
    items: [
      {
        title: "Role-Based Access Control (RBAC)",
        description: "Introduce tiered permission levels for teams: Admin, Editor, and Viewer to manage access to shared prompts and workspaces.",
        icon: ShieldCheck,
        status: "In Progress",
      },
      {
        title: "Prompt Templating & Sharing",
        description: "Create, save, and share prompt templates across your team to streamline creation, ensure consistency, and boost productivity.",
        icon: CopyPlus,
        status: "In Progress",
      },
    ],
  },
  {
    phase: "Phase 2: Analytics & Optimization",
    title: "Next Up: Data-Driven Insights",
    items: [
      {
        title: "Usage Analytics & Cost Tracking",
        description: "A comprehensive dashboard to monitor prompt usage, API costs per user/prompt, and track overall spending to optimize your budget.",
        icon: BarChartHorizontal,
        status: "Planned",
      },
      {
        title: "Automated A/B Testing",
        description: "Systematically test variations of your prompts to automatically identify and deploy the highest-performing versions.",
        icon: TestTubes,
        status: "Planned",
      },
    ],
  },
];

const futureFeatures: { title: string; items: RoadmapItem[] } = {
  title: "Future: Enterprise & Ecosystem",
  items: [
     {
        title: "Advanced API Access",
        description: "Enable custom integrations and automated workflows by providing robust API access to your prompt data and our core features.",
        icon: Code,
        status: "Future",
    },
    {
        title: "Platform Integrations",
        description: "Seamlessly connect BrieflyAI with the tools you already use, enhancing your existing workflows.",
        icon: Plug,
        status: "Future",
    },
  ]
};

const FigmaIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"><title>Figma</title><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM8 18c1.657 0 3-1.343 3-3v-3c0-1.657-1.343-3-3-3s-3 1.343-3 3v3c0 1.657 1.343 3 3 3zm0-9a3 3 0 00-3 3v.031A3.001 3.001 0 018 9h3V6H8a3 3 0 00-3 3zm3 3a3 3 0 00-3 3v3a3 3 0 003 3h.031a3 3 0 010-6H11zm3-3a3 3 0 013-3h3v3h-3a3 3 0 01-3-3zm3 0h.031a3 3 0 010 6H14a3 3 0 01-3-3v-3a3 3 0 013-3z" fill="#F24E1E"/></svg>;
const CanvaIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"><title>Canva</title><path d="M12 0C5.373 0 0 5.373 0 12s5.373 24 12 24 12-5.373 12-12S18.373 0 12 0zm0 6.37c3.11 0 5.63 2.52 5.63 5.63s-2.52 5.63-5.63 5.63-5.63-2.52-5.63-5.63 2.52-5.63 5.63-5.63z" fill="#00C4CC"/></svg>;
const FramerIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"><title>Framer</title><path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" fill="#0055FF"/></svg>;
const ClaudeIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"><title>Anthropic</title><path d="M18.333 3.61a1.04 1.04 0 00-1.01.03l-4.22 2.6a1 1 0 00-.5.87v5.39a1 1 0 00.5.87l4.22 2.6a1 1 0 001.01.03l4.22-2.6a1 1 0 00.5-.87V7.11a1 1 0 00-.5-.87zM8.333 9.61a1.04 1.04 0 00-1.01.03l-4.22 2.6a1 1 0 00-.5.87v5.39a1 1 0 00.5.87l4.22 2.6a1 1 0 001.01.03l4.22-2.6a1 1 0 00.5-.87v-5.39a1 1 0 00-.5-.87z" fill="#D97706"/></svg>;

const integrations: IntegrationItem[] = [
    { name: "Figma", description: "Generate UI copy and design ideas directly within your Figma files.", icon: FigmaIcon },
    { name: "Canva", description: "Create social media graphics and presentations with AI-powered text content.", icon: CanvaIcon },
    { name: "Framer", description: "Populate website components and landing pages with perfectly crafted content.", icon: FramerIcon },
    { name: "Claude API", description: "Leverage Claude's strengths directly, with prompts optimized for its unique capabilities.", icon: ClaudeIcon },
];

const reportingFormats = [
  { name: 'Visual Dashboards', description: 'Interactive charts and graphs for at-a-glance insights on usage, costs, and performance.', icon: LayoutDashboard },
  { name: 'Raw Data Exports', description: 'Download your complete prompt history and analytics data in CSV or JSON format for custom analysis.', icon: FileJson },
  { name: 'API Access', description: 'Integrate BrieflyAI data into your own business intelligence tools and custom applications.', icon: Code },
];

const RoadmapStatusBadge = ({ status }: { status: RoadmapItem['status'] }) => {
  const statusClasses = {
    'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'Planned': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'Future': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };
  return <Badge variant="outline" className={`text-xs ${statusClasses[status]}`}>{status}</Badge>;
};

export default function RoadmapPage() {
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
          
          <GlassCard className="mb-8 text-center">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl flex items-center justify-center">
                <Rocket className="mr-3 h-8 w-8 text-primary" />
                Our Product Roadmap
              </GlassCardTitle>
              <GlassCardDescription className="mt-2 text-lg max-w-3xl mx-auto">
                Our vision for BrieflyAI is to build a comprehensive, enterprise-grade platform for prompt engineering. Here’s a look at what we’re building to support individuals, teams, and organizations.
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>
          
          {roadmapPhases.map(phase => (
              <section key={phase.phase} className="mb-12">
                <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">{phase.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {phase.items.map((item) => {
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
                          <GlassCardTitle className="text-lg font-headline mt-2">{item.title}</GlassCardTitle>
                        </GlassCardHeader>
                        <GlassCardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </GlassCardContent>
                      </GlassCard>
                    );
                  })}
                </div>
              </section>
          ))}
          
          <section className="mb-12">
              <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">{futureFeatures.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {futureFeatures.items.map((item) => {
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
                            <GlassCardTitle className="text-lg font-headline mt-2">{item.title}</GlassCardTitle>
                        </GlassCardHeader>
                        <GlassCardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </GlassCardContent>
                    </GlassCard>
                  );
                })}
              </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section>
              <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">Integration Strategy</h2>
              <GlassCard className="h-full">
                <GlassCardContent className="p-6">
                  <p className="text-muted-foreground mb-6">Our goal is to embed BrieflyAI into your favorite creative and development tools to enhance your existing workflows.</p>
                  <div className="space-y-4">
                    {integrations.map(item => {
                        const IconComponent = item.icon;
                        return (
                            <div key={item.name} className="flex items-start gap-4">
                                <IconComponent />
                                <div>
                                    <h4 className="font-semibold text-foreground">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                        )
                    })}
                  </div>
                </GlassCardContent>
              </GlassCard>
            </section>
            
            <section>
              <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">Reporting & Data Access</h2>
               <GlassCard className="h-full">
                <GlassCardContent className="p-6">
                    <p className="text-muted-foreground mb-6">We will provide flexible reporting options to meet the needs of every customer tier.</p>
                    <div className="space-y-4">
                        {reportingFormats.map(item => {
                            const IconComponent = item.icon;
                            return (
                                <div key={item.name} className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><IconComponent className="h-5 w-5" /></div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </GlassCardContent>
              </GlassCard>
            </section>
          </div>

        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
