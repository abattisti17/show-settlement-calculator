"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import "./DashboardToast.css";

type ShowToast = (message: string) => void;

const DashboardToastContext = createContext<ShowToast | null>(null);

export function useDashboardToast(): ShowToast {
  const showToast = useContext(DashboardToastContext);
  if (!showToast) {
    throw new Error("useDashboardToast must be used within DashboardToastProvider");
  }
  return showToast;
}

export function DashboardToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 2500);
  }, []);

  return (
    <DashboardToastContext.Provider value={showToast}>
      {children}
      {message !== null && (
        <div className="dashboard-toast" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </DashboardToastContext.Provider>
  );
}
