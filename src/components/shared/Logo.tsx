
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react'; // Example icon

export function Logo({ className, onClick }: { className?: string, onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        'flex items-center font-headline text-2xl font-bold text-primary', // Kept text-primary
        className
      )}
    >
      <Sparkles className="mr-2 h-6 w-6" /> {/* Example icon */}
      BrieflyAI
    </Link>
  );
}
