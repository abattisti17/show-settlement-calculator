"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function ExportAllDataButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/shows/export");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `gigsettle-export-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="ds-btn-block"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? "Exporting…" : "Export all data"}
    </Button>
  );
}
