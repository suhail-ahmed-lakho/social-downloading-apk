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
  User,
  HelpCircle,
  Globe,
  Sliders,
} from "lucide-react";
import UserProfileModal from "./UserProfileModal";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserName(localStorage.getItem("looknow_user_name") || "");
    }
  }, [profileModalOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toolCategories = [
    {
      title: "Video & Audio Suite",
      items: [
        {
          name: "OmniSaver 4K Downloader",
          desc: "YouTube, TikTok, Reels & X in 4K",
          icon: Video,
          href: "/tools/media-downloader",
          badge: "Live",
          badgeColor: "#16A34A",
          badgeBg: "#DCFCE7",
        },
        {
          name: "Lossless Audio Extractor",
          desc: "Studio 320kbps MP3 extraction",
          icon: Music,
          href: "/tools/media-downloader?mode=audio",
          badge: "320k",
          badgeColor: "#FF6B00",
          badgeBg: "#FFF7ED",
        },
      ],
    },
    {
      title: "Image & Creative",
      items: [
        {
          name: "Vector QR Code Studio",
          desc: "High-DPI SVG & PNG custom QR codes",
          icon: QrCode,
          href: "/tools/qr-generator",
          badge: "Live",
          badgeColor: "#16A34A",
          badgeBg: "#DCFCE7",
        },
        {
          name: "Image Studio & Optimizer",
          desc: "WebP / AVIF compression & resize",
          icon: ImageIcon,
          href: "/tools/image-studio",
          badge: "Live",
          badgeColor: "#16A34A",
          badgeBg: "#DCFCE7",
        },
      ],
    },
    {
      title: "Dev & Mobile",
      items: [
        {
          name: "Text, JSON & Crypt Engine",
          desc: "Format, validate, case & hash tools",
          icon: FileCode,
          href: "/tools/text-studio",
          badge: "Live",
          badgeColor: "#16A34A",
          badgeBg: "#DCFCE7",
        },
        {
          name: "OmniSaver Mobile APK",
          desc: "Native Android background queue",
          icon: Smartphone,
          href: "/#download",
          badge: "v1.0.2",
          badgeColor: "#0284C7",
          badgeBg: "#E0F2FE",
        },
      ],
    },
  ];

  return (
    <header className="navbar-wrapper">
      <nav
        className="navbar-pill"
        style={{
          background: scrolled
            ? "rgba(255, 255, 255, 0.94)"
            : "rgba(255, 255, 255, 0.86)",
          borderColor: scrolled ? "rgba(255, 107, 0, 0.35)" : "rgba(15, 23, 42, 0.08)",
          boxShadow: scrolled
            ? "0 20px 40px rgba(15, 23, 42, 0.08), 0 0 30px rgba(255, 107, 0, 0.12)"
            : "0 10px 30px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04)",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Brand Logo with Glowing 3D Icon */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--text-title)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(255, 107, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} strokeWidth={2.4} />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text-title)",
                  lineHeight: 1.2,
                }}
              >
                Look<span className="gradient-orange-text">Now</span>
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#FF6B00",
                  boxShadow: "0 0 10px #FF6B00",
                  animation: "pulse-dot 2s infinite ease-in-out",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-subtle)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              OmniSaver Suite
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (>= 920px) */}
        <div
          className="desktop-nav-menu"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Tools Mega-Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onMouseEnter={() => setDropdownOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                color: dropdownOpen ? "#FF6B00" : "var(--text-main)",
                cursor: "pointer",
                padding: "8px 0",
                transition: "color 0.2s ease",
              }}
            >
              <span>Explore Tools</span>
              <ChevronDown
                size={14}
                style={{
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                  color: dropdownOpen ? "#FF6B00" : "var(--text-subtle)",
                }}
              />
            </button>

            {/* Mega Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onMouseLeave={() => setDropdownOpen(false)}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 14px)",
                    left: "-120px",
                    width: "680px",
                    background: "rgba(255, 255, 255, 0.98)",
                    border: "1px solid rgba(255, 107, 0, 0.25)",
                    borderRadius: 22,
                    padding: 22,
                    boxShadow: "0 24px 50px rgba(15, 23, 42, 0.12), 0 0 35px rgba(255, 107, 0, 0.12)",
                    backdropFilter: "blur(24px)",
                    zIndex: 100,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 18,
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
                          paddingBottom: 6,
                          borderBottom: "1px solid var(--border-hairline)",
                        }}
                      >
                        {cat.title}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {cat.items.map((item, i) => {
                          const ItemIcon = item.icon;
                          return (
                            <Link
                              key={i}
                              href={item.href}
                              onClick={() => setDropdownOpen(false)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                padding: "8px 10px",
                                borderRadius: 12,
                                textDecoration: "none",
                                transition: "all 0.2s ease",
                                background: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#FFF7ED";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <ItemIcon size={15} style={{ color: "#FF6B00" }} />
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-title)" }}>
                                    {item.name}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: 999,
                                    background: item.badgeBg,
                                    color: item.badgeColor,
                                  }}
                                >
                                  {item.badge}
                                </span>
                              </div>
                              <span style={{ fontSize: 11, color: "var(--text-subtle)", paddingLeft: 23 }}>
                                {item.desc}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

          <Link
            href="/#faq"
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
            FAQs
          </Link>

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
        </div>

        {/* Right Action Cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* User Identity / Profile Button (Desktop) */}
          <button
            onClick={() => setProfileModalOpen(true)}
            className="desktop-profile-btn"
            title={currentUserName ? `Active Profile: ${currentUserName}` : "Set Visitor Profile"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 11,
              background: currentUserName ? "rgba(255, 107, 0, 0.1)" : "rgba(0, 0, 0, 0.04)",
              border: currentUserName ? "1px solid rgba(255, 107, 0, 0.3)" : "1px solid var(--border-hairline)",
              color: currentUserName ? "#FF6B00" : "var(--text-title)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <User size={15} />
            <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentUserName ? currentUserName.split(" ")[0] : "Profile"}
            </span>
          </button>

          {/* User Identity Button (Mobile Compact Icon) */}
          <button
            onClick={() => setProfileModalOpen(true)}
            className="mobile-profile-btn"
            title={currentUserName ? `Profile: ${currentUserName}` : "Profile"}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: currentUserName ? "rgba(255, 107, 0, 0.12)" : "rgba(0, 0, 0, 0.04)",
              border: currentUserName ? "1px solid rgba(255, 107, 0, 0.35)" : "1px solid var(--border-hairline)",
              color: currentUserName ? "#FF6B00" : "var(--text-title)",
              cursor: "pointer",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              position: "relative",
            }}
          >
            <User size={17} />
            {currentUserName && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#16A34A",
                }}
              />
            )}
          </button>

          {/* Desktop "Launch Web Tool" CTA */}
          <Link
            href="/tools/media-downloader"
            className="btn-primary desktop-cta-btn"
            style={{
              padding: "9px 18px",
              fontSize: 13,
              borderRadius: 11,
              boxShadow: "0 4px 14px rgba(255, 107, 0, 0.35)",
            }}
          >
            <span>Launch Web Tool</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle-btn"
            style={{
              width: 36,
              height: 36,
              background: mobileMenuOpen ? "#FFF7ED" : "rgba(0, 0, 0, 0.04)",
              border: mobileMenuOpen ? "1px solid rgba(255, 107, 0, 0.3)" : "1px solid var(--border-hairline)",
              borderRadius: 10,
              color: mobileMenuOpen ? "#FF6B00" : "var(--text-title)",
              cursor: "pointer",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Pro Mobile Drawer & Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(6px)",
                zIndex: 98,
              }}
            />

            {/* Slide Down Sheet */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed",
                top: 72,
                left: 12,
                right: 12,
                maxHeight: "calc(100vh - 88px)",
                overflowY: "auto",
                background: "rgba(255, 255, 255, 0.98)",
                border: "1px solid rgba(255, 107, 0, 0.25)",
                borderRadius: 22,
                padding: "20px 18px",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2), 0 0 35px rgba(255, 107, 0, 0.15)",
                backdropFilter: "blur(24px)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                zIndex: 99,
              }}
            >
              {/* Featured Hero Tool Card */}
              <Link
                href="/tools/media-downloader"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
                  border: "1.5px solid rgba(255, 107, 0, 0.35)",
                  borderRadius: 16,
                  padding: 14,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(255, 107, 0, 0.12)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#FF6B00",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(255, 107, 0, 0.3)",
                      flexShrink: 0,
                    }}
                  >
                    <Video size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-title)" }}>
                      OmniSaver Downloader
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      YouTube, TikTok, Reels & MP3 4K
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 10, background: "#DCFCE7", color: "#16A34A", fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                  Live
                </span>
              </Link>

              {/* All Working Tools Grid */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-subtle)",
                    marginBottom: 8,
                    paddingLeft: 4,
                  }}
                >
                  Active Tools Suite (100% Free)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { name: "Audio Extractor", icon: Music, href: "/tools/media-downloader?mode=audio", badge: "320k" },
                    { name: "Vector QR Engine", icon: QrCode, href: "/tools/qr-generator", badge: "SVG" },
                    { name: "Image Studio", icon: ImageIcon, href: "/tools/image-studio", badge: "WebP" },
                    { name: "Text & JSON", icon: FileCode, href: "/tools/text-studio", badge: "Hash" },
                  ].map((tool, idx) => {
                    const TIcon = tool.icon;
                    return (
                      <Link
                        key={idx}
                        href={tool.href}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          background: "#F8FAFC",
                          border: "1px solid var(--border-hairline)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          textDecoration: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <TIcon size={16} style={{ color: "#FF6B00" }} />
                          <span style={{ fontSize: 9, fontWeight: 700, background: "#FFF7ED", color: "#FF6B00", padding: "1px 5px", borderRadius: 6 }}>
                            {tool.badge}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-title)" }}>
                          {tool.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Fast Jump Section Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Supported Networks", href: "/#platforms", icon: Globe },
                  { label: "Performance & Features", href: "/#features", icon: Sliders },
                  { label: "Frequently Asked Questions", href: "/#faq", icon: HelpCircle },
                  { label: "Download Android APK (15.2 MB)", href: "/#download", icon: Smartphone },
                ].map((item, idx) => {
                  const LIcon = item.icon;
                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-main)",
                        textDecoration: "none",
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: "rgba(15, 23, 42, 0.02)",
                      }}
                    >
                      <LIcon size={15} style={{ color: "var(--text-subtle)" }} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Profile Trigger */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileModalOpen(true);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "11px 16px",
                  borderRadius: 12,
                  background: currentUserName ? "rgba(255, 107, 0, 0.12)" : "rgba(15, 23, 42, 0.04)",
                  border: currentUserName ? "1px solid rgba(255, 107, 0, 0.3)" : "1px solid var(--border-hairline)",
                  color: currentUserName ? "#FF6B00" : "var(--text-title)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <User size={16} />
                <span>{currentUserName ? `Profile: ${currentUserName}` : "Set Visitor Profile & Name"}</span>
              </button>

              {/* Primary Mobile CTA Button */}
              <Link
                href="/tools/media-downloader"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "13px 20px",
                  borderRadius: 12,
                  fontSize: 14,
                  boxShadow: "0 4px 16px rgba(255, 107, 0, 0.35)",
                }}
              >
                <span>Launch Media Downloader</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Visitor Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSaved={(name) => setCurrentUserName(name)}
      />

      <style jsx>{`
        @media (max-width: 920px) {
          :global(.desktop-nav-menu) {
            display: none !important;
          }
          :global(.desktop-cta-btn) {
            display: none !important;
          }
          :global(.desktop-profile-btn) {
            display: none !important;
          }
          :global(.mobile-profile-btn) {
            display: flex !important;
          }
          :global(.mobile-toggle-btn) {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
