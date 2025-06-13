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
        className="h-7 w-7 mr-2 text-primary" // Ensures icon also gets primary color explicitly if needed
        aria-hidden="true"
      >
        <path
          d="M4 7C4 6.44772 4.44772 6 5 6H19C19.5523 6 20 6.44772 20 7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7Z"
          fill="currentColor"
        />
        <path
          d="M4 12C4 11.4477 4.44772 11 5 11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H5C4.44772 13 4 12.5523 4 12Z"
          fill="currentColor"
        />
        <path
          d="M4 17C4 16.4477 4.44772 16 5 16H11C11.5523 16 12 16.4477 12 17C12 17.5523 11.5523 18 11 18H5C4.44772 18 4 17.5523 4 17Z"
          fill="currentColor"
        />
      </svg>
      BrieflyAI
    </Link>
  );
}
