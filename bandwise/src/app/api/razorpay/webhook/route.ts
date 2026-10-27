import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();

    // Verify webhook signature
    const signature = request.headers.get("x-razorpay-signature");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(JSON.stringify(body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle different webhook events
    const event = body.event;

    switch (event) {
      case "payment.success":
        await handlePaymentSuccess(body.payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(body.payload);
        break;
      case "subscription.activated":
        await handleSubscriptionActivated(body.payload);
        break;
      case "subscription.charged":
        await handleSubscriptionCharged(body.payload);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(body.payload);
        break;
      default:
        console.log("Unhandled webhook event:", event);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(payload: any) {
  const supabase = createClient();

  const { payment_id, order_id, amount, currency } = payload.payment.entity;

  // Update payment status
  await supabase
    .from('payments')
    .update({
      razorpay_payment_id: payment_id,
      status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', order_id);

  // Get user and order details
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', order_id)
    .single();

  if (!payment) {
    console.error("Payment record not found for order:", order_id);
    return;
  }

  // Update user subscription
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'pro',
      razorpay_customer_id: payload.payment.entity.notes?.customer_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.user_id);

  // Create subscription record for one-time payments
  if (payment.plan === 'monthly' || payment.plan === 'yearly') {
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + (payment.plan === 'monthly' ? 1 : 12));

    await supabase.from('subscriptions').insert({
      user_id: payment.user_id,
      razorpay_subscription_id: `one_time_${payment_id}`,
      plan: payment.plan,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
    });
  }

  console.log("Payment successful for user:", payment.user_id);
}

async function handlePaymentFailed(payload: any) {
  const supabase = createClient();

  const { payment_id, order_id } = payload.payment.entity;

  // Update payment status
  await supabase
    .from('payments')
    .update({
      razorpay_payment_id: payment_id,
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', order_id);

  console.log("Payment failed for order:", order_id);
}

async function handleSubscriptionActivated(payload: any) {
  const supabase = createClient();

  const { subscription_id, customer_id, plan_id } = payload.subscription.entity;

  // Find user by customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('razorpay_customer_id', customer_id)
    .single();

  if (!profile) {
    console.error("User not found for customer:", customer_id);
    return;
  }

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: payload.subscription.entity.current_start,
      current_period_end: payload.subscription.entity.current_end,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription_id);

  // Update user subscription status
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'pro',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  console.log("Subscription activated for user:", profile.id);
}

async function handleSubscriptionCharged(payload: any) {
  const supabase = createClient();

  const { subscription_id } = payload.subscription.entity;

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      current_period_end: payload.subscription.entity.current_end,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription_id);

  console.log("Subscription charged for subscription:", subscription_id);
}

async function handleSubscriptionCancelled(payload: any) {
  const supabase = createClient();

  const { subscription_id, customer_id } = payload.subscription.entity;

  // Find user by customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('razorpay_customer_id', customer_id)
    .single();

  if (!profile) {
    console.error("User not found for customer:", customer_id);
    return;
  }

  // Check if user has other active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .neq('razorpay_subscription_id', subscription_id);

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription_id);

  // Update user subscription status if no other active subscriptions
  if (activeSubscriptions === 0) {
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
  }

  console.log("Subscription cancelled for user:", profile.id);
}
