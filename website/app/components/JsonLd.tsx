// Enterprise JSON-LD Structured Data Schema for Google Search Central Rich Snippets
import React from "react";

export default function JsonLd() {
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "OmniSaver Pro",
    alternateName: ["OmniSaver Media Downloader", "LookNow Video Downloader"],
    url: "https://looknow.cyou",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "All (Web, Android, iOS, Windows, macOS, Linux)",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description:
      "Universal 4K media downloader and lossless MP3 converter. Download TikTok videos without watermarks, YouTube 4K, Instagram Reels, Twitter/X videos, and Facebook clips free.",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "18420",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "YouTube 4K Ultra HD and 1080p 60fps Video Extraction",
      "TikTok Video Download Without Watermark in Original Bitrate",
      "Instagram Reels and Video Posts HD Direct Downloader",
      "Twitter / X HD Video Clip Extractor",
      "Facebook Public HD Video Stream Saver",
      "Lossless 320kbps and 128kbps MP3 Audio Converter",
      "Zero Telemetry and 100% Client-Side Privacy",
      "No Software Installation or Registration Required",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LookNow OmniSaver",
    url: "https://looknow.cyou",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://looknow.cyou/tools/media-downloader?url={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I download TikTok videos without a watermark?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simply copy the TikTok video or reel URL, paste it into the OmniSaver input field, and click Extract Media. OmniSaver strips the watermark and provides a direct 1080p HD MP4 link instantly.",
        },
      },
      {
        "@type": "Question",
        name: "Is OmniSaver 4K Media Downloader completely free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, OmniSaver is 100% free with unlimited downloads. There are no subscriptions, no credit card requirements, and zero pop-up ad redirects.",
        },
      },
      {
        "@type": "Question",
        name: "Can I convert YouTube videos to 320kbps MP3 audio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. OmniSaver provides high-fidelity lossless MP3 extraction up to 320kbps as well as standard 128kbps audio options for every public YouTube video and music track.",
        },
      },
      {
        "@type": "Question",
        name: "Which social media platforms are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OmniSaver natively supports YouTube (4K/1080p/720p/MP3), TikTok (No Watermark HD), Instagram (Reels & Videos), Twitter/X (HD Clips), and Facebook (Public HD Videos).",
        },
      },
      {
        "@type": "Question",
        name: "Is it safe and legal to use OmniSaver?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OmniSaver is completely safe and operates with zero telemetry, meaning your download history is never logged or tracked. You can freely save public videos for offline personal viewing and educational use.",
        },
      },
    ],
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Download Videos from Any Social Platform in 4K",
    description: "Step-by-step guide to extract and save videos from YouTube, TikTok, Instagram, Twitter/X, and Facebook.",
    totalTime: "PT1M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Copy the Video Link",
        text: "Open YouTube, TikTok, Instagram, Twitter/X, or Facebook and copy the shareable video link to your clipboard.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Paste into OmniSaver",
        text: "Navigate to OmniSaver (looknow.cyou), paste the URL into the input bar, and click 'Extract Media'.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Select Format & Download",
        text: "Choose your preferred video quality (4K, 1080p, 720p) or lossless MP3 audio, and click 'Download' to save the file directly to your device.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </>
  );
}
