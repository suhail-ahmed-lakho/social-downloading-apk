"use client";

import { motion } from "framer-motion";
import { Download, Smartphone, ShieldCheck, Check } from "lucide-react";

export default function DownloadSection() {
  return (
    <section id="download" style={{ padding: "80px 0 100px 0" }}>
      <div className="container">
        <div
          className="glass-card"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
            border: "1px solid rgba(255, 107, 0, 0.25)",
            padding: "48px 40px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08), 0 0 40px rgba(255, 107, 0, 0.08)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "40px",
              alignItems: "center",
            }}
            className="download-grid"
          >
            {/* Left Content */}
            <div>
              <div className="pill-badge" style={{ marginBottom: "20px" }}>
                <Smartphone size={14} />
                <span>Native Android Application</span>
              </div>

              <h2
                style={{
                  fontSize: "clamp(28px, 3.5vw, 44px)",
                  fontWeight: 800,
                  marginBottom: "16px",
                  lineHeight: 1.15,
                  color: "var(--text-title)",
                }}
              >
                Experience OmniSaver on <span className="gradient-orange-text">mobile</span>
              </h2>

              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "16px",
                  lineHeight: 1.65,
                  marginBottom: "28px",
                  maxWidth: "520px",
                }}
              >
                Install the official native Android build for automatic gallery indexing, fast multithreaded downloads, and offline background processing.
              </p>

              {/* Feature Checklist */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "32px",
                }}
              >
                {[
                  "Automatic Gallery Sync",
                  "Background Download Manager",
                  "Zero Watermark Output",
                  "Direct Audio Extraction (MP3)",
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#FFF7ED",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FF6B00",
                        border: "1px solid rgba(255, 107, 0, 0.3)",
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: 600 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <a
                  href="/downloads/omnisaver-latest.apk"
                  download
                  className="btn-primary"
                  style={{ padding: "14px 28px", fontSize: "15px" }}
                >
                  <Download size={16} strokeWidth={2.5} />
                  <span>Download APK (v1.0.2)</span>
                </a>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-subtle)",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  <ShieldCheck size={16} style={{ color: "#16A34A" }} />
                  <span>Google Play Protect Safe · 15.2 MB</span>
                </div>
              </div>
            </div>

            {/* Right Card: Architecture Specs */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border-hairline)",
                borderRadius: "16px",
                padding: "26px",
                boxShadow: "0 6px 24px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-subtle)",
                  marginBottom: "16px",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Package Specifications
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Target Version", val: "v1.0.2 (Stable)" },
                  { label: "Minimum SDK", val: "Android 8.0 (API 26)" },
                  { label: "Architecture", val: "arm64-v8a / armeabi-v7a" },
                  { label: "Signature", val: "SHA-256 Verified" },
                  { label: "License", val: "Free / Community" },
                ].map((spec, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < 4 ? "1px solid var(--border-hairline)" : "none",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>{spec.label}</span>
                    <span
                      style={{
                        color: "var(--text-title)",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                      }}
                    >
                      {spec.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          :global(.download-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
