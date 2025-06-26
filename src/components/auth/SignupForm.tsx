
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLogins } from "./SocialLogins";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      if (newUser) {
        await updateProfile(newUser, {
          displayName: name,
          photoURL: null, 
        });

        // Send email verification
        await sendEmailVerification(newUser);

        const userDocRef = doc(db, "users", newUser.uid);
        const userData = {
            uid: newUser.uid,
            email: newUser.email,
            displayName: name,
            photoURL: newUser.photoURL || null, 
            createdAt: Timestamp.now(),
            teamId: null, // Initialize teamId for new users
        };
        
        console.log("[SignupForm] Attempting to write user document to Firestore.");
        console.log("[SignupForm] Path:", userDocRef.path);
        console.log("[SignupForm] Data being sent:", JSON.stringify(userData, null, 2));
        console.log("[SignupForm] Current auth state (client-side):", auth.currentUser ? `UID: ${auth.currentUser.uid}` : "No current user on client");


        await setDoc(userDocRef, userData, { merge: true });
        
        console.log("[SignupForm] User document successfully written to Firestore.");

        // Redirect to the verification page instead of showing a toast and going to onboarding
        router.push(`/verify-email?email=${encodeURIComponent(newUser.email || '')}`);
        
      } else {
        throw new Error("User creation failed, no user object returned.");
      }

    } catch (error: any) {
      console.error("[SignupForm] Error during signup process:", error);
      let title = "Signup Failed";
      let description = "An unexpected error occurred. Please try again.";

      if (error.code) {
        title = "Signup Error";
        switch (error.code) {
          case "auth/email-already-in-use":
            description = "This email is already registered. Please log in or use a different email.";
            break;
          case "auth/weak-password":
            description = "Password is too weak. Please choose a stronger one (at least 6 characters).";
            break;
          case "auth/invalid-email":
            description = "The email address is not valid.";
            break;
          case "permission-denied": 
            description = "Could not save user data due to a permissions issue. Please contact support if this persists.";
            console.error("[SignupForm] Firestore Permission Denied during signup:", error.message);
            break;
          default:
            description = `An error occurred (${error.code}). Please try again.`;
            console.error(`[SignupForm] Firebase error during signup: ${error.code} - ${error.message}`);
        }
      } else {
         console.error("[SignupForm] Non-Firebase error during signup:", error.message);
      }

      toast({
        title: title,
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
         <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-10"
            />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
            />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="•••••••• (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10"
            />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>) : "Create Account"}
      </Button>
      <SocialLogins type="signup" />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
