import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe/server";
import { getUserSubscription } from "@/lib/stripe/subscription";

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await getUserSubscription(user.id);
    if (existingSubscription && ["active", "trialing"].includes(existingSubscription.status)) {
      return NextResponse.json(
        { error: "You already have an active subscription." },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      email: user.email!,
      userId: user.id,
    });

    // Get price ID from environment
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      console.error("STRIPE_PRICE_ID is not configured");
      return NextResponse.json(
        { error: "Subscription pricing is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: customer.id,
      customerEmail: user.email!,
      priceId,
      successUrl: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard`,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "An error occurred while creating checkout session." },
      { status: 500 }
    );
  }
}
