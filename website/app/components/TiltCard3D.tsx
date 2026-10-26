"use client";

import React, { useRef, useState, useCallback } from "react";

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
  scale?: number;
  glowColor?: string;
}

export default function TiltCard3D({
  children,
  className = "",
  style = {},
  maxTilt = 12,
  scale = 1.02,
  glowColor = "rgba(255, 107, 0, 0.25)",
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>(
    "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
  );
  const [glarePos, setGlarePos] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      setTransformStyle(
        `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
      );

      // Dynamic Glare
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      setGlarePos({ x: glareX, y: glareY, opacity: 1 });
    },
    [maxTilt, scale]
  );

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMove(e.clientX, e.clientY);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onMouseEnter = () => {
    setIsHovered(true);
  };

  const onMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onMouseEnter}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseLeave}
      className={`card-3d-wrapper ${className}`}
      style={{
        transform: transformStyle,
        transition: isHovered
          ? "transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease",
        transformStyle: "preserve-3d",
        position: "relative",
        borderRadius: "20px",
        willChange: "transform",
        ...style,
      }}
    >
      {/* Dynamic Specular 3D Glare Light */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.28) 0%, ${glowColor} 30%, transparent 70%)`,
          opacity: glarePos.opacity,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          zIndex: 3,
          mixBlendMode: "overlay",
        }}
        aria-hidden="true"
      />

      {/* Card Content with 3D depth */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          transformStyle: "preserve-3d",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
