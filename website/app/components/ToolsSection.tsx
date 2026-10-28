"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  FileText,
  QrCode,
  Music,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import TiltCard3D from "./TiltCard3D";

const CATEGORIES = [
  { id: "all", label: "All Active Tools" },
  { id: "media", label: "Video & Audio" },
  { id: "image", label: "Image & Vector" },
  { id: "dev", label: "Dev & Hashes" },
  { id: "mobile", label: "Mobile APK" },
];

const tools = [
  {
    id: "omnisaver",
    category: "media",
    icon: Download,
    name: "OmniSaver — Universal 4K Downloader",
    desc: "Download pristine 4K videos, watermark-free TikToks, Instagram Reels, and Twitter/X clips with direct stream extraction.",
    tags: ["4K 60fps", "Zero Watermark", "YouTube", "TikTok", "Reels"],
    status: "live",
    href: "/tools/media-downloader",
    categoryLabel: "Video & Media",
    badge: "Most Popular",
  },
  {
    id: "audio-extractor",
    category: "media",
    icon: Music,
    name: "Lossless Audio & MP3 Extractor",
    desc: "Extract crystal clear 320kbps audio directly from video streams with preserved metadata tags and zero transcode loss.",
    tags: ["320kbps MP3", "Lossless Stream", "ID3 Tags", "Instant"],
    status: "live",
    href: "/tools/media-downloader?mode=audio",
    categoryLabel: "Video & Media",
    badge: "High Fidelity",
  },
  {
    id: "qr-studio",
    category: "image",
    icon: QrCode,
    name: "Vector QR Code Engine",
    desc: "Generate custom high-DPI PNG and scalable vector SVG QR codes for URLs, Wi-Fi networks, vCards, and emails client-side.",
    tags: ["Vector SVG", "WiFi Auto-Connect", "High DPI Print", "Client-Side"],
    status: "live",
    href: "/tools/qr-generator",
    categoryLabel: "Image & Vector",
    badge: "Vector SVG",
  },
  {
    id: "image-studio",
    category: "image",
    icon: ImageIcon,
    name: "Image Studio & Optimizer",
    desc: "Convert PNG and JPEG to next-gen WebP, compress file sizes by up to 90%, and resize dimensions with zero server uploads.",
    tags: ["WebP Converter", "Canvas Engine", "Zero Upload", "Resize"],
    status: "live",
    href: "/tools/image-studio",
    categoryLabel: "Image & Vector",
    badge: "Up to 90% Saved",
  },
  {
    id: "text-engine",
    category: "dev",
    icon: FileText,
    name: "Text, JSON & Crypt Engine",
    desc: "Format and validate JSON with syntax checks, convert string casing, compute SHA-256/512 checksums, and decode Base64.",
    tags: ["JSON Beautifier", "SHA-256 Hashes", "Case Convert", "Base64"],
    status: "live",
    href: "/tools/text-studio",
    categoryLabel: "Dev & Hashes",
    badge: "Web Crypto",
  },
  {
    id: "omnisaver-apk",
    category: "mobile",
    icon: Smartphone,
    name: "OmniSaver Native Android APK",
    desc: "Install the standalone Android application for automatic gallery indexing, multithreaded downloads, and background queues.",
    tags: ["Android 8.0+", "ARM64", "Background Queue", "Gallery Sync"],
    status: "live",
    href: "/#download",
    categoryLabel: "Mobile APK",
    badge: "v1.0.2 Standalone",
  },
];

export default function ToolsSection() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredTools =
    activeTab === "all" ? tools : tools.filter((t) => t.category === activeTab);

  return (
    <section id="tools" style={{ padding: "80px 0" }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="pill-badge">
            <Sparkles size={14} />
            <span>Productivity Ecosystem</span>
          </div>
          <h2>
            Curated Tools for <span className="gradient-orange-text">creators & developers</span>
          </h2>
          <p>
            Every tool runs with maximum throughput and zero cloud tracking. Completely free, open, and unlimited.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isActive ? "1px solid rgba(255, 107, 0, 0.4)" : "1px solid var(--border-hairline)",
                  background: isActive ? "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)" : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "var(--text-muted)",
                  boxShadow: isActive
                    ? "0 4px 14px rgba(255, 107, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                    : "0 1px 3px rgba(15, 23, 42, 0.04)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 3D Bento Grid with Tilt Cards */}
        <motion.div
          layout
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 350px), 1fr))",
            gap: "24px",
          }}
        >
          <AnimatePresence>
            {filteredTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.3 }}
                >
                  <TiltCard3D glowColor="rgba(255, 107, 0, 0.25)">
                    <Link
                      href={tool.href}
                      className="glass-card preserve-3d"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        textDecoration: "none",
                        color: "inherit",
                        background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
                        boxShadow: "0 6px 24px rgba(15, 23, 42, 0.05), 0 0 20px rgba(255, 107, 0, 0.04)",
                      }}
                    >
                      {/* Card Header (3D Elevated) */}
                      <div
                        className="translate-z-20"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "18px",
                          transform: "translateZ(24px)",
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
                            border: "1px solid rgba(255, 107, 0, 0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FF6B00",
                            boxShadow: "0 4px 14px rgba(255, 107, 0, 0.25)",
                          }}
                        >
                          <Icon size={23} strokeWidth={2.2} />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "var(--text-subtle)",
                              background: "#F1F5F9",
                              padding: "4px 9px",
                              borderRadius: "8px",
                            }}
                          >
                            {tool.categoryLabel}
                          </span>

                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "999px",
                              background: "#DCFCE7",
                              border: "1px solid rgba(34, 197, 94, 0.2)",
                              color: "#16A34A",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#16A34A",
                              }}
                            />
                            Live
                          </span>

                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#FF6B00",
                              background: "#FFF7ED",
                              border: "1px solid rgba(255, 107, 0, 0.25)",
                            }}
                          >
                            <ArrowUpRight size={15} />
                          </div>
                        </div>
                      </div>

                      {/* Title & Description (3D Lift) */}
                      <div style={{ transform: "translateZ(18px)", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <h3
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "var(--text-title)",
                            }}
                          >
                            {tool.name}
                          </h3>
                        </div>

                        <p
                          style={{
                            fontSize: "14px",
                            color: "var(--text-muted)",
                            lineHeight: 1.6,
                            marginBottom: "20px",
                            flexGrow: 1,
                          }}
                        >
                          {tool.desc}
                        </p>
                      </div>

                      {/* Pill Tags (3D Layered) */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          transform: "translateZ(12px)",
                        }}
                      >
                        {tool.tags.map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              background: "#F8FAFC",
                              border: "1px solid var(--border-hairline)",
                              fontSize: "12px",
                              color: "var(--text-subtle)",
                              fontWeight: 500,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </TiltCard3D>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
