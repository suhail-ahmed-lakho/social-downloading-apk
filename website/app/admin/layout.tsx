import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Command Center — LookNow",
  description: "Enterprise administrative dashboard, live traffic telemetry, and API engine watchdog.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080B10",
        color: "#F1F5F9",
        fontFamily: "var(--font-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
