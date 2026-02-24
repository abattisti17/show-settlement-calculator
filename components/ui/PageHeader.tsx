import React from "react";
import Link from "next/link";
import "./PageHeader.css";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: { label: string; href: string }[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={["ds-page-header", className].filter(Boolean).join(" ")}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="ds-page-header-breadcrumb" aria-label="Breadcrumb">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={item.href}>
              {i > 0 && (
                <span className="ds-page-header-breadcrumb-sep" aria-hidden="true">
                  /
                </span>
              )}
              <Link href={item.href}>{item.label}</Link>
            </React.Fragment>
          ))}
          <span className="ds-page-header-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="ds-page-header-breadcrumb-current" aria-current="page">
            {title}
          </span>
        </nav>
      )}
      <div className="ds-page-header-row">
        <div>
          <h1 className="ds-page-header-title">{title}</h1>
          {description && (
            <p className="ds-page-header-desc">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
