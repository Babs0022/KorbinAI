
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

const Logo = ({ className, width = 32, height = 32 }: LogoProps) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Image
        src="/KorbinAI.svg"
        alt="KorbinAI Logo"
        width={width}
        height={height}
        className={cn("w-auto h-auto", `w-[${width}px] h-[${height}px]`)}
      />
    </div>
  );
};

export default Logo;
