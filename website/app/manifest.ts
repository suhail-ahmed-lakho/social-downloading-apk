import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OmniSaver Pro — 4K Media & Audio Downloader",
    short_name: "OmniSaver",
    description: "Download 4K YouTube videos, watermark-free TikToks, Instagram Reels, Twitter/X clips, and 320kbps MP3s.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0D14",
    theme_color: "#FF6B00",
    icons: [
      {
        src: "https://raw.githubusercontent.com/suhail-ahmed-lakho/social-downloading-apk/master/assets/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
