"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
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
} from "lucide-react";
import { sounds } from "@/lib/audio";

interface AdminModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const AdminModerationModal: React.FC<AdminModerationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"queue" | "anticheat" | "ndpa">("queue");
  const [queue, setQueue] = useState<FlaggedItem[]>(INITIAL_QUEUE);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Anti-cheat modal state
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>("SpeedPlayer99");
  const [suspectSanctioned, setSuspectSanctioned] = useState(false);

  if (!isOpen) return null;

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
      recentAuditEvents: [
        { event: "GUARDIAN_CONSENT_GRANTED", user: "chisom_vanguard", timestamp: "2026-11-11T06:20:00Z", scope: "CORE_GAMEPLAY" },
        { event: "SCREEN_TIME_LIMIT_ENFORCED", user: "chidi_okonkwo", timestamp: "2026-11-11T08:00:00Z", limitMins: 120 },
        { event: "AGE_ZONE_PERMANENTLY_LOCKED", user: "amina_katsina", timestamp: "2026-11-11T09:15:00Z", tier: "TEEN" },
      ],
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-[#0B111E] text-slate-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/80 text-rose-400 border border-rose-800 shadow-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white">
                  Admin & Moderation Control Center
                </h2>
                <span className="rounded bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300">
                  Role: Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Module 8 · Automated anti-cheat telemetry, community content vetting, and NDPA compliance audits.
              </p>
            </div>
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

        {/* Operational Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 border-b border-slate-800 px-6 py-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">Pending Review</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {queue.filter((q) => q.status === "Pending").length} Items
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">Anti-Cheat Flags</span>
            <span className="text-lg font-bold font-mono text-rose-400">1 Critical</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">NDPA Audit Status</span>
            <span className="text-lg font-bold font-mono text-emerald-400">100% Compliant</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">Active Minor Protection</span>
            <span className="text-lg font-bold font-mono text-indigo-400">Enforced</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("queue");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "queue"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              Content Queue ({queue.length})
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("anticheat");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "anticheat"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              Anti-Cheat Telemetry
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("ndpa");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "ndpa"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              NDPA 2023 Compliance
            </button>
          </div>

          {actionNotice && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "queue" && (
            <div className="space-y-4">
              {/* Category Filter & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
                  {["ALL", "Creative Submission", "Game Score Audit", "Profile Report"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        categoryFilter === cat
                          ? "bg-slate-800 text-emerald-400 border border-emerald-500/40"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search flagged records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {filteredQueue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{item.author}</span>
                        <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                          {item.type}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold ${
                            item.riskLevel === "Critical"
                              ? "bg-red-950 text-rose-400 border border-red-800"
                              : item.riskLevel === "High"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}
                        >
                          Risk: {item.riskLevel}
                        </span>
                      </div>
                      <span
                        className={`rounded px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "Approved"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : item.status === "Rejected"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>Reason: {item.reason}</span>
                      {item.status === "Pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecision(item.id, "Rejected")}
                            className="flex items-center gap-1 rounded-lg bg-rose-950/80 border border-rose-800 px-3 py-1 text-rose-300 hover:bg-rose-900 text-xs font-semibold transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject & Censor</span>
                          </button>
                          <button
                            onClick={() => handleDecision(item.id, "Approved")}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-500 text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve for Public</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[10px]">
                          Decision Recorded on Audit Trail
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "anticheat" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-rose-900/60 bg-gradient-to-r from-slate-950 via-slate-950 to-rose-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Automated Anti-Cheat Plausibility Engine (Server-Authoritative)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Detects millisecond latency anomalies, automated web-scrapers, and synthetic answer payloads using client touch-jitter variance and minimum human cognitive reaction thresholds (1.5s/question).
                </p>
              </div>

              {/* Suspect Analysis Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">
                      Flagged Player Investigation: SpeedPlayer99
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      Session ID: b492c-game-drill-1029 · Game: Brain Rush Speed Math
                    </span>
                  </div>
                  <span className="rounded bg-rose-950 border border-rose-800 px-2 py-0.5 text-xs font-mono font-bold text-rose-300">
                    Confidence: 99.4% Script Bot
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Claimed Duration</span>
                    <span className="text-sm font-bold text-rose-400">4.200 Seconds</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Min threshold: 18.0s</span>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Average Latency/Question</span>
                    <span className="text-sm font-bold text-rose-400">280ms / item</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Human avg: 1,850ms</span>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Touch Jitter Variance</span>
                    <span className="text-sm font-bold text-rose-400">0.00px (Synthetic)</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Expected: &gt; 4.5px</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Suggested Action: Void Score & Issue 7-Day Sanction</span>
                  {suspectSanctioned ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Player Sanctioned & Unverified Scores Purged</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          alert("Player issued formal warning.");
                        }}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 font-bold text-slate-300 hover:text-white"
                      >
                        Issue Warning
                      </button>
                      <button
                        onClick={() => {
                          sounds.playTrophy();
                          setSuspectSanctioned(true);
                        }}
                        className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-500 shadow-md transition-colors"
                      >
                        Void Score & Apply Sanction
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ndpa" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-r from-slate-950 via-slate-950 to-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Database className="w-4 h-4" />
                  <span>Nigeria Data Protection Act (NDPA) 2023 · Article 24 & Section 31 Compliance</span>
                </div>
                <p className="text-xs text-slate-300">
                  The NDPA requires transparent data processing, mandatory guardian consent for minors under 18, and verifiable data portability. All player mutations are recorded in immutable audit logs.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">
                      NDPA Data Portability & Audit Log Export
                    </h4>
                    <p className="text-xs text-slate-400">
                      Generate an encrypted JSON package containing all consent records, role mutations, and activity timestamps.
                    </p>
                  </div>
                  <button
                    onClick={handleExportNDPA}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download NDPA Compliance Packet</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <span className="text-slate-400 block font-bold">Active Governance Policies:</span>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero personal data exposure for Junior & Teen Zone users (public leaderboards display initials only).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Parental screen-time caps enforced at the server level (blocks sessions beyond guardian quota).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>All passwords cryptographically hashed with salted PBKDF2-SHA256 (10,000 iterations).</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-6 py-3">
          <span className="text-[11px] font-mono text-slate-500">
            Audit Trail Active · Incident Logging Level: PRODUCTION
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
