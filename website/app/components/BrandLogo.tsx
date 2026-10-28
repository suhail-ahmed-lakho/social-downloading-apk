import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Unified Official Brand Logo for LookNow & OmniSaver
 * Perfectly matches the browser tab favicon and application icon.
 */
export default function BrandLogo({ size = 36, className, style }: BrandLogoProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28), // Consistent squircle
        background: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(255, 107, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <svg
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Modern Crisp Downward Arrow & Infinite Media Wave */}
        <path
          d="M12 3V14M12 14L7.5 9.5M12 14L16.5 9.5"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 17C4.5 18.933 6.067 20.5 8 20.5H16C17.933 20.5 19.5 18.933 19.5 17"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
