
"use client";

import React from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent } from '@/components/shared/GlassCard';
import { Users, Star } from 'lucide-react';
import { XLogoIcon } from '@/components/shared/XLogoIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Farcaster icon as SVG, similar to the one in AboutFounderSection
const FarcasterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.88 13.68H14.02V17.5H11.1V13.68H7.12V10.91L11.1 6.5H14.02V10.32H16.88V13.68Z" />
  </svg>
);


const testimonials = [
  {
    name: 'HACHIRO',
    handle: '@hachiro52',
    platform: 'X',
    icon: '8',
    feedback: "I just checked out BrieflyAi, the interface is super clean and the flow makes prompt crafting very much easier.",
  },
  {
    name: 'Sir Chocs',
    handle: '@waverchocs',
    platform: 'X',
    icon: '7',
    feedback: "This is really cool, I just created an account and it works fine. Tried generateing a prompt too, and it's cool",
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => {
  const PlatformIcon = () => {
    switch(testimonial.platform) {
      case 'X': return <XLogoIcon className="h-4 w-4" />;
      case 'Discord': return <Users className="h-4 w-4 text-indigo-500" />;
      case 'Farcaster': return <FarcasterIcon />;
      default: return null;
    }
  };

  return (
    <GlassCard className="w-80 flex-shrink-0 mx-4">
      <GlassCardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center mb-4">
          <Avatar className="h-10 w-10 mr-3">
             <AvatarImage src={`https://avatar.iran.liara.run/public/${testimonial.icon}`} alt={testimonial.name} data-ai-hint="user avatar"/>
            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="font-semibold text-foreground">{testimonial.name}</p>
            <div className="flex items-center text-xs text-muted-foreground">
               <PlatformIcon />
               <span className="ml-1.5">{testimonial.handle}</span>
            </div>
          </div>
        </div>
        <blockquote className="text-sm text-muted-foreground flex-grow">
          &ldquo;{testimonial.feedback}&rdquo;
        </blockquote>
      </GlassCardContent>
    </GlassCard>
  );
};

export function SocialProofSection() {
  const extendedTestimonials = [...testimonials, ...testimonials, ...testimonials, ...testimonials];

  return (
    <section id="social-proof" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/5 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From the Community
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            BrieflyAI is shaped by feedback from real users. Here's what people are saying.
          </p>
        </div>
      </Container>

      <div
        className="relative w-full overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
        }}
      >
        <div className="flex min-w-max animate-marquee-slow hover:[animation-play-state:paused]">
          {extendedTestimonials.map((testimonial, index) => (
            <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
