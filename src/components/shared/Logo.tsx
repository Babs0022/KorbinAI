
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center font-headline text-2xl font-bold text-primary',
        className
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24" // Adjusted viewBox for potentially more detail
        fill="none" // Set fill to none initially, path will have fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 mr-2 text-primary" 
        aria-hidden="true"
      >
        {/* Stylized B logo path - approximation of the provided image */}
        <path 
          d="M17.2075 3.81445C16.5275 3.47445 15.6975 3.41445 14.9475 3.66445L8.0475 5.75445C7.0975 6.05445 6.4775 6.88445 6.3775 7.86445L4.3875 15.7945C4.2275 16.7045 4.6375 17.6244 5.4075 18.1044L5.8975 18.3744C6.2475 18.5744 6.6575 18.6644 7.0575 18.6644C7.5675 18.6644 8.0775 18.4944 8.5075 18.1744L15.7375 12.7545C16.0975 12.4845 16.3375 12.1045 16.4175 11.6745V7.42445C16.4175 6.09445 15.7075 4.90445 14.4575 4.34445C14.7575 3.94445 15.2875 3.62445 15.8975 3.54445C16.3775 3.47445 16.8675 3.55445 17.2075 3.81445ZM11.7375 7.23445C11.3075 7.23445 10.9575 7.58445 10.9575 8.01445V10.2645C10.9575 10.6945 11.3075 11.0445 11.7375 11.0445H13.5575C13.9875 11.0445 14.3375 10.6945 14.3375 10.2645V8.01445C14.3375 7.58445 13.9875 7.23445 13.5575 7.23445H11.7375Z"
          fill="currentColor"
        />
      </svg>
      BrieflyAI
    </Link>
  );
}
