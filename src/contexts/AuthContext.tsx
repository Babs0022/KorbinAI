
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

// Helper function to manage the session cookie
async function setSessionCookie(token: string | null) {
  const method = token ? 'POST' : 'DELETE';
  const body = token ? JSON.stringify({ idToken: token }) : undefined;

  await fetch('/api/auth/session', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        const token = await user.getIdToken();
        await setSessionCookie(token);
        setUser(user);
        
        if (!user.emailVerified && pathname !== '/verify-email') {
          router.replace('/verify-email');
        }
      } else {
        // User is signed out.
        await setSessionCookie(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };
  
  const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

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
      router.push('/');
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
