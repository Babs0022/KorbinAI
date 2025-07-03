import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feather, Code2, LayoutTemplate, Image } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const creationOptions = [
    {
      icon: <Feather className="h-8 w-8" />,
      title: "Written Content",
      subtitle: "Blog posts, emails, social media updates",
      href: "#",
    },
    {
      icon: <Code2 className="h-8 w-8" />,
      title: "Structured Data",
      subtitle: "JSON for components, CSV lists",
      href: "#",
    },
    {
      icon: <LayoutTemplate className="h-8 w-8" />,
      title: "Web Component",
      subtitle: "Forms, galleries, hero sections",
      href: "/component-wizard",
    },
    {
      icon: <Image className="h-8 w-8" />,
      title: "Image & Logo Ideas",
      subtitle: "Generate concepts and prompts",
      href: "#",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl text-center">
        <h1 className="mb-12 text-4xl font-bold md:text-5xl">
          What would you like to create today?
        </h1>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {creationOptions.map((option) => (
            <Link href={option.href} key={option.title} className="group">
              <Card className="flex h-full transform flex-col items-start bg-card/50 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/80 hover:bg-card">
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
  );
}
