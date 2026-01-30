"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
    <main className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1>Show Settlement Calculator</h1>
          <p>Sign in to save and manage your settlements</p>
        </div>

        {/* Mode Toggle (Sign In / Sign Up) */}
        <div className="auth-mode-toggle">
          <button
            type="button"
            className={authMode === "signin" ? "active" : ""}
            onClick={() => {
              setAuthMode("signin");
              setError("");
              setMessage("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={authMode === "signup" ? "active" : ""}
            onClick={() => {
              setAuthMode("signup");
              setError("");
              setMessage("");
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Method Toggle (Password / Magic Link) */}
        <div className="auth-method-toggle">
          <button
            type="button"
            className={authMethod === "password" ? "active" : ""}
            onClick={() => {
              setAuthMethod("password");
              setError("");
              setMessage("");
            }}
          >
            Password
          </button>
          <button
            type="button"
            className={authMethod === "magic" ? "active" : ""}
            onClick={() => {
              setAuthMethod("magic");
              setError("");
              setMessage("");
            }}
          >
            Magic Link
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          {authMethod === "password" && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          )}

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Success Message */}
          {message && <div className="success-message">{message}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              "Loading..."
            ) : authMethod === "magic" ? (
              "Send Magic Link"
            ) : authMode === "signup" ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Helper text */}
        <p className="auth-helper-text">
          {authMethod === "magic"
            ? "We'll send you a link to sign in without a password"
            : authMode === "signup"
            ? "By signing up, you agree to use this tool responsibly"
            : "Don't have an account? Switch to Sign Up above"}
        </p>
      </div>
    </main>
  );
}
