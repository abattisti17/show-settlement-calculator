import React from "react";
import "./SectionFooter.css";

export interface SectionFooterProps extends React.HTMLAttributes<HTMLElement> {
  maxWidth?: number;
}

/**
 * Full-bleed dark panel section, typically used at the bottom of a page.
 * Provides the dark-panel background, top border, and centers children.
 */
export function SectionFooter({
  maxWidth = 720,
  className,
  children,
  ...rest
}: SectionFooterProps) {
  return (
    <footer
      className={["ds-section-footer", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className="ds-section-footer-inner" style={{ maxWidth }}>
        {children}
      </div>
    </footer>
  );
}
