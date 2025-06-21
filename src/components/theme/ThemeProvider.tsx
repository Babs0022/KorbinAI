
"use client";

import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Force dark mode on the application
    document.documentElement.classList.add('dark');
    
    // Clean up any old theme setting from localStorage to avoid confusion
    if (localStorage.getItem('theme')) {
        localStorage.removeItem('theme');
    }
  }, []);

  return <>{children}</>;
}
