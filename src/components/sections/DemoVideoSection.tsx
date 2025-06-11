
import Image from 'next/image';
import { GlassCard } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
// PlayCircle is no longer needed as native controls will be used
// import { PlayCircle } from 'lucide-react';

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
        <GlassCard className="mt-10 aspect-video overflow-hidden shadow-2xl bg-black"> {/* Added bg-black for letterboxing */}
          <video
            controls
            width="100%"
            poster="https://placehold.co/1280x720.png"
            className="h-full w-full object-contain" // Changed to object-contain to see controls and poster correctly
            aria-label="BrieflyAI Demo Video"
            preload="metadata"
          >
            {/*
              IMPORTANT: Replace this src with the actual URL to your video file.
              For example, if your video is hosted at "https://example.com/videos/brieflyai-demo.mp4",
              the src attribute should be: src="https://example.com/videos/brieflyai-demo.mp4"
            */}
            <source src="YOUR_VIDEO_URL_HERE.mp4" type="video/mp4" />
            {/* You can add more <source> tags here for different video formats if needed */}
            Your browser does not support the video tag. Please update it to watch this demo.
          </video>
        </GlassCard>
        <p className="mt-4 text-sm text-muted-foreground">
          This video showcases the exact app flow: inputting a goal, answering adaptive survey questions, and receiving an optimized prompt.
        </p>
      </Container>
    </section>
  );
}
