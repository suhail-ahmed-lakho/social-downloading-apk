import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LookNow — Tools for Everyone",
  description: "Free tools, APKs, and utilities built for everyone. Download OmniSaver and more amazing tools from LookNow.",
  keywords: ["tools", "apk", "downloader", "omnisaver", "video downloader", "free tools"],
  authors: [{ name: "LookNow" }],
  openGraph: {
    title: "LookNow — Tools for Everyone",
    description: "Free tools, APKs, and utilities. Download OmniSaver & more.",
    type: "website",
    url: "https://looknow.cyou",
  },
  twitter: {
    card: "summary_large_image",
    title: "LookNow — Tools for Everyone",
    description: "Free tools, APKs, and utilities. Download OmniSaver & more.",
  },
  icons: {
    icon: "https://raw.githubusercontent.com/suhail-ahmed-lakho/social-downloading-apk/master/assets/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
