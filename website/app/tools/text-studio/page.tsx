"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileCode,
  Copy,
  Check,
  Sparkles,
  Lock,
  Code2,
  Type,
  Link2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type ToolTab = "json" | "case" | "hash" | "base64";

export default function TextStudioPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("json");
  const [inputVal, setInputVal] = useState(`{\n  "tool": "OmniSaver",\n  "status": "live",\n  "version": "1.0.2",\n  "features": ["4K", "MP3", "Zero Watermark"]\n}`);
  const [outputVal, setOutputVal] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Hash states
  const [sha256, setSha256] = useState("");
  const [sha512, setSha512] = useState("");
  const [sha1, setSha1] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // JSON operations
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(inputVal);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutputVal(formatted);
      setStatusMsg({ type: "success", text: "Valid JSON! Formatted with 2-space indentation." });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Syntax Error: ${err.message}` });
    }
  };

  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(inputVal);
      const minified = JSON.stringify(parsed);
      setOutputVal(minified);
      setStatusMsg({ type: "success", text: "JSON minified successfully!" });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Syntax Error: ${err.message}` });
    }
  };

  // Case converter
  const toCamelCase = (str: string) =>
    str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
      +match === 0 ? "" : index === 0 ? match.toLowerCase() : match.toUpperCase()
    );

  const toSnakeCase = (str: string) =>
    str.trim().toLowerCase().replace(/[\s\W-]+/g, "_");

  const toKebabCase = (str: string) =>
    str.trim().toLowerCase().replace(/[\s\W_]+/g, "-");

  const toPascalCase = (str: string) =>
    str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match) => match.toUpperCase()).replace(/\s+/g, "");

  // Hash compute via Web Crypto API
  const computeHashes = async (text: string) => {
    if (!text) {
      setSha256("");
      setSha512("");
      setSha1("");
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // SHA-256
    const hash256Buffer = await crypto.subtle.digest("SHA-256", data);
    setSha256(Array.from(new Uint8Array(hash256Buffer)).map((b) => b.toString(16).padStart(2, "0")).join(""));

    // SHA-512
    const hash512Buffer = await crypto.subtle.digest("SHA-512", data);
    setSha512(Array.from(new Uint8Array(hash512Buffer)).map((b) => b.toString(16).padStart(2, "0")).join(""));

    // SHA-1
    const hash1Buffer = await crypto.subtle.digest("SHA-1", data);
    setSha1(Array.from(new Uint8Array(hash1Buffer)).map((b) => b.toString(16).padStart(2, "0")).join(""));
  };

  // Base64 operations
  const handleBase64Encode = () => {
    try {
      setOutputVal(btoa(unescape(encodeURIComponent(inputVal))));
      setStatusMsg({ type: "success", text: "Encoded to UTF-8 Base64 string." });
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message });
    }
  };

  const handleBase64Decode = () => {
    try {
      setOutputVal(decodeURIComponent(escape(atob(inputVal))));
      setStatusMsg({ type: "success", text: "Decoded from Base64 string." });
    } catch (e: any) {
      setStatusMsg({ type: "error", text: "Invalid Base64 input string." });
    }
  };

  const handleUrlEncode = () => {
    setOutputVal(encodeURIComponent(inputVal));
    setStatusMsg({ type: "success", text: "URL-encoded successfully." });
  };

  const handleUrlDecode = () => {
    try {
      setOutputVal(decodeURIComponent(inputVal));
      setStatusMsg({ type: "success", text: "URL-decoded successfully." });
    } catch (e: any) {
      setStatusMsg({ type: "error", text: "Malformed URL encoding." });
    }
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
              <Code2 size={14} />
              <span>Developer Utilities · 100% Client-Side</span>
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
              Text, JSON & <span className="gradient-orange-text">Crypt Engine</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 620, margin: "0 auto" }}>
              Validate and beautify JSON, convert string cases, generate cryptographic SHA checksums, and encode Base64 without sending data to any server.
            </p>
          </div>

          {/* Tabs */}
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
              { id: "json", label: "JSON Formatter & Validator", icon: Code2 },
              { id: "case", label: "Case Converter", icon: Type },
              { id: "hash", label: "SHA Crypt Hashes", icon: Lock },
              { id: "base64", label: "Base64 & URL", icon: Link2 },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as ToolTab);
                    setStatusMsg(null);
                    if (tab.id === "hash") computeHashes(inputVal);
                  }}
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

          {/* Main Workspace */}
          {activeTab !== "hash" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
                gap: 24,
                alignItems: "start",
              }}
            >
              {/* Input Box */}
              <div
                className="glass-card"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: 20,
                  padding: 24,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-title)" }}>Input Text / Code</label>
                  <button
                    onClick={() => setInputVal("")}
                    style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 12, cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  rows={14}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 12,
                    border: "1.5px solid var(--border-hairline)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    outline: "none",
                    background: "#F8FAFC",
                    color: "var(--text-title)",
                    resize: "vertical",
                  }}
                />

                {/* Tab specific action buttons */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  {activeTab === "json" && (
                    <>
                      <button onClick={handleFormatJson} className="btn-primary" style={{ padding: "10px 18px", fontSize: 13, borderRadius: 10 }}>
                        <span>Beautify (2 Spaces)</span>
                      </button>
                      <button onClick={handleMinifyJson} className="btn-secondary" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>
                        <span>Minify</span>
                      </button>
                    </>
                  )}

                  {activeTab === "case" && (
                    <>
                      <button onClick={() => setOutputVal(toCamelCase(inputVal))} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>
                        camelCase
                      </button>
                      <button onClick={() => setOutputVal(toPascalCase(inputVal))} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>
                        PascalCase
                      </button>
                      <button onClick={() => setOutputVal(toSnakeCase(inputVal))} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>
                        snake_case
                      </button>
                      <button onClick={() => setOutputVal(toKebabCase(inputVal))} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>
                        kebab-case
                      </button>
                      <button onClick={() => setOutputVal(inputVal.toUpperCase())} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>
                        UPPERCASE
                      </button>
                      <button onClick={() => setOutputVal(inputVal.toLowerCase())} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>
                        lowercase
                      </button>
                    </>
                  )}

                  {activeTab === "base64" && (
                    <>
                      <button onClick={handleBase64Encode} className="btn-primary" style={{ padding: "10px 18px", fontSize: 13, borderRadius: 10 }}>
                        <span>Base64 Encode</span>
                      </button>
                      <button onClick={handleBase64Decode} className="btn-secondary" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>
                        <span>Base64 Decode</span>
                      </button>
                      <button onClick={handleUrlEncode} className="btn-secondary" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>
                        <span>URL Encode</span>
                      </button>
                      <button onClick={handleUrlDecode} className="btn-secondary" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>
                        <span>URL Decode</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Output Box */}
              <div
                className="glass-card"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: 20,
                  padding: 24,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-title)" }}>Processed Output</label>
                  {outputVal && (
                    <button
                      onClick={() => copyToClipboard(outputVal)}
                      style={{
                        background: "#FFF7ED",
                        border: "1px solid rgba(255, 107, 0, 0.3)",
                        color: "#FF6B00",
                        padding: "5px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  )}
                </div>

                <textarea
                  readOnly
                  rows={14}
                  value={outputVal}
                  placeholder="Processed output will appear here..."
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 12,
                    border: "1.5px solid var(--border-hairline)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    outline: "none",
                    background: "#F8FAFC",
                    color: "var(--text-title)",
                    resize: "vertical",
                  }}
                />

                {statusMsg && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: statusMsg.type === "success" ? "#F0FDF4" : "#FEF2F2",
                      border: statusMsg.type === "success" ? "1px solid #BBF7D0" : "1px solid #FCA5A5",
                      color: statusMsg.type === "success" ? "#16A34A" : "#DC2626",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {statusMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SHA Hashes Workspace */
            <div
              className="glass-card"
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border-hairline)",
                borderRadius: 20,
                padding: 28,
              }}
            >
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--text-title)", marginBottom: 8 }}>
                Input Text to Hash
              </label>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  computeHashes(e.target.value);
                }}
                placeholder="Enter string to compute SHA-256 and SHA-512 hashes..."
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1.5px solid var(--border-hairline)",
                  fontSize: 15,
                  marginBottom: 28,
                  outline: "none",
                  background: "#F8FAFC",
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { label: "SHA-256 Checksum", value: sha256 },
                  { label: "SHA-512 High-Security Hash", value: sha512 },
                  { label: "SHA-1 Legacy Hash", value: sha1 },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "#F8FAFC", border: "1px solid var(--border-hairline)", borderRadius: 14, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#FF6B00", textTransform: "uppercase" }}>{item.label}</span>
                      <button
                        onClick={() => copyToClipboard(item.value)}
                        disabled={!item.value}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid var(--border-hairline)",
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: item.value ? "pointer" : "default",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, wordBreak: "break-all", color: "var(--text-title)" }}>
                      {item.value || "Enter text above to compute hash..."}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
