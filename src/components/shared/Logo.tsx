
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className, onClick }: { className?: string, onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 font-headline text-2xl font-bold',
        className
      )}
      aria-label="BrieflyAI Home"
    >
      <Image 
        src="/logo.svg" 
        alt="BrieflyAI Logo" 
        width={30} 
        height={30}
        priority 
      />
      <span className="text-primary">BrieflyAI</span>
    </Link>
  );
}
