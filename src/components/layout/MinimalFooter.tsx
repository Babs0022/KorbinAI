
"use client";

import Link from 'next/link';

export function MinimalFooter() {
  return (
    <footer className="bg-background py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground md:flex md:justify-between">
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
