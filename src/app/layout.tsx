import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NaijaPlay — African Youth Learning, Games & Competition Ecosystem",
  description:
    "Activity-first African youth learning and entertainment ecosystem with Neon PostgreSQL authentication, age-calibrated learning modules, Photoshop-style creative studio, and interscholastic Olympiad competitions.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NaijaPlay",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "NaijaPlay — African Youth Learning, Games & Competition Ecosystem",
    description:
      "Activity-first African youth learning and entertainment ecosystem with Neon PostgreSQL authentication, age-calibrated learning modules, Photoshop-style creative studio, and interscholastic Olympiad competitions.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NaijaPlay — African Youth Learning, Games & Competition Ecosystem",
    description:
      "Activity-first African youth learning and entertainment ecosystem with Neon PostgreSQL authentication, age-calibrated learning modules, Photoshop-style creative studio, and interscholastic Olympiad competitions.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="min-h-screen bg-[#0B111E] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
