"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import TiltCard3D from "./TiltCard3D";

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
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
            gap: "16px",
          }}
        >
          {platforms.map((platform, i) => (
            <TiltCard3D key={i} maxTilt={8} scale={1.03} glowColor="rgba(255, 107, 0, 0.25)">
              <div
                className="preserve-3d"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "14px",
                  padding: "18px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--text-title)",
                    fontFamily: "var(--font-heading)",
                    transform: "translateZ(16px)",
                  }}
                >
                  {platform.name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-subtle)", transform: "translateZ(8px)" }}>
                  {platform.category}
                </div>
              </div>
            </TiltCard3D>
          ))}
        </div>
      </div>
    </section>
  );
}
