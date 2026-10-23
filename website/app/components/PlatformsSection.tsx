"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";

const platforms = [
  { name: "YouTube", category: "Videos & Shorts" },
  { name: "TikTok", category: "Watermark-Free" },
  { name: "Instagram", category: "Reels & Stories" },
  { name: "Twitter / X", category: "Media Streams" },
  { name: "Facebook", category: "Watch & Reels" },
  { name: "Pinterest", category: "Video Pins" },
  { name: "Reddit", category: "Native MP4s" },
  { name: "Twitch", category: "Clips & VODs" },
  { name: "Vimeo", category: "HD Streams" },
  { name: "SoundCloud", category: "HQ Audio" },
];

export default function PlatformsSection() {
  return (
    <section id="platforms" style={{ padding: "80px 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 48px auto" }}>
          <div className="pill-badge" style={{ marginBottom: "16px" }}>
            <Globe size={13} />
            <span>Universal Compatibility</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 3.2vw, 38px)", fontWeight: 800, marginBottom: "14px", color: "var(--text-title)" }}>
            Supported Networks
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6 }}>
            Direct URL resolution supported across major video and audio distribution networks.
          </p>
        </div>

        {/* Platform Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "16px",
          }}
        >
          {platforms.map((platform, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border-hairline)",
                borderRadius: "14px",
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 107, 0, 0.4)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 107, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-hairline)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.04)";
              }}
            >
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-title)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {platform.name}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
                {platform.category}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
