
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getLogsForUser } from "@/services/loggingService";
import type { BrieflyLog } from "@/types/logs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Bot, ListRestart, CheckCircle, PlayCircle, BrainCircuit, ListChecks, RefreshCcw, Hourglass, ServerCrash, Wand2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// --- Icon Mappings ---

const phaseIcons: Record<BrieflyLog['phase'], React.ElementType> = {
  'Thinking': BrainCircuit,
  'Planning': ListChecks,
  'Executing': Wand2,
  'Waiting': Hourglass,
  'Correcting': RefreshCcw,
  'Completed': CheckCircle,
};

const statusIcons: Record<BrieflyLog['status'], { icon: React.ElementType, color: string }> = {
    'started': { icon: PlayCircle, color: "text-blue-400" },
    'completed': { icon: CheckCircle, color: "text-green-400" },
    'failed': { icon: ServerCrash, color: "text-red-400" },
    'retrying': { icon: RefreshCcw, color: "text-orange-400" },
    'waiting': { icon: Hourglass, color: "text-yellow-400" },
};


// --- UI Components ---

const LogSkeleton = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
    </div>
);

const EmptyState = () => (
     <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl">
        <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Agent Logs Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            Execute a task in Agent Mode. Its detailed thought process will appear here.
        </p>
    </div>
);

const DataViewer = ({ data }: { data?: BrieflyLog['data'] }) => {
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    const content = JSON.stringify(data, null, 2);
    if (content === '{}') {
        return null;
    }

    return (
        <details className="mt-2 group">
            <summary className="cursor-pointer text-xs text-muted-foreground group-hover:text-foreground">
                View Data
            </summary>
            <div className="mt-1 text-xs bg-background p-3 rounded-md border overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">
                    {content}
                </pre>
            </div>
        </details>
    );
};


// --- Main Page Component ---

type GroupedLogs = Record<string, BrieflyLog[]>;

export default function AgentLogsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [logs, setLogs] = useState<BrieflyLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const userLogs = await getLogsForUser(user.uid);
            setLogs(userLogs);
        } catch (error) {
            console.error("Failed to fetch agent logs:", error);
            toast({
                title: "Error",
                description: "Could not fetch agent logs.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) {
            fetchLogs();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchLogs]);

    const groupedLogs = useMemo(() => {
        const groups: GroupedLogs = logs.reduce((acc, log) => {
            const traceId = log.traceId;
            if (!acc[traceId]) {
                acc[traceId] = [];
            }
            acc[traceId].push(log);
            return acc;
        }, {} as GroupedLogs);

        const sortedGroups = Object.entries(groups).sort(([, groupA], [, groupB]) => {
            const timeA = new Date(groupA[0]?.metadata.timestamp || 0).getTime();
            const timeB = new Date(groupB[0]?.metadata.timestamp || 0).getTime();
            return timeB - timeA;
        });

        return Object.fromEntries(sortedGroups);
    }, [logs]);

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold">Agent Logs</h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                An inside look at the agent's thought process for each task.
                            </p>
                        </div>
                        <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
                            <ListRestart className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>

                    {isLoading ? (
                        <LogSkeleton />
                    ) : Object.keys(groupedLogs).length === 0 ? (
                        <EmptyState />
                    ) : (
                        <Accordion type="multiple" className="w-full space-y-4">
                            {Object.entries(groupedLogs).map(([traceId, logGroup]) => {
                                const firstLog = logGroup[0];
                                const finalLog = logGroup[logGroup.length - 1];
                                const finalStatus = finalLog.status;
                                const userPrompt = firstLog?.message.match(/Agent started for prompt: "([^"]+)"/)?.[1] || "Agent Task";


                                return (
                                    <AccordionItem key={traceId} value={traceId} className="border rounded-lg overflow-hidden">
                                        <AccordionTrigger className="p-4 bg-secondary/50 hover:bg-secondary/80 hover:no-underline data-[state=open]:border-b data-[state=open]:rounded-b-none">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left w-full">
                                                <div className={cn("mt-1 sm:mt-0", statusIcons[finalStatus]?.color || "text-gray-400")}>
                                                    {statusIcons[finalStatus] ? <statusIcons[finalStatus].icon className="h-5 w-5" /> : <Bot className="h-5 w-5"/>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-sm font-semibold text-foreground break-words">{userPrompt}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDistanceToNow(new Date(firstLog.metadata.timestamp), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="shrink-0">{finalLog.phase}</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="bg-background">
                                            <div className="p-4 space-y-0">
                                                {logGroup.map((log, index) => {
                                                    const isLast = index === logGroup.length - 1;
                                                    const PhaseIcon = phaseIcons[log.phase] || Bot;
                                                   
                                                    return (
                                                        <div key={log.id} className="flex items-start gap-4">
                                                            <div className="flex flex-col items-center h-full">
                                                                <div className={cn("rounded-full p-1.5 bg-secondary/80 z-10", statusIcons[log.status]?.color || 'text-muted-foreground')}>
                                                                     <PhaseIcon className="h-5 w-5" />
                                                                </div>
                                                                {!isLast && <div className="flex-1 w-px bg-border -mt-1"></div>}
                                                            </div>
                                                            <div className="flex-1 min-w-0 pb-8 -mt-1.5">
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <Badge variant="secondary">{log.phase}</Badge>
                                                                    <span className="text-xs text-muted-foreground">{log.flowName}</span>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mt-1 break-words">{log.message}</p>
                                                                <DataViewer data={log.data} />
                                                                <p className="text-xs text-muted-foreground mt-2">
                                                                    {format(new Date(log.metadata.timestamp), "HH:mm:ss.SSS")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}
                </div>
            </main>
        </DashboardLayout>
    );
}
