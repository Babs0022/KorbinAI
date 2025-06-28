
"use client";

import React from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "What is BrieflyAI?",
    answer: "BrieflyAI is a toolkit for engineering high-performance AI prompts. It provides a structured workflow and advanced tools to help you get better, more reliable results from any AI model, faster.",
  },
  {
    question: "Who is this service for?",
    answer: "It's for anyone who relies on AI for their work and wants to move beyond basic prompting. This includes developers, marketers, founders, researchers, and creators who need consistent, high-quality AI outputs.",
  },
  {
    question: "What AI models are supported?",
    answer: "BrieflyAI is model-agnostic. You can build and optimize prompts for any modern AI, including text models like GPT-4, Claude 3, and Gemini, as well as image models like DALL-E 3 and Midjourney. Our tools help you adapt the prompt for your specific target.",
  },
  {
    question: "How is my data handled?",
    answer: "We take your privacy seriously. The prompts and goals you create are stored securely and are only accessible to you. When using our optimization features, the necessary prompt data is sent to our third-party AI providers for processing. For more details, please see our Privacy Policy.",
  },
  {
    question: "Is BrieflyAI free to use?",
    answer: "Yes. During our beta period, all of BrieflyAI's core features are available for free. We plan to introduce paid tiers for advanced team and enterprise features in the future, but the essential toolkit will remain accessible.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-gradient-to-b from-background via-indigo-50/5 to-background">
      <Container>
        <div className="text-center mb-12 md:mb-16">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Find answers to common questions about BrieflyAI.
          </p>
        </div>

        <GlassCard className="max-w-3xl mx-auto p-0 md:p-2 border-border/30">
          <GlassCardContent className="p-4 md:p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b-border/50">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium text-foreground text-md">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCardContent>
        </GlassCard>
      </Container>
    </section>
  );
}
