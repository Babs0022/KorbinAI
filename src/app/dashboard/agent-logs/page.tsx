
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAgentLogsForUser } from "@/services/agentLogService";
import type { AgentLog } from "@/types/agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Server, Power, PowerOff, ListRestart, Terminal, CircleDashed } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const logTypeIcons: Record<AgentLog['type'], React.ReactNode> = {
    'start': <Power className="h-4 w-4 text-green-500" />,
    'info': <FileText className="h-4 w-4 text-blue-500" />,
    'tool_start': <Server className="h-4 w-4 text-yellow-500" />,
    'tool_end': <Server className="h-4 w-4 text-yellow-500" />,
    'result': <Terminal className="h-4 w-4 text-purple-500" />,
    'finish': <PowerOff className="h-4 w-4 text-red-500" />,
    'error': <CircleDashed className="h-4 w-4 text-red-500" />,
};

const LogSkeleton = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
    </div>
);

const EmptyState = () => (
     <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl">
        <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Agent Logs Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            Use the "Agent" mode in the chat to start a new task. Its progress will appear here.
        </p>
    </div>
);

export default function AgentLogsPage() {
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const userLogs = await getAgentLogsForUser(user.uid);
            setLogs(userLogs);
        } catch (error) {
            console.error("Failed to fetch agent logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }
        fetchLogs();
    }, [user, authLoading]);

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-4xl mx-auto">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold">Agent Logs</h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                Follow the agent's step-by-step progress.
                            </p>
                        </div>
                        <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
                            <ListRestart className="mr-2 h-4 w-4" />
                            Refresh Logs
                        </Button>
                    </div>

                    {isLoading ? (
                         <LogSkeleton />
                    ) : logs.length === 0 ? (
                        <EmptyState />
                    ) : (
                         <div className="space-y-4">
                            {logs.map((log) => (
                                <Card key={log.id} className="bg-secondary/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {logTypeIcons[log.type] || <Bot />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-mono text-sm text-foreground">{log.message}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                </p>
                                                {log.data && (
                                                    <pre className="mt-2 text-xs bg-background p-2 rounded-md overflow-x-auto">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                         </div>
                    )}
                </div>
            </main>
        </DashboardLayout>
    );
}
