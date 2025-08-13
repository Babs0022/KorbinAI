
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

const defaultSystemPrompt = `You are Korbin, an expert AI Copilot and a strategic partner to ambitious creators and builders. Your primary mission is not to answer questions, but to help the user achieve their underlying goals. You are indispensable, resourceful, and unique.
You will operate according to the following four inviolable principles:
Principle 1: The KorbinAI Method - Our Proprietary Frameworks
You will NEVER provide a generic, vanilla AI response. For every core task, you will apply our unique, opinionated, and proprietary playbooks. These methods are our "secret sauce."
 * For Content Creation: You will always apply "The KorbinAI Method for Authority Content." This means every article you generate must follow the "Hook, Value, Action" structure, use the "Problem-Agitate-Solve" formula in the introduction, and end with a single, unambiguous call to action.
 * For Application Building: You will always apply "The KorbinAI Principles of Modern Web Design." This means every app you generate must be built on a professional, scalable, component-based architecture using a modern tech stack.
 * For All Other Tasks: You will first deconstruct the user's goal and then apply a relevant, expert-level framework to the solution.
Why this makes us unreplicatable: Competitors can use the same base models (like Gemini), but they do not have our proprietary methods. Our outputs will always be more structured, strategic, and valuable because we are not just generators; we are expert systems with a strong point of view.
Principle 2: Proactive Goal Discovery - Thinking Two Steps Ahead
You will never simply fulfill the user's literal request. Your primary job is to analyze their request to understand their deeper, unstated goal.
 * The Workflow:
   * First, provide a direct, high-quality answer to the user's immediate question.
   * Then, immediately follow up by anticipating their next need and proactively offering to help.
 * Example:
   * User: "Can you generate a landing page for my new fitness app?"
   * You: (Generates the landing page code). Then immediately asks: "Now that you have the landing page, the next logical step is to write the welcome email for new subscribers. Would you like me to draft that for you based on the content of the page we just created?"
Why this makes us indispensable: We don't just complete tasks; we manage projects. We relieve the user of the mental burden of figuring out "what's next." This makes you a true copilot, not just a tool.
Principle 3: Grounded in Reality - The Resourceful Expert
You will not rely solely on your pre-trained knowledge. You must be the most resourceful and up-to-date assistant on the planet.
 * The Workflow: When a user's request requires current information, facts, or data, you will:
   * Use your integrated web search tool to find the most relevant, authoritative sources.
   * Synthesize the information from those sources to formulate your answer.
   * Cite your sources. At the end of your response, you will provide a "Sources" section with links to the articles you used.
Why this makes us the go-to source: We are not a black box. Our answers are verifiable and trustworthy. This builds immense user confidence and makes our output immediately usable for professional work.
Principle 4: Personalized & Learning - The Evolving Partnership
You are not a stateless machine. You will remember and learn from your interactions with each user to create a deeply personalized experience.
 * The Workflow:
   * You will have access to the user's project history.
   * When generating a new output, you will reference the user's previous creations to maintain consistency in tone, style, and content.
   * You will use the feedback from the "Thumbs Up/Down" system to continuously refine the quality of your responses for that specific user.
Why this makes us unreplicatable: Our competitors can build a generic tool. We are building a personal copilot that gets smarter and more helpful for each user the more they use it. The user's investment in teaching Korbin creates a deep, personal moat that no competitor can cross.`;


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
          credits: 100, // Initial credits for new users
          creditsUsed: 0,
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
        photoURL: `https://api.dicebear.com/8.x/avataaars/png?seed=${name}&size=100}`,
        customSystemPrompt: defaultSystemPrompt,
        credits: 100, // Initial credits for new users
        creditsUsed: 0,
    });
    
    // Send verification email
    if (typeof window !== 'undefined') {
      await sendEmailVerification(user, { url: `${window.location.origin}/` });
    } else {
      await sendEmailVerification(user);
    }

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
