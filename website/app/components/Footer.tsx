"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-hairline)",
        background: "#F8FAFC",
        padding: "48px 0 36px 0",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <Sparkles size={14} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 17,
                color: "var(--text-title)",
                letterSpacing: "-0.02em",
              }}
            >
              LookNow
            </span>
            <span style={{ color: "var(--text-subtle)", fontSize: "13px", marginLeft: "8px" }}>
              — Developer & Creator Tools
            </span>
          </div>

          {/* Operational Status */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "#FFFFFF",
              border: "1px solid var(--border-hairline)",
              fontSize: "12px",
              color: "var(--text-muted)",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <span className="pill-dot" />
            <span>All Systems Operational</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            borderTop: "1px solid var(--border-hairline)",
            paddingTop: "24px",
            fontSize: "13px",
            color: "var(--text-subtle)",
          }}
        >
          <div>
            © 2026 LookNow.cyou · Free tools for everyone.
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/tools/media-downloader" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Web Downloader
            </Link>
            <a href="#download" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Android APK
            </a>
            <a href="#tools" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              All Tools
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
