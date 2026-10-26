"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Wifi,
  Globe,
  FileText,
  Mail,
  Phone,
  Sliders,
  Layers,
} from "lucide-react";
import QRCode from "qrcode";

type QrMode = "url" | "text" | "wifi" | "email" | "phone";

export default function QrGeneratorPage() {
  const [mode, setMode] = useState<QrMode>("url");
  const [urlInput, setUrlInput] = useState("https://looknow.cyou");
  const [textInput, setTextInput] = useState("");
  // Wi-Fi inputs
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiType, setWifiType] = useState<"WPA" | "WEP" | "nopass">("WPA");
  // Email / Phone
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [phoneNum, setPhoneNum] = useState("");

  // Styling options
  const [fgColor, setFgColor] = useState("#0F172A");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [dataUrl, setDataUrl] = useState("");
  const [svgString, setSvgString] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute final QR payload
  const getPayload = (): string => {
    switch (mode) {
      case "url":
        return urlInput.trim() || "https://looknow.cyou";
      case "text":
        return textInput.trim() || "LookNow OmniSaver Suite";
      case "wifi":
        return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};;`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
      case "phone":
        return `tel:${phoneNum}`;
      default:
        return "https://looknow.cyou";
    }
  };

  useEffect(() => {
    const payload = getPayload();
    if (!payload) return;

    // Render to canvas & dataURL
    QRCode.toDataURL(payload, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error("QR canvas error:", err));

    // Render to SVG
    QRCode.toString(payload, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((svg) => setSvgString(svg))
      .catch((err) => console.error("QR svg error:", err));
  }, [mode, urlInput, textInput, wifiSsid, wifiPass, wifiType, emailTo, emailSubject, phoneNum, fgColor, bgColor, errorLevel]);

  const downloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `looknow-qr-${Date.now()}.png`;
    a.click();
  };

  const downloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `looknow-qr-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyImage = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy payload
      await navigator.clipboard.writeText(getPayload());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const COLOR_PALETTES = [
    { name: "Charcoal", hex: "#0F172A" },
    { name: "Signature Orange", hex: "#FF6B00" },
    { name: "Deep Indigo", hex: "#4338CA" },
    { name: "Emerald Green", hex: "#059669" },
    { name: "Crimson", hex: "#DC2626" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", paddingTop: 100, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          {/* Back Link */}
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
              <Sparkles size={14} />
              <span>Vector Studio · Zero Cloud Storage</span>
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
              Vector <span className="gradient-orange-text">QR Code Engine</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 580, margin: "0 auto" }}>
              Generate scalable vector SVG and ultra-high DPI PNG QR codes for Wi-Fi, URLs, and contacts instantly in your browser.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            {[
              { id: "url", label: "Web Link / URL", icon: Globe },
              { id: "text", label: "Plain Text", icon: FileText },
              { id: "wifi", label: "Wi-Fi Network", icon: Wifi },
              { id: "email", label: "Email Message", icon: Mail },
              { id: "phone", label: "Phone / Tel", icon: Phone },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id as QrMode)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: active ? "1.5px solid #FF6B00" : "1px solid var(--border-hairline)",
                    background: active ? "#FFF7ED" : "#FFFFFF",
                    color: active ? "#FF6B00" : "var(--text-main)",
                    boxShadow: active ? "0 2px 8px rgba(255, 107, 0, 0.15)" : "0 1px 3px rgba(15, 23, 42, 0.03)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <TabIcon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Workspace Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
              gap: 28,
              alignItems: "start",
            }}
          >
            {/* Left: Input Form & Color Controls */}
            <div
              className="glass-card"
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border-hairline)",
                borderRadius: 20,
                padding: 26,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "var(--text-title)" }}>
                Content & Settings
              </h3>

              {/* Dynamic Inputs Based on Mode */}
              {mode === "url" && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 8 }}>
                    Destination URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1.5px solid var(--border-hairline)",
                      fontSize: 14,
                      outline: "none",
                      color: "var(--text-title)",
                      background: "#F8FAFC",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hairline)")}
                  />
                </div>
              )}

              {mode === "text" && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 8 }}>
                    Plain Text Content
                  </label>
                  <textarea
                    rows={4}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter any text, instructions, or notes..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1.5px solid var(--border-hairline)",
                      fontSize: 14,
                      outline: "none",
                      color: "var(--text-title)",
                      background: "#F8FAFC",
                      resize: "vertical",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hairline)")}
                  />
                </div>
              )}

              {mode === "wifi" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 6 }}>
                      Wi-Fi Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. Home_Network_5G"
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 12,
                        border: "1.5px solid var(--border-hairline)",
                        fontSize: 14,
                        background: "#F8FAFC",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 6 }}>
                      Wi-Fi Password
                    </label>
                    <input
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder="Password"
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 12,
                        border: "1.5px solid var(--border-hairline)",
                        fontSize: 14,
                        background: "#F8FAFC",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 6 }}>
                      Security Encryption
                    </label>
                    <select
                      value={wifiType}
                      onChange={(e) => setWifiType(e.target.value as "WPA" | "WEP" | "nopass")}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 12,
                        border: "1.5px solid var(--border-hairline)",
                        fontSize: 14,
                        background: "#F8FAFC",
                      }}
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Recommended)</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password (Open)</option>
                    </select>
                  </div>
                </div>
              )}

              {mode === "email" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 6 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="hello@looknow.cyou"
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--border-hairline)", fontSize: 14, background: "#F8FAFC" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 6 }}>
                      Default Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Inquiry / Feedback"
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--border-hairline)", fontSize: 14, background: "#F8FAFC" }}
                    />
                  </div>
                </div>
              )}

              {mode === "phone" && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 8 }}>
                    Phone Number (with Country Code)
                  </label>
                  <input
                    type="tel"
                    value={phoneNum}
                    onChange={(e) => setPhoneNum(e.target.value)}
                    placeholder="+1 555 123 4567"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--border-hairline)", fontSize: 14, background: "#F8FAFC" }}
                  />
                </div>
              )}

              {/* Color Presets */}
              <div style={{ marginBottom: 20, paddingTop: 16, borderTop: "1px solid var(--border-hairline)" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 10 }}>
                  Foreground Color Palette
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {COLOR_PALETTES.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setFgColor(c.hex)}
                      title={c.name}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: c.hex,
                        border: fgColor === c.hex ? "3px solid #FF6B00" : "2px solid #FFFFFF",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                      background: "transparent",
                    }}
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Error Correction Selection */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", marginBottom: 8 }}>
                  Error Correction Level
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { id: "L", label: "Low (7%)" },
                    { id: "M", label: "Med (15%)" },
                    { id: "Q", label: "High (25%)" },
                    { id: "H", label: "Max (30%)" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setErrorLevel(lvl.id as "L" | "M" | "Q" | "H")}
                      style={{
                        padding: "8px 6px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: errorLevel === lvl.id ? "1.5px solid #FF6B00" : "1px solid var(--border-hairline)",
                        background: errorLevel === lvl.id ? "#FFF7ED" : "#FFFFFF",
                        color: errorLevel === lvl.id ? "#FF6B00" : "var(--text-muted)",
                      }}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Preview & One-Click Download */}
            <div
              className="glass-card"
              style={{
                background: "#FFFFFF",
                border: "1.5px solid rgba(255, 107, 0, 0.25)",
                borderRadius: 20,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                boxShadow: "0 18px 45px rgba(255, 107, 0, 0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#FF6B00",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <QrCode size={15} />
                <span>Real-Time Vector Preview</span>
              </div>

              {/* QR Canvas Container with Clean Frame */}
              <div
                style={{
                  background: bgColor,
                  padding: 20,
                  borderRadius: 18,
                  border: "1px solid var(--border-hairline)",
                  boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  maxWidth: 280,
                  width: "100%",
                  aspectRatio: "1/1",
                }}
              >
                {dataUrl ? (
                  <img
                    src={dataUrl}
                    alt="Generated QR Code"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ color: "var(--text-subtle)", fontSize: 13 }}>Generating QR...</div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <button
                  onClick={downloadPng}
                  className="btn-primary"
                  style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14 }}
                >
                  <Download size={16} strokeWidth={2.5} />
                  <span>Download High-DPI PNG</span>
                </button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
                  <button
                    onClick={downloadSvg}
                    className="btn-secondary"
                    style={{ padding: "11px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}
                  >
                    <Layers size={15} />
                    <span>Vector SVG</span>
                  </button>

                  <button
                    onClick={copyImage}
                    className="btn-secondary"
                    style={{ padding: "11px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}
                  >
                    {copied ? <Check size={15} style={{ color: "#16A34A" }} /> : <Copy size={15} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 18 }}>
                SVG is infinitely scalable for print, billboards, business cards, and packaging.
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
