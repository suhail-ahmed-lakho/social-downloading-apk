"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;

    const isMobile = window.innerWidth < 768;
    const camera = new THREE.PerspectiveCamera(isMobile ? 44 : 38, width / height, 0.1, 1000);
    camera.position.z = isMobile ? 7.2 : 6.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Main 3D Pivot Group
    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Core: Vibrant Orange Wireframe Polyhedron
    const icosahedronGeometry = new THREE.IcosahedronGeometry(isMobile ? 1.15 : 1.3, 2);
    
    // Wireframe Mesh in Radiant Orange
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const wireframeMesh = new THREE.Mesh(icosahedronGeometry, wireframeMaterial);
    group.add(wireframeMesh);

    // 2. Inner Luminescent Holographic Core
    const innerGeometry = new THREE.IcosahedronGeometry(isMobile ? 0.82 : 0.95, 3);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      roughness: 0.12,
      metalness: 0.88,
      emissive: 0xff6b00,
      emissiveIntensity: 0.5,
      flatShading: true,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);

    // 3. Orbital Kinetic Rings
    const ringGeo1 = new THREE.TorusGeometry(isMobile ? 1.55 : 1.78, 0.016, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xfb923c, // Warm Amber
      transparent: true,
      opacity: 0.65,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(isMobile ? 1.75 : 1.98, 0.012, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff6b00, // Orange
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);

    // 3rd outer gyro ring for deep 3D perspective
    const ringGeo3 = new THREE.TorusGeometry(isMobile ? 1.95 : 2.18, 0.009, 16, 100);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xfdba74,
      transparent: true,
      opacity: 0.35,
    });
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.z = Math.PI / 2.5;
    group.add(ring3);

    // 4. Floating Constellation Nodes
    const particleCount = isMobile ? 120 : 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = (isMobile ? 1.4 : 1.6) + Math.random() * (isMobile ? 1.2 : 1.6);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf97316,
      size: isMobile ? 0.045 : 0.038,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xff6b00, 5.5, 14);
    pointLight1.position.set(3.5, 3.5, 3.5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf59e0b, 3.5, 10);
    pointLight2.position.set(-3, -2.5, 2.5);
    scene.add(pointLight2);

    // Interactive Mouse & Touch Dragging with Momentum
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let isDragging = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 0.7;
      targetY = -(y / rect.height) * 0.7;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        targetX += deltaX * 0.005;
        targetY += -deltaY * 0.005;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
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
      const elapsedTime = clock.getElapsedTime();

      // Smooth inertia follow
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      group.rotation.y = elapsedTime * 0.2 + mouseX;
      group.rotation.x = elapsedTime * 0.12 + mouseY;

      ring1.rotation.z = elapsedTime * 0.24;
      ring2.rotation.z = -elapsedTime * 0.18;
      ring3.rotation.y = elapsedTime * 0.15;
      particles.rotation.y = -elapsedTime * 0.07;

      // Pulse inner glow
      innerMaterial.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 2.8) * 0.18;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "360px",
        maxHeight: "560px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        touchAction: "pan-y",
        cursor: "grab",
      }}
    />
  );
}
