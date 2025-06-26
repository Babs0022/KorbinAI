
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

type TeamRole = 'admin' | 'editor' | 'viewer';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  subscription: Subscription | null;
  subscriptionLoading: boolean;
  userInitials: string;
  displayName: string;
  displayEmail: string;
  avatarUrl:string;
  teamId: string | null;
  teamRole: TeamRole | null;
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
  
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamRole, setTeamRole] = useState<TeamRole | null>(null);

  // Effect 1: Listen for authentication state changes (login/logout)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // Clear all user-specific data on logout
        setSubscription(null);
        setSubscriptionLoading(false);
        setTeamId(null);
        setTeamRole(null);
        setDisplayName("User");
        setDisplayEmail("user@example.com");
        setAvatarUrl(defaultPlaceholderUrl);
        setUserInitials("U");
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect 2: Listen for changes to the user document (e.g., teamId added)
  // and subscription status, only when a user is logged in.
  useEffect(() => {
    if (!currentUser) return;

    // Set user display info immediately
    setDisplayName(currentUser.displayName || currentUser.email?.split('@')[0] || "User");
    setDisplayEmail(currentUser.email || "user@example.com");
    setAvatarUrl(currentUser.photoURL || defaultPlaceholderUrl);
    setUserInitials(
      (currentUser.displayName?.split(" ").map(n => n[0]).join("") || 
       currentUser.email?.charAt(0) || 
       "U"
      ).toUpperCase()
    );

    // --- Listener for User Document (to get teamId) ---
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUserDoc = onSnapshot(userDocRef, (userDocSnap) => {
      const newTeamId = userDocSnap.exists() ? userDocSnap.data().teamId : null;
      setTeamId(newTeamId); // This will trigger the team role listener effect
    });

    // --- Listener for Subscription Document ---
    setSubscriptionLoading(true);
    const subDocRef = doc(db, 'userSubscriptions', currentUser.uid);
    const unsubscribeSub = onSnapshot(subDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().status === 'active') {
        setSubscription({ planId: docSnap.data().planId, status: docSnap.data().status });
      } else {
        setSubscription({ planId: 'free', status: 'active' });
      }
      setSubscriptionLoading(false);
    }, (error) => {
        console.error("Error fetching subscription:", error);
        setSubscription({ planId: 'free', status: 'active' });
        setSubscriptionLoading(false);
    });

    // Cleanup listeners when the user logs out (currentUser becomes null)
    return () => {
      unsubscribeUserDoc();
      unsubscribeSub();
    };
  }, [currentUser]);

  // Effect 3: Listen for changes to the team document, but only when teamId is known.
  useEffect(() => {
    if (!teamId || !currentUser) {
      setTeamRole(null);
      return;
    }

    // --- Listener for Team Document (to get user's role) ---
    const teamDocRef = doc(db, 'teams', teamId);
    const unsubscribeTeamDoc = onSnapshot(teamDocRef, (teamDocSnap) => {
      if (teamDocSnap.exists()) {
        const teamData = teamDocSnap.data();
        const member = teamData.members?.[currentUser.uid];
        setTeamRole(member ? member.role : null);
      } else {
        // The team document was deleted, so reset team state
        setTeamId(null);
        setTeamRole(null);
      }
    });

    // Cleanup listener when teamId changes or user logs out
    return () => unsubscribeTeamDoc();

  }, [teamId, currentUser]);

  const value = {
    currentUser,
    loading,
    subscription,
    subscriptionLoading,
    displayName,
    displayEmail,
    avatarUrl,
    userInitials,
    teamId,
    teamRole,
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
