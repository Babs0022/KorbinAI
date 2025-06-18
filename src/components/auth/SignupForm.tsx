
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
        where("code", "==", codeToValidate),
        where("isActive", "==", true)
      );
      const referralSnapshot = await getDocs(referralQuery);

      if (referralSnapshot.empty) {
        toast({
          title: "Invalid Referral Code",
          description: "The referral code entered is not valid or has expired. Please check the code and try again.",
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

        // Update referral code usage in a batch
        const batch = writeBatch(db);
        const referralCodeRef = doc(db, "referralCodes", referralDoc.id);
        
        const updateData: { usersReferred: any; usesLeft?: any; lastUsedAt: any } = {
          usersReferred: arrayUnion(newUser.uid),
          lastUsedAt: Timestamp.now(),
        };
        if (referralData.usesLeft !== undefined) {
            updateData.usesLeft = increment(-1);
        }
        batch.update(referralCodeRef, updateData);
        
        // Store referredBy information on the new user's profile/doc
        const userDocRef = doc(db, "users", newUser.uid); 
        batch.set(userDocRef, {
            uid: newUser.uid,
            email: newUser.email,
            displayName: name,
            createdAt: Timestamp.now(),
            referredByCode: codeToValidate, // Store the validated (uppercase) code
            referrerUid: referralData.userId, 
        }, { merge: true });

        await batch.commit();
      }
      
      toast({
        title: "Account Created!",
        description: "Welcome to BrieflyAI. Let's get you started.",
      });
      router.push("/onboarding"); // Redirect to onboarding flow

    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use. Please try another or log in.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else if (error.message.includes("referral code")) { 
        errorMessage = error.message;
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
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
