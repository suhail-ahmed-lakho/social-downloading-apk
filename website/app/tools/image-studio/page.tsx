"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Download,
  Sparkles,
  Sliders,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Zap,
} from "lucide-react";

export default function ImageStudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [aspectLocked, setAspectLocked] = useState(true);

  // Conversion options
  const [format, setFormat] = useState<"image/webp" | "image/jpeg" | "image/png">("image/webp");
  const [quality, setQuality] = useState(85);
  const [optimizedBlob, setOptimizedBlob] = useState<Blob | null>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      loadFile(file);
    }
  };

  const loadFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setOriginalWidth(img.naturalWidth);
      setOriginalHeight(img.naturalHeight);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
    };
  };

  // Re-process when format, quality, or dimensions change
  useEffect(() => {
    if (!previewUrl || !targetWidth || !targetHeight) return;

    setProcessing(true);
    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw with high quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setOptimizedBlob(blob);
            if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
            setOptimizedUrl(URL.createObjectURL(blob));
          }
          setProcessing(false);
        },
        format,
        format === "image/png" ? undefined : quality / 100
      );
    };
  }, [previewUrl, targetWidth, targetHeight, format, quality]);

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (aspectLocked && originalWidth > 0) {
      setTargetHeight(Math.round((val / originalWidth) * originalHeight));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (aspectLocked && originalHeight > 0) {
      setTargetWidth(Math.round((val / originalHeight) * originalWidth));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const downloadOptimized = () => {
    if (!optimizedUrl || !selectedFile) return;
    const ext = format === "image/webp" ? "webp" : format === "image/jpeg" ? "jpg" : "png";
    const name = selectedFile.name.replace(/\.[^/.]+$/, "");
    const a = document.createElement("a");
    a.href = optimizedUrl;
    a.download = `${name}-optimized.${ext}`;
    a.click();
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOptimizedBlob(null);
    setOptimizedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingTop: 100, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          {/* Back link */}
          <div style={{ marginBottom: 20 }}>
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
                padding: "8px 14px",
                background: "#FFFFFF",
                borderRadius: 10,
                border: "1px solid var(--border-hairline)",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="pill-badge" style={{ marginBottom: 14 }}>
              <Zap size={14} />
              <span>Client-Side Engine · Zero Uploads</span>
            </div>
            <h1
              style={{
                fontSize: "clamp(30px, 4.5vw, 46px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: 12,
                color: "var(--text-title)",
              }}
            >
              Image Studio & <span className="gradient-orange-text">Format Converter</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
              Convert images to next-gen WebP, compress file sizes by up to 90%, and resize dimensions with 100% browser privacy.
            </p>
          </div>

          {/* Upload Area if no file selected */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="glass-card"
              style={{
                background: "#FFFFFF",
                border: "2px dashed rgba(255, 107, 0, 0.4)",
                borderRadius: 24,
                padding: "60px 24px",
                textAlign: "center",
                cursor: "pointer",
                maxWidth: 680,
                margin: "0 auto",
                boxShadow: "0 12px 36px rgba(255, 107, 0, 0.06)",
                transition: "all 0.25s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "#FFF7ED",
                  color: "#FF6B00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px auto",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.25)",
                }}
              >
                <Upload size={26} strokeWidth={2.2} />
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--text-title)" }}>
                Drag & drop your image here or click to browse
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-subtle)", maxWidth: 420, margin: "0 auto" }}>
                Supports PNG, JPEG, WebP, GIF, and AVIF up to 50MB. All processing happens entirely inside your browser.
              </p>
            </div>
          ) : (
            /* Editing Workspace */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
                gap: 28,
                alignItems: "start",
              }}
            >
              {/* Controls */}
              <div
                className="glass-card"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: 20,
                  padding: 26,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-title)" }}>
                    Optimization Controls
                  </h3>
                  <button
                    onClick={resetAll}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EF4444",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Choose New Image</span>
                  </button>
                </div>

                {/* Format Selector */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 8 }}>
                    Export Format
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { id: "image/webp", label: "WebP (Recommended)", desc: "Smallest" },
                      { id: "image/jpeg", label: "JPEG", desc: "Universal" },
                      { id: "image/png", label: "PNG", desc: "Lossless" },
                    ].map((fmt) => {
                      const active = format === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => setFormat(fmt.id as any)}
                          style={{
                            padding: "10px 8px",
                            borderRadius: 12,
                            border: active ? "1.5px solid #FF6B00" : "1px solid var(--border-hairline)",
                            background: active ? "#FFF7ED" : "#FFFFFF",
                            color: active ? "#FF6B00" : "var(--text-title)",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          <div>{fmt.label}</div>
                          <div style={{ fontSize: 10, color: "var(--text-subtle)", marginTop: 2 }}>{fmt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quality Slider (for WebP & JPEG) */}
                {format !== "image/png" && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-subtle)" }}>
                        Quality Compression
                      </label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#FF6B00" }}>{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#FF6B00", cursor: "pointer" }}
                    />
                  </div>
                )}

                {/* Dimension Resizing */}
                <div style={{ marginBottom: 20, paddingTop: 16, borderTop: "1px solid var(--border-hairline)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-subtle)" }}>
                      Resize Dimensions (Pixels)
                    </label>
                    <button
                      onClick={() => setAspectLocked(!aspectLocked)}
                      style={{
                        background: "none",
                        border: "none",
                        color: aspectLocked ? "#FF6B00" : "var(--text-subtle)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      title="Lock aspect ratio"
                    >
                      {aspectLocked ? <Lock size={13} /> : <Unlock size={13} />}
                      <span>{aspectLocked ? "Aspect Locked" : "Free"}</span>
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-subtle)", display: "block", marginBottom: 4 }}>Width</span>
                      <input
                        type="number"
                        value={targetWidth}
                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-hairline)", fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-subtle)", display: "block", marginBottom: 4 }}>Height</span>
                      <input
                        type="number"
                        value={targetHeight}
                        onChange={(e) => handleHeightChange(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-hairline)", fontSize: 14 }}
                      />
                    </div>
                  </div>
                </div>

                {/* File Savings Comparison Badge */}
                {selectedFile && optimizedBlob && (
                  <div
                    style={{
                      background: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: 14,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Original: {formatBytes(selectedFile.size)}</div>
                      <div style={{ fontSize: 15, color: "#15803D", fontWeight: 800 }}>
                        Optimized: {formatBytes(optimizedBlob.size)}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "#DCFCE7",
                        color: "#16A34A",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {Math.round(((selectedFile.size - optimizedBlob.size) / selectedFile.size) * 100)}% Saved
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={downloadOptimized}
                  disabled={processing || !optimizedUrl}
                  className="btn-primary"
                  style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14 }}
                >
                  <Download size={16} strokeWidth={2.5} />
                  <span>Download Optimized Image</span>
                </button>
              </div>

              {/* Preview Box */}
              <div
                className="glass-card"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: 20,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-subtle)", textTransform: "uppercase", marginBottom: 14, letterSpacing: "0.06em" }}>
                  Live Canvas Preview ({targetWidth} × {targetHeight}px)
                </div>

                <div
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  {optimizedUrl ? (
                    <img
                      src={optimizedUrl}
                      alt="Optimized preview"
                      style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain" }}
                    />
                  ) : (
                    <div style={{ padding: 40, color: "var(--text-subtle)" }}>Rendering image...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
