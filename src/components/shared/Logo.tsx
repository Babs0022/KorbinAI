
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Image
        src="/icon.png"
        alt="BrieflyAI Logo"
        width={32}
        height={32}
      />
    </div>
  );
};

export default Logo;
