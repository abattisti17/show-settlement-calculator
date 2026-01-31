import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEntitlementDetails } from "@/lib/access/entitlements";
import { getUserSubscription } from "@/lib/stripe/subscription";
import SubscribeButton from "./SubscribeButton";
import ManageBillingButton from "./ManageBillingButton";
import "./dashboard.css";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's entitlement status
  const { hasAccess, entitlement } = await getEntitlementDetails(user.id);
  
  // Get subscription for Stripe-specific UI (billing management)
  const subscription = await getUserSubscription(user.id);
  const isStripeSource = entitlement?.source === "stripe";

  return (
    <main className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Welcome to Your Dashboard</h1>
          <p className="user-email">{user.email}</p>
        </div>

        <div className="dashboard-content">
          {hasAccess ? (
            <>
              {/* Active Access View */}
              <div className="subscription-status active">
                <div className="status-badge">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>
                    {isStripeSource ? "Active Subscription" : "Pro Access"}
                  </span>
                </div>
                <p className="status-description">
                  {isStripeSource 
                    ? "Your subscription is active. You have full access to the settlement calculator."
                    : "You have pro access to the settlement calculator."}
                </p>
                
                {/* Show access type for non-Stripe sources */}
                {!isStripeSource && entitlement && (
                  <p className="status-description" style={{ marginTop: "0.5rem", fontSize: "0.9rem", opacity: 0.8 }}>
                    Access type: {entitlement.source === "manual_comp" ? "Complimentary" : 
                                 entitlement.source === "dev_account" ? "Developer" : 
                                 entitlement.source === "test_account" ? "Test Account" : "Special"}
                  </p>
                )}
                
                {/* Show expiration notice for Stripe subscriptions */}
                {isStripeSource && subscription?.cancel_at_period_end && subscription.current_period_end && (
                  <p className="cancel-notice">
                    Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
                
                {/* Show expiration notice for temporary grants */}
                {!isStripeSource && entitlement?.expires_at && (
                  <p className="cancel-notice">
                    Access expires on {new Date(entitlement.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="dashboard-actions">
                <Link href="/" className="action-btn primary">
                  Go to Calculator
                </Link>

                {/* Only show billing management for Stripe subscriptions */}
                {isStripeSource && <ManageBillingButton />}

                <form action="/auth/signout" method="post">
                  <button type="submit" className="action-btn secondary">
                    Sign Out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* No Subscription View */}
              <div className="subscription-prompt">
                <h2>Subscribe to Access the Calculator</h2>
                <p className="prompt-description">
                  Get unlimited access to the settlement calculator with a simple monthly subscription.
                </p>

                <div className="features-list">
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Unlimited calculations</span>
                  </div>
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Save settlements to your account</span>
                  </div>
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Share settlements with artists</span>
                  </div>
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Access from any device</span>
                  </div>
                  <div className="feature-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Cancel anytime</span>
                  </div>
                </div>

                <div className="pricing-info">
                  <p className="price">$10/month</p>
                  <p className="price-description">Simple, transparent pricing</p>
                </div>
              </div>

              <div className="dashboard-actions">
                <SubscribeButton />

                <form action="/auth/signout" method="post">
                  <button type="submit" className="action-btn secondary">
                    Sign Out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
