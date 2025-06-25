
"use client";

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, ShieldCheck, Share2, Star, Construction } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

interface RoadmapItem {
  title: string;
  description: string;
  icon: React.ElementType;
}

const collaborationRoadmap: RoadmapItem[] = [
  {
    title: "Team Workspaces",
    description: "Create a central hub for your team. All members can access shared resources and prompts within a dedicated workspace.",
    icon: Users,
  },
  {
    title: "Shared Prompt Vaults",
    description: "Collaborate on your best prompts. Share, edit, and organize prompts collectively to ensure consistency and quality across your team.",
    icon: Share2,
  },
  {
    title: "Roles & Permissions",
    description: "Assign roles like 'Admin', 'Editor', or 'Viewer' to manage access and maintain control over your team's prompts and data.",
    icon: ShieldCheck,
  },
  {
    title: "Team Analytics",
    description: "Gain insights into your team's prompt usage. See which prompts are most effective and track performance collectively.",
    icon: Star,
  },
];

export default function CollaborationPage() {
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
          
          <GlassCard className="mb-8">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary" />
                Collaboration & Team Features
              </GlassCardTitle>
              <GlassCardDescription className="mt-2 text-lg">
                The next frontier for BrieflyAI is empowering teams. We're building a suite of features to help you and your colleagues create, share, and manage prompts together.
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>

          <section>
            <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">Our Roadmap to Collaboration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collaborationRoadmap.map((item) => {
                const IconComponent = item.icon;
                return (
                  <GlassCard key={item.title} className="flex flex-col h-full">
                    <GlassCardHeader>
                      <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg mr-3 bg-primary/10 text-primary">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <GlassCardTitle className="text-lg font-headline">{item.title}</GlassCardTitle>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </GlassCardContent>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          <GlassCard className="mt-8 border-amber-500/30 bg-amber-500/10">
            <GlassCardContent className="p-6">
              <div className="flex items-center">
                <Construction className="h-8 w-8 text-amber-600 mr-4" />
                <div>
                  <h4 className="font-semibold text-foreground">Coming Soon!</h4>
                  <p className="text-sm text-muted-foreground">
                    These features are currently under active development. Stay tuned for updates!
                  </p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

        </Container>
      </main>
      <MinimalFooter />
    </div>
  );
}
