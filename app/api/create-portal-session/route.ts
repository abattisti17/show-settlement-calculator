import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCustomerPortalSession } from "@/lib/stripe/server";
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

    // Get user's subscription
    const subscription = await getUserSubscription(user.id);
    if (!subscription || !subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: "No subscription found. Please subscribe first." },
        { status: 400 }
      );
    }

    // Get the origin for return URL
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create customer portal session
    const session = await createCustomerPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: "An error occurred while creating portal session." },
      { status: 500 }
    );
  }
}
