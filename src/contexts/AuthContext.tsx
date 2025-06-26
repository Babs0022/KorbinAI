
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

  const fetchTeamInfo = useCallback(async (user: FirebaseUser) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().teamId) {
      const currentTeamId = userDocSnap.data().teamId;
      setTeamId(currentTeamId);

      const teamDocRef = doc(db, 'teams', currentTeamId);
      const teamDocSnap = await getDoc(teamDocRef);

      if (teamDocSnap.exists()) {
        const teamData = teamDocSnap.data();
        const member = teamData.members?.[user.uid];
        if (member) {
          setTeamRole(member.role);
        } else {
          // This logic can be expanded to handle pending invites
          setTeamRole(null);
        }
      }
    } else {
      setTeamId(null);
      setTeamRole(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
        
        await fetchTeamInfo(user);
        
        setSubscriptionLoading(true);
        const subDocRef = doc(db, 'userSubscriptions', user.uid);
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

        return () => unsubscribeSub();

      } else {
        setDisplayName("User");
        setDisplayEmail("user@example.com");
        setAvatarUrl(defaultPlaceholderUrl);
        setUserInitials("U");
        setSubscription(null);
        setSubscriptionLoading(false);
        setTeamId(null);
        setTeamRole(null);
      }
    });

    return () => unsubscribe();
  }, [fetchTeamInfo]);

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

    