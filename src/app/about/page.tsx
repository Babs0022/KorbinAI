import { Metadata } from 'next';
import Link from 'next/link';
import { Lightbulb, Bot, BrainCircuit, Goal, Puzzle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About - KorbinAI',
  description: 'KorbinAI is not just a tool, but a proactive, goal-oriented AI partner designed to understand and execute complex, high-level goals.',
};

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      <main>
        {/* Hero Section */}
        <section className="text-center py-20 bg-secondary/50">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">An AI That Actually Gets It.</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Most AI assistants are reactive tools. You ask, they answer. We're building something different: a proactive, goal-oriented partner that understands not just your query, but your ultimate objective.
            </p>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Our Vision: A Proactive Partner</h2>
              <p className="text-muted-foreground leading-relaxed">
                The objective is to create an AI assistant that is not merely a tool but a proactive partner. As outlined in our architectural blueprint, this agent is designed to understand complex, high-level goals.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <Goal className="w-6 h-6 mr-3 mt-1 text-primary" />
                  <span>execute multi-step plans to achieve your objectives.</span>
                </li>
                <li className="flex items-start">
                  <BrainCircuit className="w-6 h-6 mr-3 mt-1 text-primary" />
                  <span>Adapt to new information and learn from its experiences to improve future performance.</span>
                </li>
                <li className="flex items-start">
                  <Puzzle className="w-6 h-6 mr-3 mt-1 text-primary" />
                  <span>Seamlessly integrate with your existing tools and workflows, becoming a true extension of your capabilities.</span>
                </li>
              </ul>
            </div>
            <div>
              {/* You can replace this with a diagram or a more abstract visual */}
              <img src="/icon.png" alt="KorbinAI Vision" className="rounded-lg shadow-xl w-2/3 mx-auto" />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-secondary/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">The Technology Behind "Getting It"</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              To achieve this, we've designed a hybrid, layered architecture powered by Genkit, Google's open-source AI framework. This allows us to combine the speed of reactive systems with the depth of deliberative, goal-oriented reasoning.
            </p>
            <div className="mt-12 grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-transparent hover:border-border rounded-lg transition-all">
                <Lightbulb className="w-10 h-10 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold">Goal-Oriented Reasoning</h3>
                <p className="mt-2 text-muted-foreground">
                  Understands your end goal, not just the immediate command.
                </p>
              </div>
              <div className="p-6 border border-transparent hover:border-border rounded-lg transition-all">
                <Bot className="w-10 h-10 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold">Autonomous Operation</h3>
                <p className="mt-2 text-muted-foreground">
                  Can create, manage, and execute tasks to reach a conclusion.
                </p>
              </div>
              <div className="p-6 border border-transparent hover:border-border rounded-lg transition-all">
                <BrainCircuit className="w-10 h-10 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold">Continuous Learning</h3>
                <p className="mt-2 text-muted-foreground">
                  Adapts and improves based on feedback and new data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Partner with a Smarter AI?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Experience the difference a truly strategic partner can make.
            </p>
            <div className="mt-8">
              <Link href="/signup" className="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
