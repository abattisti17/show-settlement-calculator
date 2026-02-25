"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./Button.css";
import "./MarketingShell.css";

export interface MarketingShellProps {
  children: React.ReactNode;
  className?: string;
}

export function MarketingShell({ children, className }: MarketingShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={["ds-mkt-shell", className].filter(Boolean).join(" ")}>
      <nav className="ds-mkt-nav">
        <div className="ds-mkt-nav-inner">
          <Link href="/" className="ds-mkt-nav-logo">
            <Image
              src="/gigsettle_logo.svg"
              alt="GigSettle"
              className="ds-mkt-nav-logo-icon"
              width={40}
              height={40}
              priority
            />
            <span className="ds-mkt-nav-logo-text">GigSettle</span>
          </Link>
          <div className="ds-mkt-nav-actions">
            <Link href="/pricing" className="ds-mkt-nav-link">
              Pricing
            </Link>
            <Link href="/media" className="ds-mkt-nav-link">
              Media
            </Link>
            <Link href="/login" className="ds-mkt-nav-link">
              Log in
            </Link>
            <Link href="/login" className="ds-btn ds-btn-primary ds-btn-sm">
              Sign up
            </Link>
          </div>
          <button
            type="button"
            className="ds-mkt-nav-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
        <div className={`ds-mkt-mobile-menu ${menuOpen ? "open" : ""}`}>
          <Link href="/pricing" className="ds-mkt-nav-link" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
          <Link href="/media" className="ds-mkt-nav-link" onClick={() => setMenuOpen(false)}>
            Media
          </Link>
          <Link href="/login" className="ds-mkt-nav-link" onClick={() => setMenuOpen(false)}>
            Log in
          </Link>
          <Link href="/login" className="ds-btn ds-btn-primary ds-btn-sm" onClick={() => setMenuOpen(false)}>
            Sign up
          </Link>
        </div>
      </nav>

      <main className="ds-mkt-main">{children}</main>

      <footer className="ds-mkt-footer">
        <div className="ds-mkt-footer-inner">
          <div className="ds-mkt-footer-links">
            <Link href="/pricing">Pricing</Link>
            <Link href="/media">Media</Link>
            <Link href="/login">Log in</Link>
            <a href="mailto:abattisti@proton.me">Contact</a>
          </div>
          <p className="ds-mkt-footer-copy" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} GigSettle
          </p>
        </div>
      </footer>
    </div>
  );
}
