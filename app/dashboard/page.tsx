import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/ui/AppShell";
import { AppAccountMenu } from "@/components/ui/AppAccountMenu";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getEntitlementDetails } from "@/lib/access/entitlements";
import { getUserSubscription } from "@/lib/stripe/subscription";
import { buildPageMetadata } from "@/lib/seo";
import SubscribeButton from "./SubscribeButton";
import { DashboardToastProvider } from "./DashboardToast";
import CopyShareLinkButton from "./CopyShareLinkButton";
import "./dashboard.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard - GigSettle",
  description:
    "Manage saved settlements, billing, and share links in your GigSettle dashboard.",
  path: "/dashboard",
  noIndex: true,
});

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
  const showIds = userShows.map((show) => show.id);

  // Fetch share links for shows (if any)
  const shareLinksByShowId = new Map<string, { token: string; is_active: boolean }>();
  if (showIds.length > 0) {
    const { data: shareLinks } = await supabase
      .from('share_links')
      .select('show_id, token, is_active')
      .in('show_id', showIds);

    if (shareLinks) {
      shareLinks.forEach((link) => {
        shareLinksByShowId.set(link.show_id, {
          token: link.token,
          is_active: link.is_active,
        });
      });
    }
  }

  return (
    <AppShell
      maxWidth={1200}
      userEmail={user.email ?? undefined}
      showNavLinks={false}
      userMenuContent={
        <AppAccountMenu
          initialData={{
            hasAccess,
            isStripeSource,
            entitlement: entitlement ? { source: entitlement.source, expires_at: entitlement.expires_at } : null,
            subscription: subscription
              ? { cancel_at_period_end: subscription.cancel_at_period_end, current_period_end: subscription.current_period_end }
              : null,
          }}
        />
      }
    >
      <div className="dashboard-container">
        <PageHeader
          title={hasAccess ? "Your Shows" : "Welcome to Your Dashboard"}
          action={
            hasAccess ? (
              <Button as="a" href="/" variant="primary" className="create-show-btn">
                Create New Show
              </Button>
            ) : undefined
          }
        />

        {hasAccess ? (
          <>
            {/* Shows List */}
            {userShows.length > 0 ? (
              <DashboardToastProvider>
                <div className="shows-list">
                  {userShows.map((show) => {
                    const shareLink = shareLinksByShowId.get(show.id);

                    return (
                      <Card key={show.id} className="show-card" padding="md">
                        <Link
                          href={`/?showId=${show.id}`}
                          className="show-card-link-cover"
                        >
                          Open {show.title}
                        </Link>
                        <div className="show-card-content">
                          <h3 className="show-title">{show.title}</h3>
                          {show.inputs?.artistName && (
                            <p className="show-artist">Artist: {show.inputs.artistName}</p>
                          )}
                          <p className="show-timestamp">
                            Last saved: {formatRelativeTime(show.updated_at)}
                          </p>
                        </div>
                        <div className="show-card-actions">
                          <CopyShareLinkButton
                            showId={show.id}
                            initialToken={shareLink?.token}
                            initialIsActive={shareLink?.is_active}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </DashboardToastProvider>
            ) : (
              <Card className="empty-state" variant="bordered" padding="lg">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>No shows yet</h2>
                <p>Create your first show to start tracking settlements</p>
                <Button as="a" href="/" variant="primary" className="create-show-btn-large">
                  Create New Show
                </Button>
              </Card>
            )}

            {/* Account actions moved to AppShell user dropdown */}
          </>
        ) : (
          <>
            {/* No Subscription View */}
            <Card className="dashboard-card" variant="elevated" padding="lg">
              <div className="dashboard-header">
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

                  <Card className="pricing-info" padding="md">
                    <p className="price">$10/month</p>
                    <p className="price-description">Simple, transparent pricing</p>
                  </Card>
                </div>

                <div className="dashboard-actions">
                  <SubscribeButton />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
