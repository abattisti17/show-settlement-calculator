"use client";

import { useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  const theme = mode === "system" ? getSystemTheme() : mode;
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initialMode = saved ?? "system";
    setMode(initialMode);
    applyTheme(initialMode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (!stored || stored === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  function setAndPersist(nextMode: ThemeMode) {
    setMode(nextMode);

    if (nextMode === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, nextMode);
    }

    applyTheme(nextMode);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button
        type="button"
        className={`theme-toggle-btn ${mode === "system" ? "active" : ""}`}
        onClick={() => setAndPersist("system")}
        aria-pressed={mode === "system"}
      >
        System
      </button>
      <button
        type="button"
        className={`theme-toggle-btn ${mode === "light" ? "active" : ""}`}
        onClick={() => setAndPersist("light")}
        aria-pressed={mode === "light"}
      >
        Light
      </button>
      <button
        type="button"
        className={`theme-toggle-btn ${mode === "dark" ? "active" : ""}`}
        onClick={() => setAndPersist("dark")}
        aria-pressed={mode === "dark"}
      >
        Dark
      </button>
    </div>
  );
}
