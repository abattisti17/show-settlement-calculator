"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./AppShell.css";

export interface AppShellProps {
  children: React.ReactNode;
  maxWidth?: number;
  userEmail?: string;
  onSignOut?: () => void;
  className?: string;
}

export function AppShell({
  children,
  maxWidth = 1200,
  userEmail,
  onSignOut,
  className,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={["ds-app-shell", className].filter(Boolean).join(" ")}>
      <nav className="ds-app-nav">
        <div className="ds-app-nav-inner">
          <div className="ds-app-nav-left">
            <Link href="/dashboard" className="ds-app-nav-logo">
              <Image
                src="/gigsettle_logo.svg"
                alt="GigSettle"
                className="ds-app-nav-logo-icon"
                width={28}
                height={28}
              />
              <span>GigSettle</span>
            </Link>
            <div className="ds-app-nav-links">
              <Link href="/dashboard" className="ds-app-nav-link">
                Dashboard
              </Link>
              <Link href="/" className="ds-app-nav-link">
                Calculator
              </Link>
              <Link href="/pricing" className="ds-app-nav-link">
                Pricing
              </Link>
            </div>
          </div>
          <div className="ds-app-nav-right">
            {userEmail && (
              <span className="ds-app-nav-user">{userEmail}</span>
            )}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="ds-app-nav-link"
              >
                Sign Out
              </button>
            )}
            <button
              type="button"
              className="ds-app-nav-toggle"
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
        </div>
        <div className={`ds-app-mobile-menu ${menuOpen ? "open" : ""}`}>
          <Link href="/dashboard" className="ds-app-nav-link" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          <Link href="/" className="ds-app-nav-link" onClick={() => setMenuOpen(false)}>
            Calculator
          </Link>
          <Link href="/pricing" className="ds-app-nav-link" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
          {userEmail && (
            <span className="ds-app-nav-user" style={{ padding: "0.375rem 0.75rem" }}>
              {userEmail}
            </span>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={() => { onSignOut(); setMenuOpen(false); }}
              className="ds-app-nav-link"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      <main className="ds-app-main" style={{ maxWidth }}>
        {children}
      </main>

      <footer className="ds-app-footer">
        {/* ThemeToggle rendered by root layout */}
      </footer>
    </div>
  );
}
