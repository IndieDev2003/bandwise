import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, Pen, Mic, Clock, Star, Lock } from "lucide-react";
import { Test } from "@/types";

export default async function PracticePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // Fetch active tests
  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Group tests by section
  const testsBySection = {
    reading: tests?.filter((t) => t.section === 'reading') || [],
    listening: tests?.filter((t) => t.section === 'listening') || [],
    writing: tests?.filter((t) => t.section === 'writing') || [],
    speaking: tests?.filter((t) => t.section === 'speaking') || [],
  };

  const moduleCards = [
    {
      section: 'reading' as const,
      title: 'Reading',
      description: 'Practice with academic and general training passages',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'bg-blue-100 text-blue-600',
      tests: testsBySection.reading,
    },
    {
      section: 'listening' as const,
      title: 'Listening',
      description: 'Improve your listening skills with audio exercises',
      icon: <Headphones className="h-8 w-8" />,
      color: 'bg-green-100 text-green-600',
      tests: testsBySection.listening,
    },
    {
      section: 'writing' as const,
      title: 'Writing',
      description: 'Get AI feedback on your essays and reports',
      icon: <Pen className="h-8 w-8" />,
      color: 'bg-purple-100 text-purple-600',
      tests: testsBySection.writing,
    },
    {
      section: 'speaking' as const,
      title: 'Speaking',
      description: 'Record and get AI evaluation of your speaking skills',
      icon: <Mic className="h-8 w-8" />,
      color: 'bg-orange-100 text-orange-600',
      tests: testsBySection.speaking,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Practice IELTS Modules</h1>
            <p className="text-muted-foreground">
              Choose a module to start practicing
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                View Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/practice/reading">
                Start Reading Test
              </Link>
            </Button>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {moduleCards.map((module) => {
            const testCount = module.tests.length;
            const isLocked = profile?.subscription_status !== 'pro' && module.section === 'speaking';

            return (
              <Card key={module.section} className={isLocked ? 'opacity-70' : 'hover:shadow-lg transition-shadow'}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      {module.icon}
                    </div>
                    {isLocked && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Pro Only
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mt-2">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available Tests</span>
                      <span className="font-medium">{testCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Time</span>
                      <span className="font-medium">
                        {module.tests.length > 0 
                          ? `${module.tests[0].estimated_time} min` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="w-full"
                    disabled={isLocked}
                  >
                    <Link href={`/practice/${module.section}`}>
                      Start Practicing
                    </Link>
                  </Button>

                  {isLocked && (
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Upgrade to Pro to unlock this module
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Test List by Section */}
        <div className="space-y-6">
          {Object.entries(testsBySection).map(([section, tests]) => {
            if (tests.length === 0) return null;

            const sectionInfo = {
              reading: { title: 'Reading Tests', icon: <BookOpen className="h-5 w-5" /> },
              listening: { title: 'Listening Tests', icon: <Headphones className="h-5 w-5" /> },
              writing: { title: 'Writing Tests', icon: <Pen className="h-5 w-5" /> },
              speaking: { title: 'Speaking Tests', icon: <Mic className="h-5 w-5" /> },
            }[section as keyof typeof testsBySection];

            return (
              <div key={section} className="space-y-4">
                <div className="flex items-center gap-2">
                  {sectionInfo.icon}
                  <h2 className="text-xl font-bold">{sectionInfo.title}</h2>
                  <Badge variant="secondary">{tests.length} tests</Badge>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tests.map((test: Test) => (
                    <Card key={test.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{test.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Difficulty</span>
                          <Badge variant={test.difficulty === 'easy' ? 'success' : test.difficulty === 'medium' ? 'warning' : 'destructive'}>
                            {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-medium">{test.estimated_time} min</span>
                        </div>
                        <Button asChild className="w-full mt-4">
                          <Link href={`/practice/${section}/${test.id}`}>
                            Start Test
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
