"use client";

import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Flame,
  GraduationCap,
  Sparkles,
  X,
  ArrowRight,
  BookOpen,
  Lock,
  Flag,
  Send,
  Trophy,
} from "lucide-react";
import { AgeZone, ClubItem, ProfileVisibility } from "@/types/naijaplay";
import { CLUBS } from "@/data/mockData";
import { sounds } from "@/lib/audio";
import type { ReportTarget } from "@/components/SafetyReportModal";

interface ClubsAndCommunityProps {
  ageZone: AgeZone;
  onAwardXP: (amount: number, reason: string) => void;
  blockedUsers?: string[];
  onReportTarget?: (target: ReportTarget) => void;
  profileVisibility?: ProfileVisibility;
  userDisplayName?: string;
}

const PRESET_STUDY_PROMPTS = [
  "Looking for a study partner for timed Naija Trivia rounds.",
  "Completed today's Math Rush drill — cheering on fellow club scholars.",
  "Preparing for this Saturday's National STEM Olympiad qualifier.",
  "Exploring Nigerian constitutional jurisprudence notes together.",
] as const;

const CLUB_PEER_STANDINGS = [
  { id: "peer-1", name: "Adaeze_STEM", school: "Queen's College Lagos", weeklyPoints: 1420 },
  { id: "peer-2", name: "Chidi_Algo", school: "King's College Lagos", weeklyPoints: 1310 },
  { id: "peer-3", name: "Amina_Cipher", school: "Loyola Jesuit Abuja", weeklyPoints: 1185 },
];

