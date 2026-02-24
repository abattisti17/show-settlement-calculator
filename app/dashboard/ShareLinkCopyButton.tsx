"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ShareLinkCopyButtonProps {
  token: string;
}

export default function ShareLinkCopyButton({ token }: ShareLinkCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/s/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy share link:", error);
    }
  }

  return (
    <Button type="button" onClick={handleCopy} variant="ghost" size="sm" className="share-show-btn">
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
