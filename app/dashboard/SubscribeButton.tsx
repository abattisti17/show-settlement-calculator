"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={handleSubscribe}
        disabled={loading}
        variant="primary"
        className="action-btn"
      >
        {loading ? "Loading..." : "Subscribe Now"}
      </Button>
      {error && <p className="error-message">{error}</p>}
    </>
  );
}
