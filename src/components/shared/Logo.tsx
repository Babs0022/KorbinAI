import Link from 'next/link';
import Image from 'next/image';

/**
 * Renders the application logo, which links to the homepage.
 * It uses the Next.js Image component for optimized loading.
 * The icon file is expected to be '/icon.png' in the public directory.
 */
const Logo = () => {
  return (
    <Link href="/" aria-label="BrieflyAI homepage">
      <div className="flex items-center justify-center h-10 w-10">
        <Image 
          src="/icon.png" 
          alt="BrieflyAI Logo" 
          width={40} 
          height={40}
          className="rounded-md"
        />
      </div>
    </Link>
  );
};

export default Logo;
