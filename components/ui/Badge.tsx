import React from "react";
import "./Badge.css";

export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "accent";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  const classes = ["ds-badge", `ds-badge-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
