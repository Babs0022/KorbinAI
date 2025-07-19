
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <Link href="/" className={cn("flex items-center space-x-2", className)}>
      <Image
        src="/icon.png"
        alt="BrieflyAI Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
    </Link>
  );
};

export default Logo;
