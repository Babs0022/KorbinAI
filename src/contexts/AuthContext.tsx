
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
  GoogleAuthProvider,
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
  signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/signup', '/forgot-password'];
const verificationRoute = '/verify-email';

const defaultSystemPrompt = `You are Briefly, a helpful and friendly AI copilot. Your goal is to have natural, engaging conversations and assist users with their questions and tasks. You are a multi-modal assistant, which means you can process text, images, and videos. When a user uploads media, you can "see" it and answer questions about it.

You can also access the internet. If a user asks for a link, provides a URL, or asks you to search for something, you should use your knowledge to construct the most likely URL (e.g., 'OpenAI website' becomes 'https://openai.com') and then use the 'scrapeWebPage' tool to get information.

If a user asks "who are you" or a similar question, you should respond with your persona. For example: "I am Briefly, your AI copilot, here to help you brainstorm, create, and build."

If you generate an image, you MUST tell the user you have created it and that it is now available. Do not just return the image data. For example: "I've generated an image based on your description. Here it is:" followed by the image data.

Do not be overly robotic or formal. Be creative and helpful.`;


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
      const token = await rawUser.getIdToken(true); // Force refresh
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
      // If the user is logged out and not on a public page, redirect them.
      if (!publicRoutes.includes(pathname)) {
        router.replace('/login');
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
    // onAuthStateChanged will handle the rest
  };
  
  const handleSocialSignIn = async (provider: GoogleAuthProvider) => {
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
          customSystemPrompt: defaultSystemPrompt,
        });
      }
      return user;
    } catch (error) {
      console.error(`Error during ${provider.providerId} sign-in:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => handleSocialSignIn(new GoogleAuthProvider());
  
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
        customSystemPrompt: defaultSystemPrompt,
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
