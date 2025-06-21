import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { MousePointerClick, ListChecks, MessageSquareText, Wand2, ArrowRight } from 'lucide-react';
import React from 'react';

const steps = [
  {
    icon: <MousePointerClick className="h-10 w-10 text-primary" />,
    title: '1. Input Your Goal',
    description: 'Clearly define the task or objective you want your AI prompt to achieve.',
  },
  {
    icon: <ListChecks className="h-10 w-10 text-primary" />,
    title: '2. Answer Adaptive Survey',
    description: 'BrieflyAI asks targeted questions to understand context, tone, and desired output.',
  },
  {
    icon: <MessageSquareText className="h-10 w-10 text-primary" />,
    title: '3. Provide Your Answers',
    description: 'Your responses guide the AI in tailoring the prompt specifically to your needs.',
  },
  {
    icon: <Wand2 className="h-10 w-10 text-primary" />,
    title: '4. Get Optimized Prompt',
    description: 'Receive a fine-tuned prompt, ready to deliver superior AI-generated results.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-indigo-50/30 via-background to-mint-50/30">
      <Container>
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple Steps to Prompt Perfection
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Our intuitive process makes prompt optimization effortless.
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
         <p className="mt-8 text-center text-sm text-muted-foreground">
            This animated flow demonstrates: Input goal → Adaptive survey → User answers → Optimized prompt.
          </p>
      </Container>
    </section>
  );
}
