
"use client";

import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const applyTheme = () => {
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let finalThemeDecision: 'light' | 'dark';

      if (storedTheme === 'dark') {
        finalThemeDecision = 'dark';
      } else if (storedTheme === 'light') {
        finalThemeDecision = 'light';
      } else { // 'system' or null (treat null as system default)
        finalThemeDecision = systemPrefersDark ? 'dark' : 'light';
      }

      if (finalThemeDecision === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'system' || !storedTheme) {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        applyTheme();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return <>{children}</>;
}
