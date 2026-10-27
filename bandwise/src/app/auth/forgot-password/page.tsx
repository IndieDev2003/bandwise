import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <ForgotPasswordForm />
    </div>
  );
}
