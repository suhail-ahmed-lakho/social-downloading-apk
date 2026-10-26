"use client";

import Link from "next/link";
import { Sparkles, ArrowUpRight, Shield, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-hairline)",
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        padding: "60px 0 36px 0",
      }}
    >
      <div className="container">
        {/* Main 4-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "36px",
            marginBottom: "48px",
          }}
        >
          {/* Column 1: Brand & Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "var(--text-title)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(255, 107, 0, 0.3)",
                }}
              >
                <Sparkles size={16} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                }}
              >
                Look<span className="gradient-orange-text">Now</span>
              </span>
            </Link>

            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260 }}>
              The high-speed privacy-first suite of tools for creators, developers, and mobile users worldwide.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "#FFFFFF",
                border: "1px solid var(--border-hairline)",
                fontSize: 12,
                color: "var(--text-main)",
                fontWeight: 600,
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                width: "fit-content",
              }}
            >
              <span className="pill-dot" />
              <span>All Systems Operational (99.9%)</span>
            </div>
          </div>

          {/* Column 2: Media Suite */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-subtle)", marginBottom: 14 }}>
              Media Suite
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Link href="/tools/media-downloader" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Universal 4K Downloader
              </Link>
              <Link href="/tools/media-downloader?mode=audio" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Lossless 320kbps MP3 Audio
              </Link>
              <Link href="/tools/media-downloader?platform=tiktok" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                TikTok No-Watermark Saver
              </Link>
              <Link href="/tools/media-downloader?platform=instagram" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Instagram Reels & Stories
              </Link>
            </div>
          </div>

          {/* Column 3: Creative & Dev Tools */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-subtle)", marginBottom: 14 }}>
              Creator & Dev Suite
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Link href="/tools/qr-generator" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Vector QR Code Studio (SVG)
              </Link>
              <Link href="/tools/image-studio" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Image Studio & WebP Converter
              </Link>
              <Link href="/tools/text-studio" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Text, JSON & Crypt Engine
              </Link>
              <Link href="/#download" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Android APK Installer (v1.0.3)
              </Link>
            </div>
          </div>

          {/* Column 4: Platform & Info */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-subtle)", marginBottom: 14 }}>
              Platform Info
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Link href="/#platforms" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Supported Networks
              </Link>
              <Link href="/#features" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Architectural Standards
              </Link>
              <Link href="/#faq" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Frequently Asked Questions
              </Link>
              <Link href="/admin" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                Admin Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            borderTop: "1px solid var(--border-hairline)",
            paddingTop: "24px",
            fontSize: "13px",
            color: "var(--text-subtle)",
          }}
        >
          <div>
            © 2026 LookNow.cyou · Free tools for everyone. Zero tracking.
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
              Engineered with precision
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
