"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import Link from 'next/link';

// Define the X icon locally as the original component will be removed
const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 fill-current"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);


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
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="text-3xl">Welcome to BrieflyAI, {user.displayName || 'Creator'}!</CardTitle>
                    <CardDescription>Your account is ready. One last optional step:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-8 border border-dashed rounded-lg bg-secondary/50">
                        <h3 className="text-xl font-semibold text-foreground">Stay in the loop!</h3>
                        <p className="mt-2 text-muted-foreground">Follow us on X for the latest product updates, AI tips, and community news.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button asChild size="lg">
                            <a href="https://x.com/trybrieflyai" target="_blank" rel="noopener noreferrer">
                                <XIcon className="mr-2" />
                                Connect on X
                            </a>
                        </Button>
                        <Button asChild variant="ghost" size="lg">
                            <Link href="/">
                                Skip & Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
