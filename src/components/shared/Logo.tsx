import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  showText?: boolean;
}

const Logo = ({ showText = true }: LogoProps) => {
  return (
    (<Link href="/" className="flex items-center space-x-2">
      <Image
        src="/icon.png"
        alt="BrieflyAI Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      {showText && <span className="text-xl font-bold">BrieflyAI</span>}
    </Link>)
  );
};

export default Logo;
