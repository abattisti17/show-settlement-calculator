import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getEntitlementDetails } from "@/lib/access/entitlements";
import { getUserSubscription } from "@/lib/stripe/subscription";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo";
import { MarketingShell } from "@/components/ui/MarketingShell";
import { AppShell } from "@/components/ui/AppShell";
import { AppAccountMenu } from "@/components/ui/AppAccountMenu";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import "./pricing.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing - GigSettle",
  description:
    "Compare pay-as-you-go, Pro, and Org plans for settlement workflows. Pick the right plan for your venue or promoter team.",
  path: "/pricing",
});

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let accountMenuData: {
    hasAccess: boolean;
    isStripeSource: boolean;
    entitlement: { source: string; expires_at: string | null } | null;
    subscription: { cancel_at_period_end: boolean; current_period_end: string | null } | null;
  } | undefined;

  if (user) {
    const { hasAccess, entitlement } = await getEntitlementDetails(user.id);
    const subscription = await getUserSubscription(user.id);
    const isStripeSource = entitlement?.source === "stripe";
    accountMenuData = {
      hasAccess,
      isStripeSource,
      entitlement: entitlement ? { source: entitlement.source, expires_at: entitlement.expires_at } : null,
      subscription: subscription
        ? { cancel_at_period_end: subscription.cancel_at_period_end, current_period_end: subscription.current_period_end }
        : null,
    };
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do I need Pro to share settlements?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No — share links are included on pay-as-you-go.",
        },
      },
      {
        "@type": "Question",
        name: "What makes Pro worth it?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Templates, controls, team roles, and unlimited settlements.",
        },
      },
      {
        "@type": "Question",
        name: "How is Org priced?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Based on number of venues/rooms and settlement volume.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: toAbsoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Pricing", item: toAbsoluteUrl("/pricing") },
    ],
  };

  const content = (
    <main className="pricing-page">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="pricing-back-nav">
        <Button as="a" href="/" variant="ghost" size="sm" className="pricing-back-btn">
          <Icon name="chevron" size={14} direction="left" /> Back to home
        </Button>
      </div>

      <PageHeader
        title="Simple pricing that scales with your volume"
        description="Start pay-as-you-go. Upgrade when you need templates, controls, and team workflow."
        className="pricing-header"
      />

      <div className="pricing-tiers">
        {/* Tier 1: Pay as you go */}
        <Card className="pricing-card" variant="default" padding="lg">
          <div className="pricing-card-header">
            <h3 className="pricing-tier-name">Pay as you go</h3>
            <div className="pricing-price">
              <span className="pricing-amount">$10</span>
              <span className="pricing-period">/ settlement</span>
            </div>
            <p className="pricing-price-note">(or $49 for 10 settlements)</p>
            <p className="pricing-description">
              Best for low-volume venues or trying it out.
            </p>
          </div>

          <ul className="pricing-features">
            <li>Settlement calculator + breakdown</li>
            <li>PDF export</li>
            <li>View-only share link</li>
            <li>Save shows</li>
          </ul>

          <Button as="a" href="/login" variant="ghost" className="pricing-cta">
            Start pay-as-you-go
          </Button>
        </Card>

        {/* Tier 2: Pro (Popular) */}
        <Card className="pricing-card pricing-card-featured" variant="default" padding="lg">
          <div className="pricing-card-badge-wrap">
            <Badge variant="accent" className="pricing-badge">Most Popular</Badge>
          </div>
          <div className="pricing-card-header">
            <h3 className="pricing-tier-name">Pro</h3>
            <div className="pricing-price">
              <span className="pricing-amount">$299</span>
              <span className="pricing-period">/ month</span>
            </div>
            <p className="pricing-description">
              For venues/promoters doing settlements weekly.
            </p>
          </div>

          <p className="pricing-includes">Everything in Pay-as-you-go, plus:</p>

          <ul className="pricing-features">
            <li>Unlimited settlements</li>
            <li>Templates + defaults (save deal terms once)</li>
            <li>Draft / Final + lock</li>
            <li>Share link controls (revoke, expiry, watermark)</li>
            <li>Roles (admin + viewer)</li>
            <li>CSV exports (accounting-friendly)</li>
          </ul>

          <Button as="a" href="/login" variant="primary" className="pricing-cta">
            Start Pro
          </Button>
        </Card>

        {/* Tier 3: Org */}
        <Card className="pricing-card" variant="default" padding="lg">
          <div className="pricing-card-header">
            <h3 className="pricing-tier-name">Org</h3>
            <div className="pricing-price">
              <span className="pricing-amount-small">Starting at</span>
              <span className="pricing-amount">$999</span>
              <span className="pricing-period">/ month</span>
            </div>
            <p className="pricing-description">
              For venue groups, multi-room operators, and high-volume promoters.
            </p>
          </div>

          <p className="pricing-includes">Everything in Pro, plus:</p>

          <ul className="pricing-features">
            <li>Multi-venue / multi-room</li>
            <li>Advanced permissions (team roles)</li>
            <li>Org-wide templates &amp; standardization</li>
            <li>Reporting (closeouts, payouts, margins)</li>
            <li>Priority onboarding + support</li>
          </ul>

          <Button as="a" href="mailto:abattisti@proton.me" variant="secondary" className="pricing-cta">
            Talk to sales
          </Button>
        </Card>
      </div>

      <section className="pricing-addons">
        <h2>Add-ons</h2>
        <div className="addons-grid">
          <Card className="addon-item" variant="bordered" padding="md">
            <h3>Onboarding / Template setup</h3>
            <p className="addon-price">$500</p>
            <p className="addon-note">(credited toward first month)</p>
          </Card>
          <Card className="addon-item" variant="bordered" padding="md">
            <h3>Extra settlement packs</h3>
            <p className="addon-price">$49 per 10</p>
            <p className="addon-note">(Pay-as-you-go only)</p>
          </Card>
        </div>
      </section>

      <section className="pricing-faq">
        <h2 className="pricing-faq-title">Frequently asked questions</h2>
        <div className="faq-grid">
          <Card className="faq-item" variant="bordered" padding="md">
            <h3>Do I need Pro to share settlements?</h3>
            <p>No — share links are included on pay-as-you-go.</p>
          </Card>
          <Card className="faq-item" variant="bordered" padding="md">
            <h3>What makes Pro worth it?</h3>
            <p>Templates, controls, team roles, and unlimited settlements.</p>
          </Card>
          <Card className="faq-item" variant="bordered" padding="md">
            <h3>How is Org priced?</h3>
            <p>Based on number of venues/rooms and settlement volume.</p>
          </Card>
        </div>
      </section>
    </main>
  );

  if (!user) {
    return <MarketingShell>{content}</MarketingShell>;
  }

  return (
    <AppShell
      maxWidth={1200}
      userEmail={user.email ?? undefined}
      showNavLinks={false}
      userMenuContent={accountMenuData ? <AppAccountMenu initialData={accountMenuData} /> : undefined}
    >
      {content}
    </AppShell>
  );
}
