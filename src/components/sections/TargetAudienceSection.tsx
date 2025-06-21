"use client";

import React from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Briefcase, Zap, GraduationCap, PenTool, Users, CheckCircle, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const audienceSegments = [
  {
    id: "founders",
    name: "Founders & Startups",
    icon: <Briefcase className="h-6 w-6 mr-2" />,
    valueProp: "Accelerate growth with compelling pitches, product descriptions, and strategic content.",
    benefits: ["Craft investor-ready narratives", "Define unique selling propositions", "Generate marketing copy quickly"],
  },
  {
    id: "marketers",
    name: "Marketers",
    icon: <Zap className="h-6 w-6 mr-2" />,
    valueProp: "Launch high-converting campaigns with optimized ad copy, emails, and social media content.",
    benefits: ["Boost engagement rates", "Personalize messaging at scale", "A/B test prompt variations"],
  },
  {
    id: "creators",
    name: "Creators & Writers",
    icon: <PenTool className="h-6 w-6 mr-2" />,
    valueProp: "Overcome writer's block and generate fresh ideas for articles, scripts, and creative projects.",
    benefits: ["Brainstorm unique concepts", "Develop detailed outlines", "Refine tone and style"],
  },
  {
    id: "students",
    name: "Students & Academics",
    icon: <GraduationCap className="h-6 w-6 mr-2" />,
    valueProp: "Enhance research, essays, and presentations with well-structured and insightful AI assistance.",
    benefits: ["Summarize complex information", "Generate research questions", "Improve clarity in writing"],
  },
  {
    id: "developers",
    name: "Developers",
    icon: <Code className="h-6 w-6 mr-2" />,
    valueProp: "Accelerate development cycles by generating robust boilerplate code, writing technical documentation, and debugging complex algorithms with precisely engineered prompts.",
    benefits: ["Leverage chain-of-thought for complex problem-solving", "Manage and version control prompts for different microservices", "Utilize parameter tuning for deterministic code output"],
  },
];

export function TargetAudienceSection() {
  return (
    <section id="solutions" className="py-16 md:py-24 bg-gradient-to-b from-background via-mint-50/5 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Solutions For Every Innovator
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            BrieflyAI empowers diverse users to harness the full potential of AI, effortlessly.
          </p>
        </div>

        <Tabs defaultValue={audienceSegments[0].id} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 h-auto p-1.5 bg-muted/50 rounded-lg">
            {audienceSegments.map((segment) => (
              <TabsTrigger 
                key={segment.id} 
                value={segment.id}
                className="flex-col sm:flex-row justify-center items-center px-2 py-2.5 text-xs sm:text-sm h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md whitespace-normal sm:whitespace-nowrap"
              >
                {segment.icon}
                <span className="mt-1 sm:mt-0 sm:ml-1">{segment.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {audienceSegments.map((segment) => (
            <TabsContent key={segment.id} value={segment.id} className="mt-8">
              <GlassCard className="overflow-hidden border-primary/20">
                <div className="p-6 md:p-8">
                  <h3 className="font-headline text-2xl font-semibold text-foreground mb-3">{segment.name}</h3>
                  <p className="text-muted-foreground mb-6 text-md leading-relaxed">{segment.valueProp}</p>
                  <ul className="space-y-2 mb-6">
                    {segment.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start text-sm">
                        <CheckCircle className="h-5 w-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/90">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                   <div className="mt-4">
                      <a href="/signup" className="text-primary hover:text-primary/80 font-semibold text-sm">
                        Learn more &rarr;
                      </a>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
          ))}
        </Tabs>
      </Container>
    </section>
  );
}
