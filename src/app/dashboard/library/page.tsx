"use client";

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getImageLibrary } from '@/services/imageLibraryService';
import type { ImageLibraryEntry } from '@/types/imageLibrary';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoaderCircle, Image as ImageIcon, Download, PlusCircle } from 'lucide-react';

const ImageCardSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
    </div>
);

const EmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed rounded-lg col-span-full">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Your Image Library is Empty</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            Generated images will appear here automatically.
        </p>
        <Button asChild className="mt-6">
            <Link href="/image-generator">
                <PlusCircle className="mr-2 h-4 w-4" />
                Generate an Image
            </Link>
        </Button>
    </div>
);

export default function LibraryPage() {
    const { user, loading: authLoading } = useAuth();
    const [images, setImages] = useState<ImageLibraryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchImages = async () => {
            try {
                const data = await getImageLibrary({ userId: user.uid });
                setImages(data);
            } catch (error) {
                console.error("Failed to fetch image library:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchImages();
    }, [user, authLoading]);

    if (authLoading) {
        return (
            <DashboardLayout>
                <main className="flex-1 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
                    </div>
                </main>
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout>
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold">Image Library</h1>
                    <p className="text-muted-foreground mt-2 mb-10">
                        A gallery of all the images you've generated.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {isLoading ? (
                            [...Array(8)].map((_, i) => <ImageCardSkeleton key={i} />)
                        ) : images.length === 0 ? (
                            <EmptyState />
                        ) : (
                            images.flatMap(entry => 
                                entry.imageUrls.map((url, index) => (
                                    <Card key={`${entry.id}-${index}`} className="flex flex-col">
                                        <CardContent className="p-0">
                                            <button 
                                                className="block w-full aspect-square relative group overflow-hidden rounded-t-lg"
                                                onClick={() => setSelectedImage(url)}
                                            >
                                                <NextImage
                                                    src={url}
                                                    alt={entry.prompt}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    data-ai-hint="generated art"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-white font-semibold">View</span>
                                                </div>
                                            </button>
                                        </CardContent>
                                        <CardHeader className="flex-1">
                                            <CardDescription className="line-clamp-2">{entry.prompt}</CardDescription>
                                        </CardHeader>
                                        <CardFooter className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                                        </CardFooter>
                                    </Card>
                                ))
                            )
                        )}
                    </div>
                </div>

                <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Image Preview</DialogTitle>
                        </DialogHeader>
                        {selectedImage && (
                            <div className="space-y-4">
                                <div className="relative aspect-square w-full">
                                <NextImage
                                        src={selectedImage}
                                        alt="Selected generated image"
                                        fill
                                        className="rounded-md object-contain"
                                />
                                </div>
                                <a href={selectedImage} download={`brieflyai-image-${Date.now()}.png`}>
                                    <Button className="w-full">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Image
                                    </Button>
                                </a>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </DashboardLayout>
    );
}
