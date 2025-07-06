
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FinalCTASection() {
  return (
    <section className="container py-20 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Ready to Build Your Next Big Idea?
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">
            Stop waiting and start creating. Join BrieflyAI today and unlock the power of AI-driven development and content creation.
        </p>
        <div className="mt-10">
            <Button asChild size="lg">
                <Link href="/dashboard">
                    Start Creating for Free
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
