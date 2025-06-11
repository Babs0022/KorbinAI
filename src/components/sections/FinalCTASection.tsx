
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Container from '@/components/layout/Container';
import { ArrowRight, Mail, MessageCircle, Users } from 'lucide-react';
import { XLogoIcon } from '@/components/shared/XLogoIcon';

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
        <div className="mt-12 pt-8 border-t border-border/50">
          <h3 className="font-headline text-xl font-semibold text-foreground">Still have questions? Reach out!</h3>
          <p className="text-muted-foreground mt-2">I'm always happy to chat and help you get the most out of BrieflyAI.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
             <Button variant="outline" asChild>
              <a href="mailto:babseli933@gmail.com">
                <Mail className="mr-2 h-4 w-4" /> babseli933@gmail.com
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://twitter.com/babsbuilds" target="_blank" rel="noopener noreferrer">
                <XLogoIcon className="mr-2 h-4 w-4" /> @babsbuilds
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://discord.gg/your-discord-invite" target="_blank" rel="noopener noreferrer">
                <Users className="mr-2 h-4 w-4" /> Join our Discord
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
