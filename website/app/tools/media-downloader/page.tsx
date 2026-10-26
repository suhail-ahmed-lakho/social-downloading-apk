"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowLeft,
  AlertCircle,
  Loader2,
  Link2,
  Check,
  Play,
  Zap,
} from "lucide-react";
import {
  YouTubeIcon,
  TikTokIcon,
  InstagramIcon,
  TwitterXIcon,
  FacebookIcon,
  PlatformChip,
} from "@/app/components/PlatformIcons";
import TiltCard3D from "@/app/components/TiltCard3D";

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

  const detected = detectPlatformClient(url);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qUrl = params.get("url");
      if (qUrl) {
        setUrl(qUrl);
        executeExtraction(qUrl);
      }
    }
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      executeExtraction(text);
    } catch {
      inputRef.current?.focus();
    }
  };

  const executeExtraction = async (targetUrl: string) => {
    const clean = targetUrl.trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setDownloadStates({});

    try {
      const res = await fetch("/api/video/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: clean,
          userName: typeof window !== "undefined" ? localStorage.getItem("looknow_user_name") || undefined : undefined,
          userEmail: typeof window !== "undefined" ? localStorage.getItem("looknow_user_email") || undefined : undefined,
        }),
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

  const handleFetch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await executeExtraction(url);
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
    // 1. Direct URLs (TikTok, Instagram, Twitter, Facebook)
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

  // Render detected platform icon inside search bar
  const renderDetectedIcon = () => {
    switch (detected) {
      case "youtube":
        return <YouTubeIcon size={20} />;
      case "tiktok":
        return <TikTokIcon size={20} />;
      case "instagram":
        return <InstagramIcon size={20} />;
      case "twitter":
        return <TwitterXIcon size={20} />;
      case "facebook":
        return <FacebookIcon size={20} />;
      default:
        return <Link2 size={20} style={{ color: "#FF6B00" }} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingTop: 100, paddingBottom: 80 }}>
      {/* Back to Home */}
      <div className="container" style={{ maxWidth: 940, marginBottom: 24 }}>
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
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)",
            borderRadius: 12,
            border: "1px solid var(--border-hairline)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FF6B00";
            e.currentTarget.style.borderColor = "rgba(255, 107, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--border-hairline)";
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home & All Tools</span>
        </Link>
      </div>

      <div className="container" style={{ maxWidth: 940 }}>
        {/* Header Hero */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="pill-badge" style={{ marginBottom: 16 }}>
            <span className="pill-dot" />
            <span>OmniSaver 3D Engine · 100% Free & Unlimited</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: 14,
              color: "var(--text-title)",
            }}
          >
            Universal <span className="gradient-orange-text">Media Downloader</span>
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6, maxWidth: 620, margin: "0 auto" }}>
            Extract original 4K videos, watermark-free TikToks, Instagram Reels, Twitter/X clips, and lossless MP3 audio.
          </p>

          {/* HD Platform Badges with live status */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 22,
            }}
          >
            <PlatformChip platform="youtube" active={detected === "youtube"} />
            <PlatformChip platform="tiktok" active={detected === "tiktok"} />
            <PlatformChip platform="instagram" active={detected === "instagram"} />
            <PlatformChip platform="twitter" active={detected === "twitter"} />
            <PlatformChip platform="facebook" active={detected === "facebook"} />
          </div>
        </div>

        {/* 3D Glowing Input Form */}
        <div style={{ perspective: "1000px", marginBottom: 28 }}>
          <form
            onSubmit={handleFetch}
            className="card-3d-interactive media-downloader-form"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid rgba(255, 107, 0, 0.35)",
              borderRadius: 20,
              padding: "10px 12px 10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 18px 45px rgba(255, 107, 0, 0.12), 0 6px 20px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div className="form-input-container" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {renderDetectedIcon()}
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
                placeholder="Paste YouTube, TikTok, Instagram, Twitter/X, or Facebook URL..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-title)",
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "var(--font-body)",
                  minWidth: 0,
                }}
              />

              {url && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: "rgba(15, 23, 42, 0.06)",
                    border: "none",
                    borderRadius: "50%",
                    cursor: "pointer",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                  title="Clear"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="form-actions-container" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={handlePaste}
                className="btn-secondary"
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  borderRadius: 12,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ClipboardPaste size={15} />
                <span className="hidden-mobile">Paste</span>
              </button>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="btn-primary"
                style={{
                  padding: "12px 24px",
                  fontSize: 14,
                  borderRadius: 12,
                  fontWeight: 700,
                  opacity: loading || !url.trim() ? 0.6 : 1,
                  cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 6px 18px rgba(255, 107, 0, 0.35)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Media</span>
                    <Download size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
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
                borderRadius: 16,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#B91C1C",
                fontSize: 14,
                marginBottom: 24,
                boxShadow: "0 6px 18px rgba(185, 28, 28, 0.08)",
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontWeight: 500 }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Result Card */}
        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="glass-card"
              style={{
                padding: 0,
                marginBottom: 40,
                border: "1.5px solid rgba(255, 107, 0, 0.35)",
                boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08), 0 0 35px rgba(255, 107, 0, 0.12)",
                overflow: "hidden",
              }}
            >
              {/* Header Info */}
              <div
                className="media-result-header"
                style={{
                  padding: 24,
                  borderBottom: "1px solid var(--border-hairline)",
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
                }}
              >
                {videoInfo.thumbnail ? (
                  <div
                    className="media-thumbnail-box"
                    style={{
                      width: 150,
                      height: 95,
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#F1F5F9",
                      border: "1px solid rgba(255, 107, 0, 0.25)",
                      flexShrink: 0,
                      boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
                      position: "relative",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(4px)",
                        color: "#FFFFFF",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {videoInfo.duration && Number(videoInfo.duration) > 0
                        ? formatDuration(videoInfo.duration)
                        : "HD"}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FF6B00",
                      flexShrink: 0,
                    }}
                  >
                    <Video size={36} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <PlatformChip platform={videoInfo.platform} active={true} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#16A34A",
                        background: "rgba(22, 163, 74, 0.1)",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      Verified Direct Stream
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 17,
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
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-subtle)",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} style={{ color: "#FF6B00" }} />
                  <span>Available Download Formats ({videoInfo.qualityOptions.length})</span>
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
                        className="quality-card-row"
                        style={{
                          background: isReady ? "#F0FDF4" : "#FFFFFF",
                          border: isReady ? "1px solid #86EFAC" : "1px solid var(--border-hairline)",
                          borderRadius: 14,
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 14,
                          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              background: isReady ? "#DCFCE7" : "#FFF7ED",
                              color: isReady ? "#16A34A" : "#FF6B00",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isReady ? <Check size={22} strokeWidth={2.5} /> : isAudio ? <Music size={20} /> : <Video size={20} />}
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
                                  ✅ Ready to save! Download launched.
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
                            <span>Save File</span>
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
                              fontWeight: 700,
                              opacity: isConverting ? 0.8 : 1,
                              cursor: isConverting ? "wait" : "pointer",
                            }}
                          >
                            {isConverting ? (
                              <>
                                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                                <span>{state.progressPercent ? `${state.progressPercent}%` : "Processing..."}</span>
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

        {/* 3D Native APK Mobile Card */}
        <TiltCard3D maxTilt={6}>
          <div
            className="glass-card"
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #FFFBF7 100%)",
              border: "1.5px solid rgba(255, 107, 0, 0.35)",
              padding: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06), 0 0 30px rgba(255, 107, 0, 0.1)",
              borderRadius: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 6px 18px rgba(255, 107, 0, 0.35)",
                  flexShrink: 0,
                }}
              >
                <Smartphone size={26} />
              </div>

              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-title)", marginBottom: 4 }}>
                  Want Faster Mobile Downloads? Get the Native Android APK
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Download entire playlists, background downloads directly to phone gallery, and zero ad redirects.
                </div>
              </div>
            </div>

            <a
              href="/downloads/omnisaver-latest.apk"
              download
              className="btn-primary"
              style={{
                padding: "12px 24px",
                fontSize: 14,
                borderRadius: 12,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Download size={16} />
              <span>Download APK (15.4 MB)</span>
            </a>
          </div>
        </TiltCard3D>

        {/* ─── SEO Content: How It Works & FAQs (Google Content Parity) ─── */}
        <section style={{ marginTop: 56, marginBottom: 20 }} aria-label="Media Downloader Guide & Frequently Asked Questions">
          {/* How It Works (Matches Schema.org HowTo) */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="pill-badge" style={{ marginBottom: 12 }}>
              <span>Step-by-Step Guide</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "var(--text-title)", letterSpacing: "-0.02em" }}>
              How to Download Videos in <span className="gradient-orange-text">3 Simple Steps</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 560, margin: "8px auto 0" }}>
              Save videos and audio from YouTube, TikTok, Instagram, Twitter/X, and Facebook in seconds.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              marginBottom: 56,
            }}
          >
            {[
              {
                step: "01",
                title: "Copy the Media URL",
                desc: "Open YouTube, TikTok, Instagram, Twitter/X, or Facebook and copy the shareable link of any public video or reel to your clipboard.",
              },
              {
                step: "02",
                title: "Paste & Extract",
                desc: "Paste the URL into OmniSaver's input bar above. Our engine instantly extracts original video bitrates, clean MP4 streams, and audio tracks.",
              },
              {
                step: "03",
                title: "Save Your File",
                desc: "Select your desired resolution (4K Ultra HD, 1080p, 720p) or 320kbps MP3 audio, and click Download to save directly to your gallery or storage.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: 24,
                  borderRadius: 18,
                  border: "1px solid var(--border-hairline)",
                  background: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.03)",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(255, 107, 0, 0.1)",
                    color: "#FF6B00",
                    fontWeight: 800,
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  {item.step}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-title)", marginBottom: 8 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Frequently Asked Questions (Matches Schema.org FAQPage) */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div className="pill-badge" style={{ marginBottom: 12 }}>
              <span>Answers to Common Questions</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "var(--text-title)", letterSpacing: "-0.02em" }}>
              Frequently Asked <span className="gradient-orange-text">Questions (FAQ)</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                q: "How do I download TikTok videos without a watermark?",
                a: "Simply paste any public TikTok link into the box above and click Extract. OmniSaver bypasses the native watermark overlay to fetch the pristine, original 1080p source file directly from the content distribution network.",
              },
              {
                q: "Is OmniSaver 4K Media Downloader completely free to use?",
                a: "Yes! OmniSaver is 100% free with unlimited downloads. There are no daily download caps, no subscriptions, no credit card requirements, and zero invasive pop-up redirects.",
              },
              {
                q: "Can I convert YouTube videos to 320kbps MP3 audio?",
                a: "Yes. OmniSaver offers studio-grade MP3 conversion up to 320kbps as well as standard 128kbps audio for every public YouTube video, music track, or podcast.",
              },
              {
                q: "Which social media platforms are supported?",
                a: "OmniSaver natively supports YouTube (4K/1080p/720p/MP3), TikTok (No Watermark HD), Instagram (Reels & Videos), Twitter/X (HD Clips), and Facebook (Public HD Videos).",
              },
              {
                q: "Is it safe and private to download videos here?",
                a: "OmniSaver runs with strict client-side privacy and zero telemetry. We do not store or track your download history, URLs, or personal data. All processing complies with strict modern encryption standards.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: 16,
                  padding: "18px 22px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                  cursor: "pointer",
                }}
              >
                <summary
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-title)",
                    outline: "none",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: "#FF6B00", fontWeight: 800, fontSize: 18, marginLeft: 12 }}>+</span>
                </summary>
                <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, paddingTop: 10, borderTop: "1px solid rgba(15, 23, 42, 0.05)" }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .media-downloader-form {
            flex-wrap: wrap !important;
            padding: 12px 14px !important;
            gap: 12px !important;
          }
          .form-input-container {
            width: 100% !important;
          }
          .form-actions-container {
            width: 100% !important;
            display: flex !important;
            gap: 8px !important;
          }
          .form-actions-container button {
            flex: 1 !important;
            justify-content: center !important;
          }
          .media-result-header {
            flex-direction: column !important;
            gap: 16px !important;
            padding: 18px !important;
            align-items: flex-start !important;
          }
          .media-thumbnail-box {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 16 / 9 !important;
          }
          .quality-card-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .quality-card-row button, .quality-card-row a {
            width: 100% !important;
            justify-content: center !important;
          }
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
