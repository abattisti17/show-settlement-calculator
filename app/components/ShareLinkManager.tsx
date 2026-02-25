"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ShareLinkManagerProps {
  showId: string;
  showName: string;
  resultsStale?: boolean;
}

interface ShareLinkData {
  exists: boolean;
  token?: string;
  is_active?: boolean;
  created_at?: string;
}

export default function ShareLinkManager({
  showId,
  showName,
  resultsStale = false,
}: ShareLinkManagerProps) {
  const [shareLink, setShareLink] = useState<ShareLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Fetch existing share link on mount
  useEffect(() => {
    async function fetchShareLink() {
      try {
        const response = await fetch(`/api/share-links/get?showId=${showId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch share link");
        }
        const data = await response.json();
        setShareLink(data);
      } catch (err) {
        console.error("Error fetching share link:", err);
        setError("Failed to load share link");
      } finally {
        setLoading(false);
      }
    }

    fetchShareLink();
  }, [showId]);

  // Generate new share link
  async function handleGenerateLink() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/share-links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link");
      }

      const data = await response.json();
      setShareLink({
        exists: true,
        token: data.token,
        is_active: data.is_active,
      });
    } catch (err) {
      console.error("Error creating share link:", err);
      setError("Failed to generate share link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Toggle share link active status
  async function handleToggleActive() {
    if (!shareLink || !shareLink.exists) return;

    setToggling(true);
    setError("");

    try {
      const response = await fetch("/api/share-links/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          isActive: !shareLink.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle share link");
      }

      const data = await response.json();
      setShareLink((prev) => ({
        ...prev!,
        is_active: data.is_active,
      }));
    } catch (err) {
      console.error("Error toggling share link:", err);
      setError("Failed to update share link. Please try again.");
    } finally {
      setToggling(false);
    }
  }

  // Copy link to clipboard
  async function handleCopyLink() {
    if (!shareLink || !shareLink.token || resultsStale) return;

    const fullUrl = `${window.location.origin}/s/${shareLink.token}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("Failed to copy link");
    }
  }

  if (loading) {
    return (
      <div className="share-link-manager">
        <p className="share-link-loading">Loading share link...</p>
      </div>
    );
  }

  return (
    <div className="share-link-manager">
      <h3 className="share-link-title">Share this Settlement</h3>

      {error && <div className="share-link-error">{error}</div>}
      {resultsStale && (
        <div className="share-link-error">
          Recalculate and save before sharing to avoid sending outdated numbers.
        </div>
      )}

      {!shareLink?.exists ? (
        // No share link exists yet
        <div className="share-link-generate">
          <p className="share-link-description">
            Generate a secure read-only link for {showName || "this settlement"}.
            Anyone with the link can view, but not edit.
          </p>
          <Button
            onClick={handleGenerateLink}
            loading={loading}
            variant="primary"
            size="sm"
          >
            Generate Share Link
          </Button>
        </div>
      ) : (
        // Share link exists
        <div className="share-link-display-container">
          <div className="share-link-status">
            <div className="share-link-status-indicator">
              <div
                className={`share-link-status-dot ${
                  shareLink.is_active ? "active" : "inactive"
                }`}
              ></div>
              <span className="share-link-status-text">
                {shareLink.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <Button
              onClick={handleToggleActive}
              loading={toggling}
              variant="ghost"
              size="sm"
            >
              {shareLink.is_active
                ? "Deactivate"
                : "Activate"}
            </Button>
          </div>

          {shareLink.is_active && (
            <>
              <div className="share-link-display">
                <Input
                  label="Share link"
                  value={`${window.location.origin}/s/${shareLink.token}`}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  onClick={handleCopyLink}
                  disabled={resultsStale}
                  variant="secondary"
                  size="sm"
                  title={resultsStale ? "Recalculate and save before sharing" : undefined}
                >
                  {copySuccess ? "Copied" : "Copy Link"}
                </Button>
              </div>
              <p className="share-link-hint">
                Share this link with artists, venues, or anyone who needs to see
                this settlement.
              </p>
            </>
          )}

          {!shareLink.is_active && (
            <p className="share-link-inactive-message">
              This link is currently deactivated. Activate it to make it
              accessible again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
