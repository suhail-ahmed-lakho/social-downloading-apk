"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Download, Zap, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import ThreeCanvas from "./ThreeCanvas";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function HeroSection() {
  return (
    <section
      id="home"
      style={{
        position: "relative",
        paddingTop: "140px",
        paddingBottom: "80px",
        overflow: "visible",
      }}
    >
      <div className="container" style={{ overflow: "visible" }}>
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "36px",
            alignItems: "center",
            overflow: "visible",
          }}
        >
          {/* Left Column: Typography & Glowing CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: "24px", zIndex: 2 }}
          >
            {/* Live Status Pill */}
            <motion.div variants={itemVariants}>
              <div className="pill-badge">
                <span className="pill-dot" />
                <span>Next-Gen Media Engine · v1.0 Live</span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              style={{
                fontSize: "clamp(36px, 4.8vw, 60px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
                color: "var(--text-title)",
              }}
            >
              The unified suite of{" "}
              <span className="gradient-orange-text">high-speed tools</span> for everyone.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              style={{
                fontSize: "clamp(16px, 1.8vw, 18px)",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                maxWidth: "520px",
              }}
            >
              Download high-definition videos and lossless audio from YouTube, TikTok, and Instagram with zero watermarks. Available directly in your browser or as a native Android app.
            </motion.p>

            {/* Glowing Orange Buttons */}
            <motion.div
              variants={itemVariants}
              className="hero-cta"
              style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}
            >
              <Link href="/tools/media-downloader" className="btn-primary" style={{ padding: "14px 28px", fontSize: "15px" }}>
                <span>Use Web Downloader</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>

              <a href="#download" className="btn-secondary" style={{ padding: "14px 24px", fontSize: "15px" }}>
                <Download size={16} strokeWidth={2.2} />
                <span>Download APK (15MB)</span>
              </a>
            </motion.div>

            {/* Trust Metrics */}
            <motion.div
              variants={itemVariants}
              className="hero-stats"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-hairline)",
              }}
            >
              {[
                { icon: Shield, label: "Zero Logs & Ads" },
                { icon: Sparkles, label: "4K 60fps & Lossless" },
                { icon: Zap, label: "Instant Extraction" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon size={16} style={{ color: "var(--accent-primary)" }} />
                    <span style={{ fontSize: "13px", color: "var(--text-subtle)", fontWeight: 500 }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right Column: Open Breathing 3D Canvas (No clipping, completely open) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              width: "100%",
              minHeight: "500px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "visible",
            }}
          >
            {/* Soft Warm Radial Aura behind the 3D model */}
            <div
              style={{
                position: "absolute",
                width: "360px",
                height: "360px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255, 107, 0, 0.12) 0%, rgba(251, 146, 60, 0.05) 50%, transparent 70%)",
                filter: "blur(50px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Interactive 3D Canvas */}
            <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, overflow: "visible" }}>
              <ThreeCanvas />
            </div>

            {/* Floating Metric 1: Top Right */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: "14%",
                right: "-8px",
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(255, 107, 0, 0.25)",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08), 0 0 20px rgba(255, 107, 0, 0.12)",
                backdropFilter: "blur(16px)",
                borderRadius: "14px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FFF7ED",
                  border: "1px solid rgba(255, 107, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FF6B00",
                }}
              >
                <Zap size={16} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-subtle)", fontWeight: 500 }}>Engine Speed</div>
                <div style={{ fontSize: "13px", color: "var(--text-title)", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                  &lt; 0.8s Extraction
                </div>
              </div>
            </motion.div>

            {/* Floating Metric 2: Bottom Left */}
            <motion.div
              animate={{ y: [4, -4, 4] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                bottom: "14%",
                left: "-8px",
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(255, 107, 0, 0.25)",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08), 0 0 20px rgba(255, 107, 0, 0.12)",
                backdropFilter: "blur(16px)",
                borderRadius: "14px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FFF7ED",
                  border: "1px solid rgba(255, 107, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FF6B00",
                }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-subtle)", fontWeight: 500 }}>Output Quality</div>
                <div style={{ fontSize: "13px", color: "var(--text-title)", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                  Zero Watermark
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
