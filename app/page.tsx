import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getEntitlementDetails } from "@/lib/access/entitlements";
import { getUserSubscription } from "@/lib/stripe/subscription";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo";
import { MarketingShell } from "@/components/ui/MarketingShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import JsonLd from "./components/JsonLd";
import CalculatorContent from "./calculator-content";
import CalculatorPaywall from "./calculator-paywall";
import "./landing.css";
import "./calculator.css";

export const metadata: Metadata = buildPageMetadata({
  title: "GigSettle — Show Settlement Calculator",
  description:
    "Create clean settlement packets, export PDF reports, and share read-only settlement links for live shows.",
  path: "/",
});

const homepageSoftwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GigSettle",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: toAbsoluteUrl("/"),
  description:
    "Create clean settlement packets, export PDF reports, and share read-only settlement links for live shows.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

function LandingPage() {
  return (
    <>
      <JsonLd data={homepageSoftwareAppSchema} />
      <MarketingShell>
        <main className="landing-page">
          <Card className="landing-hero" variant="elevated" padding="lg">
            <div className="landing-hero-background">
              <Image
                src="/concert-hero-1.jpg"
                alt="Concert venue atmosphere"
                className="landing-hero-image"
                width={1920}
                height={1080}
                priority
              />
            </div>
            <div className="landing-hero-content">
              <p className="landing-hero-kicker">Close out shows in minutes.</p>
              <h1>Create a clean settlement packet, share it instantly, and keep the math defensible.</h1>
              <p className="landing-hero-subtitle">
                Run a settlement - export PDF - send a view-only link.
                <br />
                Works with your existing ticketing + spreadsheets.
              </p>

              <div className="landing-cta-group">
                <Button as="a" href="/login" variant="primary" className="landing-cta-primary">
                  Create a settlement
                </Button>
                <Button
                  as="a"
                  href="/example-packet.pdf"
                  variant="secondary"
                  className="landing-cta-secondary"
                  target="_blank"
                  rel="noreferrer"
                >
                  See an example packet
                </Button>
              </div>
              <p className="landing-cta-note">
                No credit card required to try. Upgrade when you are ready.
              </p>
            </div>
          </Card>

          <section className="landing-section landing-section-centered">
            <h2>Everything you need to close out a show</h2>
            <div className="landing-cards-grid">
              <Card className="landing-feature-card" padding="md">
                <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 3h5v5M8 3H3v5M8 21H3v-5M16 21h5v-5M9 9h6v6H9z"/>
                </svg>
                <h3 className="landing-feature-title">Reusable templates</h3>
                <p className="landing-feature-description">Save deal terms once. Prefill the next show automatically.</p>
              </Card>
              <Card className="landing-feature-card" padding="md">
                <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M9 15l2 2 4-4"/>
                </svg>
                <h3 className="landing-feature-title">Clean packet output</h3>
                <p className="landing-feature-description">Professional PDF you can send to artists, managers, or accounting.</p>
              </Card>
              <Card className="landing-feature-card" padding="md">
                <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <h3 className="landing-feature-title">Shareable link</h3>
                <p className="landing-feature-description">View-only link with controls (draft or final, revoke anytime).</p>
              </Card>
            </div>
          </section>

          <section className="landing-section">
            <Card className="landing-panel landing-panel-with-image" padding="lg">
              <div className="landing-panel-content">
                <h2>Stop doing settlements in Notes, spreadsheets, and email threads</h2>
                <p className="landing-paragraph">
                  Settlements are where disputes happen. This gives you a consistent workflow and a packet
                  you can stand behind.
                </p>
                <ul className="landing-list">
                  <li>Reduce back-and-forth (&quot;show me the numbers&quot;)</li>
                  <li>Standardize deductions and splits</li>
                  <li>Keep a record of what changed and why</li>
                </ul>
              </div>
              <div className="landing-panel-image">
                <Image
                  src="/concert-hero-2.jpg"
                  alt="Live music performance"
                  className="landing-accent-image"
                  width={1600}
                  height={1067}
                  loading="lazy"
                />
              </div>
            </Card>
          </section>

          <section className="landing-section landing-section-centered">
            <h2>Three steps</h2>
            <div className="landing-cards-grid">
              <Card className="landing-feature-card" padding="md">
            <div className="landing-step-badge">
              <span className="landing-step-number">1</span>
              <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <h3 className="landing-feature-title">Create a show</h3>
            <p className="landing-feature-description">Start fresh or use a saved template with pre-filled deal terms.</p>
              </Card>
              <Card className="landing-feature-card" padding="md">
            <div className="landing-step-badge">
              <span className="landing-step-number">2</span>
              <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="16" y1="14" x2="16" y2="14.01"/>
                <line x1="16" y1="18" x2="16" y2="18.01"/>
                <path d="M8 10h.01"/>
                <path d="M12 10h.01"/>
                <path d="M8 14h.01"/>
                <path d="M12 14h.01"/>
                <path d="M8 18h.01"/>
                <path d="M12 18h.01"/>
              </svg>
            </div>
            <h3 className="landing-feature-title">Enter the numbers</h3>
            <p className="landing-feature-description">Input sales data and expenses, review the automatic breakdown.</p>
              </Card>
              <Card className="landing-feature-card" padding="md">
            <div className="landing-step-badge">
              <span className="landing-step-number">3</span>
              <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </div>
            <h3 className="landing-feature-title">Export and share</h3>
            <p className="landing-feature-description">Generate PDF and create a view-only shareable link.</p>
              </Card>
            </div>
          </section>

          <section className="landing-section">
            <Card className="landing-panel landing-panel-with-image" padding="lg">
              <div className="landing-panel-image">
                <Image
                  src="/concert-hero-3.jpg"
                  alt="Concert crowd"
                  className="landing-accent-image"
                  width={1600}
                  height={1067}
                  loading="lazy"
                />
              </div>
              <div className="landing-panel-content">
                <h2>Built for operators who do this often</h2>
                <ul className="landing-list landing-features-grid">
                <li>
                  <svg className="landing-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <path d="M8 14h.01"/>
                    <path d="M12 14h.01"/>
                    <path d="M16 14h.01"/>
                    <path d="M8 18h.01"/>
                    <path d="M12 18h.01"/>
                    <path d="M16 18h.01"/>
                  </svg>
                  <div>High-frequency venues (multiple shows per week)</div>
                </li>
                <li>
                  <svg className="landing-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                  <div>Promoters and recurring series</div>
                </li>
                <li>
                  <svg className="landing-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  <div>Multi-room or small venue groups</div>
                </li>
                <li>
                  <svg className="landing-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <div>Anyone who needs settlements to be consistent and defensible</div>
                </li>
              </ul>
              </div>
            </Card>
          </section>

          <section className="landing-section landing-section-centered">
            <h2>Your data stays private</h2>
            <div className="landing-cards-grid">
              <Card className="landing-feature-card" padding="md">
            <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <h3 className="landing-feature-title">Private by default</h3>
            <p className="landing-feature-description">Your settlements are only visible to you unless you choose to share.</p>
              </Card>
              <Card className="landing-feature-card" padding="md">
            <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <h3 className="landing-feature-title">View-only sharing</h3>
            <p className="landing-feature-description">Share links are read-only. Recipients can view but not edit.</p>
              </Card>
              <Card className="landing-feature-card" padding="md">
            <svg className="landing-feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <h3 className="landing-feature-title">Full control</h3>
            <p className="landing-feature-description">Revoke access anytime. You decide who sees your settlements.</p>
              </Card>
            </div>
          </section>

          <section className="landing-section">
            <Card className="landing-panel" padding="lg">
              <div className="landing-pricing">
                <div>
                  <h2>Simple pricing</h2>
                  <p className="landing-paragraph">
                    Start free. Upgrade for templates, advanced sharing controls, and multi-user
                    workflows.
                  </p>
                </div>
                <Button as="a" href="/pricing" variant="primary" className="landing-cta-primary">
                  View pricing
                </Button>
              </div>
            </Card>
          </section>

          <section className="landing-section">
            <Card className="landing-final-cta" padding="lg">
              <div className="landing-final-cta-background">
                <Image
                  src="/concert-hero-4.jpg"
                  alt="Live show atmosphere"
                  className="landing-final-cta-image"
                  width={1600}
                  height={1067}
                  loading="lazy"
                />
              </div>
              <div className="landing-final-cta-content">
                <h2>Close out your next show faster.</h2>
                <Button as="a" href="/login" variant="primary" className="landing-cta-primary">
                  Create your first settlement
                </Button>
              </div>
            </Card>
          </section>

          <section className="landing-credits">
            <p className="landing-credits-title">Photo Credits</p>
            <div className="landing-credits-list">
              <span>Photo by <a href="https://unsplash.com/@josephtpearson?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Joseph Pearson</a> on <a href="https://unsplash.com/photos/people-attending-concert-inside-dark-room-FrmpLKLNgNw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Unsplash</a></span>
              <span>Photo by <a href="https://unsplash.com/@hai_nguyen?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Hai Nguyen</a> on <a href="https://unsplash.com/photos/a-stage-with-a-piano-keyboard-and-other-musical-instruments-FeQHl8GQ2Gw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Unsplash</a></span>
              <span>Photo by <a href="https://unsplash.com/@konrad_rolf?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Konrad Rolf</a> on <a href="https://unsplash.com/photos/a-crowd-of-people-at-a-concert-with-their-hands-in-the-air-V0RhqyCTDWY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Unsplash</a></span>
              <span>Photo by <a href="https://unsplash.com/@martzzl?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Marcel Strauß</a> on <a href="https://unsplash.com/photos/a-group-of-people-standing-in-front-of-a-stage-DaQud2UOXwg?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Unsplash</a></span>
            </div>
          </section>
        </main>
      </MarketingShell>
    </>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const { hasAccess, entitlement } = await getEntitlementDetails(user.id);
  const subscription = await getUserSubscription(user.id);
  const isStripeSource = entitlement?.source === "stripe";

  const accountMenuData = {
    hasAccess,
    isStripeSource,
    entitlement: entitlement
      ? { source: entitlement.source, expires_at: entitlement.expires_at }
      : null,
    subscription: subscription
      ? {
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end,
        }
      : null,
  };

  if (!hasAccess) {
    return (
      <CalculatorPaywall
        userEmail={user.email ?? ""}
        accountMenuData={accountMenuData}
      />
    );
  }

  return (
    <CalculatorContent
      userId={user.id}
      userEmail={user.email ?? ""}
      accountMenuData={accountMenuData}
    />
  );
}
