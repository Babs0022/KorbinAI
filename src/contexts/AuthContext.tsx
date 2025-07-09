"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // New effect to handle redirects based on auth and verification state
  useEffect(() => {
    if (loading) return; // Wait until auth state is loaded

    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isVerificationRoute = pathname === '/verify-email';

    // If user is not logged in, they should be on an auth route, otherwise redirect to login.
    if (!user && !isAuthRoute && pathname !== '/terms-of-service' && pathname !== '/privacy-policy') {
        router.replace('/login');
        return;
    }
    
    // If user is logged in...
    if (user) {
        // ...but not verified, and not on the verification page, force them there.
        if (!user.emailVerified && !isVerificationRoute) {
            router.replace('/verify-email');
        }
        
        // ...and is verified, but on the verification page, send them to onboarding.
        if (user.emailVerified && isVerificationRoute) {
            router.replace('/onboarding');
        }
    }

  }, [user, loading, pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
  };
  
  const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not, create them
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date(),
        });
      }
      return user;
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      throw error;
    }
  };


  const value: AuthContextType = {
    user,
    loading,
    logout,
    signInWithGoogle,
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
