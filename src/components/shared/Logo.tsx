
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
      <rect 
        width="20" 
        height="20" 
        rx="3.5" 
        fill="hsl(var(--primary))" // Purple background
      />
      {/* Stylized "B" path - using a known "B in square" icon shape */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M6 4H7.5V16H6V4ZM14.2929 6.29289C14.6834 5.90237 15.3166 5.90237 15.7071 6.29289L17.5 8.08579V8.5V11.5V11.9142L15.7071 13.7071C15.3166 14.0976 14.6834 14.0976 14.2929 13.7071C13.9024 13.3166 13.9024 12.6834 14.2929 12.2929L15 11.5858V8.41421L14.2929 7.70711C13.9024 7.31658 13.9024 6.68342 14.2929 6.29289ZM9 6.5C9 5.67157 9.67157 5 10.5 5H13V6.5H10.5C10.2239 6.5 10 6.72386 10 7V8.5H13V10H10V11.5H13V13H10V14.5C10 14.7761 10.2239 15 10.5 15H13V16.5H10.5C9.67157 16.5 9 15.8284 9 15V13.5V11V9.5V6.5Z" 
        fill="hsl(var(--primary-foreground))" // White "B"
      />
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
