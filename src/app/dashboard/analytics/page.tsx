"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspaceAnalytics } from "@/services/workspaceService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import { BarChart2, BrainCircuit, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const typeDisplayNames: { [key: string]: string } = {
  'written-content': 'Written Content',
  'prompt': 'Prompts',
  'component-wizard': 'Apps/Pages',
  'structured-data': 'Structured Data',
  'N/A': 'None'
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const data = await getWorkspaceAnalytics({ userId: user.uid });
                setAnalyticsData(data);
            } catch (error) {
                console.error("Failed to fetch analytics data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, authLoading]);

    if (authLoading || isLoading) {
        return (
            <DashboardLayout>
                <main className="flex-1 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <Skeleton className="h-10 w-72 mb-2" />
                        <Skeleton className="h-6 w-96 mb-10" />
                        <div className="grid gap-6 md:grid-cols-3">
                            <Skeleton className="h-[120px]" />
                            <Skeleton className="h-[120px]" />
                            <Skeleton className="h-[120px]" />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Skeleton className="h-[350px]" />
                            <Skeleton className="h-[350px]" />
                        </div>
                    </div>
                </main>
            </DashboardLayout>
        );
    }
    
    if (!user) {
        return (
            <DashboardLayout>
                <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                    <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <CardTitle>Access Denied</CardTitle>
                            <CardDescription>You need to be signed in to view your analytics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/login">Sign In</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </DashboardLayout>
        )
    }

    if (!analyticsData || analyticsData.totalGenerations === 0) {
        return (
            <DashboardLayout>
                <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                     <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <CardTitle>No Data Yet</CardTitle>
                            <CardDescription>Start creating content to see your analytics here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/">Create Something New</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold">Your Analytics</h1>
                    <p className="text-muted-foreground mt-2 mb-10">
                        An overview of your creative activity on BrieflyAI.
                    </p>

                    <div className="grid gap-6 md:grid-cols-3 mb-8">
                        <StatCard title="Total Generations" value={analyticsData.totalGenerations} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                        <StatCard title="Favorite Tool" value={typeDisplayNames[analyticsData.favoriteTool]} icon={<BrainCircuit className="h-4 w-4 text-muted-foreground" />} />
                        <StatCard title="Generations (7 days)" value={analyticsData.activityLast7Days.reduce((acc: number, day: any) => acc + day.count, 0)} icon={<BarChart2 className="h-4 w-4 text-muted-foreground" />} />
                    </div>
                    
                    <AnalyticsCharts analyticsData={analyticsData} />

                </div>
            </main>
        </DashboardLayout>
    );
}
