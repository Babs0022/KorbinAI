import Image from 'next/image';
import { GlassCard } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { PlayCircle } from 'lucide-react';

export function DemoVideoSection() {
  return (
    <section id="demo-video" className="py-16 md:py-24 bg-background">
      <Container className="text-center">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          See BrieflyAI in Action
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Watch a quick walkthrough of how easy it is to optimize your prompts.
        </p>
        <GlassCard className="mt-10 aspect-video overflow-hidden shadow-2xl">
          {/* Placeholder for video. Replace with actual video player or embed. */}
          <div className="relative h-full w-full cursor-pointer group">
            <Image
              src="https://placehold.co/1280x720.png"
              alt="BrieflyAI Demo Video Placeholder"
              layout="fill"
              objectFit="cover"
              data-ai-hint="video play"
              className="transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/50">
              <PlayCircle className="h-20 w-20 text-white/80 transition-transform group-hover:scale-110 group-hover:text-white" />
            </div>
             <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md text-sm">
              Demo: Input goal → Adaptive survey → Optimized prompt
            </div>
          </div>
        </GlassCard>
        <p className="mt-4 text-sm text-muted-foreground">
          This video showcases the exact app flow: inputting a goal, answering adaptive survey questions, and receiving an optimized prompt.
        </p>
      </Container>
    </section>
  );
}
