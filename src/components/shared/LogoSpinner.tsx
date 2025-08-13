
"use client";

import Logo from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

interface LogoSpinnerProps {
    className?: string;
}

const LogoSpinner = ({ className }: LogoSpinnerProps) => {
    return (
        <div className={cn("relative flex items-center justify-center w-12 h-12", className)}>
            <Logo />
        </div>
    );
};

export default LogoSpinner;
