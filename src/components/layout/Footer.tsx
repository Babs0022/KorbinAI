
import Link from 'next/link';
import Logo from '@/components/shared/Logo';

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 fill-current"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );

export default function Footer() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'team@brieflyai.xyz';

  return (
    <footer className="border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <p className="text-sm font-medium">BrieflyAI</p>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BrieflyAI. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
            <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
            </Link>
            <Link href={`mailto:${supportEmail}`} className="text-sm text-muted-foreground hover:text-foreground">
                Contact
            </Link>
            <Link href="https://x.com/trybrieflyai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <XIcon />
                <span className="sr-only">X (formerly Twitter)</span>
            </Link>
        </div>
      </div>
    </footer>
  );
}
