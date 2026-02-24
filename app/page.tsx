"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { hasProAccessClient } from "@/lib/access/entitlements-client";
import JsonLd from "./components/JsonLd";
import ShareLinkManager from "./components/ShareLinkManager";
import { toAbsoluteUrl } from "@/lib/seo";
import { MarketingShell } from "@/components/ui/MarketingShell";
import { AppShell } from "@/components/ui/AppShell";
import { AppAccountMenu } from "@/components/ui/AppAccountMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionFooter } from "@/components/ui/SectionFooter";
import { AuthorCard } from "@/components/ui/AuthorCard";
import { Icon } from "@/components/ui/Icon";
import "./landing.css";
import "./calculator.css";

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * DealType represents the three possible deal structures between
 * an artist and a venue/promoter:
 * - "guarantee": Artist gets a fixed amount regardless of ticket sales
 * - "percentage": Artist gets a percentage of the net profit
 * - "guarantee_vs_percentage": Artist gets whichever is higher
 */
type DealType = "guarantee" | "percentage" | "guarantee_vs_percentage";

/**
 * FormData stores all the user inputs from the form.
 * All numeric values are stored as strings to handle empty inputs gracefully.
 */
interface FormData {
  showName: string;          // Name of the show (for saving/identifying)
  artistName: string;        // Name of the artist/band (optional, for display)
  ticketPrice: string;       // Price per ticket in dollars
  ticketsSold: string;       // Number of tickets sold
  taxRate: string;           // Tax rate as a percentage (ex: "10" for 10%)
  totalExpenses: string;     // Total expenses in dollars
  dealType: DealType;        // The type of deal structure
  guarantee: string;         // Guaranteed amount for the artist (if applicable)
  percentage: string;        // Percentage of net for the artist (if applicable)
}

/**
 * CalculationResult stores the computed settlement values.
 * All values are numbers representing dollar amounts.
 */
interface CalculationResult {
  grossRevenue: number;      // Total revenue from ticket sales
  taxAmount: number;         // Amount of tax to be paid
  totalExpenses: number;     // Total expenses (copied from input)
  netProfit: number;         // Profit after tax and expenses
  artistPayout: number;      // Amount the artist receives
  venuePayout: number;       // Amount the venue/promoter keeps
}

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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formats a number as USD currency.
 * Examples: 1234.56 -> "$1,234.56", -500 -> "-$500.00"
 */
function formatCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Safely parses a string to a number, returning 0 for empty or invalid values.
 * This prevents NaN from propagating through calculations.
 */
