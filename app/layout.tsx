import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NaijaPlay — Phase 1 Architecture & Foundation",
  description:
    "Production-grade technical foundation, modular monolith architecture, 26-model Prisma schema, age-aware RBAC/ABAC policy engine, server-authoritative XP ledger, and NDPA child-safety framework for NaijaPlay.",
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
    title: "NaijaPlay — Phase 1 Architecture & Foundation",
    description:
      "Production-grade technical foundation, modular monolith architecture, 26-model Prisma schema, age-aware RBAC/ABAC policy engine, server-authoritative XP ledger, and NDPA child-safety framework for NaijaPlay.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NaijaPlay — Phase 1 Architecture & Foundation",
    description:
      "Production-grade technical foundation, modular monolith architecture, 26-model Prisma schema, age-aware RBAC/ABAC policy engine, server-authoritative XP ledger, and NDPA child-safety framework for NaijaPlay.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body suppressHydrationWarning className="min-h-screen bg-[#0B111E] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
