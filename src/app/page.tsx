"use client";

import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feather, Code2, LayoutTemplate, Image, Bolt, LoaderCircle } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { loading } = useAuth();
  
  const creationOptions = [
    {
      icon: <Feather className="h-8 w-8" />,
      title: "Written Content",
      subtitle: "Blog posts, emails, social media updates",
      href: "/written-content",
    },
    {
      icon: <Code2 className="h-8 w-8" />,
      title: "Structured Data",
      subtitle: "JSON for components, CSV lists",
      href: "/structured-data",
    },
    {
      icon: <LayoutTemplate className="h-8 w-8" />,
      title: "Web Page / App",
      subtitle: "Full landing pages, dashboards, etc.",
      href: "/component-wizard",
    },
    {
      icon: <Image className="h-8 w-8" />,
      title: "Image Generator",
      subtitle: "Create unique images from text",
      href: "/image-generator",
    },
    {
      icon: <Bolt className="h-8 w-8" />,
      title: "Prompt Generator",
      subtitle: "Craft optimized prompts for any task",
      href: "/prompt-generator",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // The dashboard is now public. The `DashboardHeader` will show a login
  // button for unauthenticated users.
  return (
    <DashboardLayout>
      <main className="flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl text-center">
          <h1 className="mb-12 text-4xl font-bold md:text-5xl">
            What would you like to create today?
          </h1>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {creationOptions.map((option) => (
              <Link href={option.href} key={option.title} className="group">
                <Card className="flex h-full transform flex-col items-start p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/80 rounded-xl">
                  <div className="mb-4 text-primary">{option.icon}</div>
                  <CardHeader className="p-0">
                    <CardTitle className="text-2xl font-semibold transition-colors duration-300 group-hover:text-primary">
                      {option.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mt-2 p-0">
                    <p className="text-muted-foreground">{option.subtitle}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
