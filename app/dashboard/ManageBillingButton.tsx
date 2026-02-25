"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManageBilling() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session");
      }

      // Open Stripe Customer Portal in new tab
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={handleManageBilling}
        disabled={loading}
        variant="secondary"
        className="ds-btn-block"
      >
        {loading ? "Loading..." : "Manage Billing"}
      </Button>
      {error && <p className="error-message">{error}</p>}
    </>
  );
}