function parseNumber(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================
// LANDING PAGE (LOGGED OUT)
// ============================================

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

// ============================================
// MAIN COMPONENT
// ============================================

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // -----------------------------------------
  // STATE MANAGEMENT
  // -----------------------------------------

  /**
   * User authentication state
   */
  const [user, setUser] = useState<User | null>(null);

  /**
   * Pro access status (via entitlements)
   */
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loadingAccess, setLoadingAccess] = useState<boolean>(true);

  /**
   * formData holds all the user inputs.
   * We initialize with empty strings so the inputs start blank.
   */
  const [formData, setFormData] = useState<FormData>({
    showName: "",
    artistName: "",
    ticketPrice: "",
    ticketsSold: "",
    taxRate: "",
    totalExpenses: "",
    dealType: "guarantee",
    guarantee: "",
    percentage: "",
  });

  /**
   * result stores the calculation output.
   * null means no calculation has been performed yet.
   */
  const [result, setResult] = useState<CalculationResult | null>(null);

  /**
   * errorMessage displays validation errors to the user.
   * Empty string means no error.
   */
  const [errorMessage, setErrorMessage] = useState<string>("");

  /**
   * State for save/load functionality
   */
  const [currentShowId, setCurrentShowId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>("");

  // -----------------------------------------
  // AUTH EFFECT
  // -----------------------------------------

  /**
   * Fetch the current user and pro access status on mount
   */
  useEffect(() => {
    async function getUserAndAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check pro access status via entitlements
        const hasProAccess = await hasProAccessClient();
        setHasAccess(hasProAccess);
      }
      setLoadingAccess(false);
    }
    getUserAndAccess();
  }, [supabase.auth]);

  /**
   * Load show from URL param if present
   */
  useEffect(() => {
    async function loadShow() {
      const showId = searchParams.get('showId');
      if (!showId || !user) return;

      try {
        const { data, error } = await supabase
          .from('shows')
          .select('*')
          .eq('id', showId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading show:', error);
          setSaveStatus('error');
          setSaveMessage('Failed to load show. It may not exist or you may not have access.');
          setTimeout(() => {
            setSaveMessage('');
            setSaveStatus('idle');
          }, 4000);
          return;
        }

        if (data) {
          // Hydrate form with show data
          setFormData({
            showName: data.title || '',
            artistName: data.inputs.artistName || '',
            ticketPrice: data.inputs.ticketPrice || '',
            ticketsSold: data.inputs.ticketsSold || '',
            taxRate: data.inputs.taxRate || '',
            totalExpenses: data.inputs.totalExpenses || '',
            dealType: data.inputs.dealType || 'guarantee',
            guarantee: data.inputs.guarantee || '',
            percentage: data.inputs.percentage || '',
          });

          // Set results
          setResult(data.results);

          // Set current show ID for updates
          setCurrentShowId(data.id);
        }
      } catch (error) {
        console.error('Error loading show:', error);
      }
    }

    if (user && !loadingAccess) {
      loadShow();
    }
  }, [searchParams, user, loadingAccess, supabase]);

  // -----------------------------------------
  // EVENT HANDLERS
  // -----------------------------------------

  /**
   * Updates form state when any input changes.
   * Uses the input's name attribute to determine which field to update.
   */
  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear any existing error when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }
  }

  /**
   * Validates inputs and performs the settlement calculation.
   * This is the core business logic of the app.
   */
  function handleCalculate() {
    // -----------------------------------------
    // STEP 1: Parse and validate inputs
    // -----------------------------------------
    const ticketPrice = parseNumber(formData.ticketPrice);
    const ticketsSold = parseNumber(formData.ticketsSold);
    const taxRate = parseNumber(formData.taxRate);
    const totalExpenses = parseNumber(formData.totalExpenses);
    const guarantee = parseNumber(formData.guarantee);
    const percentage = parseNumber(formData.percentage);

    // Validate required fields based on deal type
    if (ticketPrice <= 0 || ticketsSold <= 0) {
      setErrorMessage("Please enter valid ticket price and tickets sold.");
      setResult(null);
      return;
    }

    // Check deal-specific required fields
    if (formData.dealType === "guarantee" && guarantee <= 0) {
      setErrorMessage("Please enter a valid guarantee amount.");
      setResult(null);
      return;
    }

    if (formData.dealType === "percentage" && percentage <= 0) {
      setErrorMessage("Please enter a valid percentage.");
      setResult(null);
      return;
    }

    if (
      formData.dealType === "guarantee_vs_percentage" &&
      (guarantee <= 0 || percentage <= 0)
    ) {
      setErrorMessage("Please enter both guarantee amount and percentage.");
      setResult(null);
      return;
    }

    // -----------------------------------------
    // STEP 2: Calculate gross revenue
    // Gross = ticket price × number of tickets sold
    // -----------------------------------------
    const grossRevenue = ticketPrice * ticketsSold;

    // -----------------------------------------
    // STEP 3: Calculate tax amount
    // Tax = gross revenue × (tax rate / 100)
    // If tax rate is 0 or empty, tax is 0
    // -----------------------------------------
    const taxAmount = grossRevenue * (taxRate / 100);

    // -----------------------------------------
    // STEP 4: Calculate net profit
    // Net = gross - tax - expenses
    // This is the money available to split
    // -----------------------------------------
    const netProfit = grossRevenue - taxAmount - totalExpenses;

    // -----------------------------------------
    // STEP 5: Calculate artist payout based on deal type
    // -----------------------------------------
    let artistPayout: number;

    switch (formData.dealType) {
      case "guarantee":
        // Artist gets the guaranteed amount regardless of net
        artistPayout = guarantee;
        break;

      case "percentage":
        // Artist gets their percentage of the net profit
        // If net is negative, artist gets 0 (can't have negative payout)
        artistPayout = Math.max(0, netProfit * (percentage / 100));
        break;

      case "guarantee_vs_percentage":
        // Artist gets whichever is higher: guarantee or percentage of net
        const percentageShare = Math.max(0, netProfit * (percentage / 100));
        artistPayout = Math.max(guarantee, percentageShare);
        break;

      default:
        artistPayout = 0;
    }

    // -----------------------------------------
    // STEP 6: Calculate venue/promoter payout
    // Venue gets whatever is left after paying the artist
    // -----------------------------------------
    const venuePayout = netProfit - artistPayout;

    // -----------------------------------------
    // STEP 7: Store the results
    // -----------------------------------------
    setResult({
      grossRevenue,
      taxAmount,
      totalExpenses,
      netProfit,
      artistPayout,
      venuePayout,
    });

    setErrorMessage("");
  }

  /**
   * Triggers the browser's print dialog.
   * The CSS handles hiding the input section when printing.
   */
  function handlePrint() {
    window.print();
  }

  /**
   * Saves the current show to the database.
   * If currentShowId exists, updates the existing show; otherwise creates a new one.
   */
  async function handleSaveShow() {
    // Validation
    if (!formData.showName.trim()) {
      setSaveStatus('error');
      setSaveMessage('Please enter a show name before saving.');
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus('idle');
      }, 4000);
      return;
    }

    if (!result) {
      setSaveStatus('error');
      setSaveMessage('Please calculate the settlement before saving.');
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus('idle');
      }, 4000);
      return;
    }

    if (!user) {
      setSaveStatus('error');
      setSaveMessage('You must be logged in to save shows.');
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus('idle');
      }, 4000);
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('');

    try {
      // Prepare data for Supabase
      const showData = {
        user_id: user.id,
        title: formData.showName.trim(),
        inputs: {
          artistName: formData.artistName,
          ticketPrice: formData.ticketPrice,
          ticketsSold: formData.ticketsSold,
          taxRate: formData.taxRate,
          totalExpenses: formData.totalExpenses,
          dealType: formData.dealType,
          guarantee: formData.guarantee,
          percentage: formData.percentage,
        },
        results: result,
      };

      let savedShowId: string;

      if (currentShowId) {
        // Update existing show
        const { data, error } = await supabase
          .from('shows')
          .update(showData)
          .eq('id', currentShowId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        savedShowId = data.id;
        
        setSaveStatus('success');
        setSaveMessage('Show updated successfully!');
      } else {
        // Insert new show
        const { data, error } = await supabase
          .from('shows')
          .insert([showData])
          .select()
          .single();

        if (error) throw error;
        savedShowId = data.id;
        setCurrentShowId(savedShowId);
        
        setSaveStatus('success');
        setSaveMessage('Show saved successfully!');
      }

      // Clear success message after 4 seconds
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus('idle');
      }, 4000);
    } catch (error) {
      console.error('Error saving show:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save show. Please try again.');
      
      // Clear error message after 4 seconds
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus('idle');
      }, 4000);
    }
  }

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  // Show loading state while checking access
  if (loadingAccess) {
    return (
      <AppShell maxWidth={720} userEmail={user?.email ?? undefined} showNavLinks={false} userMenuContent={<AppAccountMenu />}>
        <div className="calculator-container">
          <div className="calculator-loading">
            <p>Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Show paywall if user is logged in but doesn't have pro access
  if (user && !hasAccess) {
    return (
      <AppShell maxWidth={720} userEmail={user.email ?? undefined} showNavLinks={false} userMenuContent={<AppAccountMenu />}>
        <div className="calculator-container">
          <div className="calculator-paywall">
            <Card className="paywall-card" variant="elevated" padding="lg">
              <h1>Subscribe to Access the Calculator</h1>
              <p className="paywall-description">
                A subscription is required to use the Show Settlement Calculator. 
                Get instant access to unlimited calculations and save your settlements.
              </p>
              
              <div className="calculator-paywall-features">
                <div className="calculator-paywall-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Unlimited calculations</span>
                </div>
                <div className="calculator-paywall-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Save and share settlements</span>
                </div>
                <div className="calculator-paywall-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Access from any device</span>
                </div>
              </div>

              <Button onClick={() => router.push('/dashboard')} variant="primary" size="lg">
                View Plans & Subscribe
              </Button>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <>
    <AppShell maxWidth={720} userEmail={user.email ?? undefined} showNavLinks={false} userMenuContent={<AppAccountMenu />}>
      <div className="calculator-container">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="ghost"
          size="sm"
          style={{ marginBottom: "1rem" }}
        >
          <Icon name="chevron" size={14} direction="left" /> Back to Dashboard
        </Button>

        <PageHeader
          title="Show Settlement Calculator"
          description="Quickly calculate artist and venue payouts for a live show. For small venues and indie promoters who are tired of broken spreadsheets. Plug in your show numbers and get a clean, consistent settlement breakdown."
          action={
            <Button
              onClick={handleSaveShow}
              disabled={!result || saveStatus === 'saving'}
              variant="primary"
              size="sm"
              loading={saveStatus === 'saving'}
            >
              {currentShowId ? 'Update Show' : 'Save Show'}
            </Button>
          }
        />

        {/* Save Status Message */}
        {saveMessage && (
          <div className={`calculator-save-status ${saveStatus === 'success' ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}

        {/* Section 1: Input Form */}
        <Card className="calculator-form-section" variant="default" padding="lg">
          <h3 className="calculator-section-title">Show Info</h3>
          <Input
            id="showName"
            name="showName"
            label="Show Name"
            value={formData.showName}
            onChange={handleInputChange}
            placeholder="ex: Summer Festival 2026"
          />
          <Input
            id="artistName"
            name="artistName"
            label="Artist / Band Name"
            value={formData.artistName}
            onChange={handleInputChange}
            placeholder="ex: The Rolling Stones"
          />

          <h3 className="calculator-section-title">Ticket Info</h3>
          <div className="calculator-form-row">
            <Input
              id="ticketPrice"
              name="ticketPrice"
              label="Ticket Price ($)"
              type="number"
              value={formData.ticketPrice}
              onChange={handleInputChange}
              placeholder="ex: 25"
              min={0}
              step={0.01}
            />
            <Input
              id="ticketsSold"
              name="ticketsSold"
              label="Tickets Sold"
              type="number"
              value={formData.ticketsSold}
              onChange={handleInputChange}
              placeholder="ex: 200"
              min={0}
              step={1}
            />
          </div>

          <h3 className="calculator-section-title">Tax & Expenses</h3>
          <div className="calculator-form-row">
            <Input
              id="taxRate"
              name="taxRate"
              label="Tax Rate (%)"
              type="number"
              value={formData.taxRate}
              onChange={handleInputChange}
              placeholder="ex: 10"
              min={0}
              max={100}
              step={0.1}
            />
            <Input
              id="totalExpenses"
              name="totalExpenses"
              label="Total Expenses ($)"
              type="number"
              value={formData.totalExpenses}
              onChange={handleInputChange}
              placeholder="ex: 500"
              min={0}
              step={0.01}
            />
          </div>

          <h3 className="calculator-section-title">Deal Structure</h3>
          <Select
            id="dealType"
            name="dealType"
            label="Deal Type"
            value={formData.dealType}
            onChange={handleInputChange}
          >
            <option value="guarantee">Guarantee</option>
            <option value="percentage">Percentage of Net</option>
            <option value="guarantee_vs_percentage">
              Guarantee vs Percentage (whichever is higher)
            </option>
          </Select>

          {/* Conditionally show deal-specific inputs */}
          <div className="calculator-form-row">
            {(formData.dealType === "guarantee" ||
              formData.dealType === "guarantee_vs_percentage") && (
              <Input
                id="guarantee"
                name="guarantee"
                label="Guarantee Amount ($)"
                type="number"
                value={formData.guarantee}
                onChange={handleInputChange}
                placeholder="ex: 1000"
                min={0}
                step={0.01}
              />
            )}
            {(formData.dealType === "percentage" ||
              formData.dealType === "guarantee_vs_percentage") && (
              <Input
                id="percentage"
                name="percentage"
                label="Percentage (%)"
                type="number"
                value={formData.percentage}
                onChange={handleInputChange}
                placeholder="ex: 80"
                min={0}
                max={100}
                step={0.1}
              />
            )}
          </div>

          {errorMessage && (
            <div className="calculator-save-status error" style={{ marginTop: "1rem" }}>
              {errorMessage}
            </div>
          )}

          <Button type="button" variant="primary" size="lg" onClick={handleCalculate} style={{ width: "100%", marginTop: "1rem" }}>
            Calculate Settlement
          </Button>
        </Card>

        {/* Section 2: Results */}
        {result && (
          <section className="results-section" style={{ marginTop: "2rem" }}>
            <Card className="results-card" variant="elevated" padding="lg">
              <h2>Settlement Summary</h2>

              {formData.artistName && (
                <p className="artist-name-display">
                  Settlement for: {formData.artistName}
                </p>
              )}

              <div className="calculator-result-row result-row">
                <span className="label">Gross Revenue</span>
                <span className="value">{formatCurrency(result.grossRevenue)}</span>
              </div>

              <div className="calculator-result-row result-row">
                <span className="label">Tax</span>
                <span className="value">−{formatCurrency(result.taxAmount)}</span>
              </div>

              <div className="calculator-result-row result-row">
                <span className="label">Expenses</span>
                <span className="value">−{formatCurrency(result.totalExpenses)}</span>
              </div>

              <div className="calculator-result-row result-row highlight">
                <span className="label">Net</span>
                <span className="value">{formatCurrency(result.netProfit)}</span>
              </div>

              <div className="calculator-result-row result-row highlight artist-payout">
                <span className="label">Artist Payout</span>
                <span className="value">{formatCurrency(result.artistPayout)}</span>
              </div>

              <div className="calculator-result-row result-row highlight venue-payout">
                <span className="label">Promoter/House Settlement</span>
                <span className="value">{formatCurrency(result.venuePayout)}</span>
              </div>

              <Button variant="secondary" onClick={handlePrint} className="calculator-print-btn" style={{ width: "100%", marginTop: "1.25rem" }}>
                🖨️ Print / Save as PDF
              </Button>
            </Card>
          </section>
        )}

        {/* Share Link Manager */}
        {currentShowId && result && user && (
          <section style={{ marginTop: "2rem" }}>
            <ShareLinkManager showId={currentShowId} showName={formData.showName} />
          </section>
        )}
      </div>

      {/* Footer */}
      <SectionFooter>
        <AuthorCard imageSrc="/my-photo.png" imageAlt="Founder photo">
          <p>
            Hi, I&apos;m Alessandro, an indie designer exploring tools for small venues and indie promoters. 
            I created this free settlement calculator because so many people still struggle 
            with spreadsheets and inconsistent deal sheets.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If you have questions, ideas, or requests, email me directly at
            <a href="mailto:abattisti@proton.me"> abattisti@proton.me</a>.
          </p>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text)", fontWeight: "var(--font-medium)" as unknown as number }}>
            Cheers!
          </p>
        </AuthorCard>
      </SectionFooter>
    </AppShell>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LandingPage />}>
      <CalculatorContent />
    </Suspense>
  );
}
