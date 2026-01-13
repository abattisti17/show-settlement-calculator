"use client";

import { useState } from "react";

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
  artistName: string;        // Name of the artist/band (optional, for display)
  ticketPrice: string;       // Price per ticket in dollars
  ticketsSold: string;       // Number of tickets sold
  taxRate: string;           // Tax rate as a percentage (e.g., "10" for 10%)
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

export default function Home() {
  // -----------------------------------------
  // STATE MANAGEMENT
  // -----------------------------------------

  /**
   * formData holds all the user inputs.
   * We initialize with empty strings so the inputs start blank.
   */
  const [formData, setFormData] = useState<FormData>({
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

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  return (
    <>
    <main className="container">
      {/* Header */}
      <header className="header">
        <h1>Show Settlement Calculator</h1>
        <p>Quickly calculate artist and venue payouts for a live show.
        <br /> <br />
        For small venues and indie promoters who are tired of broken spreadsheets. Plug in your show numbers and get a clean, consistent settlement breakdown.
        </p>
      </header>

      {/* Section 1: Input Form */}
      <section className="section">
        {/* Show Info */}
        <h3 className="section-title">Show Info</h3>
        <div className="form-group">
          <label htmlFor="artistName">Artist / Band Name</label>
          <input
            type="text"
            id="artistName"
            name="artistName"
            value={formData.artistName}
            onChange={handleInputChange}
            placeholder="e.g., The Rolling Stones"
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
              placeholder="e.g., 25"
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
              placeholder="e.g., 200"
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
              placeholder="e.g., 10"
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
              placeholder="e.g., 500"
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
                placeholder="e.g., 1000"
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
                placeholder="e.g., 80"
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
