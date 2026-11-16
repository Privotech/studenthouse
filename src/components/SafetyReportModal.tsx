"use client";

import React, { useState } from "react";
import { ShieldAlert, Ban, X, CheckCircle2 } from "lucide-react";
import { sounds } from "@/lib/audio";

export interface ReportTarget {
  targetType: "CREATIVE_SUBMISSION" | "LEADERBOARD_PLAYER" | "CLUB_MEMBER" | "GENERAL";
  targetId: string;
  targetLabel: string;
  authorName?: string;
}

interface SafetyReportModalProps {
  target: ReportTarget | null;
  isAuthenticated: boolean;
  onClose: () => void;
  onBlockUser: (targetName: string) => Promise<void>;
  onReportSubmitted: (message: string) => void;
  onRequestAuth: () => void;
}

const REASON_OPTIONS = [
  { value: "INAPPROPRIATE_FOR_AGE", label: "Inappropriate content for my age tier" },
  { value: "PERSONAL_INFORMATION_EXPOSURE", label: "Personal contact / PII exposure" },
  { value: "UNFAIR_PLAY_OR_CHEATING", label: "Unfair play or suspected cheating" },
  { value: "HARASSMENT_OR_BULLYING", label: "Harassment or disrespectful conduct" },
  { value: "SPAM_OR_SCAM", label: "Spam or suspicious external link" },
] as const;

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  target,
  isAuthenticated,
  onClose,
  onBlockUser,
  onReportSubmitted,
  onRequestAuth,
}) => {
  const [reasonCategory, setReasonCategory] = useState<string>("INAPPROPRIATE_FOR_AGE");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onClose();
      onRequestAuth();
      return;
    }

    if (details.trim().length < 5) {
      setError("Please add at least 5 characters describing the concern.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: target.targetType,
          targetId: target.targetId,
          targetLabel: target.targetLabel,
          reasonCategory,
          details: details.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not submit report.");
      }

      if (alsoBlock && target.authorName) {
        await onBlockUser(target.authorName);
      }

      sounds.playCorrect();
      setDone(true);
      onReportSubmitted(`Report filed for ${target.targetLabel}. Moderators notified.`);
      setTimeout(() => {
        setDone(false);
        setDetails("");
        onClose();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950 border border-rose-800/60 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                Trust & Safety Report
              </h3>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-[260px]">
                Target: {target.targetLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Safety Report Received</p>
            <p className="text-xs text-slate-400">
              Our Trust & Safety team will review this entry promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Violation Category
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Details for Moderator Review
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what violated NaijaPlay safety or fair-play guidelines..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {target.authorName && (
              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer">
                <div className="flex items-center gap-2 text-slate-200">
                  <Ban className="w-4 h-4 text-rose-400" />
                  <span>Also block <strong>{target.authorName}</strong> from my view</span>
                </div>
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  className="h-4 w-4 accent-rose-500 rounded"
                />
              </label>
            )}

            {error && (
              <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-2 text-rose-300">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {target.authorName && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      onClose();
                      onRequestAuth();
                      return;
                    }
                    await onBlockUser(target.authorName!);
                    onClose();
                  }}
                  className="mr-auto rounded-xl border border-rose-800/70 bg-rose-950/40 px-3 py-2 font-bold text-rose-300 hover:bg-rose-950 transition-colors"
                >
                  Block Only
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
