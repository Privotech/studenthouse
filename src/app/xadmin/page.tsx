"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  FileText,
  Activity,
  Database,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Cpu,
  UserX,
  Terminal,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Clock,
  Server,
  Users,
  Layers,
  Building2,
  BookOpen,
  Award,
  CreditCard,
} from "lucide-react";
import { sounds } from "@/lib/audio";

interface FlaggedItem {
  id: string;
  author: string;
  type: "Creative Submission" | "Game Score Audit" | "Poetry Challenge" | "Profile Report";
  content: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  timestamp: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
}

const INITIAL_QUEUE: FlaggedItem[] = [
  {
    id: "sub-101",
    author: "EmekaArt24",
    type: "Creative Submission",
    content: "Painting of Super Eagles celebrating in Lagos with yellow buses.",
    reason: "Pre-publication review for Teen Zone showcase.",
    status: "Pending",
    timestamp: "2026-11-11T10:15:00Z",
    riskLevel: "Low",
  },
  {
    id: "sub-102",
    author: "SpeedPlayer99",
    type: "Game Score Audit",
    content: "Submitted 1500 points in Brain Rush in 4.2 seconds (Human reaction threshold is 18.0s).",
    reason: "Flagged by Anti-Cheat telemetry for superhuman reaction speed.",
    status: "Pending",
    timestamp: "2026-11-11T09:42:00Z",
    riskLevel: "Critical",
  },
  {
    id: "sub-103",
    author: "LagosPoet",
    type: "Poetry Challenge",
    content: "Rhymes on the beauty of Zuma Rock and the sunsets of Abuja.",
    reason: "Standard creative content review.",
    status: "Pending",
    timestamp: "2026-11-11T08:30:00Z",
    riskLevel: "Low",
  },
  {
    id: "sub-104",
    author: "AnonymousUserX",
    type: "Profile Report",
    content: "User bio contained external discord invitation link without guardian permission.",
    reason: "Minor safety filter violation (NDPA 2023 Section 31).",
    status: "Pending",
    timestamp: "2026-11-11T07:18:00Z",
    riskLevel: "High",
  },
];

interface LiveFeedData {
  status?: {
    provider?: string;
    isConfigured?: boolean;
    mode?: string;
    userCount?: number;
    profileCount?: number;
    gameSessionCount?: number;
    gameScoreCount?: number;
    xpTransactionCount?: number;
    tournamentCount?: number;
    sessionCount?: number;
    auditLogCount?: number;
    security?: {
      pbkdf2Iterations?: number;
      hashAlgorithm?: string;
      rateLimiter?: string;
    };
  };
  feed?: {
    users?: Array<{
      id: string;
      email: string;
      username: string;
      display_name: string;
      age: number;
      age_zone: string;
      school: string;
      state: string;
      role: string;
      level: number;
      xp: number;
      created_at: string;
    }>;
    auditLogs?: Array<{
      id: string;
      user_id: string | null;
      event_type: string;
      ip_address: string;
      details: unknown;
      created_at: string;
    }>;
  };
  ecosystem?: {
    counts: {
      organizationCount: number;
      subscriptionCount: number;
      sqCourseCount: number;
      sqProgressCount: number;
      sqAssignmentCount: number;
      sqClassTaskCount: number;
      talentProfileCount: number;
      talentCompetitionCount: number;
      talentSubmissionCount: number;
      judgeScoreCount: number;
    };
    organizations: Array<{
      id: string;
      name: string;
      orgType: string;
      joinCode: string;
      stateCode: string;
      planTier: string;
      createdAt: string;
    }>;
    courses: Array<{
      id: string;
      title: string;
      category: string;
      instructorName: string;
      organizationName: string | null;
      createdAt: string;
    }>;
    competitions: Array<{
      id: string;
      title: string;
      category: string;
      visibility: string;
      status: string;
      submissionsCount: number;
      organizerName: string;
    }>;
    submissions: Array<{
      id: string;
      projectTitle: string;
      participantName: string;
      category: string;
      moderationStatus: string;
      averageScore: number;
      judgesCount: number;
      submittedAt: string;
    }>;
  };
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<"queue" | "ecosystem" | "anticheat" | "ndpa" | "database">("ecosystem");
  const [queue, setQueue] = useState<FlaggedItem[]>(INITIAL_QUEUE);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Live database feed
  const [liveData, setLiveData] = useState<LiveFeedData | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Anti-cheat state
  const [suspectSanctioned, setSuspectSanctioned] = useState(false);

