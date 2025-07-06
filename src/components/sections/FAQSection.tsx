
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
      question: "What is BrieflyAI?",
      answer: "BrieflyAI is an AI-powered platform that helps you turn ideas into digital products. You can build applications, generate written content, craft AI prompts, and create structured data, all from a single interface."
    },
    {
      question: "Who is this for?",
      answer: "BrieflyAI is for anyone who wants to build and create with AI, from developers looking to prototype quickly to non-technical creators who want to bring their ideas to life without writing code."
    },
    {
      question: "Do I need to know how to code?",
      answer: "No! While developers can leverage the generated code, our tools are designed to be used by everyone, regardless of technical skill. You can describe what you want in plain English."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, you can get started for free to explore the core features of BrieflyAI. We offer paid plans for unlimited access and more advanced capabilities."
    },
]

export default function FAQSection() {
    return (
        <section id="faq" className="container py-20 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Frequently Asked Questions
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Find answers to common questions about BrieflyAI.
                </p>
            </div>
            <div className="mx-auto mt-12 max-w-3xl">
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
