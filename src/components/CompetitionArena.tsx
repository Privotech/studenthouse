"use client";

import React, { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  CheckCircle2,
  Filter,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";
import { AgeZone, LeaderboardEntry, Tournament } from "@/types/naijaplay";
import { TOURNAMENTS } from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface CompetitionArenaProps {
  ageZone: AgeZone;
  onVerifiedXP: (amount: number, totalXP: number, level: number) => void;
  isAuthenticated: boolean;
  onRequestAuth: () => void;
}

interface QualifierQuestion {
  discipline: string;
  question: string;
  options: string[];
}

interface TournamentCatalogRecord {
  id: string;
  title: string;
  game: string;
  participantsCount: number;
  startsIn: string;
  status: Tournament["status"];
  targetZone: Tournament["targetZone"];
}

export const CompetitionArena: React.FC<CompetitionArenaProps> = ({
  ageZone,
  onVerifiedXP,
  isAuthenticated,
  onRequestAuth,
}) => {
  const [filterType, setFilterType] = useState<"All" | "Individual" | "School vs School" | "State vs State">("All");
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>([]);
  const [completedTournamentIds, setCompletedTournamentIds] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registeringTournamentId, setRegisteringTournamentId] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<QualifierQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<number[]>([]);
  const [examSessionId, setExamSessionId] = useState<string | null>(null);
  const [examAwardedXP, setExamAwardedXP] = useState(0);
  const [examError, setExamError] = useState<string | null>(null);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [tournamentDataVersion, setTournamentDataVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<"tournaments" | "leaderboard" | "schools">("tournaments");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/tournaments")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Could not load tournament registrations.");
        }
        if (!cancelled) {
          if (isAuthenticated) {
            setJoinedTournaments(result.joinedTournamentIds ?? []);
            setCompletedTournamentIds(result.completedTournamentIds ?? []);
          } else {
            setJoinedTournaments([]);
            setCompletedTournamentIds([]);
          }
          setRegistrationError(null);
          const catalogById = new Map(
            (result.tournaments as TournamentCatalogRecord[]).map((tournament) => [
              tournament.id,
              tournament,
            ]),
          );
          setTournaments(
            TOURNAMENTS.flatMap((template) => {
              const record = catalogById.get(template.id);
              return record ? [{ ...template, ...record }] : [];
            }),
          );
          setLeaderboardEntries(result.leaderboard ?? []);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          if (!isAuthenticated) {
            setJoinedTournaments([]);
            setCompletedTournamentIds([]);
          }
          const message = error instanceof Error
            ? error.message
            : "Could not load tournament registrations.";
          setRegistrationError(message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, tournamentDataVersion]);

  const filteredTournaments = tournaments.filter((t) => {
    if (filterType !== "All" && t.type !== filterType) return false;
    return t.targetZone === "All Zones" || t.targetZone === ageZone;
  });

  const [activeExamTourney, setActiveExamTourney] = useState<Tournament | null>(null);
  const [examQIndex, setExamQIndex] = useState(0);
  const [examSelectedOpt, setExamSelectedOpt] = useState<number | null>(null);
  const [examScore, setExamScore] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);

  const handleJoin = async (tourney: Tournament) => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    if (joinedTournaments.includes(tourney.id)) return;

    setRegisteringTournamentId(tourney.id);
    setRegistrationError(null);
    try {
      const response = await fetch("/api/tournaments/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: tourney.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        onRequestAuth();
        return;
      }
      if (!response.ok) {
        throw new Error(result.error || "Could not register for this tournament.");
      }

      sounds.playTrophy();
      setJoinedTournaments((current) => [...current, tourney.id]);
      onVerifiedXP(result.awardedXP, result.totalXP, result.level);
    } catch (error) {
      setRegistrationError(
        error instanceof Error ? error.message : "Could not register for this tournament.",
      );
    } finally {
      setRegisteringTournamentId(null);
    }
  };

  const handleStartExam = async (tourney: Tournament) => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }

    setRegisteringTournamentId(tourney.id);
    setRegistrationError(null);
    setExamError(null);
    try {
      const response = await fetch("/api/tournaments/qualifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", tournamentId: tourney.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        onRequestAuth();
        return;
      }
      if (!response.ok) {
        throw new Error(result.error || "Could not start this qualifier.");
      }

      sounds.playClick();
      setExamSessionId(result.sessionId);
      setExamQuestions(result.questions);
      setExamAnswers([]);
      setActiveExamTourney(tourney);
      setExamQIndex(0);
      setExamSelectedOpt(null);
      setExamScore(0);
      setExamAwardedXP(0);
      setExamSubmitted(false);
      setExamFinished(false);
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : "Could not start this qualifier.");
    } finally {
      setRegisteringTournamentId(null);
    }
  };


  const handleSelectExamOption = (idx: number) => {
    if (examSubmitted) return;
    sounds.playClick();
    setExamSelectedOpt(idx);
  };

  const handleSubmitExamOption = () => {
    if (examSelectedOpt === null || examSubmitted) return;
    sounds.playClick();
    setExamAnswers((current) => {
      const next = [...current];
      next[examQIndex] = examSelectedOpt;
      return next;
    });
    setExamSubmitted(true);
  };

  const handleNextExamQuestion = async () => {
    if (examQIndex < examQuestions.length - 1) {
      sounds.playClick();
      setExamQIndex((prev) => prev + 1);
      setExamSelectedOpt(null);
      setExamSubmitted(false);
      return;
    }

    if (!examSessionId || examAnswers.length !== examQuestions.length) {
      setExamError("Your answers could not be submitted. Restart the qualifier and try again.");
      return;
    }

    setIsSubmittingExam(true);
    setExamError(null);
    try {
      const response = await fetch("/api/tournaments/qualifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", sessionId: examSessionId, answers: examAnswers }),
      });
      const result = await response.json();
      if (response.status === 401) {
        onRequestAuth();
        return;
      }
      if (!response.ok) {
        throw new Error(result.error || "Could not save your qualifier result.");
      }

      sounds.playTrophy();
      setExamScore(result.correctAnswers);
      setExamAwardedXP(result.awardedXP);
      setExamFinished(true);
      if (activeExamTourney) {
        setCompletedTournamentIds((current) => [...new Set([...current, activeExamTourney.id])]);
      }
      onVerifiedXP(result.awardedXP, result.totalXP, result.level);
      setTournamentDataVersion((version) => version + 1);
    } catch (error) {
      setExamError(error instanceof Error ? error.message : "Could not save your qualifier result.");
    } finally {
      setIsSubmittingExam(false);
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
          {registrationError && (
            <p role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-300">
              {registrationError}
            </p>
          )}
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
                        disabled={registeringTournamentId === tourney.id || isJoined}
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
                        completedTournamentIds.includes(tourney.id) ? (
                          <span className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Qualifier completed</span>
                          </span>
                        ) : tourney.status === "Upcoming" ? (
                          <span className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-950 text-slate-400 border border-slate-800">
                            Opens {tourney.startsIn}
                          </span>
                        ) : tourney.status === "Completed" ? (
                          <span className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-950 text-slate-400 border border-slate-800">
                            Tournament closed
                          </span>
                        ) : (
                          <button
                            onClick={() => void handleStartExam(tourney)}
                            disabled={registeringTournamentId === tourney.id}
                            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <Medal className="w-4 h-4 text-emerald-200" />
                            <span>{registeringTournamentId === tourney.id ? "Starting..." : "Start Qualifier"}</span>
                          </button>
                        )
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
                Rankings from saved qualifier results. Only scholars who opted into public profile visibility appear here.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Database-backed results</span>
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
                {leaderboardEntries.map((player) => (
                  <tr
                    key={`${player.rank}-${player.name}`}
                    className="transition-colors hover:bg-slate-800/40"
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
                {leaderboardEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No public qualifier results yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHOOL DERBY TAB */}
      {activeTab === "schools" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center">
          <h3 className="font-display text-lg font-bold text-white">School Derby Standings</h3>
          <p className="mt-2 text-sm text-slate-400">
            Verified school standings will appear after tournament results are linked to verified school records.
          </p>
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
                      Question {examQIndex + 1} of {examQuestions.length}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      Discipline: {examQuestions[examQIndex]?.discipline}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                      style={{
                        width: `${Math.round(((examQIndex + 1) / examQuestions.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {examQuestions[examQIndex]?.question}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {examQuestions[examQIndex]?.options.map((opt, i) => {
                    const isSelected = examSelectedOpt === i;
                    let btnClass = "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-200";
                    if (isSelected) {
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
                      </button>
                    );
                  })}
                </div>

                {examError && (
                  <p role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-300">
                    {examError}
                  </p>
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
                      disabled={isSubmittingExam}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950 disabled:opacity-60"
                    >
                      <span>
                        {isSubmittingExam
                          ? "Saving result..."
                          : examQIndex < examQuestions.length - 1
                            ? "Next Problem"
                            : "Finish Qualifier"}
                      </span>
                      {!isSubmittingExam && <ArrowRight className="w-4 h-4" />}
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
                    Your verified score, result, and XP award have been saved to your account.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <span className="text-[11px] text-slate-400 block font-mono">Accuracy</span>
                    <span className="font-mono text-xl font-bold text-emerald-400">
                      {examScore} / {examQuestions.length} Correct
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <span className="text-[11px] text-slate-400 block font-mono">Merit Conferred</span>
                    <span className="font-mono text-xl font-bold text-amber-400">
                      +{examAwardedXP} XP
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
