import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SpeakingTest } from "@/components/speaking";

export default async function SpeakingPage() {
  const client = createClient();
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch user profile
  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // Check if user is pro
  if (profile?.subscription_status !== 'pro') {
    redirect("/pricing?redirect=/practice/speaking");
  }

  // Fetch a speaking test
  const { data: test } = await client
    .from('tests')
    .select('*')
    .eq('section', 'speaking')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!test) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Speaking Tests Available</h1>
        <p className="text-muted-foreground">
          Please check back later for available tests.
        </p>
      </div>
    );
  }

  const handleSubmit = async (attempt: Omit<import("@/types").UserAttempt, 'id' | 'created_at' | 'updated_at'>) => {
    "use server";
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('user_attempts')
        .insert({
          ...attempt,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving attempt:", error);
        return;
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Speaking Practice Test</h1>
      </div>
      <SpeakingTest 
        test={test} 
        onSubmit={handleSubmit}
        userId={session.user.id}
        userSubscription={profile?.subscription_status || 'free'}
      />
    </div>
  );
}
