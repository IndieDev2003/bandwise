import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <SignupForm />
    </div>
  );
}
