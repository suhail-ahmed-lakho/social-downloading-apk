"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Download,
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
  ClipboardPaste,
  Link2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { YouTubeIcon, TikTokIcon, InstagramIcon, TwitterXIcon, FacebookIcon } from "./PlatformIcons";

const ThreeCanvas = dynamic(() => import("./ThreeCanvas"), {
  ssr: false,
});

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function HeroSection() {
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl.trim()) {
      router.push("/tools/media-downloader");
      return;
    }
    router.push(`/tools/media-downloader?url=${encodeURIComponent(heroUrl.trim())}`);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setHeroUrl(text);
        router.push(`/tools/media-downloader?url=${encodeURIComponent(text.trim())}`);
      }
    } catch {
      // Clipboard denied, focus input
    }
  };

  return (
    <section
      id="home"
      style={{
        position: "relative",
        paddingTop: "130px",
        paddingBottom: "70px",
        overflow: "visible",
      }}
    >
      <div className="container" style={{ overflow: "visible" }}>
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "36px",
            alignItems: "center",
            overflow: "visible",
          }}
        >
          {/* Left Column: Typography, Live Hero Input Bar & CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: "22px", zIndex: 2 }}
          >
            {/* Live Status Pill */}
            <motion.div variants={itemVariants}>
              <div className="pill-badge">
                <span className="pill-dot" />
                <span>Next-Gen Media Engine · 100% Free & Unlimited</span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              style={{
                fontSize: "clamp(34px, 4.6vw, 58px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.12,
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
                fontSize: "clamp(15px, 1.7vw, 17px)",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                maxWidth: "520px",
              }}
            >
              Download high-definition 4K videos, Reels, and lossless 320kbps MP3 audio with zero watermarks. Available directly in your browser or as a native Android app.
            </motion.p>

            {/* Hero Quick Download Form */}
            <motion.div variants={itemVariants}>
              <form
                onSubmit={handleSubmit}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid rgba(255, 107, 0, 0.35)",
                  borderRadius: 16,
                  padding: "6px 8px 6px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 14px 34px rgba(255, 107, 0, 0.12), 0 2px 8px rgba(15, 23, 42, 0.04)",
                  maxWidth: 540,
                }}
              >
                <Link2 size={18} style={{ color: "#FF6B00", flexShrink: 0 }} />
                <input
                  type="url"
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="Paste YouTube, TikTok, Reels, or X link..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "var(--text-title)",
                    background: "transparent",
                    minWidth: 0,
                  }}
                />

                <button
                  type="button"
                  onClick={handlePaste}
                  style={{
                    background: "rgba(15, 23, 42, 0.04)",
                    border: "none",
                    borderRadius: 9,
                    padding: "7px 10px",
                    color: "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                  title="Paste link from clipboard"
                >
                  <ClipboardPaste size={14} />
                  <span className="hidden-mobile">Paste</span>
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: "10px 18px",
                    fontSize: 13,
                    borderRadius: 11,
                    flexShrink: 0,
                    boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
                  }}
                >
                  <span>Download</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </form>
            </motion.div>

            {/* Supported Networks HD Badges */}
            <motion.div
              variants={itemVariants}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
                Supported:
              </span>
              {[
                { name: "YouTube", icon: YouTubeIcon },
                { name: "TikTok", icon: TikTokIcon },
                { name: "Instagram", icon: InstagramIcon },
                { name: "Twitter / X", icon: TwitterXIcon },
                { name: "Facebook", icon: FacebookIcon },
              ].map((p, idx) => {
                const IconComp = p.icon;
                return (
                  <Link
                    key={idx}
                    href={`/tools/media-downloader?platform=${p.name.toLowerCase()}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 11px",
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      border: "1px solid var(--border-hairline)",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                      textDecoration: "none",
                      color: "var(--text-title)",
                      fontSize: "12px",
                      fontWeight: 700,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#FF6B00";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 107, 0, 0.18)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-hairline)";
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.04)";
                    }}
                  >
                    <IconComp size={15} />
                    <span>{p.name}</span>
                  </Link>
                );
              })}
            </motion.div>

            {/* Action Buttons Row */}
            <motion.div
              variants={itemVariants}
              className="hero-cta"
              style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "4px" }}
            >
              <Link href="/tools/media-downloader" className="btn-primary" style={{ padding: "13px 26px", fontSize: "14px" }}>
                <Sparkles size={16} />
                <span>Launch Full Downloader</span>
              </Link>

              <a href="#download" className="btn-secondary" style={{ padding: "13px 22px", fontSize: "14px" }}>
                <Download size={16} strokeWidth={2.2} />
                <span>Download Android APK (15.4 MB)</span>
              </a>
            </motion.div>

            {/* Trust Metrics */}
            <motion.div
              variants={itemVariants}
              className="hero-stats"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
                paddingTop: "14px",
                borderTop: "1px solid var(--border-hairline)",
              }}
            >
              {[
                { icon: Shield, label: "Zero Logs & Ads" },
                { icon: Sparkles, label: "4K 60fps & Lossless" },
                { icon: Zap, label: "Instant Extraction (< 0.8s)" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon size={15} style={{ color: "var(--accent-primary)" }} />
                    <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontWeight: 600 }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right Column: Open Breathing 3D Canvas with Floating Metric Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hero-canvas-wrapper preserve-3d"
            style={{
              position: "relative",
              width: "100%",
              minHeight: "440px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "visible",
              perspective: "1000px",
            }}
          >
            {/* Warm Radial Aura */}
            <div
              style={{
                position: "absolute",
                width: "min(360px, 85vw)",
                height: "min(360px, 85vw)",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255, 107, 0, 0.16) 0%, rgba(251, 146, 60, 0.05) 50%, transparent 70%)",
                filter: "blur(50px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Interactive 3D Canvas */}
            <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, overflow: "visible" }}>
              <ThreeCanvas />
            </div>

            {/* Floating Metric 1 */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="floating-hero-badge float-3d-1"
              style={{
                position: "absolute",
                top: "10%",
                right: "0px",
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(255, 107, 0, 0.35)",
                boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08), 0 0 25px rgba(255, 107, 0, 0.18)",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                zIndex: 3,
                transform: "translateZ(30px)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
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
                  &lt; 0.8s Ultra Fast
                </div>
              </div>
            </motion.div>

            {/* Floating Metric 2 */}
            <motion.div
              animate={{ y: [4, -4, 4] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="floating-hero-badge float-3d-2"
              style={{
                position: "absolute",
                bottom: "10%",
                left: "0px",
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(255, 107, 0, 0.35)",
                boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08), 0 0 25px rgba(255, 107, 0, 0.18)",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                zIndex: 3,
                transform: "translateZ(30px)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
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
                  Zero Watermark 4K
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          :global(.hidden-mobile) {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
