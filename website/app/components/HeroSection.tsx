"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Download,
  Zap,
  Shield,
  Sparkles,
  ClipboardPaste,
  Link2,
  Film,
  Music,
} from "lucide-react";
import { YouTubeIcon, TikTokIcon, InstagramIcon, TwitterXIcon, FacebookIcon } from "./PlatformIcons";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function HeroSection() {
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState("");
  const [apkSize, setApkSize] = useState("70.8 MB");
  const [selectedFormat, setSelectedFormat] = useState<"video" | "audio">("video");

  useEffect(() => {
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        if (data?.fileSize) setApkSize(data.fileSize);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl.trim()) {
      router.push(`/tools/media-downloader${selectedFormat === "audio" ? "?mode=audio" : ""}`);
      return;
    }
    const modeParam = selectedFormat === "audio" ? "&mode=audio" : "";
    router.push(`/tools/media-downloader?url=${encodeURIComponent(heroUrl.trim())}${modeParam}`);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setHeroUrl(text);
        const modeParam = selectedFormat === "audio" ? "&mode=audio" : "";
        router.push(`/tools/media-downloader?url=${encodeURIComponent(text.trim())}${modeParam}`);
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
        paddingTop: "140px",
        paddingBottom: "80px",
      }}
    >
      <div className="container" style={{ maxWidth: "980px" }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "24px",
          }}
        >
          {/* 1. Live Status Pill Badge */}
          <motion.div variants={itemVariants}>
            <div className="pill-badge">
              <span className="pill-dot" />
              <span>Next-Gen Media Engine · 100% Free & Unlimited</span>
            </div>
          </motion.div>

          {/* 2. Main High-Impact Headline */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: "clamp(36px, 5.2vw, 62px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              color: "var(--text-title)",
              maxWidth: "840px",
            }}
          >
            Download Any Video in{" "}
            <span className="gradient-orange-text">4K & Lossless MP3</span>
          </motion.h1>

          {/* 3. Subheadline */}
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: "clamp(16px, 1.8vw, 18px)",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            Extract source-quality videos without watermarks from TikTok, YouTube 4K, Instagram Reels, and Twitter/X. Fast, ad-free, and no installation required.
          </motion.p>

          {/* 4. Format Selector Quick Toggle */}
          <motion.div
            variants={itemVariants}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
              background: "#F1F5F9",
              borderRadius: "12px",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedFormat("video")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: selectedFormat === "video" ? "#FFFFFF" : "transparent",
                color: selectedFormat === "video" ? "var(--text-title)" : "var(--text-subtle)",
                boxShadow: selectedFormat === "video" ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Film size={14} style={{ color: selectedFormat === "video" ? "#FF6B00" : "inherit" }} />
              <span>Video (MP4 / 4K)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat("audio")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: selectedFormat === "audio" ? "#FFFFFF" : "transparent",
                color: selectedFormat === "audio" ? "var(--text-title)" : "var(--text-subtle)",
                boxShadow: selectedFormat === "audio" ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Music size={14} style={{ color: selectedFormat === "audio" ? "#FF6B00" : "inherit" }} />
              <span>Audio (MP3 / 320k)</span>
            </button>
          </motion.div>

          {/* 5. Hero Quick Download Form */}
          <motion.div variants={itemVariants} style={{ width: "100%", maxWidth: "680px" }}>
            <form
              onSubmit={handleSubmit}
              style={{
                background: "#FFFFFF",
                border: "1.5px solid rgba(255, 107, 0, 0.35)",
                borderRadius: "16px",
                padding: "8px 10px 8px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 16px 36px rgba(255, 107, 0, 0.12), 0 2px 8px rgba(15, 23, 42, 0.04)",
                width: "100%",
                transition: "all 0.2s ease",
              }}
            >
              <Link2 size={20} style={{ color: "#FF6B00", flexShrink: 0 }} />
              <input
                type="url"
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="Paste YouTube, TikTok, Instagram or X link..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  color: "var(--text-title)",
                  width: "100%",
                  background: "transparent",
                  fontFamily: "var(--font-body)",
                }}
              />

              <button
                type="button"
                onClick={handlePaste}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "#F8FAFC",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
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
                  padding: "11px 22px",
                  fontSize: "14px",
                  borderRadius: "10px",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
                }}
              >
                <span>Download</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </form>
          </motion.div>

          {/* 6. Supported Networks Chips */}
          <motion.div
            variants={itemVariants}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginRight: "4px",
              }}
            >
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
                    padding: "6px 12px",
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

          {/* 7. Action CTA Buttons */}
          <motion.div
            variants={itemVariants}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
              marginTop: "8px",
            }}
          >
            <Link
              href="/tools/media-downloader"
              className="btn-primary"
              style={{ padding: "13px 28px", fontSize: "14px" }}
            >
              <Sparkles size={16} />
              <span>Launch Full Studio</span>
            </Link>

            <a
              href="#download"
              className="btn-secondary"
              style={{ padding: "13px 24px", fontSize: "14px" }}
            >
              <Download size={16} strokeWidth={2.2} />
              <span>Download Android APK ({apkSize})</span>
            </a>
          </motion.div>

          {/* 8. Trust Metrics Grid (4 Clean Cards) */}
          <motion.div
            variants={itemVariants}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              width: "100%",
              marginTop: "20px",
              paddingTop: "24px",
              borderTop: "1px solid var(--border-hairline)",
            }}
          >
            {[
              { icon: Sparkles, title: "4K 60fps & HD", desc: "Native master source quality" },
              { icon: Shield, title: "Zero Watermarks", desc: "Clean TikTok & Reels frames" },
              { icon: Zap, title: "< 0.8s Extraction", desc: "Direct multi-threaded streams" },
              { icon: Download, title: "100% Free Forever", desc: "No registration or daily quotas" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "14px",
                    padding: "16px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      background: "#FFF7ED",
                      border: "1px solid rgba(255, 107, 0, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FF6B00",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text-title)",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-subtle)", marginTop: "2px" }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
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
