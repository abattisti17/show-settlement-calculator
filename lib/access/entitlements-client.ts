import { createClient } from "@/lib/supabase/client";

/**
 * UserEntitlement represents a user's access grant
 * Can be sourced from Stripe or manual grants (dev/test/comped users)
 */
export interface UserEntitlement {
  id: string;
  user_id: string;
  source: "stripe" | "manual_comp" | "dev_account" | "test_account";
  status: "active" | "inactive" | "expired";
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the current user's entitlement from Supabase (client-side)
 */
export async function getUserEntitlementClient(): Promise<UserEntitlement | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No entitlement found
      return null;
    }
    console.error("Error fetching user entitlement:", error);
    return null;
  }

  return data as UserEntitlement;
}

/**
 * Checks if the current user has active pro access (client-side)
 * This is the primary access control function - replaces hasActiveSubscriptionClient()
 * 
 * Returns true if:
 * - User has an entitlement with status 'active'
 * - Entitlement is not expired (expires_at is null or in the future)
 */
export async function hasProAccessClient(): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return false;
  }

  // Check if active
  if (data.status !== "active") {
    return false;
  }

  // Check if expired (null expires_at means lifetime access)
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Gets entitlement details for display purposes (client-side)
 * Useful for showing entitlement source and metadata in the UI
 */
export async function getEntitlementDetailsClient(): Promise<{
  hasAccess: boolean;
  entitlement: UserEntitlement | null;
}> {
  const entitlement = await getUserEntitlementClient();

  if (!entitlement) {
    return { hasAccess: false, entitlement: null };
  }

  const hasAccess =
    entitlement.status === "active" &&
    (!entitlement.expires_at || new Date(entitlement.expires_at) >= new Date());

  return { hasAccess, entitlement };
}
