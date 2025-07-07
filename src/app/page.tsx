
"use client";

import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feather, Code2, LayoutTemplate, Image, Bolt, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      icon: <Bolt className="h-8 w-8" />,
      title: "Prompt Generator",
      subtitle: "Craft optimized prompts for any task",
      href: "/prompt-generator",
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
      icon: <Code2 className="h-8 w-8" />,
      title: "Structured Data",
      subtitle: "JSON for components, CSV lists",
      href: "/structured-data",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-1 items-center justify-center">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl text-center">
          <h1 className="mb-12 text-4xl font-bold md:text-5xl">
            What would you like to create today?
          </h1>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
            {creationOptions.map((option, index) => (
              <Link
                href={option.href}
                key={option.title}
                className={cn(
                  "group",
                  index < 2 ? "lg:col-span-3" : "lg:col-span-2"
                )}
              >
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
