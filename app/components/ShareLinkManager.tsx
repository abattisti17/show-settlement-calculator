"use client";

import { useState, useEffect } from "react";

interface ShareLinkManagerProps {
  showId: string;
  showName: string;
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
    if (!shareLink || !shareLink.token) return;

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

      {!shareLink?.exists ? (
        // No share link exists yet
        <div className="share-link-generate">
          <p className="share-link-description">
            Generate a shareable link to send this settlement to others. Anyone
            with the link can view the settlement details.
          </p>
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="share-link-btn-primary"
          >
            Generate Share Link
          </button>
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
            <button
              onClick={handleToggleActive}
              disabled={toggling}
              className="share-link-toggle-btn"
            >
              {toggling
                ? "Updating..."
                : shareLink.is_active
                ? "Deactivate"
                : "Activate"}
            </button>
          </div>

          {shareLink.is_active && (
            <>
              <div className="share-link-display">
                <input
                  type="text"
                  value={`${window.location.origin}/s/${shareLink.token}`}
                  readOnly
                  className="share-link-input"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={handleCopyLink}
                  className="share-link-copy-btn"
                >
                  {copySuccess ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
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
