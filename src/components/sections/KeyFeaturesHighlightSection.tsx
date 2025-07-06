
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutTemplate, Feather, Code2, BrainCircuit } from 'lucide-react';

const features = [
  {
    icon: <LayoutTemplate className="h-8 w-8" />,
    title: 'AI App Builder',
    description: 'Describe your application, and our AI architect will generate the pages and components for you.',
  },
  {
    icon: <Feather className="h-8 w-8" />,
    title: 'Content Generation',
    description: 'Create blog posts, ad copy, and social media updates with our advanced writing assistant.',
  },
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: 'Prompt Engineering',
    description: 'Craft and optimize the perfect prompts to get the best results from any AI model.',
  },
  {
    icon: <Code2 className="h-8 w-8" />,
    title: 'Structured Data',
    description: 'Generate JSON, CSV, and other data formats from a simple text description.',
  },
];

export default function KeyFeaturesHighlightSection() {
  return (
    <section id="features" className="container py-20 md:py-24 bg-secondary/50 rounded-xl">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Everything You Need to Create
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Powerful tools to accelerate your workflow from concept to completion.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-card/50 border-0 shadow-none">
            <CardHeader>
              <div className="mb-4 text-primary">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription className="pt-2">{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
