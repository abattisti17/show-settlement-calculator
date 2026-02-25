"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import JsonLd from "../components/JsonLd";
import { toAbsoluteUrl } from "@/lib/seo";
import { MarketingShell } from "@/components/ui/MarketingShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import "./login.css";

type AuthMode = "signin" | "signup";
type AuthMethod = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: toAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Log In",
        item: toAbsoluteUrl("/login"),
      },
    ],
  };

  async function handleEmailPassword() {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (authMode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage("Check your email to confirm your account!");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
      } else {
        setMessage("Check your email for the magic link!");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (authMethod === "magic") {
      handleMagicLink();
    } else {
      handleEmailPassword();
    }
  }

  return (
    <MarketingShell>
      <JsonLd data={breadcrumbSchema} />
      <div className="auth-container">
        <Card variant="elevated" className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <h1>Show Settlement Calculator</h1>
            <p>Sign in to save and manage your settlements</p>
          </div>

          {/* Mode Toggle (Sign In / Sign Up) */}
          <SegmentedControl
            value={authMode}
            onChange={(v) => { setAuthMode(v); setError(""); setMessage(""); }}
            options={[
              { value: "signin", label: "Sign In" },
              { value: "signup", label: "Sign Up" },
            ]}
            className="auth-mode-toggle"
          />

          {/* Auth Method Toggle (Password / Magic Link) */}
          <SegmentedControl
            value={authMethod}
            onChange={(v) => { setAuthMethod(v); setError(""); setMessage(""); }}
            options={[
              { value: "password", label: "Password" },
              { value: "magic",    label: "Magic Link" },
            ]}
            className="auth-method-toggle"
          />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="auth-form-fields">
              <Input
                type="email"
                id="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />

              {authMethod === "password" && (
                <Input
                  type="password"
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
              )}
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Success Message */}
            {message && <div className="success-message">{message}</div>}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="ds-btn-block"
            >
              {loading
                ? "Loading..."
                : authMethod === "magic"
                ? "Send Magic Link"
                : authMode === "signup"
                ? "Sign Up"
                : "Sign In"}
            </Button>
          </form>

          {/* Helper text */}
          <p className="auth-helper-text">
            {authMethod === "magic"
              ? "We'll send you a link to sign in without a password"
              : authMode === "signup"
              ? "By signing up, you agree to use this tool responsibly"
              : "Don't have an account? Switch to Sign Up above"}
          </p>
        </Card>
      </div>
    </MarketingShell>
  );
}
