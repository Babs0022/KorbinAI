
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { MousePointerClick, ListChecks, FileText, Wand2, ArrowRight } from 'lucide-react';
import React from 'react';

const steps = [
  {
    icon: <MousePointerClick className="h-10 w-10 text-primary" />,
    title: '1. Describe Your Vision',
    description: 'Start with a simple description of what you want to build or create.',
  },
  {
    icon: <ListChecks className="h-10 w-10 text-primary" />,
    title: '2. Clarify Key Details',
    description: 'Answer a few targeted questions to define features, style, and functionality.',
  },
  {
    icon: <FileText className="h-10 w-10 text-primary" />,
    title: '3. Get a Detailed Blueprint',
    description: 'Receive a comprehensive specification that acts as a perfect instruction set for an AI developer.',
  },
  {
    icon: <Wand2 className="h-10 w-10 text-primary" />,
    title: '4. Execute and Build',
    description: 'Use the blueprint with your favorite AI model to generate code, text, or images and bring your project to life.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-indigo-50/30 via-background to-mint-50/30">
      <Container>
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From Idea to Reality in Four Steps
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Our structured process turns your initial idea into a high-performance prompt, ready for any AI model.
          </p>
        </div>
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.title}>
              <GlassCard className="flex flex-col items-center text-center h-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <GlassCardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <GlassCardTitle className="font-headline text-xl">{step.title}</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </GlassCardContent>
              </GlassCard>
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transform items-center justify-center"
                  style={{ left: `${(index + 1) * 25}%` }}
                >
                  <ArrowRight className="h-8 w-8 text-primary/50" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Container>
    </section>
  );
}
