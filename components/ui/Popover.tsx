"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./Popover.css";

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "left" | "right";
  className?: string;
}

/**
 * Floating popover that renders via Portal so it hovers over page content.
 * Use for dropdowns, menus, tooltips.
 */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = "right",
  className,
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const width = 280;
    setPosition({
      top: rect.bottom + gap,
      left: align === "right" ? rect.right - width : rect.left,
    });
  }, [align]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  return (
    <div className="ds-popover">
      <div
        ref={triggerRef}
        className="ds-popover-trigger"
        onClick={() => onOpenChange(!open)}
      >
        {trigger}
      </div>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className={["ds-popover-panel", className].filter(Boolean).join(" ")}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              minWidth: 280,
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  );
}
