import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEntitlementDetails } from "@/lib/access/entitlements";
import { getUserSubscription } from "@/lib/stripe/subscription";

/**
 * GET /api/account
 * Returns account menu data for the authenticated user.
 * Used by AppAccountMenu when rendered from client components (e.g. calculator).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, entitlement } = await getEntitlementDetails(user.id);
    const subscription = await getUserSubscription(user.id);
    const isStripeSource = entitlement?.source === "stripe";

    return NextResponse.json({
      hasAccess,
      isStripeSource,
      entitlement: entitlement
        ? {
            source: entitlement.source,
            expires_at: entitlement.expires_at,
          }
        : null,
      subscription: subscription
        ? {
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: subscription.current_period_end,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching account data:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
