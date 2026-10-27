import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, BarChart3, Bot, Headphones, Mic, Pen, Users, Rocket } from "lucide-react";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  const features = [
    {
      title: "Comprehensive Practice",
      description: "Full IELTS test modules including Reading, Listening, Writing, and Speaking",
      icon: <BookOpen className="h-8 w-8 text-brand" />,
    },
    {
      title: "AI-Powered Feedback",
      description: "Get detailed AI evaluation for your writing and speaking with band scores",
      icon: <Bot className="h-8 w-8 text-brand" />,
    },
    {
      title: "Progress Tracking",
      description: "Monitor your improvement with detailed analytics and band score history",
      icon: <BarChart3 className="h-8 w-8 text-brand" />,
    },
    {
      title: "Real Test Simulation",
      description: "Practice with timed tests that simulate the actual IELTS exam conditions",
      icon: <Rocket className="h-8 w-8 text-brand" />,
    },
  ];

  const moduleCards = [
    {
      title: "Reading",
      description: "Practice with academic and general training passages",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/practice/reading",
    },
    {
      title: "Listening",
      description: "Improve your listening skills with audio exercises",
      icon: <Headphones className="h-6 w-6" />,
      href: "/practice/listening",
    },
    {
      title: "Writing",
      description: "Get AI feedback on your essays and reports",
      icon: <Pen className="h-6 w-6" />,
      href: "/practice/writing",
    },
    {
      title: "Speaking",
      description: "Record and get AI evaluation of your speaking skills",
      icon: <Mic className="h-6 w-6" />,
      href: "/practice/speaking",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand to-brand-dark text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.svg')] bg-cover bg-center opacity-10" />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 text-white font-bold text-2xl">
                  BW
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Ace Your IELTS with <span className="text-yellow-300">BandWise</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-lg">
                The most comprehensive IELTS practice platform with AI-powered feedback, 
                real test simulations, and detailed progress tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-white text-brand hover:bg-white/90">
                  <Link href="/auth/signup">
                    Get Started Free
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Link href="/practice">
                    Try a Demo
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-medium">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-white/80">
                  Join <span className="font-semibold">10,000+</span> students who have improved their band scores
                </p>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-10 -right-10 h-20 w-20 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-20 w-20 bg-white/10 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose BandWise?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to achieve your target IELTS band score
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Practice All IELTS Modules
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Master each section with targeted practice and instant feedback
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {moduleCards.map((module, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                      {module.icon}
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{module.description}</CardDescription>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={module.href}>
                      Start Practicing
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Ready to Start Your IELTS Journey?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of students who have improved their IELTS scores with BandWise
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/signup">
                  Create Free Account
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
