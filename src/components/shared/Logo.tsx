
import Link from 'next/link';
import { cn } from '@/lib/utils';

// SVG icon component that represents the app logo
const AppLogoIcon = () => {
  return (
    <svg 
      width="30" 
      height="30" 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      aria-hidden="true" // Hide from screen readers as text label is present
    >
      {/* Defs for rounded corners */}
      <defs>
        <clipPath id="logoClipPathRounded">
          <rect width="20" height="20" rx="3.5" />
        </clipPath>
      </defs>
      
      {/* Group to apply the clipping path */}
      <g clipPath="url(#logoClipPathRounded)">
        {/* Left half - Primary Color */}
        <rect x="0" y="0" width="10" height="20" fill="hsl(var(--primary))"/>
        {/* Right half - Accent Color */}
        <rect x="10" y="0" width="10" height="20" fill="hsl(var(--accent))"/>
      </g>
    </svg>
  );
};

export function Logo({ className, onClick }: { className?: string, onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 font-headline text-2xl font-bold', // Main container for icon and text
        className
      )}
      aria-label="BrieflyAI Home"
    >
      <AppLogoIcon />
      <span className="text-primary">BrieflyAI</span> {/* Text part of the logo */}
    </Link>
  );
}
