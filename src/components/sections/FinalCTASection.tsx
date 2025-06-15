
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Container from '@/components/layout/Container';
import { ArrowRight } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-t from-indigo-50/30 via-background to-mint-50/30">
      <Container className="text-center">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to Elevate Your Prompts?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Join BrieflyAI today and experience the difference that truly optimized prompts can make.
          Start for free, no credit card required.
        </p>
        <Button size="lg" asChild className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
          <Link href="/signup">
            Get Started with BrieflyAI <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </Container>
    </section>
  );
}
