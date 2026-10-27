import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PricingCard } from "@/components/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Rocket, BarChart3, Bot, Clock } from "lucide-react";
import { SubscriptionPlan } from "@/types";

export default async function PricingPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const client = createClient();
  const { data: { session } } = await client.auth.getSession();

  const pricingPlans = [
    {
      id: "free",
      name: "Free Plan",
      description: "Get started with basic features",
      price: 0,
      period: "month" as const,
      features: [
        "Access to 1 practice test per module",
        "Basic scoring for Reading and Listening",
        "Limited test history",
        "Community support",
      ],
      isPopular: false,
      isPro: false,
    },
    {
      id: "monthly",
      name: "Pro Monthly",
      description: "Unlock all features with monthly subscription",
      price: 29900, // ₹299
      period: "month" as const,
      features: [
        "Unlimited practice tests",
        "AI-powered feedback for Writing and Speaking",
        "Detailed analytics and progress tracking",
        "Priority support",
        "Access to all test modules",
        "Band score predictions",
      ],
      isPopular: true,
      isPro: true,
    },
    {
      id: "yearly",
      name: "Pro Yearly",
      description: "Best value - Save 20% with annual subscription",
      price: 239900, // ₹2399 (20% discount)
      period: "year" as const,
      features: [
        "Unlimited practice tests",
        "AI-powered feedback for Writing and Speaking",
        "Detailed analytics and progress tracking",
        "Priority support",
        "Access to all test modules",
        "Band score predictions",
        "2 months free!",
      ],
      isPopular: false,
      isPro: true,
    },
  ];

  const userSubscription = session ? (
    (await client.from('profiles').select('subscription_status').eq('id', session.user.id).single()).data?.subscription_status
  ) : null;

  const handleSelectPlan = async (planId: string, planType: SubscriptionPlan) => {
    "use server";
    
    if (!session) {
      redirect("/auth/login");
    }

    // For demo purposes, we'll just redirect to the Razorpay integration
    // In a real implementation, this would create an order and redirect to Razorpay
    redirect(`/api/razorpay/create-order?plan=${planId}&type=${planType}`);
  };

  return (
    <div className="min-h-screen">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Upgrade to Pro to unlock AI-powered feedback, unlimited practice, and detailed analytics
          </p>
        </div>

        {/* Features Comparison */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              What You Get with Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-bold mb-2">AI Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Get detailed AI evaluation for your Writing and Speaking with band scores
                </p>
              </div>
              <div className="text-center p-4">
                <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-bold mb-2">Detailed Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track your progress with comprehensive analytics and improvement insights
                </p>
              </div>
              <div className="text-center p-4">
                <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-bold mb-2">Unlimited Practice</h3>
                <p className="text-sm text-muted-foreground">
                  Take as many tests as you want across all modules
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onSelect={(planId, planType) => {
                if (planId === 'free') {
                  window.location.href = '/practice';
                } else {
                  window.location.href = `/api/razorpay/create-order?plan=${planId}&type=${planType}`;
                }
              }}
              userSubscription={userSubscription || 'free'}
            />
          ))}
        </div>

        {/* Money Back Guarantee */}
        <Card className="max-w-3xl mx-auto text-center">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Check className="h-5 w-5 text-success" />
              <span className="font-medium">30-day Money Back Guarantee</span>
            </div>
            <p className="text-sm text-muted-foreground">
              If you&apos;re not satisfied with your progress, we&apos;ll refund your money. No questions asked.
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What&apos;s the difference between Free and Pro plans?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The Free plan gives you access to basic practice tests with limited features. 
                  The Pro plan unlocks AI-powered feedback, unlimited practice, detailed analytics, 
                  and access to all test modules including Speaking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How does the AI feedback work?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI evaluates your Writing and Speaking responses based on official IELTS criteria 
                  (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy, 
                  Pronunciation, and Fluency) and provides detailed band scores with actionable feedback.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I cancel my subscription?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time from your account settings. 
                  You&apos;ll continue to have access to Pro features until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
