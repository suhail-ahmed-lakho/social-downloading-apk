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
  Pause,
  Zap,
  Share2,
  Trash2,
  Folder,
  HelpCircle,
  CheckCircle2,
  Eye,
  Volume2,
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

export interface DownloadedItem {
  id: string;
  title: string;
  platform: string;
  thumbnail: string;
  downloadUrl: string;
  filename: string;
  format: "mp4" | "mp3";
  quality: string;
  timestamp: number;
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
  const [downloadsHistory, setDownloadsHistory] = useState<DownloadedItem[]>([]);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [showGalleryGuide, setShowGalleryGuide] = useState(false);
  const [lastDownloadedItem, setLastDownloadedItem] = useState<DownloadedItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const detected = detectPlatformClient(url);

  const [apkSize, setApkSize] = useState("70.8 MB");

  useEffect(() => {
    // Load local downloads history
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("looknow_downloaded_media");
        if (stored) {
          setDownloadsHistory(JSON.parse(stored));
        }
      } catch (_) {}
    }

    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        if (data?.fileSize) setApkSize(data.fileSize);
      })
      .catch(() => {});

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

  const triggerBrowserDownload = (downloadUrl: string, filename: string, opt?: QualityOption) => {
    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.assign(downloadUrl);
    }

    const isAudio = opt?.type === "audio" || filename.endsWith(".mp3");
    const newItem: DownloadedItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: videoInfo?.title || filename.replace(/\.[^/.]+$/, ""),
      platform: videoInfo?.platform || detectPlatformClient(url),
      thumbnail: videoInfo?.thumbnail || "",
      downloadUrl,
      filename,
      format: isAudio ? "mp3" : "mp4",
      quality: opt?.quality || opt?.label || (isAudio ? "320kbps MP3" : "HD Video"),
      timestamp: Date.now(),
    };

    setLastDownloadedItem(newItem);
    setDownloadsHistory((prev) => {
      const filtered = prev.filter((p) => p.filename !== newItem.filename);
      const updated = [newItem, ...filtered].slice(0, 15);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("looknow_downloaded_media", JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setDownloadsHistory((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("looknow_downloaded_media", JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });
    if (activePlayingId === id) setActivePlayingId(null);
  };

  const handleClearHistory = () => {
    setDownloadsHistory([]);
    setActivePlayingId(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("looknow_downloaded_media");
      } catch (_) {}
    }
  };

  const handleShareOrSaveToGallery = async (item: DownloadedItem) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: item.title,
          text: `Downloaded with OmniSaver: ${item.title}`,
          url: item.downloadUrl.startsWith("http") ? item.downloadUrl : `${window.location.origin}${item.downloadUrl}`,
        });
      } catch (_) {
        setShowGalleryGuide(true);
      }
    } else {
      setShowGalleryGuide(true);
    }
  };

  const handleDownload = async (opt: QualityOption, index: number) => {
    const rawTitle = videoInfo?.title || "OmniSaver_Video";
    const fileExt = opt.type === "audio" ? "mp3" : "mp4";
    const filename = `${rawTitle}.${fileExt}`;

    // 1. Direct URLs (TikTok, Instagram, Twitter, Facebook) -> Stream through local proxy
    if (opt.directUrl) {
      const proxyUrl = `/api/video/stream?url=${encodeURIComponent(opt.directUrl)}&title=${encodeURIComponent(rawTitle)}&format=${fileExt}`;
      setDownloadStates((prev) => ({
        ...prev,
        [index]: { index, status: "ready", progressText: "Downloading...", downloadUrl: proxyUrl },
      }));
      triggerBrowserDownload(proxyUrl, filename, opt);
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
          progressText: opt.type === "audio" ? "Converting to MP3 (15%)..." : "Processing HD Video (15%)...",
          progressPercent: 15,
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
          const proxyUrl = `/api/video/stream?url=${encodeURIComponent(initData.downloadUrl)}&title=${encodeURIComponent(rawTitle)}&format=${fileExt}`;
          setDownloadStates((prev) => ({
            ...prev,
            [index]: {
              index,
              status: "ready",
              progressText: "Download Ready!",
              downloadUrl: proxyUrl,
            },
          }));
          triggerBrowserDownload(proxyUrl, filename, opt);
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

              const currentPct = pollData.progress || Math.min(92, 20 + poll * 5);
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
            const proxyUrl = `/api/video/stream?url=${encodeURIComponent(downloadReadyUrl)}&title=${encodeURIComponent(rawTitle)}&format=${fileExt}`;
            setDownloadStates((prev) => ({
              ...prev,
              [index]: {
                index,
                status: "ready",
                progressText: "Download Ready!",
                downloadUrl: proxyUrl,
              },
            }));
            triggerBrowserDownload(proxyUrl, filename, opt);
            return;
          }
        }

        // Clean error state instead of redirecting to third-party website
        setDownloadStates((prev) => ({
          ...prev,
          [index]: {
            index,
            status: "error",
            progressText: "Stream Busy · Retry",
          },
        }));
        setError("Converter server is busy right now. Please click Download again.");
      } catch (err: unknown) {
        console.error(err);
        setDownloadStates((prev) => ({
          ...prev,
          [index]: {
            index,
            status: "error",
            progressText: "Failed · Retry",
          },
        }));
        setError("Download connection timed out. Please try again.");
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

                {/* Live Download Success & Player Banner */}
                {lastDownloadedItem && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: 18,
                      background: "#F0FDF4",
                      border: "1.5px solid #86EFAC",
                      borderRadius: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16A34A" }}>
                          <CheckCircle2 size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>
                            Download Launched Successfully!
                          </div>
                          <div style={{ fontSize: 12, color: "#15803D" }}>
                            File saved to your browser&apos;s Downloads folder ({lastDownloadedItem.filename})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => setActivePlayingId(activePlayingId === lastDownloadedItem.id ? null : lastDownloadedItem.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 10,
                            background: "#FFFFFF",
                            border: "1px solid #86EFAC",
                            color: "#166534",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Play size={14} />
                          <span>{activePlayingId === lastDownloadedItem.id ? "Close Player" : "Play in Browser"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareOrSaveToGallery(lastDownloadedItem)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 10,
                            background: "#16A34A",
                            border: "none",
                            color: "#FFFFFF",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
                          }}
                        >
                          <Share2 size={14} />
                          <span>Save / Share</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowGalleryGuide(true)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 10,
                            background: "#DCFCE7",
                            border: "1px solid #86EFAC",
                            color: "#166534",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <HelpCircle size={14} />
                          <span>Phone Gallery Guide</span>
                        </button>
                      </div>
                    </div>

                    {/* In-Browser Player Expandable */}
                    {activePlayingId === lastDownloadedItem.id && (
                      <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #BBF7D0" }}>
                        {lastDownloadedItem.format === "mp3" ? (
                          <audio src={lastDownloadedItem.downloadUrl} controls autoPlay style={{ width: "100%" }} />
                        ) : (
                          <video
                            src={lastDownloadedItem.downloadUrl}
                            controls
                            autoPlay
                            playsInline
                            style={{ width: "100%", maxHeight: 380, borderRadius: 10, background: "#000000" }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Downloaded Media History Section */}
        {downloadsHistory.length > 0 && (
          <div
            className="glass-card"
            style={{
              padding: 28,
              marginBottom: 40,
              border: "1px solid var(--border-hairline)",
              borderRadius: 20,
              background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF7 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FFF7ED", border: "1px solid rgba(255, 107, 0, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6B00" }}>
                  <Folder size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-title)", margin: 0 }}>
                    Downloaded Media ({downloadsHistory.length})
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>
                    Saved files from your recent downloads in this browser
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowGalleryGuide(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 9,
                    background: "#F8FAFC",
                    border: "1px solid var(--border-hairline)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-main)",
                    cursor: "pointer",
                  }}
                >
                  <Smartphone size={14} style={{ color: "#FF6B00" }} />
                  <span>Where is my file in Gallery?</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearHistory}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    borderRadius: 9,
                    background: "transparent",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#EF4444",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                  <span>Clear History</span>
                </button>
              </div>
            </div>

            {/* Quick Gallery Location Banner */}
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                fontSize: 13,
                lineHeight: 1.5,
                color: "#166534",
              }}
            >
              <Smartphone size={18} style={{ color: "#16A34A", flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Where to find your downloaded videos on mobile:</strong>
                <div style={{ marginTop: 4 }}>
                  • <strong>Android:</strong> Open your phone&apos;s <strong>Files</strong> or <strong>Gallery</strong> app ➔ Look in the <strong>&quot;Download&quot;</strong> album.
                  <br />
                  • <strong>iPhone / iPad:</strong> Open <strong>Files</strong> app ➔ <strong>Downloads</strong> ➔ Tap Share ➔ Select <strong>&quot;Save Video&quot;</strong> to copy it directly into your Photos album!
                </div>
              </div>
            </div>

            {/* Items List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {downloadsHistory.map((item) => {
                const isPlaying = activePlayingId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: isPlaying ? "#FFFDF9" : "#FFFFFF",
                      border: isPlaying ? "1px solid rgba(255, 107, 0, 0.4)" : "1px solid var(--border-hairline)",
                      borderRadius: 14,
                      padding: 16,
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 240, flex: 1 }}>
                        {item.thumbnail ? (
                          <div
                            style={{
                              width: 64,
                              height: 48,
                              borderRadius: 8,
                              overflow: "hidden",
                              background: "#000",
                              flexShrink: 0,
                              position: "relative",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 8,
                              background: "#FFF7ED",
                              color: "#FF6B00",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {item.format === "mp3" ? <Music size={20} /> : <Video size={20} />}
                          </div>
                        )}

                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-title)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }}>
                            {item.title}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, background: item.format === "mp3" ? "#FFF7ED" : "#EFF6FF", color: item.format === "mp3" ? "#EA580C" : "#2563EB", padding: "2px 6px", borderRadius: 6 }}>
                              {item.format.toUpperCase()} · {item.quality}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => setActivePlayingId(isPlaying ? null : item.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 9,
                            background: isPlaying ? "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)" : "#F8FAFC",
                            border: isPlaying ? "none" : "1px solid var(--border-hairline)",
                            color: isPlaying ? "#FFFFFF" : "var(--text-main)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                          <span>{isPlaying ? "Pause" : "Play Media"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareOrSaveToGallery(item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "8px 12px",
                            borderRadius: 9,
                            background: "#DCFCE7",
                            border: "1px solid #86EFAC",
                            color: "#166534",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Save to Gallery / Share file"
                        >
                          <Share2 size={13} />
                          <span>Save / Share</span>
                        </button>

                        <a
                          href={item.downloadUrl}
                          download={item.filename}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "8px 12px",
                            borderRadius: 9,
                            background: "#F8FAFC",
                            border: "1px solid var(--border-hairline)",
                            color: "var(--text-main)",
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                          title="Redownload this file"
                        >
                          <Download size={13} />
                          <span>Redownload</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "transparent",
                            border: "none",
                            color: "var(--text-subtle)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          title="Remove from history"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable In-Browser Player for this item */}
                    {isPlaying && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
                        {item.format === "mp3" ? (
                          <audio src={item.downloadUrl} controls autoPlay style={{ width: "100%" }} />
                        ) : (
                          <video
                            src={item.downloadUrl}
                            controls
                            autoPlay
                            playsInline
                            style={{ width: "100%", maxHeight: 380, borderRadius: 10, background: "#000000" }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              <span>Download APK ({apkSize})</span>
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

      {/* Phone Gallery Guide Modal */}
      <AnimatePresence>
          {showGalleryGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(8px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
              onClick={() => setShowGalleryGuide(false)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: 24,
                  maxWidth: 580,
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  padding: 32,
                  boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6B00" }}>
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-title)", margin: 0 }}>
                        Where are my downloaded files?
                      </h3>
                      <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>
                        Phone Gallery & Photos Guide
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowGalleryGuide(false)}
                    style={{ background: "#F1F5F9", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-subtle)" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Steps Container */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Android Guide */}
                  <div style={{ background: "#F8FAFC", border: "1px solid var(--border-hairline)", borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: 6 }}>
                        ANDROID PHONES
                      </span>
                      <strong style={{ fontSize: 14, color: "var(--text-title)" }}>Gallery &amp; Files App</strong>
                    </div>
                    <ol style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                      <li>Browsers (Chrome / Samsung Internet) save files into your phone&apos;s <strong>Downloads</strong> folder.</li>
                      <li>Open your phone&apos;s <strong>Files</strong> (or <em>Files by Google</em>) app ➔ Tap <strong>Downloads</strong>. Your video is right there!</li>
                      <li>In your phone Gallery app: Tap <strong>&quot;Albums&quot;</strong> or <strong>&quot;Collections&quot;</strong> ➔ Scroll to the <strong>&quot;Download&quot;</strong> album to watch it.</li>
                    </ol>
                  </div>

                  {/* iPhone Guide */}
                  <div style={{ background: "#F8FAFC", border: "1px solid var(--border-hairline)", borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, background: "#EFF6FF", color: "#1E40AF", padding: "3px 8px", borderRadius: 6 }}>
                        IPHONE &amp; IPAD
                      </span>
                      <strong style={{ fontSize: 14, color: "var(--text-title)" }}>Move from Files to Photos</strong>
                    </div>
                    <ol style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                      <li>Apple Safari downloads files to the <strong>Files</strong> app (in the <em>Downloads</em> folder).</li>
                      <li>Open your <strong>Files</strong> app ➔ Tap the downloaded video.</li>
                      <li>Tap the <strong>Share</strong> button (bottom-left arrow icon) ➔ Tap <strong>&quot;Save Video&quot;</strong>.</li>
                      <li>It will instantly appear in your iPhone <strong>Photos / Camera Roll</strong>!</li>
                    </ol>
                  </div>

                  {/* Native App Highlight */}
                  <div style={{ background: "#FFF7ED", border: "1px solid rgba(255, 107, 0, 0.3)", borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Sparkles size={16} style={{ color: "#FF6B00" }} />
                      <strong style={{ fontSize: 14, color: "#C2410C" }}>
                        Want 100% Automatic Gallery Sync?
                      </strong>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                      Our native Android APK automatically indexes every video directly into your phone&apos;s main Photos gallery &amp; creates a dedicated OmniSaver album without any manual steps!
                    </p>
                    <a
                      href="/api/download/apk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ padding: "10px 18px", fontSize: 13, display: "inline-flex" }}
                    >
                      <Download size={14} />
                      <span>Download Android APK (v1.0.4)</span>
                    </a>
                  </div>
                </div>

                <div style={{ marginTop: 24, textAlign: "right" }}>
                  <button
                    onClick={() => setShowGalleryGuide(false)}
                    className="btn-secondary"
                    style={{ padding: "10px 22px", fontSize: 13 }}
                  >
                    Got It
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
