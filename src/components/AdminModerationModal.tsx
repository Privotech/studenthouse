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
} from "lucide-react";
import { sounds } from "@/lib/audio";

interface AdminModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FlaggedItem {
  id: string;
  author: string;
  type: string;
  content: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

const INITIAL_QUEUE: FlaggedItem[] = [
  {
    id: "sub-101",
    author: "EmekaArt24",
    type: "Creative Submission",
    content: "Painting of Super Eagles celebrating in Lagos with yellow buses.",
    reason: "Pre-publication review for Teen Zone showcase.",
    status: "Pending",
  },
  {
    id: "sub-102",
    author: "SpeedPlayer99",
    type: "Game Score Audit",
    content: "Submitted 1500 points in Brain Rush in 4.2 seconds (Human reaction threshold is 18.0s).",
    reason: "Flagged by Anti-Cheat telemetry for superhuman reaction speed.",
    status: "Pending",
  },
  {
    id: "sub-103",
    author: "LagosPoet",
    type: "Poetry Challenge",
    content: "Rhymes on the beauty of Zuma Rock and the sunsets of Abuja.",
    reason: "Standard creative content review.",
    status: "Pending",
  },
];

export const AdminModerationModal: React.FC<AdminModerationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [queue, setQueue] = useState<FlaggedItem[]>(INITIAL_QUEUE);

  if (!isOpen) return null;

  const handleDecision = (id: string, decision: "Approved" | "Rejected") => {
    sounds.playClick();
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item)),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/80 text-rose-400 border border-rose-800">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Admin & Moderation Control Center
              </h2>
              <p className="text-xs text-slate-400">
                Module 8 · Content approval, anti-cheat detection, and platform safety.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
            <span className="text-[11px] text-slate-400 block">Pending Review</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {queue.filter((q) => q.status === "Pending").length}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
            <span className="text-[11px] text-slate-400 block">Anti-Cheat Flags</span>
            <span className="text-xl font-bold font-mono text-rose-400">1 Active</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
            <span className="text-[11px] text-slate-400 block">Platform Safety</span>
            <span className="text-xl font-bold font-mono text-emerald-400">100% NDPA</span>
          </div>
        </div>

        {/* Review Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Moderation Queue ({queue.length})
          </h3>

          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.author}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                      {item.type}
                    </span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
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

                <p className="text-xs text-slate-200 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                  {item.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Note: {item.reason}</span>
                  {item.status === "Pending" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision(item.id, "Rejected")}
                        className="flex items-center gap-1 rounded-lg bg-rose-950/80 border border-rose-800 px-3 py-1 text-rose-300 hover:bg-rose-900 text-xs font-semibold"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleDecision(item.id, "Approved")}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-500 text-xs font-semibold shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-500 font-mono text-[10px]">Decision Recorded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
