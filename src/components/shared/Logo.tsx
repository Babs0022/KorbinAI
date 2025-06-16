
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="BrieflyAI Home"
      className={cn(
        'flex items-center text-primary', // Removed font-specific styles, kept text-primary for SVG color
        className
      )}
    >
      <svg 
        width="28" 
        height="32" 
        viewBox="0 0 28 32" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg" 
        aria-hidden="true" 
        focusable="false"
        // You can adjust width and height here or through className prop for more control
        // For example, if className includes h-8, this will scale if width="auto" or similar
      >
        <path d="M0 0H8V32H0V0Z" />
        <path d="M8 0L28 16L8 32V0Z" />
      </svg>
      {/* <span className="ml-2 font-headline text-2xl font-bold">BrieflyAI</span> */}
      {/* Optionally, if you want the text next to the SVG, uncomment the span above and adjust styling. */}
      {/* If only the SVG is desired as the logo, the aria-label on the Link is sufficient. */}
    </Link>
  );
}
