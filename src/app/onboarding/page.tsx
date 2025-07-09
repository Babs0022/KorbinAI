"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import Link from 'next/link';

export default function OnboardingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <LoaderCircle className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    if (!user) {
        router.replace('/login');
        return null; // or a loading spinner
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Welcome to BrieflyAI, {user.displayName}!</CardTitle>
                    <CardDescription>Let's get your account set up for success.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <p>This is where the onboarding flow will go. We can ask the user about their role, what they want to achieve, etc. to personalize their experience.</p>
                    
                    <div className="p-8 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">Onboarding steps would appear here.</p>
                    </div>

                    <Button asChild size="lg">
                        <Link href="/">
                            Go to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
