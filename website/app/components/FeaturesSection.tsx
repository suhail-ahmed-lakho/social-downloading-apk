"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Sparkles, Smartphone, Layers, Infinity as InfinityIcon } from "lucide-react";

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

        {/* Features Bento Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={i}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="glass-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  background: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#FFF7ED",
                    border: "1px solid rgba(255, 107, 0, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FF6B00",
                  }}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </div>

                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-title)" }}>
                  {feature.title}
                </h3>

                <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
