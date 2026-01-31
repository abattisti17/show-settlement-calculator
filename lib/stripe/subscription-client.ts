import { createClient } from "@/lib/supabase/client";

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the user's subscription from Supabase (client-side)
 */
export async function getUserSubscriptionClient(): Promise<UserSubscription | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No subscription found
      return null;
    }
    console.error("Error fetching user subscription:", error);
    return null;
  }

  return data as UserSubscription;
}

/**
 * Checks if the current user has an active subscription (client-side)
 */
export async function hasActiveSubscriptionClient(): Promise<boolean> {
  const subscription = await getUserSubscriptionClient();

  if (!subscription) {
    return false;
  }

  // Check if subscription is in an active state
  const activeStatuses = ["active", "trialing"];
  return activeStatuses.includes(subscription.status);
}
