"use client";

import React from "react";

interface PlatformIconProps {
  platform: "youtube" | "tiktok" | "instagram" | "twitter" | "facebook" | "pinterest" | "reddit" | string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  showBadge?: boolean;
}

export function YouTubeIcon({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <defs>
        <linearGradient id="yt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF1E1E" />
          <stop offset="100%" stopColor="#CC0000" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#yt-grad)" />
      <path d="M10 8.5L15.5 12L10 15.5V8.5Z" fill="#FFFFFF" />
    </svg>
  );
}

export function TikTokIcon({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <rect width="24" height="24" rx="6" fill="#010101" />
      {/* Cyan shadow */}
      <path
        d="M16.5 7.2C15.4 6.8 14.6 5.8 14.3 4.6H12V15.2C11.9 16.4 10.9 17.3 9.7 17.2C8.6 17.1 7.7 16.1 7.7 15C7.7 13.9 8.6 12.9 9.7 12.8C10.2 12.8 10.6 12.9 11 13.2V10.7C10.6 10.6 10.1 10.5 9.7 10.5C7.2 10.5 5.2 12.5 5.2 15C5.2 17.5 7.2 19.5 9.7 19.5C12.1 19.5 14.1 17.6 14.2 15.2V9.6C15.3 10.4 16.6 10.8 18 10.8V8.5C17.4 8.5 16.9 8 16.5 7.2Z"
        fill="#25F4EE"
        transform="translate(-0.6, -0.6)"
      />
      {/* Red shadow */}
      <path
        d="M16.5 7.2C15.4 6.8 14.6 5.8 14.3 4.6H12V15.2C11.9 16.4 10.9 17.3 9.7 17.2C8.6 17.1 7.7 16.1 7.7 15C7.7 13.9 8.6 12.9 9.7 12.8C10.2 12.8 10.6 12.9 11 13.2V10.7C10.6 10.6 10.1 10.5 9.7 10.5C7.2 10.5 5.2 12.5 5.2 15C5.2 17.5 7.2 19.5 9.7 19.5C12.1 19.5 14.1 17.6 14.2 15.2V9.6C15.3 10.4 16.6 10.8 18 10.8V8.5C17.4 8.5 16.9 8 16.5 7.2Z"
        fill="#FE2C55"
        transform="translate(0.6, 0.6)"
      />
      {/* Main white body */}
      <path
        d="M16.5 7.2C15.4 6.8 14.6 5.8 14.3 4.6H12V15.2C11.9 16.4 10.9 17.3 9.7 17.2C8.6 17.1 7.7 16.1 7.7 15C7.7 13.9 8.6 12.9 9.7 12.8C10.2 12.8 10.6 12.9 11 13.2V10.7C10.6 10.6 10.1 10.5 9.7 10.5C7.2 10.5 5.2 12.5 5.2 15C5.2 17.5 7.2 19.5 9.7 19.5C12.1 19.5 14.1 17.6 14.2 15.2V9.6C15.3 10.4 16.6 10.8 18 10.8V8.5C17.4 8.5 16.9 8 16.5 7.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function InstagramIcon({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <defs>
        <radialGradient id="ig-rad" cx="20%" cy="100%" r="130%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="20%" stopColor="#FF543E" />
          <stop offset="50%" stopColor="#C837AB" />
          <stop offset="100%" stopColor="#4158D0" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-rad)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
      <circle cx="12" cy="12" r="3.2" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
      <circle cx="15.8" cy="8.2" r="0.9" fill="#FFFFFF" />
    </svg>
  );
}

export function TwitterXIcon({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <rect width="24" height="24" rx="6" fill="#0F1419" />
      <path
        d="M14.7 6.5H16.8L12.2 11.8L17.5 18.5H13.2L9.8 14.1L6 18.5H3.9L8.8 12.9L3.8 6.5H8.2L11.3 10.6L14.7 6.5ZM13.9 17.2H15.1L7.4 7.7H6.1L13.9 17.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function FacebookIcon({ size = 24, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <defs>
        <linearGradient id="fb-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1877F2" />
          <stop offset="100%" stopColor="#0D65D9" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#fb-grad)" />
      <path
        d="M13.8 19.5V13.2H15.9L16.2 10.8H13.8V9.3C13.8 8.6 14 8.1 15.1 8.1H16.4V6C16.2 5.9 15.4 5.8 14.5 5.8C12.5 5.8 11.2 7 11.2 9.1V10.8H9.2V13.2H11.2V19.5H13.8Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function PlatformChip({
  platform,
  size = 28,
  active = false,
  onClick,
}: {
  platform: "youtube" | "tiktok" | "instagram" | "twitter" | "facebook" | string;
  size?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const renderIcon = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <YouTubeIcon size={size} />;
      case "tiktok":
        return <TikTokIcon size={size} />;
      case "instagram":
        return <InstagramIcon size={size} />;
      case "twitter":
      case "x":
        return <TwitterXIcon size={size} />;
      case "facebook":
        return <FacebookIcon size={size} />;
      default:
        return <YouTubeIcon size={size} />;
    }
  };

  const getLabel = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return "YouTube";
      case "tiktok":
        return "TikTok";
      case "instagram":
        return "Instagram";
      case "twitter":
      case "x":
        return "Twitter / X";
      case "facebook":
        return "Facebook";
      default:
        return platform;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 12,
        background: active ? "#FFF7ED" : "#FFFFFF",
        border: active ? "1px solid #FF6B00" : "1px solid var(--border-hairline)",
        boxShadow: active
          ? "0 4px 16px rgba(255, 107, 0, 0.22), 0 0 20px rgba(255, 107, 0, 0.12)"
          : "0 2px 6px rgba(15, 23, 42, 0.04)",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: active ? "translateY(-1px) scale(1.02)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>
        {renderIcon()}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: active ? "#FF6B00" : "var(--text-title)",
          fontFamily: "var(--font-heading)",
        }}
      >
        {getLabel()}
      </span>
    </button>
  );
}
