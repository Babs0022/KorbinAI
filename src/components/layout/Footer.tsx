
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Github, Send, Users } from 'lucide-react'; // Using Users for Discord
import { XLogoIcon } from '@/components/shared/XLogoIcon';

export function Footer() {
  return (
    <footer className="bg-muted/50 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">
              Optimize your AI prompts with BrieflyAI. Clarity, honesty, and results.
            </p>
          </div>
          <div className="md:justify-self-center">
            <h4 className="font-headline text-lg font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-1">
              <li><Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-primary">How It Works</Link></li>
              <li><Link href="/#pricing" className="text-sm text-muted-foreground hover:text-primary">Pricing</Link></li>
              
            </ul>
          </div>
          <div className="md:justify-self-end">
            <h4 className="font-headline text-lg font-semibold">Connect</h4>
            <ul className="mt-2 space-y-1">
              <li><a href="mailto:babseli933@gmail.com" className="text-sm text-muted-foreground hover:text-primary flex items-center"><Send size={16} className="mr-2" /> Email Support</a></li>
              <li><a href="https://twitter.com/babsbuilds" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center"><XLogoIcon className="mr-2 h-4 w-4" /> @babsbuilds</a></li>
              <li><a href="https://discord.gg/8muUf5Nzb4" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center"><Users size={16} className="mr-2" /> Join Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground md:flex md:justify-between">
          <p>&copy; {new Date().getFullYear()} BrieflyAI. All rights reserved.</p>
          <div className="mt-4 space-x-4 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

