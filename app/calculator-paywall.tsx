"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { AppAccountMenu, type AppAccountMenuData } from "@/components/ui/AppAccountMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import "./calculator.css";

export interface CalculatorPaywallProps {
  userEmail: string;
  accountMenuData: AppAccountMenuData;
}

export default function CalculatorPaywall({ userEmail, accountMenuData }: CalculatorPaywallProps) {
  const router = useRouter();

  return (
    <AppShell maxWidth={720} userEmail={userEmail} showNavLinks={false} userMenuContent={<AppAccountMenu initialData={accountMenuData} />}>
      <div className="calculator-container">
        <div className="calculator-paywall">
          <Card className="paywall-card" variant="elevated" padding="lg">
            <h1>Subscribe to Access the Calculator</h1>
            <p className="paywall-description">
              A subscription is required to use the Show Settlement Calculator.
              Get instant access to unlimited calculations and save your settlements.
            </p>

            <div className="calculator-paywall-features">
              <div className="calculator-paywall-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Unlimited calculations</span>
              </div>
              <div className="calculator-paywall-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Save and share settlements</span>
              </div>
              <div className="calculator-paywall-feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 12l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Access from any device</span>
              </div>
            </div>

            <Button onClick={() => router.push('/dashboard')} variant="primary" size="lg">
              View Plans &amp; Subscribe
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
