import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NaijaPlay Ecosystem — NaijaPlay, SkillQuest & Talent Arena",
  description:
    "Connected 3-in-1 African youth platform uniting NaijaPlay (games & verified competitions), SkillQuest (structured learning & certificates), and Talent Arena (portfolios & judged showcases) with Neon PostgreSQL & NDPA child safeguarding.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NaijaPlay Ecosystem",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "NaijaPlay Ecosystem — NaijaPlay, SkillQuest & Talent Arena",
    description:
      "One connected platform. Three experiences. Shared progress across gaming, structured learning, and talent discovery.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NaijaPlay Ecosystem — NaijaPlay, SkillQuest & Talent Arena",
    description:
      "One connected platform. Three experiences. Shared progress across gaming, structured learning, and talent discovery.",
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
