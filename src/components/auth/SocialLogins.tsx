"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Chrome } from "lucide-react"; // Using Chrome icon as a placeholder for Google

export function SocialLogins({ type }: { type: "login" | "signup" }) {
  const handleGoogleLogin = () => {
    // Placeholder for Firebase Google Auth
    console.log("Attempting Google login/signup...");
    // signInWithPopup(auth, googleProvider)...
  };

  return (
    <>
      <div className="my-6 flex items-center">
        <Separator className="flex-grow" />
        <span className="mx-4 text-xs text-muted-foreground">OR CONTINUE WITH</span>
        <Separator className="flex-grow" />
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
        <Chrome className="mr-2 h-4 w-4" /> {/* Replace with a proper Google icon if available or SVG */}
        {type === "login" ? "Login with Google" : "Sign up with Google"}
      </Button>
    </>
  );
}
