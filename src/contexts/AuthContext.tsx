
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

// This context is cleared and ready for rebuilding.
// You can add user state, auth methods, etc. here.

interface AuthContextType {
  // Define your auth context properties here
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = {
    // Provide your context values here
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
