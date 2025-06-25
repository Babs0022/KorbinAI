
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface Subscription {
  planId: string;
  status: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  subscription: Subscription | null;
  subscriptionLoading: boolean;
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
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [displayName, setDisplayName] = useState("User");
  const [displayEmail, setDisplayEmail] = useState("user@example.com");
  const [avatarUrl, setAvatarUrl] = useState(defaultPlaceholderUrl);
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        setDisplayName(user.displayName || user.email?.split('@')[0] || "User");
        setDisplayEmail(user.email || "user@example.com");
        setAvatarUrl(user.photoURL || defaultPlaceholderUrl); 
        setUserInitials(
          (user.displayName?.split(" ").map(n => n[0]).join("") || 
           user.email?.charAt(0) || 
           "U"
          ).toUpperCase()
        );
        
        // Listen for subscription changes
        setSubscriptionLoading(true);
        const subDocRef = doc(db, 'userSubscriptions', user.uid);
        const unsubscribeSub = onSnapshot(subDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().status === 'active') {
            setSubscription({ planId: docSnap.data().planId, status: docSnap.data().status });
          } else {
            // No active subscription found, default to free
            setSubscription({ planId: 'free', status: 'active' });
          }
          setSubscriptionLoading(false);
        }, (error) => {
            console.error("Error fetching subscription:", error);
            setSubscription({ planId: 'free', status: 'active' }); // Default to free on error
            setSubscriptionLoading(false);
        });

        return () => unsubscribeSub(); // Cleanup subscription listener on user change

      } else {
        // No user, clear all data
        setDisplayName("User");
        setDisplayEmail("user@example.com");
        setAvatarUrl(defaultPlaceholderUrl);
        setUserInitials("U");
        setSubscription(null);
        setSubscriptionLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    subscription,
    subscriptionLoading,
    displayName,
    displayEmail,
    avatarUrl,
    userInitials
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
