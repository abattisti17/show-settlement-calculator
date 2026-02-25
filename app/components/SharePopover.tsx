"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Popover } from "@/components/ui/Popover";
import ShareLinkManager from "./ShareLinkManager";
import { useDashboardToast } from "../dashboard/DashboardToast";

interface SharePopoverProps {
  showId: string;
  showName: string;
}

export default function SharePopover({ showId, showName }: SharePopoverProps) {
  const [open, setOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const showToast = useDashboardToast();

  async function handleCopyLink(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCopying(true);

    try {
      const res = await fetch(`/api/share-links/get?showId=${showId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (!data.token) {
        const createRes = await fetch("/api/share-links/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showId }),
        });
        if (!createRes.ok) throw new Error("Failed to create link");
        const createData = await createRes.json();
        const token = createData.token;
        let isActive = createData.is_active;
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
        showToast("Link ready — copied!");
      } else if (data.is_active) {
        const url = `${window.location.origin}/s/${data.token}`;
        await navigator.clipboard.writeText(url);
        showToast("Link copied!");
      } else {
        showToast("Link is inactive. Open Share to activate.");
      }
    } catch {
      showToast("Could not copy link. Try again.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="share-popover-actions">
      <Popover
        trigger={
          <Button variant="ghost" size="sm">
            Share
          </Button>
        }
        open={open}
        onOpenChange={setOpen}
        panelWidth={400}
        align="right"
      >
        <div className="share-popover-content">
          <ShareLinkManager showId={showId} showName={showName} />
        </div>
      </Popover>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        disabled={copying}
        aria-label="Copy share link"
      >
        <Icon name="link" size={18} />
      </Button>
    </div>
  );
}
