import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`font-headline text-2xl font-bold text-primary ${className}`}>
      BrieflyAI
    </Link>
  );
}
