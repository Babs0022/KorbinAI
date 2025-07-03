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
        <path
          d="M20.0002 10.5C19.3002 10.5 18.7502 11.05 18.7502 11.75V15.5H15.0002C14.3002 15.5 13.7502 16.05 13.7502 16.75C13.7502 17.45 14.3002 18 15.0002 18H18.7502V22.25C18.7502 22.95 19.3002 23.5 20.0002 23.5C20.7002 23.5 21.2502 22.95 21.2502 22.25V18H25.0002C25.7002 18 26.2502 17.45 26.2502 16.75C26.2502 16.05 25.7002 15.5 25.0002 15.5H21.2502V11.75C21.2502 11.05 20.7002 10.5 20.0002 10.5Z"
          fill="white"
        />
        <path
          d="M11.25 24.5C11.25 25.47 12.03 26.25 13 26.25H27C27.97 26.25 28.75 25.47 28.75 24.5C28.75 23.53 27.97 22.75 27 22.75H13C12.03 22.75 11.25 23.53 11.25 24.5Z"
          fill="white"
          fillOpacity="0.5"
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
