"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "How do I download videos without watermarks?",
    answer:
      "Simply copy the video link from TikTok, Instagram Reels, YouTube Shorts, or Twitter/X and paste it into OmniSaver. Our extraction engine analyzes direct CDN streams and removes watermarks automatically, saving the original high-definition file.",
  },
  {
    question: "Is LookNow & OmniSaver 100% free with no limits?",
    answer:
      "Yes! All tools—including the 4K Video Downloader, Lossless MP3 Extractor, Vector QR Engine, and Image Studio—are completely free with unlimited usage. There are no paywalls, daily quotas, or forced account requirements.",
  },
  {
    question: "Can I extract MP3 audio directly from videos?",
    answer:
      "Yes. OmniSaver provides a dedicated lossless audio extractor that extracts audio streams in studio quality up to 320kbps MP3. It preserves artists and song titles when available.",
  },
  {
    question: "Which platforms and file formats are supported?",
    answer:
      "We support YouTube (Videos & Shorts), TikTok, Instagram (Reels & Stories), Twitter / X, Facebook, and more. Videos can be saved in MP4 (up to 4K 60fps) and audio in MP3 or M4A.",
  },
  {
    question: "Is the native Android APK safe to install?",
    answer:
      "Absolutely. The APK is built from clean, verified code, contains zero third-party adware, and requests only the minimal permissions required to save media directly into your Android device gallery.",
  },
  {
    question: "Are my downloads, files, or links stored on your servers?",
    answer:
      "No. We enforce a strict zero-retention privacy policy. We never store downloaded videos or audio files on our servers. All downloads are streamed directly to your browser or device.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" style={{ padding: "80px 0" }}>
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="section-header">
          <div className="pill-badge">
            <HelpCircle size={14} />
            <span>Got Questions?</span>
          </div>
          <h2>
            Frequently Asked <span className="gradient-orange-text">Questions</span>
          </h2>
          <p>
            Everything you need to know about LookNow tools, stream extraction, and the native Android APK.
          </p>
        </div>

        {/* Accordion List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                style={{
                  background: isOpen ? "#FFFFFF" : "rgba(255, 255, 255, 0.8)",
                  border: isOpen ? "1px solid rgba(255, 107, 0, 0.4)" : "1px solid var(--border-hairline)",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: isOpen ? "0 8px 24px rgba(255, 107, 0, 0.08)" : "0 2px 6px rgba(15, 23, 42, 0.02)",
                  transition: "all 0.25s ease",
                }}
              >
                <button
                  onClick={() => toggle(idx)}
                  style={{
                    width: "100%",
                    padding: "20px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: isOpen ? "#FF6B00" : "var(--text-title)",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {faq.question}
                  </span>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: isOpen ? "#FFF7ED" : "rgba(15, 23, 42, 0.04)",
                      color: isOpen ? "#FF6B00" : "var(--text-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div
                        style={{
                          padding: "0 22px 20px 22px",
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: "var(--text-muted)",
                          borderTop: "1px solid rgba(15, 23, 42, 0.04)",
                          paddingTop: 14,
                        }}
                      >
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
