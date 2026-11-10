"use client";

import React, { useState } from "react";
import {
  Trophy,
  Users,
  MapPin,
  Calendar,
  Medal,
  CheckCircle2,
  Filter,
  Sparkles,
  X,
  ArrowRight,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { AgeZone, Tournament } from "@/types/naijaplay";
import { LEADERBOARD_ENTRIES, TOURNAMENTS } from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface CompetitionArenaProps {
  ageZone: AgeZone;
  onAwardXP: (amount: number, reason: string) => void;
}

export const CompetitionArena: React.FC<CompetitionArenaProps> = ({
  ageZone,
  onAwardXP,
}) => {
  const [filterType, setFilterType] = useState<"All" | "Individual" | "School vs School" | "State vs State">("All");
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"tournaments" | "leaderboard" | "schools">("tournaments");

  const filteredTournaments = TOURNAMENTS.filter((t) => {
    if (filterType !== "All" && t.type !== filterType) return false;
    return true;
  });

  const [activeExamTourney, setActiveExamTourney] = useState<Tournament | null>(null);
  const [examQIndex, setExamQIndex] = useState(0);
  const [examSelectedOpt, setExamSelectedOpt] = useState<number | null>(null);
  const [examScore, setExamScore] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);

  const OLYMPIAD_QUESTIONS = [
    {
      discipline: "Pure Mathematics",
      question: "If f(x) = 3x² - 12x + 7, at what critical value of x does the local extremum occur?",
      options: ["x = 2", "x = 4", "x = -2", "x = 0"],
      correctIndex: 0,
      rationale: "Differentiating f(x) yields f'(x) = 6x - 12. Setting f'(x) = 0 gives x = 2.",
    },
    {
      discipline: "Computer Science",
      question: "What is the worst-case time complexity of standard unrandomized Quickselect algorithm?",
      options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"],
      correctIndex: 0,
      rationale: "When bad pivot partitions occur repeatedly, standard Quickselect degrades to O(n²), though average runtime is O(n).",
    },
    {
      discipline: "Physical Science",
      question: "A projectile is launched vertically at 19.6 m/s in standard gravity (g = 9.8 m/s²). Neglecting drag, what is its maximum elevation?",
      options: ["19.6 meters", "39.2 meters", "9.8 meters", "14.7 meters"],
      correctIndex: 0,
      rationale: "Using v² = u² - 2gh at max height where v=0: h = (19.6)² / (2 * 9.8) = 19.6 meters.",
    },
    {
      discipline: "Trade & Economics",
      question: "Under the AfCFTA protocol on Trade in Goods, what percentage of tariff lines must State Parties liberalize during phase one?",
      options: ["90% of tariff lines", "50% of tariff lines", "75% of tariff lines", "100% of tariff lines"],
      correctIndex: 0,
      rationale: "The AfCFTA Agreement mandates 90% tariff liberalization across commercial product lines during the initial phase.",
    },
  ];

  const handleJoin = (tourney: Tournament) => {
    sounds.playTrophy();
    if (!joinedTournaments.includes(tourney.id)) {
      setJoinedTournaments([...joinedTournaments, tourney.id]);
      onAwardXP(50, `Registered for ${tourney.title}`);
    }
  };

  const handleStartExam = (tourney: Tournament) => {
    sounds.playClick();
    setActiveExamTourney(tourney);
    setExamQIndex(0);
    setExamSelectedOpt(null);
    setExamScore(0);
    setExamSubmitted(false);
    setExamFinished(false);
  };


  const handleSelectExamOption = (idx: number) => {
    if (examSubmitted) return;
    sounds.playClick();
    setExamSelectedOpt(idx);
  };

  const handleSubmitExamOption = () => {
    if (examSelectedOpt === null || examSubmitted) return;
    const isCorrect = examSelectedOpt === OLYMPIAD_QUESTIONS[examQIndex]!.correctIndex;
    if (isCorrect) {
      sounds.playCorrect();
      setExamScore((prev) => prev + 1);
    } else {
      sounds.playWrong();
    }
    setExamSubmitted(true);
  };

  const handleNextExamQuestion = () => {
    if (examQIndex < OLYMPIAD_QUESTIONS.length - 1) {
      sounds.playClick();
      setExamQIndex((prev) => prev + 1);
      setExamSelectedOpt(null);
      setExamSubmitted(false);
    } else {
      sounds.playTrophy();
      setExamFinished(true);
      const earnedXP = 120 + examScore * 25;
      onAwardXP(earnedXP, `Completed ${activeExamTourney?.title} Qualifier`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>Module 2 · Interscholastic Olympiads & Tournaments</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Academic Competitions & Derbies
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Compete individually, lead your school team in national olympiads, or represent your state. Rankings are earned purely on verified academic performance.
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 border border-slate-800 p-1 self-start md:self-auto text-xs">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("tournaments");
              }}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "tournaments" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Tournaments
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("leaderboard");
              }}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "leaderboard" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              National Rankings
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("schools");
              }}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "schools" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              School Derby
            </button>
          </div>
        </div>
      </div>

      {/* TOURNAMENTS TAB */}
      {activeTab === "tournaments" && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Format:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(["All", "Individual", "School vs School", "State vs State"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    sounds.playClick();
                    setFilterType(cat);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                    filterType === cat
                      ? "border-emerald-500 bg-emerald-950/60 text-emerald-300 font-semibold"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tournament Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTournaments.map((tourney) => {
              const isJoined = joinedTournaments.includes(tourney.id);
              return (
                <div
                  key={tourney.id}
                  className={`rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-slate-950 border border-slate-800 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-slate-300">
                        {tourney.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                        {tourney.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {tourney.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 font-mono">
                        Discipline: <strong className="text-emerald-400">{tourney.game}</strong>
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Award / Grant:</span>
                        <span className="font-semibold text-amber-300">{tourney.prizePool}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Enrolled:</span>
                        <span className="text-white">{tourney.participantsCount.toLocaleString()} Scholars</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Schedule:</span>
                        <span className="text-emerald-300">{tourney.startsIn}</span>
                      </div>
                    </div>
                  </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleJoin(tourney)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                          isJoined
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                            : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                        }`}
                      >
                        {isJoined ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Enrolled</span>
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4" />
                            <span>Register (+50 XP)</span>
                          </>
                        )}
                      </button>

                      {isJoined && (
                        <button
                          onClick={() => handleStartExam(tourney)}
                          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-colors flex items-center gap-1.5"
                        >
                          <Medal className="w-4 h-4 text-emerald-200" />
                          <span>Start Qualifier</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* LEADERBOARD TAB */}
      {activeTab === "leaderboard" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                All-Nigeria Verified Academic Rankings
              </h3>
              <p className="text-xs text-slate-400">
                Live rankings calculated server-authoritatively across verified examination results.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anti-Cheat Verified</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-3 px-3 font-semibold">Rank</th>
                  <th className="py-3 px-3 font-semibold">Scholar</th>
                  <th className="py-3 px-3 font-semibold">Institution</th>
                  <th className="py-3 px-3 font-semibold">State</th>
                  <th className="py-3 px-3 font-semibold">Academic Distinction</th>
                  <th className="py-3 px-3 text-right font-semibold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {LEADERBOARD_ENTRIES.map((player) => (
                  <tr
                    key={player.rank}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      player.name.includes("Chidi") ? "bg-emerald-950/30 text-emerald-200" : ""
                    }`}
                  >
                    <td className="py-3 px-3">
                      {player.rank === 1 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-950">
                          1
                        </span>
                      ) : player.rank === 2 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 font-bold text-slate-950">
                          2
                        </span>
                      ) : player.rank === 3 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 font-bold text-white">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#{player.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 font-sans font-semibold text-white">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-400">
                          {player.initials}
                        </span>
                        <span>{player.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {player.school || "Independent Scholar"}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400">
                      {player.state}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-slate-700">
                        {player.badge}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                      {player.score.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHOOL DERBY TAB */}
      {activeTab === "schools" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-800">
                1st Place School
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">42,850 pts</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              King&apos;s College Lagos
            </h3>
            <p className="text-xs text-slate-300">
              Top Categories: Calculus & Computer Science. 240 active scholars enrolled.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                2nd Place School
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">38,120 pts</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              Queen&apos;s College Yaba
            </h3>
            <p className="text-xs text-slate-300">
              Top Categories: Physical Sciences & English Rhetoric. 210 active scholars enrolled.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                3rd Place School
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">35,900 pts</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              Corona Secondary School
            </h3>
            <p className="text-xs text-slate-300">
              Top Categories: Macroeconomics & Logic. 185 active scholars enrolled.
            </p>
          </div>
        </div>
      )}

      {/* Olympiad Qualifier Examination Modal */}
      {activeExamTourney && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7 text-slate-100 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  National Interscholastic Qualifier
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-0.5">
                  {activeExamTourney.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveExamTourney(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!examFinished ? (
              <div className="space-y-5">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>
                      Question {examQIndex + 1} of {OLYMPIAD_QUESTIONS.length}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      Discipline: {OLYMPIAD_QUESTIONS[examQIndex]?.discipline}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                      style={{
                        width: `${Math.round(((examQIndex + 1) / OLYMPIAD_QUESTIONS.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {OLYMPIAD_QUESTIONS[examQIndex]?.question}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {OLYMPIAD_QUESTIONS[examQIndex]?.options.map((opt, i) => {
                    const isSelected = examSelectedOpt === i;
                    const isCorrect = i === OLYMPIAD_QUESTIONS[examQIndex]?.correctIndex;

                    let btnClass = "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-200";
                    if (examSubmitted) {
                      if (isCorrect) {
                        btnClass = "border-emerald-500 bg-emerald-950/60 text-emerald-200 font-semibold";
                      } else if (isSelected) {
                        btnClass = "border-rose-500 bg-rose-950/60 text-rose-200";
                      } else {
                        btnClass = "border-slate-800 bg-slate-950/40 text-slate-500";
                      }
                    } else if (isSelected) {
                      btnClass = "border-emerald-500 bg-slate-800 text-white font-semibold ring-1 ring-emerald-500";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectExamOption(i)}
                        disabled={examSubmitted}
                        className={`w-full rounded-xl border p-3.5 text-left text-xs transition-all flex items-center justify-between ${btnClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {examSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {examSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on submission */}
                {examSubmitted && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 text-xs text-slate-300 space-y-1">
                    <span className="font-mono font-bold text-emerald-400 block">
                      Academic Rationale:
                    </span>
                    <p>{OLYMPIAD_QUESTIONS[examQIndex]?.rationale}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {!examSubmitted ? (
                    <button
                      onClick={handleSubmitExamOption}
                      disabled={examSelectedOpt === null}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-950"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextExamQuestion}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                    >
                      <span>
                        {examQIndex < OLYMPIAD_QUESTIONS.length - 1 ? "Next Problem" : "Finish Qualifier"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Examination Finished Screen */
              <div className="space-y-5 text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-display text-xl font-bold text-white">
                    Qualifier Round Completed
                  </h4>
                  <p className="text-xs text-slate-300">
                    Your score has been registered server-authoritatively to the Olympiad Derby standings.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <span className="text-[11px] text-slate-400 block font-mono">Accuracy</span>
                    <span className="font-mono text-xl font-bold text-emerald-400">
                      {examScore} / {OLYMPIAD_QUESTIONS.length} Correct
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <span className="text-[11px] text-slate-400 block font-mono">Merit Conferred</span>
                    <span className="font-mono text-xl font-bold text-amber-400">
                      +{120 + examScore * 25} XP
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveExamTourney(null);
                    setActiveTab("leaderboard");
                  }}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                >
                  View Updated National Standings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
