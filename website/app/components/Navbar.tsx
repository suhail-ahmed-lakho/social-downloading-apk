"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Video,
  Music,
  Image as ImageIcon,
  FileCode,
  QrCode,
  Smartphone,
  ExternalLink,
} from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toolCategories = [
    {
      title: "Video & Media",
      items: [
        {
          name: "OmniSaver Downloader",
          desc: "YouTube, TikTok & Instagram in 4K",
          icon: Video,
          href: "/tools/media-downloader",
          badge: "Live",
          badgeType: "live",
        },
        {
          name: "Audio Extractor",
          desc: "Lossless 320kbps MP3 extraction",
          icon: Music,
          href: "/tools/media-downloader",
          badge: "Included",
          badgeType: "subtle",
        },
      ],
    },
    {
      title: "Image & Graphics",
      items: [
        {
          name: "Image Studio",
          desc: "WebP converter & compression",
          icon: ImageIcon,
          href: "/#tools",
          badge: "Soon",
          badgeType: "soon",
        },
        {
          name: "Vector QR Engine",
          desc: "Custom high-DPI SVG QR codes",
          icon: QrCode,
          href: "/#tools",
          badge: "Soon",
          badgeType: "soon",
        },
      ],
    },
    {
      title: "Developer & Utilities",
      items: [
        {
          name: "Text & JSON Engine",
          desc: "Format, validate & regex tester",
          icon: FileCode,
          href: "/#tools",
          badge: "Soon",
          badgeType: "soon",
        },
        {
          name: "OmniSaver Mobile APK",
          desc: "Official native Android application",
          icon: Smartphone,
          href: "/#download",
          badge: "v1.0.2",
          badgeType: "accent",
        },
      ],
    },
  ];

  return (
    <header className="navbar-wrapper">
      <nav
        className="navbar-pill"
        style={{
          background: scrolled ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.9)",
          borderColor: scrolled ? "rgba(255, 107, 0, 0.22)" : "rgba(15, 23, 42, 0.08)",
          boxShadow: scrolled
            ? "0 14px 34px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.02)"
            : "0 4px 20px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
              boxShadow: "0 2px 10px rgba(255, 107, 0, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <Sparkles size={17} strokeWidth={2.4} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.03em",
                color: "var(--text-title)",
              }}
            >
              LookNow
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#EA580C",
                background: "#FFF7ED",
                padding: "2px 7px",
                borderRadius: 999,
                border: "1px solid rgba(255, 107, 0, 0.2)",
              }}
            >
              Free
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
          className="desktop-nav"
        >
          {/* Categories / Tools Dropdown */}
          <div
            ref={dropdownRef}
            style={{ position: "relative" }}
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                color: dropdownOpen ? "#FF6B00" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 0",
                transition: "color 0.2s ease",
              }}
            >
              <span>Tool Categories</span>
              <ChevronDown
                size={14}
                style={{
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {/* Mega Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    paddingTop: 12,
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      width: 580,
                      background: "#FFFFFF",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: 18,
                      padding: 20,
                      boxShadow: "0 20px 48px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 20,
                    }}
                  >
                    {toolCategories.map((cat, idx) => (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "var(--text-subtle)",
                            paddingBottom: 4,
                            borderBottom: "1px solid var(--border-hairline)",
                          }}
                        >
                          {cat.title}
                        </div>

                        {cat.items.map((item, i) => {
                          const Icon = item.icon;
                          const isLive = item.badgeType === "live";

                          return (
                            <Link
                              key={i}
                              href={item.href}
                              onClick={() => setDropdownOpen(false)}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "8px 10px",
                                borderRadius: 10,
                                textDecoration: "none",
                                background: "transparent",
                                transition: "background 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: isLive ? "#FFF7ED" : "#F1F5F9",
                                  color: isLive ? "#FF6B00" : "var(--text-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Icon size={16} />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: "var(--text-title)",
                                    }}
                                  >
                                    {item.name}
                                  </span>
                                  {isLive && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#16A34A",
                                        background: "#DCFCE7",
                                        padding: "1px 6px",
                                        borderRadius: 999,
                                      }}
                                    >
                                      ● Live
                                    </span>
                                  )}
                                  {item.badgeType === "soon" && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: "var(--text-subtle)",
                                        background: "#F1F5F9",
                                        padding: "1px 6px",
                                        borderRadius: 999,
                                      }}
                                    >
                                      Soon
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "var(--text-subtle)",
                                    marginTop: 2,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {item.desc}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/#download"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B00")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Android APK
          </Link>

          <Link
            href="/#features"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B00")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Features
          </Link>

          <Link
            href="/#platforms"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B00")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Networks
          </Link>
        </div>

        {/* Right CTA with Liquid Smoke Wave */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/tools/media-downloader"
            className="btn-primary"
            style={{
              padding: "9px 18px",
              fontSize: 13,
              borderRadius: 10,
            }}
          >
            <span>Launch Web Tool</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-title)",
              cursor: "pointer",
              display: "none",
              padding: 4,
            }}
            className="mobile-toggle"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "absolute",
              top: 76,
              left: 24,
              right: 24,
              background: "#FFFFFF",
              border: "1px solid var(--border-hairline)",
              borderRadius: 18,
              padding: 20,
              boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              zIndex: 99,
            }}
          >
            <Link
              href="/tools/media-downloader"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#FF6B00",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--border-hairline)",
              }}
            >
              <span>🎬 OmniSaver Video Downloader</span>
              <span style={{ fontSize: 11, background: "#DCFCE7", color: "#16A34A", padding: "2px 8px", borderRadius: 999 }}>● Live</span>
            </Link>

            <Link
              href="/#tools"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text-title)", textDecoration: "none", padding: "6px 0" }}
            >
              All Tool Categories
            </Link>

            <Link
              href="/#download"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text-title)", textDecoration: "none", padding: "6px 0" }}
            >
              Android APK
            </Link>

            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text-title)", textDecoration: "none", padding: "6px 0" }}
            >
              Features & Standards
            </Link>

            <Link
              href="/tools/media-downloader"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            >
              <span>Launch Web Tool</span>
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (max-width: 820px) {
          :global(.desktop-nav) {
            display: none !important;
          }
          :global(.mobile-toggle) {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
