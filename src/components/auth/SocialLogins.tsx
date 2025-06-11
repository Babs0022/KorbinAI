
"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Chrome } from "lucide-react"; // Using Chrome icon as a placeholder for Google
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function SocialLogins({ type }: { type: "login" | "signup" }) {
  const { toast } = useToast();
  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast({
        title: "Google Sign-In Successful",
        description: "Welcome to BrieflyAI!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google Sign-In cancelled.";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email using a different sign-in method.";
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
      <div className="my-4 flex items-center">
        <Separator className="flex-grow" />
        <span className="mx-4 text-xs text-muted-foreground">OR CONTINUE WITH</span>
        <Separator className="flex-grow" />
      </div>
      <Button 
        variant="default" 
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90" 
        onClick={handleGoogleLogin}
      >
        <Chrome className="mr-2 h-4 w-4" /> {/* Replace with a proper Google icon if available or SVG */}
        {type === "login" ? "Login with Google" : "Sign up with Google"}
      </Button>
    </>
  );
}
