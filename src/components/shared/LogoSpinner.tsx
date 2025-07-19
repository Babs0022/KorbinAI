
"use client";

import Logo from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

interface LogoSpinnerProps {
    className?: string;
}

const LogoSpinner = ({ className }: LogoSpinnerProps) => {
    return (
        <div className={cn("relative flex items-center justify-center w-12 h-12", className)}>
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-t-primary rounded-full animate-spin-slow"></div>
            <Logo />
        </div>
    );
};

export default LogoSpinner;
