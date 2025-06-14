
"use client";

import React from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent } from '@/components/shared/GlassCard';
import { Star, Users } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    quote: "BrieflyAI revolutionized how I interact with AI. My prompts are clearer, and the results are miles better!",
    name: "Alex P.",
    role: "Founder, Tech Startup",
    avatar: "https://placehold.co/48x48.png",
    stars: 5,
    imageHint: "user avatar",
  },
  {
    quote: "The model-specific adaptations are a game-changer. I'm getting so much more out of DALL-E and GPT-4.",
    name: "Sarah M.",
    role: "Digital Marketer",
    avatar: "https://placehold.co/48x48.png",
    stars: 5,
    imageHint: "user avatar",
  },
  {
    quote: "Finally, a tool that understands the nuances of good prompting. The grading feature helps me learn and improve.",
    name: "David K.",
    role: "Content Creator",
    avatar: "https://placehold.co/48x48.png",
    stars: 4,
    imageHint: "user avatar",
  },
];

const trustedByLogos = [
  { name: "Innovatech", src: "https://placehold.co/120x40.png?text=Innovatech&font=roboto", hint: "company logo tech" },
  { name: "CreatorHub", src: "https://placehold.co/120x40.png?text=CreatorHub&font=lato", hint: "company logo media" },
  { name: "EduSpark", src: "https://placehold.co/120x40.png?text=EduSpark&font=montserrat", hint: "company logo education" },
  { name: "MarketBoost", src: "https://placehold.co/120x40.png?text=MarketBoost&font=oswald", hint: "company logo marketing" },
  { name: "DevSolutions", src: "https://placehold.co/120x40.png?text=DevSolutions&font=source-sans-pro", hint: "company logo software" },
];

export function SocialProofSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/5 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loved by Innovators Like You
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See what our users are saying and who's building better with BrieflyAI. (Testimonials are illustrative)
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {testimonials.map((testimonial) => (
            <GlassCard key={testimonial.name} className="flex flex-col bg-card/70 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
                ))}
              </div>
              <blockquote className="text-foreground/90 italic flex-grow">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <div className="mt-4 flex items-center">
                <Image 
                  src={testimonial.avatar} 
                  alt={testimonial.name} 
                  width={48} 
                  height={48} 
                  className="rounded-full mr-3"
                  data-ai-hint={testimonial.imageHint}
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Trusted By Logos */}
        <div className="text-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center justify-center">
            <Users className="h-5 w-5 mr-2" />
            Trusted by Teams and Individuals at Leading Companies
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6">
            {trustedByLogos.map((logo) => (
              <div key={logo.name} className="opacity-70 hover:opacity-100 transition-opacity" title={logo.name}>
                <Image 
                    src={logo.src} 
                    alt={logo.name} 
                    width={120} 
                    height={40} 
                    className="object-contain"
                    data-ai-hint={logo.hint} 
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
