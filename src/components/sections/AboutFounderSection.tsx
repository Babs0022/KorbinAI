
import Image from 'next/image';
import { GlassCard } from '@/components/shared/GlassCard';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Twitter, Users, Mail } from 'lucide-react'; // Using Users for Discord & Farcaster (generic group icon)

// Farcaster icon as SVG
const FarcasterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.88 13.68H14.02V17.5H11.1V13.68H7.12V10.91L11.1 6.5H14.02V10.32H16.88V13.68Z" fill="currentColor"/>
  </svg>
);


export function AboutFounderSection() {
  return (
    <section id="about-founder" className="py-16 md:py-24 bg-background">
      <Container>
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Meet the Founder
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            BrieflyAI is built with passion, transparency, and a commitment to quality.
          </p>
        </div>
        <GlassCard className="max-w-3xl mx-auto">
          <div className="md:flex md:items-center md:gap-8 p-6">
            <div className="md:w-1/3 mb-6 md:mb-0 text-center">
              <Image
                src="https://placehold.co/200x200.png"
                alt="Elijah Babatunde - Founder of BrieflyAI"
                width={200}
                height={200}
                className="rounded-full mx-auto shadow-lg"
                data-ai-hint="founder portrait"
              />
            </div>
            <div className="md:w-2/3">
              <h3 className="font-headline text-2xl font-semibold text-foreground">Elijah Babatunde</h3>
              <p className="mt-2 text-muted-foreground">
                Hey, I’m Elijah Babatunde, also known as Babs! I'm building BrieflyAI to solve a problem I faced daily: crafting effective AI prompts. 
                My goal is to provide a straightforward, honest tool that genuinely helps you get more out of AI. 
                I believe in building in public, listening to users, and creating products that deliver real value.
                No hype, just utility.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://twitter.com/babsbuilds" target="_blank" rel="noopener noreferrer">
                    <Twitter className="mr-2 h-4 w-4" /> X (@babsbuilds)
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://warpcast.com/0xbabs" target="_blank" rel="noopener noreferrer">
                    <FarcasterIcon /> <span className="ml-2">Farcaster (@0xbabs)</span>
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://discord.gg/your-discord-invite" target="_blank" rel="noopener noreferrer">
                    <Users className="mr-2 h-4 w-4" /> Join Discord
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:babseli933@gmail.com">
                    <Mail className="mr-2 h-4 w-4" /> Email Me
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </Container>
    </section>
  );
}
