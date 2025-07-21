
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserSubscription } from "@/types/subscription";

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setSubscription(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const subDocRef = doc(db, "userSubscriptions", user.uid);
        const unsubscribe = onSnapshot(subDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSubscription({
                    ...data,
                    currentPeriodEnd: data.currentPeriodEnd?.toDate(),
                    currentPeriodStart: data.currentPeriodStart?.toDate(),
                } as UserSubscription);
            } else {
                setSubscription(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { subscription, isLoading };
}
