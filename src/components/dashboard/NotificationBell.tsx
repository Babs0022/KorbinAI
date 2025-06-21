
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export function NotificationBell() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const announcementsQuery = query(collection(db, 'appAnnouncements'), orderBy('timestamp', 'desc'), limit(10));
      const querySnapshot = await getDocs(announcementsQuery);
      const fetchedAnnouncements = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let timestampStr = new Date().toISOString();
        if (data.timestamp instanceof Timestamp) {
          timestampStr = data.timestamp.toDate().toISOString();
        }
        return {
          id: docSnap.id,
          title: data.title || 'Update',
          content: data.content || 'No content available.',
          timestamp: timestampStr
        } as Announcement;
      });
      setAnnouncements(fetchedAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements for bell:", error);
      // Don't show a toast for this, as it's a background element.
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isOpen) {
      fetchAnnouncements();
    }
  }, [currentUser, isOpen, fetchAnnouncements]);
  
  if (!currentUser) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle notifications">
          <Bell className="h-5 w-5" />
          {/* Future feature: Add a red dot for unread notifications */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm text-foreground">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : announcements.length > 0 ? (
              announcements.map(announcement => (
                <div key={announcement.id} className="text-sm">
                  <p className="font-semibold text-foreground mb-1">{announcement.title}</p>
                  <p className="text-muted-foreground text-xs mb-1">{announcement.content}</p>
                  <p className="text-muted-foreground/70 text-[10px]">
                    {new Date(announcement.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No new notifications.</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
