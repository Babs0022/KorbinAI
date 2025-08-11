
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingVerificationRequests, approveVerificationRequest, denyVerificationRequest } from '@/services/adminService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoaderCircle, CheckCircle, XCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface VerificationRequest {
    id: string;
    userId: string;
    tweetUrl: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    userName?: string;
    userEmail?: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check for admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
    }

    const adminRef = doc(db, 'admins', user.uid);
    const unsubscribe = onSnapshot(adminRef, (docSnap) => {
        setIsAdmin(docSnap.exists());
    });
    
    return () => unsubscribe();
  }, [user, authLoading]);
  
  // Fetch pending requests if user is an admin
  useEffect(() => {
      if (isAdmin === true && user) {
          setIsLoading(true);
          getPendingVerificationRequests(user.uid)
            .then(setRequests)
            .catch(err => {
                toast({ variant: 'destructive', title: 'Error', description: err.message });
            })
            .finally(() => setIsLoading(false));
      } else if (isAdmin === false) {
          setIsLoading(false);
      }
  }, [isAdmin, user, toast]);

  const handleApprove = async (requestUserId: string) => {
    if (!user) return;
    setIsProcessing(requestUserId);
    try {
      await approveVerificationRequest(user.uid, requestUserId);
      toast({ title: 'Request Approved', description: 'User has been verified.' });
      setRequests(prev => prev.filter(r => r.userId !== requestUserId));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeny = async (requestUserId: string) => {
    if (!user) return;
    setIsProcessing(requestUserId);
    try {
      await denyVerificationRequest(user.uid, requestUserId);
      toast({ title: 'Request Denied' });
      setRequests(prev => prev.filter(r => r.userId !== requestUserId));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessing(null);
    }
  };
  
  const renderContent = () => {
      if (isLoading || isAdmin === null) {
          return (
            <div className="flex items-center justify-center py-16">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          )
      }

      if (!isAdmin) {
          return (
            <Card className="mt-8 border-destructive bg-destructive/10">
                <CardHeader className="text-center">
                    <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                    <CardDescription className="text-destructive/80">You do not have permission to view this page.</CardDescription>
                </CardHeader>
            </Card>
          )
      }

      return (
          <Card>
            <CardHeader>
              <CardTitle>Pending Verification Requests</CardTitle>
              <CardDescription>Review the submissions below to approve or deny verification checkmarks.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Tweet Link</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.userName}</div>
                        <div className="text-sm text-muted-foreground">{req.userEmail}</div>
                      </TableCell>
                      <TableCell>{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</TableCell>
                      <TableCell>
                        <a href={req.tweetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          View Tweet <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-500 hover:text-green-500 hover:bg-green-500/10"
                          onClick={() => handleApprove(req.userId)}
                          disabled={isProcessing === req.userId}
                        >
                          {isProcessing === req.userId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          <span className="ml-2">Approve</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => handleDeny(req.userId)}
                          disabled={isProcessing === req.userId}
                        >
                          {isProcessing === req.userId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          <span className="ml-2">Deny</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                            No pending requests. Great job!
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">User and application management.</p>
          <div className="mt-8">
            {renderContent()}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
