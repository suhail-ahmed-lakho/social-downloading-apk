"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  FileText,
  QrCode,
  Lock,
  Cpu,
  ArrowUpRight,
  Sparkles,
  Layers,
  Smartphone,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Tools" },
  { id: "media", label: "Video & Media" },
  { id: "image", label: "Image & Graphics" },
  { id: "dev", label: "Dev Utilities" },
  { id: "mobile", label: "Mobile APK" },
];

const tools = [
  {
    id: "omnisaver",
    category: "media",
    icon: Download,
    name: "OmniSaver — Video & Audio Suite",
    desc: "Download 4K videos, Reels, and lossless MP3 audio from YouTube, TikTok, and Instagram without compression or watermarks.",
    tags: ["Web Tool", "Android APK", "Lossless Audio", "4K Video"],
    status: "live",
    href: "/tools/media-downloader",
    categoryLabel: "Video & Media",
  },
  {
    id: "omnisaver-apk",
    category: "mobile",
    icon: Smartphone,
    name: "OmniSaver Native Android APK",
    desc: "Install the high-speed native Android build with automatic gallery sync, multithreaded downloads, and background processing.",
    tags: ["Android 8.0+", "ARM64", "Background Queue", "Gallery Sync"],
    status: "live",
    href: "/#download",
    categoryLabel: "Mobile APK",
  },
  {
    id: "image-studio",
    category: "image",
    icon: ImageIcon,
    name: "Image Studio & Optimizer",
    desc: "Client-side image optimizer, WebP/AVIF converter, background remover, and smart resizer running with zero cloud latency.",
    tags: ["WebP / AVIF", "Browser Processing", "Zero Upload"],
    status: "coming",
    href: "#",
    categoryLabel: "Image & Graphics",
  },
  {
    id: "qr-studio",
    category: "image",
    icon: QrCode,
    name: "Vector QR Engine",
    desc: "High-density custom QR generator supporting Wi-Fi configurations, vCards, dynamic logos, and vector SVG outputs.",
    tags: ["Vector SVG", "WiFi / vCard", "High DPI Print"],
    status: "coming",
    href: "#",
    categoryLabel: "Image & Graphics",
  },
  {
    id: "text-engine",
    category: "dev",
    icon: FileText,
    name: "Developer Text & JSON Engine",
    desc: "Syntax highlighting formatter, JSON validator, regex playground, and case transform utilities for fast developer workflows.",
    tags: ["JSON / YAML", "Regex Tester", "Diff Viewer"],
    status: "coming",
    href: "#",
    categoryLabel: "Dev Utilities",
  },
  {
    id: "crypto-vault",
    category: "dev",
    icon: Lock,
    name: "Client Crypt & Hash Vault",
    desc: "Client-side SHA-256/512 checksums, AES-GCM local file encryption, and password generation with modern Web Crypto APIs.",
    tags: ["SHA-256", "AES-GCM", "Zero Cloud Storage"],
    status: "coming",
    href: "#",
    categoryLabel: "Dev Utilities",
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
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px auto" }}>
          <div className="pill-badge" style={{ marginBottom: "16px" }}>
            <Sparkles size={14} />
            <span>Categorized Tool Ecosystem</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 800,
              marginBottom: "16px",
              color: "var(--text-title)",
            }}
          >
            Curated Tools for <span className="gradient-orange-text">creators & developers</span>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1.6 }}>
            Browse by category to find web utilities and native mobile applications. Zero paywalls, zero telemetry.
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

        {/* Filtered Tools Grid */}
        <motion.div
          layout
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "24px",
          }}
        >
          <AnimatePresence>
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const isLive = tool.status === "live";

              return (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ y: -3 }}
                >
                  <Link
                    href={tool.href}
                    className="glass-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      textDecoration: "none",
                      borderColor: isLive ? "rgba(255, 107, 0, 0.35)" : "var(--border-hairline)",
                      background: isLive
                        ? "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)"
                        : "#FFFFFF",
                    }}
                  >
                    {/* Card Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "18px",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: isLive
                            ? "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)"
                            : "#F8FAFC",
                          border: isLive ? "1px solid rgba(255, 107, 0, 0.3)" : "1px solid var(--border-hairline)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isLive ? "#FF6B00" : "var(--text-muted)",
                        }}
                      >
                        <Icon size={22} strokeWidth={2.2} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--text-subtle)",
                            background: "#F1F5F9",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {tool.categoryLabel}
                        </span>

                        {isLive ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
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
                        ) : (
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              background: "#F1F5F9",
                              border: "1px solid var(--border-hairline)",
                              color: "var(--text-subtle)",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Soon
                          </span>
                        )}

                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-subtle)",
                            background: "#F8FAFC",
                            border: "1px solid var(--border-hairline)",
                          }}
                        >
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        marginBottom: "8px",
                        color: "var(--text-title)",
                      }}
                    >
                      {tool.name}
                    </h3>

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

                    {/* Pill Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
