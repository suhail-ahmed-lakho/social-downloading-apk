import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ThreeBackground3D from "@/app/components/ThreeBackground3D";

export const metadata: Metadata = {
  title: "Universal 4K Media Downloader — TikTok, YouTube, Instagram, Twitter & Facebook",
  description:
    "Extract 4K YouTube videos, watermark-free TikToks, Instagram Reels, Twitter/X clips, and lossless 320kbps MP3s directly in your browser. Free, fast, and no registration.",
  keywords: [
    "universal media downloader",
    "tiktok downloader no watermark",
    "youtube 4k video download",
    "instagram reel saver",
    "twitter video download mp4",
    "facebook hd video downloader",
    "youtube to mp3 320kbps",
  ],
  alternates: {
    canonical: "https://looknow.cyou/tools/media-downloader",
  },
  openGraph: {
    title: "Universal 4K Media Downloader | OmniSaver Pro",
    description:
      "Download TikTok without watermark, YouTube in 4K/1080p, Instagram Reels, Twitter/X, and Facebook videos free.",
    url: "https://looknow.cyou/tools/media-downloader",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal 4K Media Downloader | OmniSaver Pro",
    description:
      "Download TikTok without watermark, YouTube in 4K, Instagram Reels, Twitter/X, and Facebook videos free.",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThreeBackground3D />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
