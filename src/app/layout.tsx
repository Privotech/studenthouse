import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="min-h-screen bg-[#0B111E] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
