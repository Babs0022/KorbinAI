"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoaderCircle, MailCheck } from "lucide-react";
import AuthLayout from "@/components/shared/AuthLayout";

export default function VerifyEmailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);

    // This effect checks the verification status periodically.
    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/login");
            return;
        }

        const interval = setInterval(async () => {
            await user.reload();
            if (user.emailVerified) {
                clearInterval(interval);
                router.replace("/onboarding");
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [user, loading, router]);


    const handleResendVerification = async () => {
        if (!user) return;
        setIsSending(true);
        try {
            await sendEmailVerification(user, {
                url: `${window.location.origin}/onboarding`,
            });
            toast({
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your email address.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send verification email. Please try again.",
            });
        } finally {
            setIsSending(false);
        }
    };
    
    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading || !user) {
        return (
            <AuthLayout>
                <div className="flex justify-center items-center h-48">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AuthLayout>
        );
    }
    
    // This case handles users who land here but are already verified.
    if (user.emailVerified) {
        router.replace('/onboarding');
        return (
             <AuthLayout>
                <div className="flex justify-center items-center h-48">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <Card>
                <CardHeader className="text-center">
                     <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
                        <MailCheck className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="mt-4">Verify Your Email</CardTitle>
                    <CardDescription>
                        A verification link has been sent to <br />
                        <span className="font-semibold text-foreground">{user.email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Please check your inbox (and spam folder) and click the link to continue. This page will automatically redirect after you've verified.
                    </p>
                    <Button onClick={handleResendVerification} disabled={isSending} className="w-full">
                        {isSending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Resend Verification Email
                    </Button>
                     <Button variant="link" onClick={handleSignOut} className="text-muted-foreground">
                        Sign in with a different account
                    </Button>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
