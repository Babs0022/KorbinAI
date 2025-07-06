
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="container flex flex-col items-center py-20 text-center md:py-32">
      <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
        Turn Your Ideas into Reality with AI
      </h1>
      <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
        BrieflyAI is your co-pilot for building applications, generating content,
        and bringing your creative projects to life, faster than ever before.
        No code required.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Button asChild size="lg">
          <Link href="/dashboard">
            Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