interface ClubProblem {
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CATEGORY_PROBLEMS: Record<string, ClubProblem> = {
  "Computer Science": {
    title: "Binary Tree Search Analysis",
    question: "In a worst-case degenerate binary search tree (resembling a linked list) of n nodes, what is the search time complexity?",
    options: ["O(n)", "O(log n)", "O(1)"],
    correctIndex: 0,
    explanation: "A degenerate unbalanced tree requires traversing all n nodes sequentially, giving O(n) search time.",
  },
  "Mathematics": {
    title: "Differential Calculus Optimization",
    question: "What is the critical value of x where f(x) = 2x² - 8x + 5 achieves its stationary point?",
    options: ["x = 2", "x = 4", "x = 1"],
    correctIndex: 0,
    explanation: "The first derivative f'(x) = 4x - 8. Setting 4x - 8 = 0 gives x = 2.",
  },
  "Biotechnology": {
    title: "Cellular Energy Synthesis",
    question: "Which organelle is the primary site of ATP generation via the electron transport chain and oxidative phosphorylation?",
    options: ["Mitochondria", "Endoplasmic Reticulum", "Ribosome"],
    correctIndex: 0,
    explanation: "Mitochondria house the ATP synthase complexes and electron transport enzymes in their inner cristae membranes.",
  },
  "Economics": {
    title: "Real Interest Rate Calculation",
    question: "If a sovereign bond yields a 16% nominal rate while annual CPI inflation is 12%, what is the approximate Fisher real rate?",
    options: ["4.0%", "28.0%", "1.33%"],
    correctIndex: 0,
    explanation: "By the Fisher equation: r ≈ i - π = 16% - 12% = 4%.",
  },
  "Default": {
    title: "Civic Governance & Legal Rights",
    question: "Under the 1999 Constitution of the Federal Republic of Nigeria, which chapter guarantees Fundamental Human Rights?",
    options: ["Chapter IV", "Chapter II", "Chapter VII"],
    correctIndex: 0,
    explanation: "Chapter IV explicitly defines and safeguards fundamental rights including personal liberty and fair hearing.",
  },
};

export const ClubsAndCommunity: React.FC<ClubsAndCommunityProps> = ({
  ageZone,
  onAwardXP,
  blockedUsers = [],
  onReportTarget,
  profileVisibility = "SCHOOL_AND_CLUB_ONLY",
  userDisplayName = "Scholar",
}) => {
  const [clubs, setClubs] = useState<ClubItem[]>(CLUBS);
  const [selectedClub, setSelectedClub] = useState<ClubItem>(CLUBS[0]!);
  const [solvedActivities, setSolvedActivities] = useState<Set<string>>(new Set(["club-1-0"]));
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [postedPrompts, setPostedPrompts] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: "pr-init-1",
      author: "Adaeze_STEM",
      text: PRESET_STUDY_PROMPTS[0],
      time: "Today",
    },
  ]);
  const [activeProblem, setActiveProblem] = useState<{
    activityKey: string;
    activityTitle: string;
    problem: ClubProblem;
  } | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleToggleJoin = (clubId: string) => {
    sounds.playTrophy();
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id === clubId) {
          const willJoin = !c.isJoined;
          if (willJoin) {
            onAwardXP(50, `Joined Academic Society: ${c.name}`);
          }
          const updated = {
            ...c,
            isJoined: willJoin,
            membersCount: willJoin ? c.membersCount + 1 : c.membersCount - 1,
          };
          if (selectedClub.id === clubId) {
            setSelectedClub(updated);
          }
          return updated;
        }
        return c;
      }),
    );
  };

  const handleOpenProblem = (act: string, idx: number) => {
    sounds.playClick();
    const problem =
      CATEGORY_PROBLEMS[selectedClub.category] || CATEGORY_PROBLEMS.Default!;
    setActiveProblem({
      activityKey: `${selectedClub.id}-${idx}`,
      activityTitle: act,
      problem,
    });
    setSelectedOpt(null);
    setSubmitted(false);
  };

  const handleSubmitProblem = () => {
    if (!activeProblem || selectedOpt === null) return;
    const isCorrect = selectedOpt === activeProblem.problem.correctIndex;
    if (isCorrect) {
      sounds.playCorrect();
      setSolvedActivities((prev) => new Set([...prev, activeProblem.activityKey]));
      onAwardXP(40, `Solved Problem: ${activeProblem.activityTitle}`);
    } else {
      sounds.playWrong();
    }
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Users className="w-4 h-4" />
              <span>Module 5 · Academic Societies & Research Circles</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Scholarly Communities & Societies
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Collaborate around computer science, quantitative mathematics, biotechnology, and constitutional law. Structured group sessions with zero unmoderated private DMs.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>NDPA Safe Community Standard Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Clubs Directory (Left Column) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 font-mono">
            Browse Academic Societies ({clubs.length})
          </div>

          <div className="space-y-3">
            {clubs.map((club) => {
              const isSelected = selectedClub.id === club.id;
              return (
                <div
                  key={club.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedClub(club);
                  }}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition-all shadow-md ${
                    isSelected
                      ? "border-emerald-500 bg-slate-900 shadow-emerald-950/40"
                      : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-white">
                          {club.name}
                        </span>
                        {club.isJoined && (
                          <span className="rounded bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                            Enrolled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {club.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                    <span>{club.membersCount.toLocaleString()} Scholars</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {club.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Club Hub & Activities (Right Column) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 shadow-xl">
          <div className="rounded-xl bg-slate-950 p-5 space-y-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
                {selectedClub.category} Society
              </span>
              <span className="font-mono text-xs text-slate-400">
                {selectedClub.membersCount.toLocaleString()} Active Scholars
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-white">
              {selectedClub.name}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedClub.tagline}
            </p>

            <div className="pt-2">
              <button
                onClick={() => handleToggleJoin(selectedClub.id)}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-md ${
                  selectedClub.isJoined
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950"
                }`}
              >
                {selectedClub.isJoined ? "Leave Society" : "Join Society (+50 XP)"}
              </button>
            </div>
          </div>

          {/* Academic Activities */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              Active Society Curriculum & Problem Sets
            </h4>
            <div className="space-y-2.5">
              {selectedClub.activities.map((act, idx) => {
                const activityKey = `${selectedClub.id}-${idx}`;
                const isSolved = solvedActivities.has(activityKey);
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 text-slate-200">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isSolved ? "text-emerald-400" : "text-slate-600"
                        }`}
                      />
                      <span>{act}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="font-mono text-emerald-400 font-bold">
                        +40 XP
                      </span>
                      {isSolved ? (
                        <span className="rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-2.5 py-1 text-[11px] font-mono font-semibold">
                          Solved Today
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenProblem(act, idx)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 text-[11px] transition-colors shadow-sm"
                        >
                          Solve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Friends & Club Competition Standings (Privacy Controlled) */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Club & Friends Weekly Standings
                </h4>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400" />
                Visibility: {profileVisibility.replaceAll("_", " ")}
              </span>
            </div>

            {profileVisibility === "PRIVATE_GUARDIAN_ONLY" ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
                Your profile visibility is set to <strong>Private Guardian Only</strong>. You can view club challenges privately without sharing your name on peer standings.
              </div>
            ) : (
              <div className="space-y-2">
                {CLUB_PEER_STANDINGS.filter((peer) => !blockedUsers.includes(peer.name)).map((peer, idx) => (
                  <div
                    key={peer.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-amber-400">#{idx + 1}</span>
                      <div>
                        <div className="font-semibold text-white">{peer.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{peer.school}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400">
                        {peer.weeklyPoints.toLocaleString()} pts
                      </span>
                      {onReportTarget && (
                        <button
                          type="button"
                          onClick={() =>
                            onReportTarget({
                              targetType: "CLUB_MEMBER",
                              targetId: peer.id,
                              targetLabel: `${peer.name} (${selectedClub.name})`,
                              authorName: peer.name,
                            })
                          }
                          className="rounded-lg border border-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:border-rose-700 hover:text-rose-300"
                        >
                          <Flag className="w-3 h-3 inline mr-1" />
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Minor-Safe Structured Study Exchange (No Free-Text Unrestricted DMs) */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Moderated Study Check-Ins
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {ageZone === "JUNIOR" || ageZone === "TEEN"
                  ? "No Unrestricted DMs · Preset Safe Prompts Only"
                  : "Moderated Academic Board"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedPromptIdx}
                onChange={(e) => setSelectedPromptIdx(Number(e.target.value))}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {PRESET_STUDY_PROMPTS.map((prompt, idx) => (
                  <option key={idx} value={idx}>
                    {prompt}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setPostedPrompts((prev) => [
                    {
                      id: `pr-${Date.now()}`,
                      author: userDisplayName,
                      text: PRESET_STUDY_PROMPTS[selectedPromptIdx]!,
                      time: "Just now",
                    },
                    ...prev.slice(0, 4),
                  ]);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share Study Note</span>
              </button>
            </div>

            <div className="space-y-2">
              {postedPrompts
                .filter((post) => !blockedUsers.includes(post.author))
                .map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="font-bold text-emerald-400">{post.author}</span>
                        <span className="text-slate-500">· {post.time}</span>
                      </div>
                      <p className="text-slate-200 mt-1">{post.text}</p>
                    </div>
                    {onReportTarget && post.author !== userDisplayName && (
                      <button
                        type="button"
                        onClick={() =>
                          onReportTarget({
                            targetType: "CLUB_MEMBER",
                            targetId: post.id,
                            targetLabel: `Study Note by ${post.author}`,
                            authorName: post.author,
                          })
                        }
                        className="shrink-0 text-[10px] font-semibold text-slate-500 hover:text-rose-400"
                      >
                        Report
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Society Problem Solver Modal */}
      {activeProblem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                    {selectedClub.name} Problem Set
                  </span>
                  <h3 className="font-display text-base font-bold text-white">
                    {activeProblem.problem.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveProblem(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {activeProblem.problem.question}
              </p>
            </div>

            <div className="space-y-2">
              {activeProblem.problem.options.map((opt, i) => {
                const isSelected = selectedOpt === i;
                const isCorrect = i === activeProblem.problem.correctIndex;
                let btnStyle = "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700";

                if (submitted) {
                  if (isCorrect) {
                    btnStyle = "border-emerald-500 bg-emerald-950/70 text-emerald-200 font-bold";
                  } else if (isSelected) {
                    btnStyle = "border-rose-500 bg-rose-950/70 text-rose-200";
                  } else {
                    btnStyle = "border-slate-800 bg-slate-950/40 text-slate-500";
                  }
                } else if (isSelected) {
                  btnStyle = "border-emerald-500 bg-slate-800 text-white font-bold ring-1 ring-emerald-500";
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!submitted) {
                        sounds.playClick();
                        setSelectedOpt(i);
                      }
                    }}
                    disabled={submitted}
                    className={`w-full rounded-xl border p-3 text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {submitted && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 text-xs text-slate-300 space-y-1">
                <span className="font-mono font-bold text-emerald-400 block">
                  Academic Deduction:
                </span>
                <p>{activeProblem.problem.explanation}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {!submitted ? (
                <button
                  onClick={handleSubmitProblem}
                  disabled={selectedOpt === null}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-md shadow-emerald-950"
                >
                  Submit Solution (+40 XP)
                </button>
              ) : (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveProblem(null);
                  }}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
                >
                  Complete Activity
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
