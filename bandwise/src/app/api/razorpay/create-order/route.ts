import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get("plan");
  const type = searchParams.get("type");

  if (!plan || !type) {
    return NextResponse.json(
      { success: false, error: "Missing plan or type parameter" },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // Determine amount based on plan
    let amount = 0;
    let planName = "";
    let period = "";

    switch (plan) {
      case "monthly":
        amount = 29900; // ₹299 in paise
        planName = "Pro Monthly";
        period = "monthly";
        break;
      case "yearly":
        amount = 239900; // ₹2399 in paise
        planName = "Pro Yearly";
        period = "yearly";
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid plan" },
          { status: 400 }
        );
    }

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `bandwise_${session.user.id}_${Date.now()}`,
      notes: {
        user_id: session.user.id,
        plan,
        type,
        email: session.user.email,
      },
    });

    // Save order to database
    await supabase.from('payments').insert({
      user_id: session.user.id,
      razorpay_order_id: order.id,
      amount,
      currency: "INR",
      status: "created",
      plan: type as 'monthly' | 'yearly' | 'credits',
    });

    return NextResponse.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: profile.full_name || "User",
        phone: profile.phone_number || "",
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET request (for redirect)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get("plan");
  const type = searchParams.get("type");

  if (!plan || !type) {
    return NextResponse.redirect("/pricing");
  }

  // This will be handled by the POST method via form submission
  return NextResponse.redirect("/pricing");
}
