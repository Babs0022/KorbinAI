"use client";

import React from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "What is BrieflyAI?",
    answer: "BrieflyAI is a Software-as-a-Service (SaaS) platform designed to help users create, manage, and optimize prompts for various AI models. Our tools guide you from a simple goal to a highly effective prompt, ensuring better results from your AI interactions.",
  },
  {
    question: "Who is this service for?",
    answer: "BrieflyAI is for anyone who uses AI, including startup founders, marketers, content creators, students, researchers, and developers. If you want to get more precise and valuable outputs from AI, our platform is for you.",
  },
  {
    question: "What AI models are supported?",
    answer: "Our platform is model-agnostic, meaning you can craft prompts for virtually any text or image-based AI model, including those from OpenAI (like GPT-4), Anthropic (Claude), Google (Gemini), Midjourney, and more. Our 'Model-Specific Prompts' feature helps tailor your prompt's syntax for optimal performance on your chosen model.",
  },
  {
    question: "How is my data handled?",
    answer: "We take your privacy seriously. The prompts and goals you create are stored securely and are only accessible to you. When using our optimization features, the necessary prompt data is sent to our third-party AI providers for processing. For more details, please see our Privacy Policy.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes, you can cancel your subscription at any time through your account settings. You will retain access to your plan's features until the end of the current billing cycle. There are no long-term contracts or hidden fees.",
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
