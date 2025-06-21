"use client";

import React from 'react';
import Container from '@/components/layout/Container';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "What is BrieflyAI?",
    answer: "BrieflyAI is an advanced prompt engineering platform designed for developers, teams, and creators. It provides a comprehensive suite of tools for crafting, managing, testing, and collaborating on AI prompts. Our mission is to enable users to achieve consistent, high-quality, and scalable results from any large language model (LLM).",
  },
  {
    question: "How does BrieflyAI improve my prompts?",
    answer: "BrieflyAI enhances prompts through a structured engineering process. Key capabilities include: \n• **Clarity & Specificity:** Tools to eliminate ambiguity. \n• **Contextual Framing:** Easily add necessary background information. \n• **Role-Playing Techniques:** Assign personas to the AI (e.g., 'expert copywriter'). \n• **Chain-of-Thought:** Guide the AI through complex reasoning step-by-step. \n• **Parameter Tuning:** Precisely adjust variables like temperature to steer AI behavior.",
  },
  {
    question: "Which AI models does BrieflyAI support?",
    answer: "Our platform is designed for multi-LLM compatibility, supporting a wide array of text, image, and code generation models. This includes models from OpenAI (GPT series), Anthropic (Claude series), Google (Gemini family), and open-source alternatives. This ensures you can use the best model for any specific task.",
  },
  {
    question: "Is BrieflyAI suitable for teams?",
    answer: "Yes, absolutely. BrieflyAI is built for collaboration. Features include a shared prompt library, version control, A/B testing capabilities, and performance logging. Teams can work together in real-time to build, test, and deploy reliable prompt configurations across their organization.",
  },
  {
    question: "How does BrieflyAI handle data privacy and security?",
    answer: "We prioritize your data security. Prompts and sensitive information are handled with strict security protocols. We provide tools for usage monitoring and cost estimation without compromising the privacy of your content. For enterprise clients, we offer solutions that can be integrated within your own virtual private cloud. Please see our Privacy Policy for more details.",
  },
  {
    question: "How does the automated optimization work?",
    answer: "This is one of our core value propositions. BrieflyAI leverages data-driven techniques, including analyzing prompt performance over time. Our system can suggest improvements based on historical data and is being developed with feedback-driven, self-evolving capabilities inspired by reinforcement learning to continually enhance prompt effectiveness with minimal manual intervention.",
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
