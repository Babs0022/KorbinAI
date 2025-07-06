export default function Logo({ className }: { className?: string }) {
    return (
      <svg
        className={className}
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="url(#paint0_linear_1_2)" />
        {/* Stylish "B" Logo */}
        <path
          d="M14,10 h7 c4,0 6,2 6,6 c0,4 -2,6 -6,6 h-7 z M14,22 h8 c4,0 6,2 6,6 c0,4 -2,6 -6,6 h-8 z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="paint0_linear_1_2"
            x1="20"
            y1="0"
            x2="20"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00F0A0" />
            <stop offset="1" stopColor="#00D0A0" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
