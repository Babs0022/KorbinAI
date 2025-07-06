
import Link from 'next/link';
import Logo from '@/components/shared/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <p className="text-sm font-medium">BrieflyAI</p>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BrieflyAI. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
            <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
            </Link>
        </div>
      </div>
    </footer>
  );
}
