"use client";

import { useState, useEffect } from "react";
import { User, Check, X, ShieldCheck, Sparkles, Mail } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (name: string, email: string) => void;
}

export default function UserProfileModal({ isOpen, onClose, onSaved }: UserProfileModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(localStorage.getItem("looknow_user_name") || "");
      setEmail(localStorage.getItem("looknow_user_email") || "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const cleanName = name.trim();
      const cleanEmail = email.trim();

      if (cleanName) {
        localStorage.setItem("looknow_user_name", cleanName);
      } else {
        localStorage.removeItem("looknow_user_name");
      }

      if (cleanEmail) {
        localStorage.setItem("looknow_user_email", cleanEmail);
      } else {
        localStorage.removeItem("looknow_user_email");
      }

      // Sync beacon with backend immediately
      fetch("/api/track/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          name: cleanName || undefined,
          email: cleanEmail || undefined,
        }),
      }).catch(() => {});

      if (onSaved) onSaved(cleanName, cleanEmail);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0E131F",
          border: "1px solid rgba(255, 107, 0, 0.3)",
          borderRadius: 20,
          padding: "28px 24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 107, 0, 0.15)",
          position: "relative",
          color: "#F1F5F9",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255, 255, 255, 0.05)",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94A3B8",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(255, 107, 0, 0.35)",
            }}
          >
            <User size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
              Visitor Profile & Identity
            </h3>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0 0" }}>
              Personalize your download history & sync with system
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>
              Your Name or Google Handle
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Suhail Ahmed"
              autoFocus
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(2, 6, 23, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 6 }}>
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. suhail@example.com"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(2, 6, 23, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(255, 107, 0, 0.08)",
              border: "1px solid rgba(255, 107, 0, 0.2)",
              fontSize: 11,
              color: "#FF8A3D",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>Your IP & identity are securely protected and recognized across downloads.</span>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button
              type="submit"
              disabled={savedSuccess}
              style={{
                flex: 1,
                padding: "12px 18px",
                borderRadius: 10,
                background: savedSuccess ? "#10B981" : "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                border: "none",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(255, 107, 0, 0.35)",
              }}
            >
              {savedSuccess ? (
                <>
                  <Check size={16} />
                  <span>Profile Synced!</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Save & Sync Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
