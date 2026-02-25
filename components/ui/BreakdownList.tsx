import React from "react";
import "./BreakdownList.css";

export type BreakdownRowVariant =
  | "default"
  | "negative"
  | "highlight"
  | "success"
  | "warning";

export interface BreakdownListProps {
  children: React.ReactNode;
  className?: string;
}

export interface BreakdownListRowProps {
  label: string;
  value: React.ReactNode;
  variant?: BreakdownRowVariant;
}

export function BreakdownList({ children, className }: BreakdownListProps) {
  return (
    <div className={["ds-breakdown", className].filter(Boolean).join(" ")}>
      <div className="ds-breakdown-list" role="list">{children}</div>
    </div>
  );
}

export function BreakdownListRow({
  label,
  value,
  variant = "default",
}: BreakdownListRowProps) {
  const variantClass =
    variant !== "default" ? `ds-breakdown-row--${variant}` : "";
  return (
    <div
      className={["ds-breakdown-row", variantClass].filter(Boolean).join(" ")}
      role="listitem"
    >
      <span className="ds-breakdown-label">{label}</span>
      <span className="ds-breakdown-value">{value}</span>
    </div>
  );
}

export function BreakdownListDivider() {
  return <div className="ds-breakdown-divider" role="separator" />;
}

BreakdownList.Row = BreakdownListRow;
BreakdownList.Divider = BreakdownListDivider;
