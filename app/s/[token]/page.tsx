import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import Link from "next/link";

/**
 * Public share page for settlements
 * Server component that fetches show data using service role to bypass RLS
 * No authentication required - access granted via valid active token
 */

interface Show {
  id: string;
  title: string | null;
  show_date: string | null;
  inputs: {
    artistName?: string;
    ticketPrice?: string;
    ticketsSold?: string;
    taxRate?: string;
    totalExpenses?: string;
    dealType?: string;
    guarantee?: string;
    percentage?: string;
  };
  results: {
    grossRevenue: number;
    taxAmount: number;
    totalExpenses: number;
    netProfit: number;
    artistPayout: number;
    venuePayout: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Formats a number as USD currency
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
 * Formats deal type for display
 */
function formatDealType(dealType: string): string {
  switch (dealType) {
    case "guarantee":
      return "Guarantee";
    case "percentage":
      return "Percentage of Net";
    case "guarantee_vs_percentage":
      return "Guarantee vs Percentage (whichever is higher)";
    default:
      return dealType;
  }
}

export default async function SharedSettlementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const serviceClient = createServiceClient();
  const resolvedParams = await params;
  const token = resolvedParams?.token ?? "";

  // Look up share link using service role
  const { data: shareLink, error: shareLinkError } = await serviceClient
    .from("share_links")
    .select("show_id, is_active")
    .eq("token", token)
    .single();

  // If link doesn't exist or is inactive, show 404
  if (shareLinkError || !shareLink || !shareLink.is_active) {
    notFound();
  }

  // Fetch show data using service role
  const { data: show, error: showError } = await serviceClient
    .from("shows")
    .select("*")
    .eq("id", shareLink.show_id)
    .single();

  if (showError || !show) {
    notFound();
  }

  const typedShow = show as Show;

  return (
    <main className="settlement-packet-container">
      {/* Header */}
      <header className="settlement-packet-header">
        <div className="settlement-packet-logo">
          <h1>Show Settlement Calculator</h1>
          <p className="settlement-packet-subtitle">Settlement Report</p>
        </div>
      </header>

      {/* Settlement Content */}
      <div className="settlement-packet-content">
        {/* Show Info Section */}
        <section className="settlement-section">
          <h2 className="settlement-section-title">Show Information</h2>
          <div className="settlement-info-grid">
            {typedShow.title && (
              <div className="settlement-info-item">
                <span className="settlement-label">Show Name:</span>
                <span className="settlement-value">{typedShow.title}</span>
              </div>
            )}
            {typedShow.inputs.artistName && (
              <div className="settlement-info-item">
                <span className="settlement-label">Artist:</span>
                <span className="settlement-value">{typedShow.inputs.artistName}</span>
              </div>
            )}
            {typedShow.show_date && (
              <div className="settlement-info-item">
                <span className="settlement-label">Show Date:</span>
                <span className="settlement-value">
                  {new Date(typedShow.show_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Deal Structure Section */}
        <section className="settlement-section">
          <h2 className="settlement-section-title">Deal Structure</h2>
          <div className="settlement-info-grid">
            <div className="settlement-info-item">
              <span className="settlement-label">Deal Type:</span>
              <span className="settlement-value">
                {formatDealType(typedShow.inputs.dealType || "")}
              </span>
            </div>
            {typedShow.inputs.guarantee && (
              <div className="settlement-info-item">
                <span className="settlement-label">Guarantee Amount:</span>
                <span className="settlement-value">
                  {formatCurrency(parseFloat(typedShow.inputs.guarantee))}
                </span>
              </div>
            )}
            {typedShow.inputs.percentage && (
              <div className="settlement-info-item">
                <span className="settlement-label">Percentage:</span>
                <span className="settlement-value">{typedShow.inputs.percentage}%</span>
              </div>
            )}
          </div>
        </section>

        {/* Show Details Section */}
        <section className="settlement-section">
          <h2 className="settlement-section-title">Show Details</h2>
          <div className="settlement-info-grid">
            {typedShow.inputs.ticketPrice && (
              <div className="settlement-info-item">
                <span className="settlement-label">Ticket Price:</span>
                <span className="settlement-value">
                  {formatCurrency(parseFloat(typedShow.inputs.ticketPrice))}
                </span>
              </div>
            )}
            {typedShow.inputs.ticketsSold && (
              <div className="settlement-info-item">
                <span className="settlement-label">Tickets Sold:</span>
                <span className="settlement-value">{typedShow.inputs.ticketsSold}</span>
              </div>
            )}
            {typedShow.inputs.taxRate && (
              <div className="settlement-info-item">
                <span className="settlement-label">Tax Rate:</span>
                <span className="settlement-value">{typedShow.inputs.taxRate}%</span>
              </div>
            )}
            {typedShow.inputs.totalExpenses && (
              <div className="settlement-info-item">
                <span className="settlement-label">Total Expenses:</span>
                <span className="settlement-value">
                  {formatCurrency(parseFloat(typedShow.inputs.totalExpenses))}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Settlement Breakdown */}
        <section className="settlement-section settlement-breakdown">
          <h2 className="settlement-section-title">Settlement Breakdown</h2>
          
          <div className="settlement-results">
            <div className="settlement-result-row">
              <span className="settlement-result-label">Gross Revenue</span>
              <span className="settlement-result-value">
                {formatCurrency(typedShow.results.grossRevenue)}
              </span>
            </div>

            <div className="settlement-result-row">
              <span className="settlement-result-label">Tax</span>
              <span className="settlement-result-value settlement-negative">
                −{formatCurrency(typedShow.results.taxAmount)}
              </span>
            </div>

            <div className="settlement-result-row">
              <span className="settlement-result-label">Expenses</span>
              <span className="settlement-result-value settlement-negative">
                −{formatCurrency(typedShow.results.totalExpenses)}
              </span>
            </div>

            <div className="settlement-result-row settlement-highlight">
              <span className="settlement-result-label">Net Profit</span>
              <span className="settlement-result-value">
                {formatCurrency(typedShow.results.netProfit)}
              </span>
            </div>

            <div className="settlement-divider"></div>

            <div className="settlement-result-row settlement-artist-payout">
              <span className="settlement-result-label">Artist Payout</span>
              <span className="settlement-result-value">
                {formatCurrency(typedShow.results.artistPayout)}
              </span>
            </div>

            <div className="settlement-result-row settlement-venue-payout">
              <span className="settlement-result-label">Promoter/House Settlement</span>
              <span className="settlement-result-value">
                {formatCurrency(typedShow.results.venuePayout)}
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="settlement-packet-footer">
          <p className="settlement-footer-text">
            Generated on {new Date().toLocaleDateString()} via{" "}
            <Link href="/" className="settlement-footer-link">
              Show Settlement Calculator
            </Link>
          </p>
          <p className="settlement-footer-note">
            This is a shared settlement report. Sign up to create your own settlements.
          </p>
        </footer>
      </div>
    </main>
  );
}
