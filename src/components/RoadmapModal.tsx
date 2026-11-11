"use client";

import React, { useState } from "react";
import {
  Map,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Trophy,
  ArrowRight,
  TrendingUp,
  Globe2,
  Database,
  Cpu,
  Lock,
  Users,
  Target,
  BarChart3,
  Rocket,
  Compass,
} from "lucide-react";
import {
  ROADMAP_PHASES,
  DATABASE_26_MODELS,
  PILOT_TARGET_DISTRIBUTION,
  MONETIZATION_STREAMS,
} from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "roadmap" | "architecture" | "database" | "safety" | "business" | "future";

export const RoadmapModal: React.FC<RoadmapModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("roadmap");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");

  if (!isOpen) return null;

  const domains = ["All", ...Array.from(new Set(DATABASE_26_MODELS.map((m) => m.domain)))];
  const filteredModels = selectedDomain === "All"
    ? DATABASE_26_MODELS
    : DATABASE_26_MODELS.filter((m) => m.domain === selectedDomain);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Map className="w-4 h-4" />
              <span>Official Product Blueprint · Nigeria to Africa</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              NaijaPlay — Full Product Concept & Roadmap
            </h2>
            <p className="text-xs text-slate-400">
              Play. Learn. Compete. Become. · Comprehensive 14-Section Product Specification
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("roadmap");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "roadmap"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>12-Phase Roadmap</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("architecture");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "architecture"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Modular Monolith & Stack</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("database");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "database"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database (26 Models)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("safety");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "safety"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Child Safety & NDPA</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("business");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "business"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Monetization & Pilot Plan</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("future");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "future"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Beyond MVP & Africa</span>
          </button>
        </div>

        {/* ----------------- TAB 1: 12-PHASE ROADMAP ----------------- */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Solo-Developer Execution Timeline: 16–24 Weeks
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Structured 12-phase delivery roadmap with explicit deliverables, acceptance tests, and zero discarded work.
                </p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-emerald-900/80 px-3 py-1 text-xs font-mono font-bold text-emerald-300 border border-emerald-700">
                Phase 1 & 2 Live in Preview
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROADMAP_PHASES.map((p, idx) => (
                <div
                  key={p.phase}
                  className={`rounded-2xl border p-4.5 space-y-2.5 transition-all ${
                    p.status.includes("Completed") || p.status.includes("Implemented")
                      ? "border-emerald-800/70 bg-emerald-950/20"
                      : p.status.includes("Active")
                      ? "border-amber-600/70 bg-amber-950/20 shadow-md shadow-amber-950/30"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {p.phase} · {p.timeline}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        p.status.includes("Completed") || p.status.includes("Implemented")
                          ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                          : p.status.includes("Active")
                          ? "bg-amber-950 text-amber-300 border-amber-700 animate-pulse"
                          : "bg-slate-900 text-slate-400 border-slate-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <h4 className="font-display text-sm font-bold text-white">
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {p.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: MODULAR MONOLITH & TECH STACK ----------------- */}
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Cpu className="w-4 h-4" />
                <span>System Architecture Decision: Modular Monolith</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rather than building microservices that introduce unnecessary operational complexity for a solo engineer, NaijaPlay is built as a highly structured Next.js application layer backed by independently organized business domain modules and shared validation.
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-blue-900/60 bg-blue-950/20 p-4 space-y-2">
                <span className="text-[11px] font-mono text-blue-400 uppercase font-bold block">
                  1. Client Applications
                </span>
                <h4 className="font-display text-sm font-bold text-white">
                  Cross-Device Experience
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>Installable Mobile PWA (Zero app store barrier)</li>
                  <li>Responsive Desktop Web for classrooms</li>
                  <li>Parent & School Portal</li>
                  <li>Admin & Moderation Console</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-2">
                <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold block">
                  2. Next.js Modular Monolith
                </span>
                <h4 className="font-display text-sm font-bold text-white">
                  Application Engines
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>Age-aware Authentication & RBAC/ABAC</li>
                  <li>Phaser.js Browser Game Engine</li>
                  <li>Server-Authoritative Score Verifier</li>
                  <li>Append-Only XP Ledger Engine</li>
                  <li>Curriculum & Quiz Engine</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4 space-y-2">
                <span className="text-[11px] font-mono text-amber-400 uppercase font-bold block">
                  3. Data & Infrastructure
                </span>
                <h4 className="font-display text-sm font-bold text-white">
                  Persistent Storage
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>PostgreSQL Database with Prisma ORM</li>
                  <li>Redis for session caching & rate limits</li>
                  <li>Socket.IO on dedicated Node.js host</li>
                  <li>Sentry error logging & PostHog telemetry</li>
                </ul>
              </div>
            </div>

            {/* Tech Stack Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Layer</th>
                    <th className="p-3">Technology Selected</th>
                    <th className="p-3">Architectural Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="p-3 font-semibold text-white">Frontend</td>
                    <td className="p-3 font-mono text-emerald-400">Next.js 15+ & TypeScript</td>
                    <td className="p-3">App Router, SSR, fast initial loads on low-end 3G/4G devices</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Styling</td>
                    <td className="p-3 font-mono text-emerald-400">Tailwind CSS v4</td>
                    <td className="p-3">Zero runtime CSS, ultra-lean bundles, responsive mobile ergonomics</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Database & ORM</td>
                    <td className="p-3 font-mono text-emerald-400">PostgreSQL + Prisma</td>
                    <td className="p-3">ACID transactions for immutable XP ledger, schema migrations</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Auth & Safety</td>
                    <td className="p-3 font-mono text-emerald-400">Auth.js + Zod</td>
                    <td className="p-3">Strict schema validation, NDPA age-tier authorization rules</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Realtime Server</td>
                    <td className="p-3 font-mono text-emerald-400">Socket.IO (Standalone Node)</td>
                    <td className="p-3">Long-lived WebSocket connections independent of serverless limits</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: 26 DATABASE MODELS ----------------- */}
        {activeTab === "database" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  26-Model Relational Database Architecture
                </h3>
                <p className="text-xs text-slate-400">
                  Filter by domain module to inspect responsibilities and child-safe boundary design.
                </p>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDomain(d)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                      selectedDomain === d
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredModels.map((m) => (
                <div
                  key={m.name}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {m.name}
                    </span>
                    <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                      {m.domain}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    {m.responsibility}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-emerald-400 block font-mono">
                Key Engineering Safeguards:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong className="text-white">Immutable XP Ledger:</strong> User balances are calculated from an audit log of XPTransaction records, preventing arbitrary score manipulation.</li>
                <li><strong className="text-white">Session Score Validation:</strong> Game scores must match the started GameSession duration and token signature before XP is committed.</li>
                <li><strong className="text-white">NDPA Consent Integrity:</strong> Minors under 13 cannot persist public activity without an active GuardianConsent record with a verifiable contact.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: CHILD SAFETY & NDPA ----------------- */}
        {activeTab === "safety" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Nigeria Data Protection Act (NDPA) & NCC Child Online Protection</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                NaijaPlay treats child safety not as an afterthought, but as the foundational architecture. The platform enforces strict activity-first interaction with zero unmoderated communication channels for minors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>No Unrestricted Direct Messaging</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Minors cannot send or receive private 1-on-1 direct messages. Communities are limited to structured, topic-based clubs with adult and teacher moderation queues.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Parent-Configured Screen Time</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Parents can configure usage caps (30 to 240 minutes) directly from the Guardian Portal. When the daily limit is reached, gaming pauses until the next calendar day.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Guardian Consent</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For Junior players (ages 6–12), public leaderboard participation and creative submissions require an explicit parental consent record stored with timestamps and scope.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Globe2 className="w-4 h-4 text-emerald-400" />
                  <span>Low-Data & Offline-Friendly (UNICEF Insight)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To address Nigeria&apos;s urban-rural digital divide documented by UNICEF, assets are compressed, audio is synthesized in-browser, and game states can run offline in the PWA.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 5: BUSINESS & 1,000 USER PILOT ----------------- */}
        {activeTab === "business" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Monetization Without Predatory Dark Patterns
              </h3>
              <p className="text-xs text-slate-400">
                Zero gambling, zero pay-to-win mechanics, and zero cash betting for minors. Revenue is driven by institutional school subscriptions and brand-sponsored educational challenges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MONETIZATION_STREAMS.map((item) => (
                <div
                  key={item.stream}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5"
                >
                  <span className="font-display text-sm font-bold text-emerald-400">
                    {item.stream}
                  </span>
                  <p className="text-xs text-slate-300 leading-snug">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* First 1,000 Users Plan */}
            <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-bold text-white">
                    Initial Pilot Launch Target: First 1,000 Users
                  </h4>
                  <p className="text-xs text-slate-300">
                    Acquisition targets and validation channels in Lagos and Abuja.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400">
                  Target: 1,000 Users
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PILOT_TARGET_DISTRIBUTION.map((p) => (
                  <div
                    key={p.source}
                    className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{p.source}</span>
                      <span className="font-mono font-bold text-emerald-400">{p.target}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {p.strategy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 6: BEYOND MVP & EXPANSION ----------------- */}
        {activeTab === "future" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Long-Term Vision: From Nigeria to Pan-Africa
              </h3>
              <p className="text-xs text-slate-400">
                Phased regional expansion and immersive features after Phase 1–2 validation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Globe2 className="w-4 h-4" />
                  <span>Pan-African Localization</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Rolling out localized content, curricula, and trivia starting with <strong>Ghana</strong>, <strong>Kenya</strong>, and <strong>South Africa</strong>, accompanied by language support for <strong>Swahili, Yoruba, Hausa, Igbo, and French</strong>.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Rocket className="w-4 h-4" />
                  <span>Real-Time Multiplayer Tournaments</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Moving from asynchronous challenges to live head-to-head trivia and speed math duels powered by persistent Socket.IO game lobbies.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Avatar World & Creative Studio</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Customizable African cultural avatars, celebratory dances, school crest flags, and an in-app comic/drawing editor with community voting.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Compass className="w-4 h-4" />
                  <span>Youth Career & Skill Pathways</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For the 18–24 Youth Zone: Verified portfolios, software engineering mentorship, fintech competitions, and partner internship showcases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs font-mono text-slate-400">
            NaijaPlay · Next.js 15+ · TypeScript · Tailwind CSS v4 · PWA Ready
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
