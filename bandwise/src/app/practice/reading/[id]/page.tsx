import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ReadingTest } from "@/components/reading";
import { Test } from "@/types";

export default async function ReadingTestPage({ params }: { params: { id: string } }) {
  const client = createClient();
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch the specific test
  const { data: test } = await client
    .from('tests')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!test) {
    redirect("/practice/reading");
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
        <h1 className="text-2xl font-bold">{test.title}</h1>
      </div>
      <ReadingTest test={test} onSubmit={handleSubmit} />
    </div>
  );
}