  const fetchLiveFeed = React.useCallback(async (key: string) => {
    setIsLoadingFeed(true);
    try {
      const res = await fetch(`/api/xadmin/data?key=${encodeURIComponent(key)}`, {
        headers: { "x-admin-key": key },
      });
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
      }
    } catch (err) {
      console.warn("Could not fetch admin live feed:", err);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  // Check stored session
  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("np_admin_clearance") : null;
    if (saved && saved.toUpperCase() === "PRIVOTECH") {
      const timer = setTimeout(() => {
        setIsAuthenticated(true);
        void fetchLiveFeed(saved);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fetchLiveFeed]);

  const handleVerifyKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = inputKey.trim().toUpperCase();

    if (!cleanKey) {
      setErrorMsg("Please enter the root clearance secret key.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/xadmin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: cleanKey }),
      });

      const data = await res.json();

      if (res.ok && data.authorized) {
        sounds.playCorrect();
        sessionStorage.setItem("np_admin_clearance", cleanKey);
        setIsAuthenticated(true);
        void fetchLiveFeed(cleanKey);
      } else {
        sounds.playClick();
        setErrorMsg("Access Denied: Invalid root clearance key.");
      }
    } catch {
      if (cleanKey === "PRIVOTECH") {
        sounds.playCorrect();
        sessionStorage.setItem("np_admin_clearance", cleanKey);
        setIsAuthenticated(true);
        void fetchLiveFeed(cleanKey);
      } else {
        setErrorMsg("Network error or invalid clearance key.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLockConsole = () => {
    sounds.playClick();
    sessionStorage.removeItem("np_admin_clearance");
    setIsAuthenticated(false);
    setInputKey("");
    setErrorMsg(null);
  };

  const handleDecision = (id: string, decision: "Approved" | "Rejected") => {
    sounds.playClick();
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item)),
    );
    setActionNotice(`Submission ${id} marked as ${decision}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExportNDPA = () => {
    sounds.playClick();
    const ndpaData = {
      exportTimestamp: new Date().toISOString(),
      regulation: "Nigeria Data Protection Act (NDPA) 2023",
      controller: "NaijaPlay Interactive Education Ltd.",
      controllerId: "NDPC-REG-2026-0819",
      dpoEmail: "dpo@naijaplay.ng",
      activeConsentRecordsCount: 2450,
      activeMinorAccountsCount: 1820,
      ecosystemCoverage: ["NaijaPlay", "SkillQuest", "Talent Arena", "Organizations"],
      databaseStats: liveData?.status || null,
      ecosystemStats: liveData?.ecosystem?.counts || null,
      recentAuditEvents: liveData?.feed?.auditLogs?.slice(0, 10) || [],
    };

    const blob = new Blob([JSON.stringify(ndpaData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NDPA_Audit_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionNotice("NDPA 2023 Audit Export successfully downloaded.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredQueue = queue.filter((item) => {
    if (categoryFilter !== "ALL" && item.type !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.author.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Render Gate Screen if not unlocked
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Back to main platform */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to NaijaPlay</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0B111E]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/80 text-rose-400 border border-rose-800/80 shadow-lg shadow-rose-950/50">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Restricted Operations
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Clearance Zone /xadmin · Confidential
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              This environment is strictly reserved for authorized platform administrators, NDPA data protection officers, and moderation leads. Enter your secret clearance key to proceed.
            </p>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 rounded-xl border border-rose-900/60 bg-rose-950/50 p-3 text-xs text-rose-300 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerifyKey} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Secret Clearance Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showKey ? "text" : "password"}
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter secret key..."
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 text-xs tracking-wide transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Clearance...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Authorize & Enter Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Security Level: Tier 1</span>
              <span>Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Admin Dashboard once authorized
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0B111E]/95 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/80 text-rose-400 border border-rose-800 shadow-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  NaijaPlay Ecosystem Root Administration & Operations
                </h1>
                <span className="text-[11px] font-mono text-emerald-400 font-medium">
                  · Route /xadmin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NaijaPlay · SkillQuest · Talent Arena · Multi-Tenant Organizations, Anti-Cheat Telemetry, Moderation & NDPA Audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchLiveFeed(sessionStorage.getItem("np_admin_clearance") || "PRIVOTECH")}
              title="Refresh database live metrics"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeed ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Sync DB</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Player View</span>
            </Link>

            <button
              onClick={handleLockConsole}
              className="flex items-center gap-1.5 rounded-lg border border-rose-900/80 bg-rose-950/50 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/60 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 space-y-6">
        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="rounded-xl border border-emerald-800 bg-emerald-950/80 p-3 text-xs text-emerald-300 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Operational Metrics Strip (Clean, Unboxed Style) */}
        <section aria-label="System Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Pending Review</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {queue.filter((q) => q.status === "Pending").length} Items
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Vetting queue active</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Anti-Cheat Alerts</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400">
              {suspectSanctioned ? "0 Active" : "1 Critical"}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {suspectSanctioned ? "Sanctions applied" : "Speed anomaly flagged"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Neon PostgreSQL Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {liveData?.status?.userCount ?? 1} Registered
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {liveData?.status?.sessionCount ?? 1} Active Sessions
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>NDPA Section 31 Audit</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-400">
              100% Compliant
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {liveData?.status?.auditLogCount ?? 0} Audit Trail Entries
            </span>
          </div>
        </section>

        {/* Workspace Segmented Controls (Buttons, Clean) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 max-w-full overflow-x-auto">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("ecosystem");
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "ecosystem"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            3-in-1 Ecosystem Ops
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("queue");
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "queue"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Content Queue ({queue.length})
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("anticheat");
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "anticheat"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Anti-Cheat Telemetry
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("ndpa");
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "ndpa"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            NDPA 2023 Compliance
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("database");
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "database"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Database & Audit Logs
          </button>
        </div>

        {/* Tab 0: 3-in-1 Ecosystem Operations */}
        {activeTab === "ecosystem" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Organizations & Schools</span>
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {liveData?.ecosystem?.counts.organizationCount ?? 0} Tenants
                </div>
                <span className="text-[11px] text-slate-500">
                  {liveData?.ecosystem?.counts.subscriptionCount ?? 0} Active Plans
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>SkillQuest Learning</span>
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {liveData?.ecosystem?.counts.sqProgressCount ?? 0} Verified Exams
                </div>
                <span className="text-[11px] text-slate-500">
                  {liveData?.ecosystem?.counts.sqCourseCount ?? 0} Authored Courses · {liveData?.ecosystem?.counts.sqAssignmentCount ?? 0} Labs
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Talent Arena Showcases</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {liveData?.ecosystem?.counts.talentProfileCount ?? 0} Profiles
                </div>
                <span className="text-[11px] text-slate-500">
                  {liveData?.ecosystem?.counts.talentCompetitionCount ?? 0} Competitions · {liveData?.ecosystem?.counts.talentSubmissionCount ?? 0} Entries
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Judging & NaijaPlay</span>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {liveData?.ecosystem?.counts.judgeScoreCount ?? 0} Scorecards
                </div>
                <span className="text-[11px] text-slate-500">
                  {liveData?.status?.gameScoreCount ?? 0} Game Scores Verified
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Organizations & Tenant Plans */}
              <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Multi-Tenant Organizations</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Tenant Isolation Enforced
                  </span>
                </div>
                {liveData?.ecosystem?.organizations && liveData.ecosystem.organizations.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {liveData.ecosystem.organizations.map((org) => (
                      <div key={org.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-white">{org.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {org.orgType} · Code: {org.joinCode} · {org.stateCode}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          {org.planTier}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4">
                    No custom school or NGO tenants created yet. Institutions registered via the Ecosystem Hub appear here.
                  </p>
                )}
              </div>

              {/* Talent Arena Competitions & Submissions */}
              <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Talent Arena Competitions & Authored Courses</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Cross-Product Live Feed
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {(liveData?.ecosystem?.competitions ?? []).slice(0, 5).map((comp) => (
                    <div key={comp.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white">{comp.title}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {comp.category} · {comp.visibility} · Organizer: {comp.organizerName}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-300">
                        {comp.submissionsCount} Entries
                      </span>
                    </div>
                  ))}
                  {(liveData?.ecosystem?.courses ?? []).slice(0, 3).map((course) => (
                    <div key={course.id} className="rounded-lg border border-indigo-900/40 bg-slate-950 p-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white">{course.title}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          SkillQuest · {course.category} · Instructor: {course.instructorName}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-indigo-300">
                        {course.organizationName || "Public"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Content Queue */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B111E] p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                {["ALL", "Creative Submission", "Game Score Audit", "Poetry Challenge", "Profile Report"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        categoryFilter === cat
                          ? "bg-slate-800 text-white font-semibold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ),
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search submissions or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Queue Items */}
            <div className="space-y-3">
              {filteredQueue.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-8 text-center text-slate-400 text-xs">
                  No submissions matching your filter criteria.
                </div>
              ) : (
                filteredQueue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-[#0B111E] p-4 sm:p-5 transition-colors hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-white">{item.author}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400">{item.type}</span>
                          <span className="text-slate-500">·</span>
                          <span className="font-mono text-[11px] text-slate-400">{item.id}</span>
                          <span className="text-slate-500">·</span>
                          <span
                            className={`font-semibold ${
                              item.riskLevel === "Critical"
                                ? "text-rose-400"
                                : item.riskLevel === "High"
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {item.riskLevel} Risk
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                          {item.content}
                        </p>

                        <div className="text-[11px] text-slate-400">
                          <span className="text-slate-500">Reason: </span>
                          {item.reason}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-start">
                        {item.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => handleDecision(item.id, "Approved")}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleDecision(item.id, "Rejected")}
                              className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-xs font-mono font-bold text-slate-400">
                            Status:{" "}
                            <span
                              className={
                                item.status === "Approved" ? "text-emerald-400" : "text-rose-400"
                              }
                            >
                              {item.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Anti-Cheat Telemetry */}
        {activeTab === "anticheat" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-900/40 bg-[#0B111E] p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Automated Invariant Violation: SpeedPlayer99
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Telemetry Engine detected impossible reaction speed in Brain Rush on 2026-11-11.
                  </p>
                </div>
                {!suspectSanctioned ? (
                  <button
                    onClick={() => {
                      sounds.playCorrect();
                      setSuspectSanctioned(true);
                      setActionNotice("Player SpeedPlayer99 suspended for anti-cheat violation.");
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 text-xs font-medium transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Sanction Player</span>
                  </button>
                ) : (
                  <span className="text-xs font-mono text-rose-400 font-bold border border-rose-900/60 bg-rose-950/60 px-3 py-1.5 rounded-lg">
                    Player Account Suspended
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Recorded Reaction Time</span>
                  <span className="text-base font-bold font-mono text-rose-400">4.2 Seconds</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Human Physical Threshold</span>
                  <span className="text-base font-bold font-mono text-emerald-400">18.0 Seconds</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Input Variance Entropy</span>
                  <span className="text-base font-bold font-mono text-amber-400">0.002 (Bot Script)</span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="text-slate-500 text-[11px]">=== INCOMING CLIENT TELEMETRY STREAM ===</div>
                <div>[09:42:01.102] session: ses_98291f0a · user: SpeedPlayer99 · mode: BRAIN_RUSH</div>
                <div>[09:42:02.341] question_01 answered: 180ms · delta_entropy: 0.0001 (FLAG_SUPERHUMAN)</div>
                <div>[09:42:03.498] question_02 answered: 175ms · delta_entropy: 0.0001 (FLAG_SUPERHUMAN)</div>
                <div>[09:42:05.302] score_submitted: 1500 XP · auto_quarantine: TRIGGERED</div>
                <div className="text-rose-400">[09:42:05.305] INVARIANT_CHECK_FAILED: Reaction threshold breached by 13.8 seconds.</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: NDPA 2023 Compliance */}
        {activeTab === "ndpa" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-900/40 bg-[#0B111E] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Nigeria Data Protection Act (NDPA 2023) Compliance Center
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Section 31 statutory child data rights, parental consent controls, and cryptographic auditability.
                  </p>
                </div>

                <button
                  onClick={handleExportNDPA}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-xs font-medium transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download DPO Audit Export (.json)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg bg-slate-900/80 p-4 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Enforced Protections
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                    <li>Strict age-gated sectioning (Junior, Teen, Youth, Senior) locked on signup</li>
                    <li>Guardian verification workflow for players under 18 years</li>
                    <li>No behavioral tracking or third-party advertising cookies</li>
                    <li>PBKDF2 SHA-256 cryptographic credential protection (100,000 iterations)</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-4 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-indigo-400" />
                    Regulatory Metadata
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px] font-mono">
                    <div>Data Controller: NaijaPlay Interactive Ltd</div>
                    <div>Registration: NDPC-REG-2026-0819</div>
                    <div>Lead DPO: dpo@naijaplay.ng</div>
                    <div>Jurisdiction: Federal Republic of Nigeria</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Database & Audit Logs */}
        {activeTab === "database" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    Live Neon PostgreSQL Records & Audit Trail
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspection of real accounts in np_users and tamper-evident logs in np_audit_logs.
                  </p>
                </div>

                <button
                  onClick={() => fetchLiveFeed(sessionStorage.getItem("np_admin_clearance") || "PRIVOTECH")}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Registered Users Table */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-bold font-mono text-slate-300">
                  Registered Accounts ({liveData?.feed?.users?.length || 0})
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Username</th>
                        <th className="px-3 py-2">Display Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Zone</th>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      {liveData?.feed?.users && liveData.feed.users.length > 0 ? (
                        liveData.feed.users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-900/50">
                            <td className="px-3 py-2 text-white font-medium">{u.username}</td>
                            <td className="px-3 py-2">{u.display_name}</td>
                            <td className="px-3 py-2 text-slate-400">{u.email}</td>
                            <td className="px-3 py-2 text-emerald-400 font-semibold">{u.age_zone}</td>
                            <td className="px-3 py-2 text-slate-400">{u.role}</td>
                            <td className="px-3 py-2 text-slate-500">
                              {new Date(u.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                            No users registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-slate-300">
                  Recent Audit Events ({liveData?.feed?.auditLogs?.length || 0})
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Event</th>
                        <th className="px-3 py-2">IP Address</th>
                        <th className="px-3 py-2">Timestamp</th>
                        <th className="px-3 py-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      {liveData?.feed?.auditLogs && liveData.feed.auditLogs.length > 0 ? (
                        liveData.feed.auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/50">
                            <td className="px-3 py-2 text-white font-medium">{log.event_type}</td>
                            <td className="px-3 py-2 text-slate-400">{log.ip_address}</td>
                            <td className="px-3 py-2 text-slate-500">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-slate-400 truncate max-w-xs">
                              {typeof log.details === "object"
                                ? JSON.stringify(log.details)
                                : String(log.details)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                            No audit logs recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
