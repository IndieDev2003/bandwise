import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { TestHistory } from "@/components/dashboard/test-history";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BookOpen, Clock, TrendingUp, Crown, Rocket, Users, Target } from "lucide-react";
import { TestHistory as TestHistoryType, ProgressData } from "@/types";

export default async function DashboardPage() {
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

  // Fetch user attempts
  const { data: attempts } = await supabase
    .from('user_attempts')
    .select(`
      id as attempt_id,
      test_id,
      section,
      band_score,
      time_taken,
      created_at,
      status,
      tests (title)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  // Format test history
  const testHistory: TestHistoryType[] = attempts?.map((attempt) => ({
    attempt_id: attempt.attempt_id,
    test_id: attempt.test_id,
    section: attempt.section,
    title: attempt.tests?.title || 'Unknown Test',
    band_score: attempt.band_score,
    time_taken: attempt.time_taken,
    created_at: attempt.created_at,
    status: attempt.status,
  })) || [];

  // Fetch progress data
  const { data: progressData } = await supabase
    .from('user_attempts')
    .select('created_at, section, band_score')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true });

  const formattedProgressData: ProgressData[] = progressData?.map((p) => ({
    date: p.created_at,
    section: p.section,
    band_score: p.band_score || 0,
  })) || [];

  // Calculate statistics
  const stats = {
    totalTests: testHistory.length,
    averageScore: testHistory.length > 0 
      ? parseFloat((testHistory.reduce((acc, t) => acc + (t.band_score || 0), 0) / testHistory.length).toFixed(1))
      : 0,
    highestScore: testHistory.length > 0 
      ? Math.max(...testHistory.map((t) => t.band_score || 0))
      : 0,
    timeSpent: testHistory.reduce((acc, t) => acc + (t.time_taken || 0), 0),
  };

  // Calculate section-specific stats
  const sectionStats = {
    reading: testHistory.filter((t) => t.section === 'reading').length,
    listening: testHistory.filter((t) => t.section === 'listening').length,
    writing: testHistory.filter((t) => t.section === 'writing').length,
    speaking: testHistory.filter((t) => t.section === 'speaking').length,
  };

  return (
    <div className="min-h-screen">
      <div className="container py-8 space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-brand to-brand-dark text-white border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Welcome back, {profile?.full_name || profile?.email || 'User'}!
                </h1>
                <p className="text-white/90">
                  {profile?.subscription_status === 'pro' 
                    ? 'You have Pro access - Enjoy unlimited practice and AI feedback!' 
                    : 'Upgrade to Pro to unlock all features'}
                </p>
              </div>
              <div className="flex gap-4">
                {profile?.subscription_status !== 'pro' && (
                  <Button asChild variant="outline" className="border-white text-white hover:bg-white/10">
                    <a href="/pricing">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </a>
                  </Button>
                )}
                <Button asChild className="bg-white text-brand hover:bg-white/90">
                  <a href="/practice">
                    <Rocket className="h-4 w-4 mr-2" />
                    Start Practicing
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Tests"
            value={stats.totalTests}
            icon={<BarChart3 className="h-5 w-5" />}
            trend={testHistory.length > 0 ? testHistory.length : 0}
          />
          <StatsCard
            title="Average Score"
            value={stats.averageScore}
            icon={<Target className="h-5 w-5" />}
            trend={stats.averageScore > 0 ? stats.averageScore - 5 : 0}
          />
          <StatsCard
            title="Highest Score"
            value={stats.highestScore.toFixed(1)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={stats.highestScore > 0 ? stats.highestScore - 6 : 0}
          />
          <StatsCard
            title="Time Spent"
            value={`${Math.floor(stats.timeSpent / 3600)}h ${Math.floor((stats.timeSpent % 3600) / 60)}m`}
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        {/* Section Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Reading Tests"
            value={sectionStats.reading}
            icon={<BookOpen className="h-5 w-5" />}
            section="reading"
          />
          <StatsCard
            title="Listening Tests"
            value={sectionStats.listening}
            icon={<Users className="h-5 w-5" />}
            section="listening"
          />
          <StatsCard
            title="Writing Tests"
            value={sectionStats.writing}
            icon={<Target className="h-5 w-5" />}
            section="writing"
          />
          <StatsCard
            title="Speaking Tests"
            value={sectionStats.speaking}
            icon={<Rocket className="h-5 w-5" />}
            section="speaking"
          />
        </div>

        {/* Progress Chart */}
        <ProgressChart data={formattedProgressData} />

        {/* Test History */}
        <TestHistory history={testHistory} />
      </div>
    </div>
  );
}
