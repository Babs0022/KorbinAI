
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLogins } from "./SocialLogins";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Ticket } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, doc, writeBatch, Timestamp, increment, arrayUnion } from "firebase/firestore";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!referralCode.trim()) {
      toast({
        title: "Referral Code Required",
        description: "Please enter a valid referral code to sign up.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Validate referral code (case-insensitive)
      const codeToValidate = referralCode.trim().toUpperCase();
      const referralQuery = query(
        collection(db, "referralCodes"),
        where("code", "==", codeToValidate), // Query with uppercase
        where("isActive", "==", true)
      );
      const referralSnapshot = await getDocs(referralQuery);

      if (referralSnapshot.empty) {
        toast({
          title: "Invalid Referral Code",
          description: "The referral code entered is not valid, not active, or does not exist. Please check the code and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const referralDoc = referralSnapshot.docs[0];
      const referralData = referralDoc.data();

      if (referralData.usesLeft !== undefined && referralData.usesLeft <= 0) {
        toast({
          title: "Referral Code Limit Reached",
          description: "This referral code has no uses left.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Proceed with user creation
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      if (newUser) {
        await updateProfile(newUser, {
          displayName: name,
        });

        // Update referral code usage and create user document in a batch
        const batch = writeBatch(db);
        const referralCodeRef = doc(db, "referralCodes", referralDoc.id);
        
        const updateData: { usersReferred: any; usesLeft?: any; lastUsedAt: any } = {
          usersReferred: arrayUnion(newUser.uid),
          lastUsedAt: Timestamp.now(), // Uses client-side timestamp, converted to server by Firestore
        };
        if (referralData.usesLeft !== undefined) { // Only decrement if usesLeft is a defined number
            updateData.usesLeft = increment(-1);
        }
        batch.update(referralCodeRef, updateData);
        
        // Store referredBy information on the new user's profile/doc
        const userDocRef = doc(db, "users", newUser.uid); 
        batch.set(userDocRef, {
            uid: newUser.uid,
            email: newUser.email,
            displayName: name,
            createdAt: Timestamp.now(), // Uses client-side timestamp
            referredByCode: codeToValidate, 
            referrerUid: referralData.userId, // Ensure referralData.userId is valid
        }, { merge: true });

        await batch.commit(); // This is a critical point
      }
      
      toast({
        title: "Account Created!",
        description: "Welcome to BrieflyAI. Let's get you started.",
      });
      router.push("/onboarding"); // Redirect to onboarding flow

    } catch (error: any) {
      console.error("Signup process error:", error);
      let title = "Signup Failed";
      let description = "An unexpected error occurred. Please try again.";

      if (error.code) { // Firebase specific error
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
          case "permission-denied": // Firestore permission error
            description = "Could not finalize signup due to a permission issue. This might be temporary. Please try again. If it persists, contact support.";
            console.error("Firestore Permission Denied during signup batch:", error.message);
            break;
          case "unavailable": // Firestore unavailable
             description = "Our database seems to be temporarily unavailable. Please try again in a few moments.";
             console.error("Firestore unavailable during signup batch:", error.message);
            break;
          default:
            description = `An error occurred (${error.code}). Please try again.`;
            console.error(`Firebase error during signup: ${error.code} - ${error.message}`);
        }
      } else if (error.message && error.message.toLowerCase().includes("referral code")) {
        // Handle custom error messages related to referral codes if thrown explicitly
        title = "Referral Code Issue";
        description = error.message;
      } else {
         console.error("Non-Firebase error during signup:", error.message);
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
      <div className="space-y-2">
        <Label htmlFor="referralCode">Referral Code</Label>
        <div className="relative">
            <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="referralCode"
              type="text"
              placeholder="Enter your invite code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              required
              className="pl-10"
            />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
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

    