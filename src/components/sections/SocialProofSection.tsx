
"use client";

import React from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent } from '@/components/shared/GlassCard';
import { MessageSquareText } from 'lucide-react'; // Using a generic icon for "Coming Soon"

export function SocialProofSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/5 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See What Our Users Are Saying
          </h2>
        </div>

        {/* "Coming Soon" Placeholder */}
        <GlassCard className="max-w-2xl mx-auto">
          <GlassCardContent className="p-8 text-center">
            <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Testimonials Coming Soon!</h3>
            <p className="text-muted-foreground mt-2">
              We're gathering feedback from our amazing users and will showcase their stories here shortly.
            </p>
          </GlassCardContent>
        </GlassCard>
      </Container>
    </section>
  );
}
