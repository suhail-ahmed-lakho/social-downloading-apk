"use client";

import { useEffect } from "react";

export function VisitorTracker() {
  useEffect(() => {
    // Beacon tracking on client page visit
    try {
      const storedName = typeof window !== "undefined" ? localStorage.getItem("looknow_user_name") : null;
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("looknow_user_email") : null;

      fetch("/api/track/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          name: storedName || undefined,
          email: storedEmail || undefined,
        }),
      }).catch(() => {
        // Silent fail for tracker
      });
    } catch {
      // Ignore
    }
  }, []);

  return null;
}
