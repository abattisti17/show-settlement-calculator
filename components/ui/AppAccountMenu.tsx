"use client";

import { useState, useEffect } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import ManageBillingButton from "@/app/dashboard/ManageBillingButton";
import { ThemeToggle } from "./ThemeToggle";
import "@/app/dashboard/dashboard.css";

export interface AppAccountMenuData {
  hasAccess: boolean;
  isStripeSource: boolean;
  entitlement?: { source: string; expires_at: string | null } | null;
  subscription?: {
    cancel_at_period_end: boolean;
    current_period_end: string | null;
  } | null;
}

export interface AppAccountMenuProps {
  /** When provided, skips fetch and uses this data (e.g. from server) */
  initialData?: AppAccountMenuData | null;
}

/**
 * Account dropdown menu used when logged into the app.
 * Same nav as dashboard: subscription badge, Manage Billing (if Stripe), Sign Out.
 */
export function AppAccountMenu({ initialData }: AppAccountMenuProps) {
  const [data, setData] = useState<AppAccountMenuData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData !== undefined) {
      setData(initialData);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAccount() {
      try {
        const res = await fetch("/api/account");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch {
        // Silently fail - menu will show minimal state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAccount();
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  if (loading || !data) {
    return (
      <div className="dashboard-account-menu">
        <div className="dashboard-account-menu-theme">
          <span className="dashboard-account-menu-theme-label">Theme</span>
          <ThemeToggle />
        </div>
        <div className="dashboard-account-menu-actions">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="danger" className="ds-btn-block">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const { hasAccess, isStripeSource, entitlement, subscription } = data;

  return (
    <div className="dashboard-account-menu">
      <Badge variant={hasAccess ? "success" : "warning"} className="subscription-badge">
        {hasAccess
          ? isStripeSource
            ? "Active Subscription"
            : "Pro Access"
          : "No Active Subscription"}
      </Badge>

      {hasAccess && isStripeSource && subscription?.cancel_at_period_end && subscription.current_period_end && (
        <p className="subscription-notice">
          Ends {new Date(subscription.current_period_end).toLocaleDateString()}
        </p>
      )}

      {hasAccess && !isStripeSource && entitlement?.expires_at && (
        <p className="subscription-notice">
          Expires {new Date(entitlement.expires_at).toLocaleDateString()}
        </p>
      )}

      <div className="dashboard-account-menu-theme">
        <span className="dashboard-account-menu-theme-label">Theme</span>
        <ThemeToggle />
      </div>

      <div className="dashboard-account-menu-actions">
        {hasAccess && isStripeSource && <ManageBillingButton />}
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="danger" className="ds-btn-block">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
