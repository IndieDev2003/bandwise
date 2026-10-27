import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ReadingTest } from "@/components/reading";
import { Test } from "@/types";
import { supabase } from "@/lib/supabase";

export default async function ReadingPage() {
  const client = createClient();
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch a reading test
  const { data: test } = await client
    .from('tests')
    .select('*')
    .eq('section', 'reading')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!test) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Reading Tests Available</h1>
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

      // Update profile if this improves the user's score
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile && attempt.band_score && (!profile.best_reading_score || attempt.band_score > profile.best_reading_score)) {
        await supabase
          .from('profiles')
          .update({
            best_reading_score: attempt.band_score,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reading Practice Test</h1>
      </div>
      <ReadingTest test={test} onSubmit={handleSubmit} />
    </div>
  );
}
