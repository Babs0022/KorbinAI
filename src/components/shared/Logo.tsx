
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, onClick }: { className?: string, onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        'flex items-center font-headline text-2xl font-bold text-primary',
        className
      )}
      aria-label="BrieflyAI Home"
    >
      BrieflyAI
    </Link>
  );
}
