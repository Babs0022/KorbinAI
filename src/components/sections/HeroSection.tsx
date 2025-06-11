import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Container from '@/components/layout/Container';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-indigo-50/50 to-mint-50/50 py-20 md:py-32">
      <div className="absolute inset-0 -z-10">
        {/* Subtle background pattern or gradient variation if needed */}
      </div>
      <Container className="text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
          <Sparkles className="mr-2 h-4 w-4 text-accent" />
          AI-Powered Prompt Perfection
        </div>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Craft <span className="text-primary">Flawless Prompts</span>.
          <br />
          Unlock AI's True Potential.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          BrieflyAI helps you transform your ideas into powerful, optimized prompts.
          Stop guessing, start creating with clarity and precision.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
            <Link href="/signup">
              Start Prompting Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="shadow-lg transition-transform hover:scale-105">
            <Link href="#how-it-works">
              Learn How It Works
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
