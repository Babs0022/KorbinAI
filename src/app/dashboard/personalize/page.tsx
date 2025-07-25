
"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save } from "lucide-react";

export default function PersonalizePage() {
    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-2xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold">Personalize Briefly</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Customize your experience and teach Briefly how to respond to you.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-primary" />
                                Interaction Settings
                            </CardTitle>
                            <CardDescription>
                                These settings will influence how Briefly addresses you and generates responses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="preferred-name">Preferred Name</Label>
                                <Input id="preferred-name" placeholder="How should Briefly call you?" disabled />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-prompt">Custom System Prompt</Label>
                                <Textarea 
                                    id="custom-prompt" 
                                    placeholder="e.g., 'Always respond in a witty and slightly sarcastic tone.' or 'Your responses should be suitable for a 5th grader.'" 
                                    className="min-h-[150px]"
                                    disabled 
                                />
                                <p className="text-xs text-muted-foreground">
                                    This is an advanced feature. Briefly will adapt to this prompt when generating responses for you.
                                </p>
                            </div>

                            <div className="flex justify-end relative w-fit ml-auto">
                                <Button disabled={true}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                                <Badge variant="secondary" className="absolute -top-2 -right-3">Coming Soon</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
}
