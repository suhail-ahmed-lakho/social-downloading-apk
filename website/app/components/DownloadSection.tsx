"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, ShieldCheck, Check, QrCode, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import TiltCard3D from "./TiltCard3D";

export default function DownloadSection() {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [apkDetails, setApkDetails] = useState<{ version: string; size: string; bytes: number }>({
    version: "1.0.4",
    size: "70.8 MB",
    bytes: 74262740,
  });

  useEffect(() => {
    // Generate QR code pointing to the APK download endpoint
    QRCode.toDataURL("https://looknow.cyou/api/download/apk", {
      width: 220,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Error:", err));

    // Fetch dynamic APK file details directly from server
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        if (data?.fileSize || data?.version) {
          setApkDetails({
            version: data.version || "1.0.4",
            size: data.fileSize || "70.8 MB",
            bytes: data.fileSizeBytes || 74262740,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="download" style={{ padding: "80px 0" }}>
      <div className="container">
        <div
          className="glass-card"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
            border: "1px solid rgba(255, 107, 0, 0.3)",
            padding: "40px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08), 0 0 40px rgba(255, 107, 0, 0.08)",
            borderRadius: 24,
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
              <div className="pill-badge" style={{ marginBottom: "14px" }}>
                <Smartphone size={14} />
                <span>Native Android Application · v{apkDetails.version}</span>
              </div>

              <h2
                style={{
                  fontSize: "clamp(28px, 3.4vw, 42px)",
                  fontWeight: 800,
                  marginBottom: "14px",
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
                        flexShrink: 0,
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
                  href="/api/download/apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ padding: "14px 28px", fontSize: "15px" }}
                >
                  <Download size={16} strokeWidth={2.5} />
                  <span>Download APK (v{apkDetails.version})</span>
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
                  <span>Google Play Protect Safe · {apkDetails.size}</span>
                </div>
              </div>
            </div>

            {/* Right Card: Architecture Specs & Mobile Scan QR (3D Card) */}
            <TiltCard3D maxTilt={8} scale={1.02} glowColor="rgba(255, 107, 0, 0.25)">
              <div
                className="preserve-3d"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "20px",
                  padding: "26px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06), 0 0 25px rgba(255, 107, 0, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-subtle)",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    Scan to Install on Phone
                  </div>
                  <span style={{ fontSize: 11, background: "#DCFCE7", color: "#16A34A", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
                    ● Direct APK
                  </span>
                </div>

                {/* QR Code and Quick Scan Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 14,
                      background: "#FFFFFF",
                      border: "1px solid var(--border-hairline)",
                      padding: 6,
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Scan to download APK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <QrCode size={32} style={{ color: "var(--text-subtle)" }} />
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-title)", marginBottom: 4 }}>
                      Point Camera to Scan
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-subtle)", lineHeight: 1.5 }}>
                      Open your phone camera to instantly download the APK file without connecting cables.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-hairline)", paddingTop: 14 }}>
                  {[
                    { label: "Target Version", val: `v${apkDetails.version} (Stable)` },
                    { label: "Exact Size", val: `${apkDetails.size} (${apkDetails.bytes.toLocaleString()} B)` },
                    { label: "Minimum SDK", val: "Android 8.0+ (API 26)" },
                    { label: "Architecture", val: "arm64-v8a / v7a" },
                    { label: "Signature", val: "SHA-256 Verified" },
                    { label: "License", val: "100% Free / Community" },
                  ].map((spec, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>{spec.label}</span>
                      <span
                        style={{
                          color: "var(--text-title)",
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {spec.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard3D>
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
