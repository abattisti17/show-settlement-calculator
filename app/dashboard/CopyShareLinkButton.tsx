"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDashboardToast } from "./DashboardToast";

interface CopyShareLinkButtonProps {
  showId: string;
  /** If present and active, we copy immediately; otherwise we create (or activate) first. */
  initialToken?: string | null;
  initialIsActive?: boolean;
}

export default function CopyShareLinkButton({
  showId,
  initialToken,
  initialIsActive,
}: CopyShareLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const showToast = useDashboardToast();

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const hasActiveLink = initialToken && initialIsActive;

    if (hasActiveLink) {
      const url = `${window.location.origin}/s/${initialToken}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        showToast("Copied!");
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        showToast("Could not copy");
      }
      return;
    }

    setLoading(true);
    showToast("Generating link…");

    try {
      const createRes = await fetch("/api/share-links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create link");
      }

      const data = await createRes.json();
      const token = data.token as string;
      let isActive = data.is_active as boolean;

      if (!isActive) {
        const toggleRes = await fetch("/api/share-links/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showId, isActive: true }),
        });
        if (toggleRes.ok) {
          const toggleData = await toggleRes.json();
          isActive = toggleData.is_active;
        }
      }

      const url = `${window.location.origin}/s/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link ready — copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy share link error:", err);
      showToast("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const label = copied ? "Copied!" : loading ? "Generating…" : "Copy link";

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant="ghost"
      size="sm"
      className="share-show-btn"
      disabled={loading}
      aria-busy={loading}
    >
      {label}
    </Button>
  );
}
