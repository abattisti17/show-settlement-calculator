"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import ShareLinkManager from "./ShareLinkManager";

interface SharePopoverProps {
  showId: string;
  showName: string;
  resultsStale?: boolean;
}

export default function SharePopover({
  showId,
  showName,
  resultsStale = false,
}: SharePopoverProps) {
  const [open, setOpen] = useState(false);

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
          <ShareLinkManager showId={showId} showName={showName} resultsStale={resultsStale} />
        </div>
      </Popover>
    </div>
  );
}
