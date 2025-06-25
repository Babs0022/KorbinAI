
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLogins } from "./SocialLogins";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2 } from "lucide-react"; // Added Loader2
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
          // User signed up with email/password but email is not verified
          await sendEmailVerification(user); // Resend verification email
          toast({
            title: "Email Not Verified",
            description: `A new verification link has been sent to ${user.email}. Please check your inbox to verify your account before logging in.`,
            variant: "destructive",
            duration: 10000,
          });
          setIsLoading(false);
          router.push(`/verify-email?email=${encodeURIComponent(user.email || '')}`);
          return; // Prevent further action
        }

        // Email is verified or it's a social login (where Firebase handles verification status)
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/dashboard");
      } else {
         // Should not happen if signInWithEmailAndPassword resolves, but as a safeguard
        throw new Error("User object not found after login.");
      }

    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many login attempts. Please try again later or reset your password.";
      }
      // Other specific Firebase error codes can be handled here
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="#" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
           <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : "Login"}
      </Button>
      <SocialLogins type="login" />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
