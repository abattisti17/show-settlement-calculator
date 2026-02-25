import { MarketingShell } from "@/components/ui/MarketingShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Custom 404 page for invalid/inactive share links
 * Provides helpful messaging without revealing whether a token exists
 */
export default function NotFound() {
  return (
    <MarketingShell>
      <main className="settlement-packet-container">
        <Card className="settlement-not-found" variant="default" padding="lg">
        <div className="settlement-not-found-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="settlement-not-found-title">Settlement Not Found</h1>
        <p className="settlement-not-found-description">
          This settlement link is invalid or has been deactivated by the owner.
        </p>
        <div className="settlement-not-found-actions">
          <Button as="a" href="/" variant="primary">
            Create Your Own Settlement
          </Button>
        </div>
      </Card>
      </main>
    </MarketingShell>
  );
}
