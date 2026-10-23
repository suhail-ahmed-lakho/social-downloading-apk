import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Downloader Online — Free HD | LookNow",
  description:
    "Download videos from YouTube, TikTok, Instagram, Twitter & more for free. HD quality, no watermark, no login required. Also get the OmniSaver Android app.",
  keywords: ["video downloader", "youtube downloader", "tiktok downloader", "instagram downloader", "mp3 extractor", "free", "no watermark"],
  openGraph: {
    title: "Video Downloader Online — Free HD | LookNow",
    description: "Download videos from YouTube, TikTok, Instagram & more. Free, HD, no watermark.",
    type: "website",
    url: "https://looknow.cyou/tools/media-downloader",
  },
};

export default function MediaDownloaderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
