
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithGitHub: () => Promise<User>;
  signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/signup', '/forgot-password'];
const verificationRoute = '/verify-email';

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

  const handleUser = useCallback(async (rawUser: User | null) => {
    if (rawUser) {
      // User is signed in
      const token = await rawUser.getIdToken();
      await setSessionCookie(token);

      const userDocRef = doc(db, "users", rawUser.uid);
      const userDoc = await getDoc(userDocRef);

      let displayName = rawUser.displayName;

      if (userDoc.exists()) {
        displayName = userDoc.data()?.name || displayName;
      }
      
      const userWithProfile: User = { ...rawUser, displayName };
      setUser(userWithProfile);
      
      if (!rawUser.emailVerified) {
        if (pathname !== verificationRoute) {
          router.replace(verificationRoute);
        }
      } else if (publicRoutes.includes(pathname) || pathname === verificationRoute) {
        router.replace('/');
      }

    } else {
      // User is signed out
      await setSessionCookie(null);
      setUser(null);
      if (!publicRoutes.includes(pathname) && pathname !== verificationRoute) {
        // router.replace('/login');
      }
    }
    setLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

  const logout = async () => {
    await firebaseSignOut(auth);
    await setSessionCookie(null);
    router.push('/login');
  };
  
  const handleSocialSignIn = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
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
      return user;
    } catch (error) {
      console.error(`Error during ${provider.providerId} sign-in:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => handleSocialSignIn(new GoogleAuthProvider());
  const signInWithGitHub = () => handleSocialSignIn(new GithubAuthProvider());
  
  const signup = async (email: string, password: string) => {
    if (!email || !password) return;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a display name from the email
    const name = email.split('@')[0];
    await updateProfile(user, { displayName: name });
    
    // Create user document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
        uid: user.uid,
        name: name,
        email: user.email,
        createdAt: new Date(),
        photoURL: `https://api.dicebear.com/8.x/avataaars/png?seed=${name}&size=100`,
    });
    
    // Send verification email
    await sendEmailVerification(user, { url: `${window.location.origin}/` });

    // Let the onAuthStateChanged listener handle the redirect to /verify-email
  };

  const value: AuthContextType = {
    user,
    loading,
    logout,
    signInWithGoogle,
    signInWithGitHub,
    signup,
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
