
"use client";

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mail, Loader2 } from 'lucide-react';
import { XLogoIcon } from '@/components/shared/XLogoIcon';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'babseli933@gmail.com';

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // Use email as doc ID to prevent duplicates
      const subscriberRef = doc(db, 'newsletterSubscribers', email); 
      await setDoc(subscriberRef, {
        email: email,
        subscribedAt: serverTimestamp(),
      }, { merge: true }); // Use merge to not overwrite if they re-subscribe

      toast({ title: "Subscribed!", description: "Thanks for joining our newsletter." });
      setEmail('');
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({ title: "Subscription Failed", description: "Could not subscribe. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

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
              <li><Link href="/#faq" className="text-sm text-muted-foreground hover:text-primary">FAQ</Link></li>
            </ul>
          </div>
          <div className="md:justify-self-end">
            <h4 className="font-headline text-lg font-semibold">Connect</h4>
            <ul className="mt-2 space-y-1">
              <li><a href={`mailto:${supportEmail}`} className="text-sm text-muted-foreground hover:text-primary flex items-center"><Send size={16} className="mr-2" /> Email Support</a></li>
              <li><a href="https://twitter.com/babsbuilds" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center"><XLogoIcon className="mr-2 h-4 w-4" /> @babsbuilds</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="font-headline text-lg font-semibold">Stay Updated</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Subscribe to our newsletter to get the latest news, updates, and tips.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="max-w-sm w-full"
                aria-label="Email for newsletter"
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground md:flex md:justify-between">
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
