"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Sparkles, Smartphone, Layers, Infinity as InfinityIcon } from "lucide-react";
import TiltCard3D from "./TiltCard3D";

const features = [
  {
    icon: Zap,
    title: "Instant Audio & Video Extraction",
    desc: "Direct stream resolution ensures downloads initiate within milliseconds, with zero server transcode delays.",
  },
  {
    icon: Sparkles,
    title: "Native 4K & Lossless Audio",
    desc: "Extract source files at full original fidelity up to 2160p 60fps and 320kbps MP3 audio.",
  },
  {
    icon: ShieldCheck,
    title: "Strict Privacy & Zero Logs",
    desc: "LookNow does not log request URLs, store downloaded files, or collect identifying user device telemetry.",
  },
  {
    icon: Smartphone,
    title: "Android Native Core",
    desc: "The APK runs lightweight native multithreaded downloads with background queues and gallery auto-indexing.",
  },
  {
    icon: Layers,
    title: "Clean Watermark Removal",
    desc: "TikTok and Reels metadata is analyzed to deliver clean, unbranded video frames for creators.",
  },
  {
    icon: InfinityIcon,
    title: "Unmetered Free Tier",
    desc: "No hidden daily quotas, throttling, or artificial paywalls. All current features are 100% open.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "80px 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 56px auto" }}>
          <div className="pill-badge" style={{ marginBottom: "16px" }}>
            <span>Architectural Standards</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, marginBottom: "16px", color: "var(--text-title)" }}>
            Built with <span className="gradient-orange-text">obsessive precision</span>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1.6 }}>
            Every interaction has been refined to eliminate friction and maximize download throughput.
          </p>
        </div>

        {/* Features Bento Grid with 3D Tilt */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <TiltCard3D key={i} glowColor="rgba(255, 107, 0, 0.2)">
                <div
                  className="glass-card preserve-3d"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
                    height: "100%",
                    boxShadow: "0 6px 22px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
                      border: "1px solid rgba(255, 107, 0, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FF6B00",
                      transform: "translateZ(24px)",
                      boxShadow: "0 4px 12px rgba(255, 107, 0, 0.2)",
                    }}
                  >
                    <Icon size={23} strokeWidth={2.2} />
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-title)", transform: "translateZ(18px)" }}>
                    {feature.title}
                  </h3>

                  <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, transform: "translateZ(10px)" }}>
                    {feature.desc}
                  </p>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      </div>
    </section>
  );
}
