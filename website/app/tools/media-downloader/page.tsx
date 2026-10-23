"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Download,
  Video,
  Music,
  ClipboardPaste,
  X,
  Sparkles,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2,
  Check,
  ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface QualityOption {
  label: string;
  quality: string;
  type: "video" | "audio";
  format?: string;
  itag?: number;
  directUrl?: string;
  approxSize: string;
}

interface VideoInfo {
  platform: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  views?: string;
  qualityOptions: QualityOption[];
  videoId?: string;
}

interface DownloadState {
  index: number;
  status: "idle" | "converting" | "ready" | "error";
  progressText: string;
  progressPercent?: number;
  downloadUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { label: string }> = {
  youtube: { label: "YouTube" },
  tiktok: { label: "TikTok" },
  instagram: { label: "Instagram" },
  twitter: { label: "Twitter / X" },
  facebook: { label: "Facebook" },
};

function detectPlatformClient(url: string): string {
  if (/tiktok\.com|vm\.tiktok\.com/i.test(url)) return "tiktok";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/instagram\.com|instagr\.am/i.test(url)) return "instagram";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  return "unknown";
}

function formatDuration(seconds: string | number): string {
  const s = Number(seconds);
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VideoDownloaderTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadStates, setDownloadStates] = useState<Record<number, DownloadState>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleFetch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setDownloadStates({});

    try {
      const res = await fetch("/api/video/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch video details");
      setVideoInfo(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to process this URL.");
    } finally {
      setLoading(false);
    }
  };

  const triggerBrowserDownload = (downloadUrl: string, filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(downloadUrl, "_blank");
    }
  };

  const handleDownload = async (opt: QualityOption, index: number) => {
    // 1. Direct URLs (TikTok, Instagram)
    if (opt.directUrl) {
      setDownloadStates((prev) => ({
        ...prev,
        [index]: { index, status: "ready", progressText: "Download Ready", downloadUrl: opt.directUrl },
      }));
      triggerBrowserDownload(opt.directUrl, `${videoInfo?.title || "video"}.${opt.type === "audio" ? "mp3" : "mp4"}`);
      return;
    }

    // 2. YouTube (Interactive Server-Side Conversion with Live Progress)
    if (videoInfo?.videoId) {
      const format = opt.format || (opt.type === "audio" ? "mp3" : "720");
      setDownloadStates((prev) => ({
        ...prev,
        [index]: {
          index,
          status: "converting",
          progressText: opt.type === "audio" ? "Converting to MP3 (10%)..." : "Processing HD Video (10%)...",
          progressPercent: 10,
        },
      }));

      try {
        // Step A: Init conversion
        const initRes = await fetch("/api/video/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: videoInfo.videoId,
            format,
            action: "init",
          }),
        });

        const initData = await initRes.json();

        // If direct download URL is already available
        if (initData.status === "done" && initData.downloadUrl) {
          setDownloadStates((prev) => ({
            ...prev,
            [index]: {
              index,
              status: "ready",
              progressText: "Download Ready!",
              downloadUrl: initData.downloadUrl,
            },
          }));
          triggerBrowserDownload(
            initData.downloadUrl,
            `${videoInfo.title}.${opt.type === "audio" ? "mp3" : "mp4"}`
          );
          return;
        }

        // Step B: Poll progress URL
        if (initData.progressUrl) {
          const maxPolls = 18;
          let downloadReadyUrl = "";

          for (let poll = 0; poll < maxPolls; poll++) {
            await new Promise((r) => setTimeout(r, 1400));

            const pollRes = await fetch("/api/video/download", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "poll",
                progressUrl: initData.progressUrl,
              }),
            });

            if (pollRes.ok) {
              const pollData = await pollRes.json();

              if (pollData.status === "done" && pollData.downloadUrl) {
                downloadReadyUrl = pollData.downloadUrl;
                break;
              }

              const currentPct = pollData.progress || Math.min(90, 15 + poll * 5);
              setDownloadStates((prev) => ({
                ...prev,
                [index]: {
                  index,
                  status: "converting",
                  progressText: opt.type === "audio" ? `Converting to MP3 (${currentPct}%)...` : `Processing Stream (${currentPct}%)...`,
                  progressPercent: currentPct,
                },
              }));
            }
          }

          if (downloadReadyUrl) {
            setDownloadStates((prev) => ({
              ...prev,
              [index]: {
                index,
                status: "ready",
                progressText: "Download Ready!",
                downloadUrl: downloadReadyUrl,
              },
            }));
            triggerBrowserDownload(
              downloadReadyUrl,
              `${videoInfo.title}.${opt.type === "audio" ? "mp3" : "mp4"}`
            );
            return;
          }
        }

        // Fallback gateway if conversion took longer
        const fallback = `https://en.savefrom.net/#url=https://www.youtube.com/watch?v=${videoInfo.videoId}`;
        setDownloadStates((prev) => ({
          ...prev,
          [index]: {
            index,
            status: "ready",
            progressText: "Click to Download",
            downloadUrl: fallback,
          },
        }));
        triggerBrowserDownload(fallback, "video");
      } catch (err: unknown) {
        console.error(err);
        const fallback = `https://en.savefrom.net/#url=https://www.youtube.com/watch?v=${videoInfo.videoId}`;
        setDownloadStates((prev) => ({
          ...prev,
          [index]: {
            index,
            status: "ready",
            progressText: "Click to Download",
            downloadUrl: fallback,
          },
        }));
      }
    }
  };

  const handleReset = () => {
    setUrl("");
    setVideoInfo(null);
    setError(null);
    setDownloadStates({});
    inputRef.current?.focus();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingTop: 100, paddingBottom: 80 }}>
      {/* Back to Home */}
      <div className="container" style={{ maxWidth: 840, marginBottom: 24 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B00")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ArrowLeft size={16} />
          <span>Back to All Tools</span>
        </Link>
      </div>

      <div className="container" style={{ maxWidth: 840 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="pill-badge" style={{ marginBottom: 16 }}>
            <span className="pill-dot" />
            <span>OmniSaver Engine · Free & Unlimited</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 4.5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: 12,
              color: "var(--text-title)",
            }}
          >
            Universal <span className="gradient-orange-text">Media Downloader</span>
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6, maxWidth: 580, margin: "0 auto" }}>
            Extract 4K videos, Reels, and lossless MP3 audio with zero telemetry and no watermarks.
          </p>
        </div>

        {/* URL Input Form */}
        <form
          onSubmit={handleFetch}
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(255, 107, 0, 0.3)",
            borderRadius: 18,
            padding: "8px 8px 8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06), 0 0 25px rgba(255, 107, 0, 0.08)",
            marginBottom: 20,
          }}
        >
          <div style={{ color: "#FF6B00", display: "flex", alignItems: "center" }}>
            <Link2 size={18} />
          </div>

          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setVideoInfo(null);
              setError(null);
              setDownloadStates({});
            }}
            placeholder="Paste YouTube, TikTok, or Instagram video link..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-title)",
              fontSize: 15,
              fontFamily: "var(--font-body)",
              minWidth: 0,
            }}
          />

          {url && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--text-subtle)",
              }}
              title="Clear"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={handlePaste}
            className="btn-secondary"
            style={{ padding: "8px 14px", fontSize: 13, borderRadius: 10 }}
          >
            <ClipboardPaste size={14} />
            <span>Paste</span>
          </button>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary"
            style={{
              padding: "10px 20px",
              fontSize: 14,
              borderRadius: 10,
              opacity: loading || !url.trim() ? 0.6 : 1,
              cursor: loading || !url.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <span>Extract</span>
                <Download size={15} />
              </>
            )}
          </button>
        </form>

        {/* Platform Pill Bar */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 36 }}>
          {["YouTube", "TikTok", "Instagram", "Twitter / X", "Facebook"].map((name) => (
            <span
              key={name}
              style={{
                fontSize: 12,
                color: "var(--text-subtle)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF6B00" }} />
              {name}
            </span>
          ))}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#B91C1C",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Result Card */}
        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-card"
              style={{ padding: 0, marginBottom: 40, border: "1px solid rgba(255, 107, 0, 0.3)" }}
            >
              {/* Header Info */}
              <div style={{ padding: 24, borderBottom: "1px solid var(--border-hairline)", display: "flex", gap: 20, alignItems: "flex-start", background: "#FFFBF7" }}>
                {videoInfo.thumbnail && (
                  <div
                    style={{
                      width: 140,
                      height: 90,
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#F1F5F9",
                      border: "1px solid var(--border-hairline)",
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pill-badge" style={{ padding: "3px 10px", fontSize: 11, marginBottom: 8 }}>
                    <span>{PLATFORM_CONFIG[videoInfo.platform]?.label || videoInfo.platform}</span>
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      marginBottom: 8,
                      color: "var(--text-title)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {videoInfo.title}
                  </h3>

                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-subtle)", flexWrap: "wrap" }}>
                    <span>By {videoInfo.author}</span>
                    {videoInfo.duration && Number(videoInfo.duration) > 0 && (
                      <span>Duration: {formatDuration(videoInfo.duration)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quality Downloads List */}
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-subtle)", marginBottom: 16 }}>
                  Available Formats
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {videoInfo.qualityOptions.map((opt, i) => {
                    const isAudio = opt.type === "audio";
                    const state = downloadStates[i] || { status: "idle" };
                    const isConverting = state.status === "converting";
                    const isReady = state.status === "ready";

                    return (
                      <div
                        key={i}
                        style={{
                          background: isReady ? "#F0FDF4" : "#FFFFFF",
                          border: isReady ? "1px solid #86EFAC" : "1px solid var(--border-hairline)",
                          borderRadius: 14,
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 14,
                          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: isReady ? "#DCFCE7" : "#FFF7ED",
                              color: isReady ? "#16A34A" : "#FF6B00",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isReady ? <Check size={20} strokeWidth={2.5} /> : isAudio ? <Music size={18} /> : <Video size={18} />}
                          </div>

                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-title)" }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>
                              {isConverting ? (
                                <span style={{ color: "#EA580C", fontWeight: 600 }}>
                                  {state.progressText}
                                </span>
                              ) : isReady ? (
                                <span style={{ color: "#16A34A", fontWeight: 600 }}>
                                  ✅ Ready to save! Automatic download started.
                                </span>
                              ) : (
                                opt.approxSize
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Button States */}
                        {isReady && state.downloadUrl ? (
                          <a
                            href={state.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "#16A34A",
                              color: "#FFFFFF",
                              padding: "10px 18px",
                              borderRadius: 10,
                              fontSize: 13,
                              fontWeight: 700,
                              textDecoration: "none",
                              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                            }}
                          >
                            <Download size={14} strokeWidth={2.5} />
                            <span>Save File Again</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => handleDownload(opt, i)}
                            disabled={isConverting}
                            className="btn-primary"
                            style={{
                              padding: "10px 20px",
                              fontSize: 13,
                              borderRadius: 10,
                              opacity: isConverting ? 0.8 : 1,
                              cursor: isConverting ? "wait" : "pointer",
                            }}
                          >
                            {isConverting ? (
                              <>
                                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                                <span>{state.progressPercent ? `${state.progressPercent}%` : "Converting..."}</span>
                              </>
                            ) : (
                              <>
                                <Download size={14} />
                                <span>Download</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Native App Banner (Integrated into the tool page) */}
        <div
          className="glass-card"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
            border: "1px solid rgba(255, 107, 0, 0.3)",
            padding: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06), 0 0 25px rgba(255, 107, 0, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(255, 107, 0, 0.35)",
              }}
            >
              <Smartphone size={24} />
            </div>

            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-title)", marginBottom: 4 }}>
                Prefer mobile? Download the Native APK
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Automatic background saves, direct gallery integration, and batch queueing.
              </div>
            </div>
          </div>

          <a
            href="/downloads/omnisaver-latest.apk"
            download
            className="btn-primary"
            style={{ padding: "10px 20px", fontSize: 13, borderRadius: 10 }}
          >
            <Download size={15} />
            <span>Download APK (15MB)</span>
          </a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
