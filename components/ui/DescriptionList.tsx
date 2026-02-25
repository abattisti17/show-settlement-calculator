import React from "react";
import "./DescriptionList.css";

export interface DescriptionListProps {
  children: React.ReactNode;
  className?: string;
}

export interface DescriptionListItemProps {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}

export function DescriptionList({ children, className }: DescriptionListProps) {
  return (
    <dl className={["ds-dl", className].filter(Boolean).join(" ")}>
      {children}
    </dl>
  );
}

export function DescriptionListItem({
  label,
  value,
  children,
}: DescriptionListItemProps) {
  const content = children ?? value;
  return (
    <div className="ds-dl-item">
      <dt className="ds-dl-label">{label}</dt>
      <dd className="ds-dl-value">{content}</dd>
    </div>
  );
}

DescriptionList.Item = DescriptionListItem;
