
"use client";

import React from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "What is BrieflyAI?",
    answer: "BrieflyAI is a comprehensive SaaS platform designed to help you craft, adapt, and analyze AI prompts. Our tools empower you to generate highly effective prompts for various AI models, leading to superior results, increased efficiency, and a deeper understanding of prompt engineering.",
  },
  {
    question: "How does BrieflyAI improve my prompts?",
    answer: "BrieflyAI uses a multi-faceted approach: \n1. **Intelligent Crafting:** Our guided workflow with adaptive surveys helps you clarify your goals and provide essential context. \n2. **Model-Specific Adaptation:** We tailor your prompts to the specific nuances of different AI models (like GPT-4, Claude, DALL-E). \n3. **Advanced Grading:** Get AI-powered feedback, quality scores, and actionable suggestions to iteratively refine your prompts.",
  },
  {
    question: "Which AI models does BrieflyAI support?",
    answer: "BrieflyAI is designed to be model-agnostic in principle. Our 'Model-Specific Adaptation' feature currently focuses on popular models like GPT-3.5/4, Claude series, Gemini, DALL-E 3, Midjourney, and Stable Diffusion, with more being added. The core prompt crafting and analysis principles apply broadly.",
  },
  {
    question: "Is my data secure with BrieflyAI?",
    answer: "Yes, data security is a top priority. We use Firebase for secure authentication and data storage. When your prompts are sent for AI processing (e.g., optimization or analysis by our AI or third-party models like OpenAI), they are handled according to strict privacy and security protocols. We do not use your specific prompt content to train our core models without explicit consent. Please refer to our Privacy Policy for full details.",
  },
  {
    question: "Can I use BrieflyAI for free?",
    answer: "Absolutely! BrieflyAI offers a free tier that allows you to experience our core features with a limited number of prompts per month. For more advanced capabilities and higher usage limits, we offer flexible paid plans.",
  },
  {
    question: "How does the 'Prompt Grading' feature work?",
    answer: "Our Prompt Grading feature uses an AI model trained to analyze prompts based on criteria like clarity, specificity, conciseness, and potential for ambiguity. It provides a numerical score (0-10) and actionable feedback items to help you understand strengths and areas for improvement.",
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
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
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
