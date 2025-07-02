
"use client";

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, School, BookOpen, Lightbulb, CheckSquare, Users, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

interface AcademyTopic {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string; 
}

const keyTopics: AcademyTopic[] = [
  {
    title: "Understanding Prompt Structure",
    description: "Learn the fundamental components of a well-structured prompt for better AI understanding.",
    icon: BookOpen,
    href: "/dashboard/academy/understanding-prompt-structure",
  },
  {
    title: "The Art of Specificity",
    description: "Discover how providing clear, concise, and specific details can dramatically improve AI output.",
    icon: Lightbulb,
    href: "/dashboard/academy/art-of-specificity",
  },
  {
    title: "Crafting Effective Personas",
    description: "Explore techniques for assigning roles to your AI to guide its tone, style, and knowledge base.",
    icon: Users,
    href: "/dashboard/academy/crafting-personas",
  },
  {
    title: "Iterative Prompt Refinement",
    description: "Master the process of testing and tweaking your prompts to achieve optimal results.",
    icon: Settings2,
    href: "/dashboard/academy/iterative-refinement",
  },
];

export default function AcademyPage() {
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
          
          <GlassCard className="mb-8">
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-3xl flex items-center">
                <School className="mr-3 h-8 w-8 text-primary" />
                BrieflyAI Prompt Academy
              </GlassCardTitle>
              <GlassCardDescription className="mt-2 text-lg">
                Welcome to the Prompt Academy! Here you&apos;ll find resources, tutorials, and best practices to help you master the art and science of crafting perfect AI prompts.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-muted-foreground">
                Effective prompting is key to unlocking the full potential of AI models. Our goal is to empower you with the knowledge and skills to create prompts that deliver precise, relevant, and high-quality results every time.
              </p>
            </GlassCardContent>
          </GlassCard>

          <section className="mb-8">
            <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">Key Topics & Learning Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {keyTopics.map((topic) => {
                const IconComponent = topic.icon;
                return (
                  <GlassCard key={topic.title} className="flex flex-col h-full hover:shadow-xl transition-shadow">
                    <GlassCardHeader>
                      <div className="flex items-center mb-3">
                        <div className="p-2 rounded-lg mr-3 bg-primary/10 text-primary">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <GlassCardTitle className="text-lg font-headline">{topic.title}</GlassCardTitle>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent className="flex-grow">
                      <GlassCardDescription className="text-sm">
                        {topic.description}
                      </GlassCardDescription>
                    </GlassCardContent>
                    <div className="p-4 pt-2 mt-auto">
                       <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={topic.href}>Learn More</Link>
                       </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="font-headline text-2xl flex items-center">
                <CheckSquare className="mr-3 h-7 w-7 text-primary" />
                Example Prompts & Best Practices
              </GlassCardTitle>
               <GlassCardDescription className="mt-2">
                Illustrative examples and actionable tips to guide your prompt engineering.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-md text-foreground">Example: Improving a Vague Prompt</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Before:</strong> "Write about dogs."
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>After:</strong> "Write a 500-word informative blog post about the benefits of daily walks for a golden retriever's physical and mental health. Target audience is new dog owners. Include at least three specific benefits and a friendly, encouraging tone."
                  </p>
                </div>
                 <div>
                  <h4 className="font-semibold text-md text-foreground">General Do&apos;s and Don&apos;ts</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                    <li><strong>Do:</strong> Be specific and provide context.</li>
                    <li><strong>Do:</strong> Define the desired output format.</li>
                    <li><strong>Don&apos;t:</strong> Use ambiguous language.</li>
                    <li><strong>Don&apos;t:</strong> Assume the AI knows your unstated intentions.</li>
                  </ul>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

        </Container>
      </main>
    </DashboardLayout>
  );
}
