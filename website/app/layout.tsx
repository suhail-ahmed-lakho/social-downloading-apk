import type { Metadata, Viewport } from "next";
import "./globals.css";
import JsonLd from "@/app/components/JsonLd";
import { VisitorTracker } from "@/app/components/VisitorTracker";

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://looknow.cyou"),
  title: {
    default: "OmniSaver Pro — Free 4K Video Downloader & MP3 Converter",
    template: "%s | OmniSaver Pro",
  },
  description:
    "Universal 4K Media Downloader. Save TikTok videos with no watermark, download YouTube 4K/1080p, Instagram Reels, Twitter/X clips, and lossless 320kbps MP3 audio instantly for free.",
  keywords: [
    "video downloader",
    "free video downloader",
    "tiktok video download no watermark",
    "youtube 4k video downloader",
    "download youtube video 1080p",
    "youtube to mp3 320kbps converter",
    "instagram reels downloader online",
    "download instagram video hd",
    "twitter video downloader mp4",
    "save twitter x video clip",
    "facebook video downloader hd online",
    "online media extractor free",
    "omnisaver",
    "looknow",
  ],
  authors: [{ name: "OmniSaver Team", url: "https://looknow.cyou" }],
  creator: "OmniSaver",
  publisher: "LookNow Digital",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://looknow.cyou",
  },
  openGraph: {
    title: "OmniSaver Pro — Universal 4K Media & Lossless MP3 Downloader",
    description:
      "Extract 4K YouTube videos, watermark-free TikToks, Instagram Reels, Twitter/X videos, and 320kbps MP3 audio. 100% free and unlimited.",
    url: "https://looknow.cyou",
    siteName: "OmniSaver Pro",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://looknow.cyou/icon.png",
        width: 1200,
        height: 630,
        alt: "OmniSaver Pro 4K Media Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniSaver Pro — 4K Video & MP3 Downloader",
    description:
      "Save TikTok videos without watermark, YouTube 4K, Instagram Reels, Twitter/X videos, and MP3 audio free.",
    images: [
      "https://looknow.cyou/icon.png",
    ],
    creator: "@OmniSaver",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icon.png",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body>
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}
