
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getLogsForUser } from "@/services/loggingService";
import type { BrieflyLog } from "@/types/logs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Server, Power, PowerOff, ListRestart, Terminal, CircleDashed, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Hourglass } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";

const logIcons: Record<BrieflyLog['level'], { icon: React.ReactNode, color: string }> = {
    'info': { icon: <FileText className="h-4 w-4" />, color: "text-blue-400" },
    'warn': { icon: <AlertCircle className="h-4 w-4" />, color: "text-yellow-400" },
    'error': { icon: <AlertCircle className="h-4 w-4" />, color: "text-red-400" },
    'debug': { icon: <Terminal className="h-4 w-4" />, color: "text-purple-400" },
};

const statusIcons: Record<BrieflyLog['status'], { icon: React.ReactNode, color: string }> = {
    'started': { icon: <Hourglass className="h-4 w-4" />, color: "text-yellow-400" },
    'completed': { icon: <CheckCircle className="h-4 w-4" />, color: "text-green-400" },
    'failed': { icon: <AlertCircle className="h-4 w-4" />, color: "text-red-400" },
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

type GroupedLogs = Record<string, BrieflyLog[]>;

export default function AgentLogsPage() {
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<BrieflyLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const userLogs = await getLogsForUser(user.uid);
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

    const groupedLogs = useMemo(() => {
        return logs.reduce((acc, log) => {
            const traceId = log.traceId;
            if (!acc[traceId]) {
                acc[traceId] = [];
            }
            acc[traceId].push(log);
            return acc;
        }, {} as GroupedLogs);
    }, [logs]);

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-4xl mx-auto">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold">Agent Logs</h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                Follow the agent's step-by-step progress for each request.
                            </p>
                        </div>
                        <Button variant="outline" onClick={fetchLogs} disabled={isLoading} className="w-full sm:w-auto">
                            <ListRestart className="mr-2 h-4 w-4" />
                            Refresh Logs
                        </Button>
                    </div>

                    {isLoading ? (
                         <LogSkeleton />
                    ) : Object.keys(groupedLogs).length === 0 ? (
                        <EmptyState />
                    ) : (
                         <Accordion type="multiple" className="w-full space-y-4">
                            {Object.entries(groupedLogs).map(([traceId, logGroup]) => {
                                const parentLog = logGroup.find(l => l.status === 'started') || logGroup[0];
                                const childLogs = logGroup.filter(l => l.id !== parentLog.id);
                                const finalStatus = logGroup.find(l => l.status === 'failed') ? 'failed' :
                                                    logGroup.find(l => l.status === 'completed') ? 'completed' : 'started';

                                return (
                                    <AccordionItem key={traceId} value={traceId} className="border-b-0">
                                        <AccordionTrigger className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 hover:no-underline data-[state=open]:rounded-b-none">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left w-full">
                                                <div className={cn("mt-1 sm:mt-0", statusIcons[finalStatus].color)}>
                                                    {statusIcons[finalStatus].icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-sm font-semibold text-foreground break-words">{parentLog.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDistanceToNow(new Date(parentLog.metadata.timestamp), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="shrink-0">{parentLog.flowName}</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="bg-secondary/30 rounded-b-lg p-4">
                                            <div className="pl-6 border-l-2 border-dashed border-border ml-2 space-y-4">
                                                {childLogs.map(log => (
                                                    <div key={log.id} className="flex items-start gap-4">
                                                        <div className={cn("mt-1", logIcons[log.level].color)}>
                                                            {logIcons[log.level].icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-mono text-sm text-foreground break-words">{log.message}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {format(new Date(log.metadata.timestamp), "HH:mm:ss.SSS")}
                                                            </p>
                                                             {log.data && (
                                                                <details className="mt-2">
                                                                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">View Data</summary>
                                                                    <pre className="mt-1 text-xs bg-background p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                                                                        {JSON.stringify(log.data, null, 2)}
                                                                    </pre>
                                                                </details>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {childLogs.length === 0 && <p className="text-sm text-muted-foreground">No detailed steps recorded.</p>}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                         </Accordion>
                    )}
                </div>
            </main>
        </DashboardLayout>
    );
}
