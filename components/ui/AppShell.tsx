"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Popover } from "./Popover";
import { Icon } from "./Icon";
import "./AppShell.css";

export interface AppShellProps {
  children: React.ReactNode;
  maxWidth?: number;
  userEmail?: string;
  onSignOut?: () => void;
  signOutAction?: string;
  showNavLinks?: boolean;
  userMenuContent?: React.ReactNode;
  className?: string;
}

export function AppShell({
  children,
  maxWidth = 1200,
  userEmail,
  onSignOut,
  signOutAction,
  showNavLinks = true,
  userMenuContent,
  className,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
            {showNavLinks && (
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
            )}
          </div>
          <div className="ds-app-nav-right">
            {userEmail && userMenuContent ? (
              <Popover
                open={userMenuOpen}
                onOpenChange={setUserMenuOpen}
                align="right"
                trigger={
                  <button
                    type="button"
                    className="ds-app-user-menu-trigger"
                    aria-label="Toggle account menu"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="ds-app-nav-user">{userEmail}</span>
                    <Icon
                      name="chevron"
                      size={18}
                      direction="down"
                      className={`ds-app-user-menu-chevron ${userMenuOpen ? "open" : ""}`}
                    />
                  </button>
                }
              >
                {userMenuContent}
              </Popover>
            ) : userEmail ? (
              <span className="ds-app-nav-user">{userEmail}</span>
            ) : null}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="ds-app-nav-link"
              >
                Sign Out
              </button>
            )}
            {!userMenuContent && !onSignOut && signOutAction && (
              <form action={signOutAction} method="post">
                <button type="submit" className="ds-app-nav-link">
                  Sign Out
                </button>
              </form>
            )}
            {showNavLinks && (
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
            )}
          </div>
        </div>
        {showNavLinks && (
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
              <span className="ds-app-nav-user ds-app-mobile-user-email">
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
            {!userMenuContent && !onSignOut && signOutAction && (
              <form action={signOutAction} method="post">
                <button type="submit" className="ds-app-nav-link">
                  Sign Out
                </button>
              </form>
            )}
          </div>
        )}
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
