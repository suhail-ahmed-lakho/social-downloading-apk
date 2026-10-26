"use client";

import { useEffect, useState, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false, // keep fast 60fps on mobile
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 1. Ambient Floating 3D Starfield / Particle Cloud
    const particleCount = window.innerWidth < 768 ? 90 : 160;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      scales[i] = Math.random() * 0.8 + 0.4;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff7a1a,
      size: 0.16,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // 2. Slow Floating 3D Geometries in Background (ambient depth)
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    // Low-poly floating icosahedra
    const polyGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const polyMat = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });

    const mesh1 = new THREE.Mesh(polyGeo, polyMat);
    mesh1.position.set(-18, 12, -8);
    floatingGroup.add(mesh1);

    const mesh2 = new THREE.Mesh(polyGeo, polyMat);
    mesh2.position.set(16, -14, -12);
    mesh2.scale.setScalar(1.4);
    floatingGroup.add(mesh2);

    const mesh3 = new THREE.Mesh(polyGeo, polyMat);
    mesh3.position.set(14, 16, -10);
    mesh3.scale.setScalar(0.9);
    floatingGroup.add(mesh3);

    // Mouse & Touch Tracking
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointerMove = (clientX: number, clientY: number) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetX = (clientX - halfW) * 0.0008;
      targetY = (clientY - halfH) * 0.0008;
    };

    const handleMouseMove = (e: MouseEvent) => {
      onPointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Scroll parallax in 3D
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Resize
    const handleResize = () => {
      if (!renderer || !camera) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera sway
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      camera.position.x = currentX * 10;
      camera.position.y = -currentY * 8 - (scrollY * 0.006);

      // Rotate particles and meshes
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = elapsed * 0.015;

      mesh1.rotation.x = elapsed * 0.12;
      mesh1.rotation.y = elapsed * 0.16;
      mesh2.rotation.x = -elapsed * 0.08;
      mesh2.rotation.y = elapsed * 0.14;
      mesh3.rotation.z = elapsed * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    />
  );
}
