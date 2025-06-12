
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  userInitials: string;
  displayName: string;
  displayEmail: string;
  avatarUrl:string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const defaultPlaceholderUrl = "https://placehold.co/40x40.png";


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [displayName, setDisplayName] = useState("User");
  const [displayEmail, setDisplayEmail] = useState("user@example.com");
  const [avatarUrl, setAvatarUrl] = useState(defaultPlaceholderUrl);
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setDisplayName(user.displayName || user.email?.split('@')[0] || "User");
        setDisplayEmail(user.email || "user@example.com");
        // Use the actual photoURL from Firebase, or the default placeholder if it's null/empty
        setAvatarUrl(user.photoURL || defaultPlaceholderUrl); 
        setUserInitials(
          (user.displayName?.split(" ").map(n => n[0]).join("") || 
           user.email?.charAt(0) || 
           "U"
          ).toUpperCase()
        );
      } else {
        setDisplayName("User");
        setDisplayEmail("user@example.com");
        setAvatarUrl(defaultPlaceholderUrl);
        setUserInitials("U");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    displayName,
    displayEmail,
    avatarUrl,
    userInitials
  };

  // Always render children. Consumer components can use the 'loading' state.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    