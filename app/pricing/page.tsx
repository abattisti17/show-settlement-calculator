import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo";
import "./pricing.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing - GigSettle",
  description:
    "Compare pay-as-you-go, Pro, and Org plans for settlement workflows. Pick the right plan for your venue or promoter team.",
  path: "/pricing",
});

export default function PricingPage() {
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
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: toAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: toAbsoluteUrl("/pricing"),
      },
    ],
  };

  return (
    <main className="pricing-page">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="pricing-back-nav">
        <nav aria-label="Breadcrumb">
          <Link href="/">Home</Link> / <span aria-current="page">Pricing</span>
        </nav>
        <Link href="/" className="pricing-back-btn">
          ← Back to home
        </Link>
      </div>

      <header className="pricing-header">
        <h1>Simple pricing that scales with your volume</h1>
        <p className="pricing-subtitle">
          Start pay-as-you-go. Upgrade when you need templates, controls, and team workflow.
        </p>
      </header>

      <div className="pricing-tiers">
        {/* Tier 1: Pay as you go */}
        <div className="pricing-card">
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

          <Link href="/login" className="pricing-cta btn-ghost">
            Start pay-as-you-go
          </Link>
        </div>

        {/* Tier 2: Pro (Popular) */}
        <div className="pricing-card pricing-card-featured">
          <div className="pricing-badge">Most Popular</div>
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

          <Link href="/login" className="pricing-cta btn-primary">
            Start Pro
          </Link>
        </div>

        {/* Tier 3: Org */}
        <div className="pricing-card">
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
            <li>Org-wide templates & standardization</li>
            <li>Reporting (closeouts, payouts, margins)</li>
            <li>Priority onboarding + support</li>
          </ul>

          <a href="mailto:abattisti@proton.me" className="pricing-cta btn-ghost">
            Talk to sales
          </a>
        </div>
      </div>

      <section className="pricing-addons">
        <h2>Add-ons</h2>
        <div className="addons-grid">
          <div className="addon-item">
            <h3>Onboarding / Template setup</h3>
            <p className="addon-price">$500</p>
            <p className="addon-note">(credited toward first month)</p>
          </div>
          <div className="addon-item">
            <h3>Extra settlement packs</h3>
            <p className="addon-price">$49 per 10</p>
            <p className="addon-note">(Pay-as-you-go only)</p>
          </div>
        </div>
      </section>

      <section className="pricing-faq">
        <h2>Frequently asked questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Do I need Pro to share settlements?</h3>
            <p>No — share links are included on pay-as-you-go.</p>
          </div>
          <div className="faq-item">
            <h3>What makes Pro worth it?</h3>
            <p>Templates, controls, team roles, and unlimited settlements.</p>
          </div>
          <div className="faq-item">
            <h3>How is Org priced?</h3>
            <p>Based on number of venues/rooms and settlement volume.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
