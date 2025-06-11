import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Users, Zap, BookOpen, Briefcase, GraduationCap, Mic } from 'lucide-react';

const useCases = [
  {
    icon: <Briefcase className="h-8 w-8 mb-4 text-primary" />,
    title: 'Founders & Entrepreneurs',
    description: 'Generate compelling startup pitches, investor updates, and product descriptions that resonate.',
    example: 'e.g., "Draft a concise one-liner for a sustainable energy startup targeting urban consumers."',
  },
  {
    icon: <Zap className="h-8 w-8 mb-4 text-primary" />,
    title: 'Marketers & Content Creators',
    description: 'Craft engaging ad copy, social media posts, blog outlines, and email campaigns that convert.',
    example: 'e.g., "Write three catchy Instagram captions for a new vegan cookbook launch."',
  },
  {
    icon: <GraduationCap className="h-8 w-8 mb-4 text-primary" />,
    title: 'Students & Researchers',
    description: 'Summarize complex topics, generate research questions, and draft well-structured essays or reports.',
    example: 'e.g., "Explain the theory of relativity in simple terms for a high school presentation."',
  },
   {
    icon: <Mic className="h-8 w-8 mb-4 text-primary" />,
    title: 'Podcasters & Speakers',
    description: 'Develop interview questions, script podcast intros, or outline engaging speeches.',
    example: 'e.g., "Create 5 thought-provoking questions for an interview with a tech innovator."',
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-16 md:py-24 bg-background">
      <Container>
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Who is BrieflyAI For?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Anyone who uses AI can benefit from better prompts. Here are a few examples:
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {useCases.map((useCase) => (
            <GlassCard key={useCase.title} className="flex flex-col h-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <GlassCardHeader>
                {useCase.icon}
                <GlassCardTitle className="font-headline text-xl">{useCase.title}</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="flex-grow">
                <GlassCardDescription>{useCase.description}</GlassCardDescription>
                <p className="mt-3 text-xs text-muted-foreground italic">{useCase.example}</p>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
