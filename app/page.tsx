"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { hasProAccessClient } from "@/lib/access/entitlements-client";
import ShareLinkManager from "./components/ShareLinkManager";

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

  /**
   * Handle sign out
   */
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

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
      <main className="container">
        <div className="loading-state">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  // Show paywall if user is logged in but doesn't have pro access
  if (user && !hasAccess) {
    return (
      <main className="container">
        {/* User Header */}
        <div className="user-header">
          <span className="user-email">{user.email}</span>
          <button onClick={handleSignOut} className="logout-btn">
            Sign Out
          </button>
        </div>

        {/* Paywall */}
        <div className="paywall">
          <div className="paywall-card">
            <h1>Subscribe to Access the Calculator</h1>
            <p className="paywall-description">
              A subscription is required to use the Show Settlement Calculator. 
              Get instant access to unlimited calculations and save your settlements.
            </p>
            
            <div className="paywall-features">
              <div className="paywall-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Unlimited calculations</span>
              </div>
              <div className="paywall-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Save and share settlements</span>
              </div>
              <div className="paywall-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Access from any device</span>
              </div>
            </div>

            <button 
              onClick={() => router.push('/dashboard')}
              className="paywall-btn"
            >
              View Plans & Subscribe
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="container">
      {/* User Header */}
      {user && (
        <div className="user-header">
          <div className="user-header-left">
            <span className="user-email">{user.email}</span>
          </div>
          <div className="user-header-actions">
            <button
              onClick={() => router.push('/dashboard')}
              className="dashboard-link-btn"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleSaveShow}
              disabled={!result || saveStatus === 'saving'}
              className="save-show-btn"
            >
              {saveStatus === 'saving' ? 'Saving...' : currentShowId ? 'Update Show' : 'Save Show'}
            </button>
            <button onClick={handleSignOut} className="logout-btn">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <h1>Show Settlement Calculator</h1>
        <p>Quickly calculate artist and venue payouts for a live show.
        <br /> <br />
        For small venues and indie promoters who are tired of broken spreadsheets. Plug in your show numbers and get a clean, consistent settlement breakdown.
        </p>
      </header>

      {/* Save Status Message */}
      {saveMessage && (
        <div className={`save-status-message ${saveStatus === 'success' ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      {/* Section 1: Input Form */}
      <section className="section">
        {/* Show Info */}
        <h3 className="section-title">Show Info</h3>
        <div className="form-group">
          <label htmlFor="showName">Show Name</label>
          <input
            type="text"
            id="showName"
            name="showName"
            value={formData.showName}
            onChange={handleInputChange}
            placeholder="ex: Summer Festival 2026"
          />
        </div>
        <div className="form-group">
          <label htmlFor="artistName">Artist / Band Name</label>
          <input
            type="text"
            id="artistName"
            name="artistName"
            value={formData.artistName}
            onChange={handleInputChange}
            placeholder="ex: The Rolling Stones"
          />
        </div>

        {/* Ticket Info */}
        <h3 className="section-title">Ticket Info</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ticketPrice">Ticket Price ($)</label>
            <input
              type="number"
              id="ticketPrice"
              name="ticketPrice"
              value={formData.ticketPrice}
              onChange={handleInputChange}
              placeholder="ex: 25"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="ticketsSold">Tickets Sold</label>
            <input
              type="number"
              id="ticketsSold"
              name="ticketsSold"
              value={formData.ticketsSold}
              onChange={handleInputChange}
              placeholder="ex: 200"
              min="0"
              step="1"
            />
          </div>
        </div>

        {/* Tax & Expenses */}
        <h3 className="section-title">Tax & Expenses</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="taxRate">Tax Rate (%)</label>
            <input
              type="number"
              id="taxRate"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleInputChange}
              placeholder="ex: 10"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="totalExpenses">Total Expenses ($)</label>
            <input
              type="number"
              id="totalExpenses"
              name="totalExpenses"
              value={formData.totalExpenses}
              onChange={handleInputChange}
              placeholder="ex: 500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Deal Type & Deal Inputs */}
        <h3 className="section-title">Deal Structure</h3>
        <div className="form-group">
          <label htmlFor="dealType">Deal Type</label>
          <select
            id="dealType"
            name="dealType"
            value={formData.dealType}
            onChange={handleInputChange}
          >
            <option value="guarantee">Guarantee</option>
            <option value="percentage">Percentage of Net</option>
            <option value="guarantee_vs_percentage">
              Guarantee vs Percentage (whichever is higher)
            </option>
          </select>
        </div>

        {/* Conditionally show deal-specific inputs */}
        <div className="form-row">
          {/* Show Guarantee input for "guarantee" or "guarantee_vs_percentage" */}
          {(formData.dealType === "guarantee" ||
            formData.dealType === "guarantee_vs_percentage") && (
            <div className="form-group">
              <label htmlFor="guarantee">Guarantee Amount ($)</label>
              <input
                type="number"
                id="guarantee"
                name="guarantee"
                value={formData.guarantee}
                onChange={handleInputChange}
                placeholder="ex: 1000"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Show Percentage input for "percentage" or "guarantee_vs_percentage" */}
          {(formData.dealType === "percentage" ||
            formData.dealType === "guarantee_vs_percentage") && (
            <div className="form-group">
              <label htmlFor="percentage">Percentage (%)</label>
              <input
                type="number"
                id="percentage"
                name="percentage"
                value={formData.percentage}
                onChange={handleInputChange}
                placeholder="ex: 80"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {/* Calculate Button */}
        <button type="button" className="calculate-btn" onClick={handleCalculate}>
          Calculate Settlement
        </button>
      </section>

      {/* Section 2: Results */}
      {result && (
        <section className="section results-section">
          <div className="results-card">
            <h2>Settlement Summary</h2>

            {/* Show artist name if provided */}
            {formData.artistName && (
              <p className="artist-name-display">
                Settlement for: {formData.artistName}
              </p>
            )}

            {/* Revenue breakdown */}
            <div className="result-row">
              <span className="label">Gross Revenue</span>
              <span className="value">{formatCurrency(result.grossRevenue)}</span>
            </div>

            <div className="result-row">
              <span className="label">Tax</span>
              <span className="value">−{formatCurrency(result.taxAmount)}</span>
            </div>

            <div className="result-row">
              <span className="label">Expenses</span>
              <span className="value">−{formatCurrency(result.totalExpenses)}</span>
            </div>

            <div className="result-row highlight">
              <span className="label">Net</span>
              <span className="value">{formatCurrency(result.netProfit)}</span>
            </div>

            {/* Payout breakdown */}
            <div className="result-row highlight artist-payout">
              <span className="label">Artist Payout</span>
              <span className="value">{formatCurrency(result.artistPayout)}</span>
            </div>

            <div className="result-row highlight venue-payout">
              <span className="label">Promoter/House Settlement</span>
              <span className="value">{formatCurrency(result.venuePayout)}</span>
            </div>

            {/* Print Button */}
            <button className="print-btn" onClick={handlePrint}>
              🖨️ Print / Save as PDF
            </button>
          </div>
        </section>
      )}

      {/* Share Link Manager - only show when show is saved */}
      {currentShowId && result && user && (
        <section className="section">
          <ShareLinkManager showId={currentShowId} showName={formData.showName} />
        </section>
      )}
      </main>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-content">
          <img 
            src="/my-photo.png" 
            alt="Founder photo" 
            className="footer-photo"
          />
          
          <div className="footer-text">
            <p>
              Hi, I&apos;m Alessandro, an indie designer exploring tools for small venues and indie promoters. 
              I created this free settlement calculator because so many people still struggle 
              with spreadsheets and inconsistent deal sheets.
            </p>
            <p className="footer-email">
              If you have questions, ideas, or requests, email me directly at
              <a href="mailto:abattisti@proton.me">
                abattisti@proton.me
              </a>.
            </p>
            <p className="footer-cheers">Cheers!</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="container">
        <div className="loading-state">
          <p>Loading...</p>
        </div>
      </main>
    }>
      <CalculatorContent />
    </Suspense>
  );
}
