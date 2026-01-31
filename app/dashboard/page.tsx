import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEntitlementDetails } from "@/lib/access/entitlements";
import { getUserSubscription } from "@/lib/stripe/subscription";
import SubscribeButton from "./SubscribeButton";
import ManageBillingButton from "./ManageBillingButton";
import "./dashboard.css";

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

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

  // Fetch user's shows
  const { data: shows, error: showsError } = await supabase
    .from('shows')
    .select('id, title, updated_at, inputs')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const userShows = shows || [];

  return (
    <main className="dashboard-container">
      {hasAccess ? (
        <>
          {/* Dashboard Header */}
          <div className="dashboard-top-header">
            <div className="dashboard-title-section">
              <h1>Your Shows</h1>
              <p className="user-email">{user.email}</p>
            </div>
            <Link href="/" className="create-show-btn">
              Create New Show
            </Link>
          </div>

          {/* Shows List */}
          {userShows.length > 0 ? (
            <div className="shows-list">
              {userShows.map((show) => (
                <div key={show.id} className="show-card">
                  <div className="show-card-content">
                    <h3 className="show-title">{show.title}</h3>
                    {show.inputs?.artistName && (
                      <p className="show-artist">Artist: {show.inputs.artistName}</p>
                    )}
                    <p className="show-timestamp">
                      Last saved: {formatRelativeTime(show.updated_at)}
                    </p>
                  </div>
                  <Link href={`/?showId=${show.id}`} className="open-show-btn">
                    Open
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>No shows yet</h2>
              <p>Create your first show to start tracking settlements</p>
              <Link href="/" className="create-show-btn-large">
                Create New Show
              </Link>
            </div>
          )}

          {/* Subscription Info Footer */}
          <div className="dashboard-footer">
            <div className="subscription-info-compact">
              <div className="subscription-badge">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{isStripeSource ? "Active Subscription" : "Pro Access"}</span>
              </div>
              
              {isStripeSource && subscription?.cancel_at_period_end && subscription.current_period_end && (
                <p className="subscription-notice">
                  Ends {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
              
              {!isStripeSource && entitlement?.expires_at && (
                <p className="subscription-notice">
                  Expires {new Date(entitlement.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="dashboard-footer-actions">
              {isStripeSource && <ManageBillingButton />}
              <form action="/auth/signout" method="post">
                <button type="submit" className="action-btn secondary">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* No Subscription View */}
          <div className="dashboard-card">
            <div className="dashboard-header">
              <h1>Welcome to Your Dashboard</h1>
              <p className="user-email">{user.email}</p>
            </div>

            <div className="dashboard-content">
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
            </div>
          </div>
        </>
      )}
    </main>
  );
}
