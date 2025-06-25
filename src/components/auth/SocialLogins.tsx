
"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Chrome } from "lucide-react"; // Using Chrome icon as a placeholder for Google
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, type UserCredential } from "firebase/auth";
import { doc, setDoc, Timestamp, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getAdditionalUserInfo } from "firebase/auth"; // Import for isNewUser check

export function SocialLogins({ type }: { type: "login" | "signup" }) {
  const { toast } = useToast();
  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      if (user) {
        if (additionalInfo?.isNewUser) {
          // This is a new user, create their document in Firestore
          const userDocRef = doc(db, "users", user.uid);
          // Check if document already exists (e.g. from a rapidly succeeding auth state change listener)
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
             await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || "New User",
                photoURL: user.photoURL || null,
                createdAt: Timestamp.now(),
             }, { merge: true });
          }
          toast({
            title: "Account Created with Google!",
            description: "Welcome to BrieflyAI. Let's get you started.",
          });
          router.push("/onboarding"); // Direct new social users to onboarding
        } else {
          // Existing user
          toast({
            title: "Google Sign-In Successful",
            description: "Welcome back to BrieflyAI!",
          });
          router.push("/dashboard"); // Direct existing users to dashboard
        }
      } else {
        throw new Error("User object not found after Google sign-in.");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google Sign-In cancelled.";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email using a different sign-in method. Please log in with that method.";
      } else if (error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-blocked") {
        errorMessage = "Google Sign-In popup was blocked or cancelled. Please ensure popups are allowed and try again.";
      }
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-x-4">
        <Separator orientation="horizontal" />
        <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
        <Separator orientation="horizontal" />
      </div>
      <Button 
        variant="default" 
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90" 
        onClick={handleGoogleLogin}
        type="button" // Ensure it doesn't submit the parent form if nested
      >
        <Chrome className="mr-2 h-4 w-4" />
        {type === "login" ? "Login with Google" : "Sign up with Google"}
      </Button>
    </>
  );
}
