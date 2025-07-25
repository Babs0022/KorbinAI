
"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Undo, AlertTriangle } from "lucide-react";


export default function TrashPage() {
    // This is a placeholder. In a real implementation, you would fetch deleted items.
    const deletedItems: any[] = [];

    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold">Trash</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Deleted conversations are stored here for 30 days before being permanently removed.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Deleted Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deletedItems.length > 0 ? (
                                <ul className="space-y-4">
                                    {/* Map over deleted items here */}
                                </ul>
                            ) : (
                                <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl">
                                    <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">The trash is empty</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        When you delete a conversation, you'll find it here.
                                    </p>
                                </div>
                            )}
                             <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200">
                                <AlertTriangle className="h-5 w-5 mt-1 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold">This feature is under construction.</p>
                                    <p className="opacity-80">The ability to view and restore deleted conversations is coming soon.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </DashboardLayout>
    );
}
