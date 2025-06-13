
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center font-headline text-2xl font-bold text-primary',
        className
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 mr-2 text-primary" 
        aria-hidden="true"
      >
        <path
            d="M12 2L12 4L12 6L12 8L12 10L12 12L12 14L12 16L12 18L12 20L12 22M12 2H10V4H12V2ZM12 22H10V20H12V22ZM12 2L14 2L14 4L12 4L12 2ZM12 22L14 22L14 20L12 20L12 22Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
      </svg>
      BrieflyAI
    </Link>
  );
}
