"use client";

import React, { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  CheckCircle2,
  Filter,
  X,
  ArrowRight,
  School,
  Search,
  Building,
  Award,
  Users,
  Flame,
  ShieldCheck,
  MapPin,
  Flag,
  Lock,
} from "lucide-react";
import {
  AgeZone,
  LeaderboardEntry,
  ProfileVisibility,
  RegionalRankingEntry,
  Tournament,
} from "@/types/naijaplay";
import { PAST_TOURNAMENT_RESULTS, REGIONAL_RANKINGS, TOURNAMENTS, VERIFIED_SCHOOL_DERBY } from "@/data/mockData";
import { sounds } from "@/lib/audio";
import type { ReportTarget } from "@/components/SafetyReportModal";

interface CompetitionArenaProps {
  ageZone: AgeZone;
  onVerifiedXP: (amount: number, totalXP: number, level: number) => void;
  isAuthenticated: boolean;
  onRequestAuth: () => void;
  blockedUsers?: string[];
  onReportTarget?: (target: ReportTarget) => void;
  userSchool?: string;
  profileVisibility?: ProfileVisibility;
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

interface PastTournamentResult {
  tournamentTitle: string;
  date: string;
  division: string;
  winner: string;
  runnerUp: string;
  thirdPlace: string;
  winningScore: number;
  totalEntrants: number;
  verifiedIntegrity: string;
}

interface FairPlayStatus {
  auditedScoresCount: number;
  blockedAnomaliesCount: number;
  serverValidationRate: string;
  minorPrivacyRule: string;
}

export const CompetitionArena: React.FC<CompetitionArenaProps> = ({
  ageZone,
  onVerifiedXP,
  isAuthenticated,
  onRequestAuth,
  blockedUsers = [],
  onReportTarget,
  userSchool,
  profileVisibility = "SCHOOL_AND_CLUB_ONLY",
}) => {
  const [filterType, setFilterType] = useState<"All" | "Individual" | "School vs School" | "State vs State">("All");
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>([]);
  const [completedTournamentIds, setCompletedTournamentIds] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [regionalRankings, setRegionalRankings] = useState<RegionalRankingEntry[]>(REGIONAL_RANKINGS);
  const [recentResults, setRecentResults] = useState<PastTournamentResult[]>(PAST_TOURNAMENT_RESULTS);
  const [fairPlayStatus, setFairPlayStatus] = useState<FairPlayStatus>({
    auditedScoresCount: 0,
    blockedAnomaliesCount: 0,
    serverValidationRate: "100%",
    minorPrivacyRule: "PRIVATE_GUARDIAN_ONLY profiles hidden automatically",
  });
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registeringTournamentId, setRegisteringTournamentId] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<QualifierQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<number[]>([]);
  const [examSessionId, setExamSessionId] = useState<string | null>(null);
  const [examAwardedXP, setExamAwardedXP] = useState(0);
  const [examError, setExamError] = useState<string | null>(null);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [tournamentDataVersion, setTournamentDataVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<"tournaments" | "leaderboard" | "regional" | "schools">("tournaments");
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "all">("weekly");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolStateFilter, setSchoolStateFilter] = useState<string>("All States");
  const [regionFilter, setRegionFilter] = useState<string>("All Regions");
  const [joinedSchoolId, setJoinedSchoolId] = useState<string | null>("sch-1");
  const [leaderboardZoneFilter, setLeaderboardZoneFilter] = useState<string>("All");
  const [friendsClubOnly, setFriendsClubOnly] = useState(false);


  useEffect(() => {
    let cancelled = false;

    fetch(`/api/tournaments?timeframe=${timeframe}`)
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
          if (Array.isArray(result.regionalRankings)) {
            setRegionalRankings(result.regionalRankings);
          }
          if (Array.isArray(result.recentResults)) {
            setRecentResults(result.recentResults);
          }
          if (result.fairPlayStatus) {
            setFairPlayStatus(result.fairPlayStatus);
          }
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
  }, [isAuthenticated, tournamentDataVersion, timeframe]);

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
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-950/80 border border-slate-800 p-1 self-start md:self-auto text-xs">
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
                setActiveTab("regional");
              }}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "regional" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Regional Rankings
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

          {/* Fair-Play Monitoring & Recent Tournament Results */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-display text-base font-bold text-white">
                    Fair-Play Integrity Monitor
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  {fairPlayStatus.serverValidationRate} Server Audited
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-400 block">Verified Scores</span>
                  <span className="text-lg font-bold text-white">{fairPlayStatus.auditedScoresCount}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-400 block">Anomalies Blocked</span>
                  <span className="text-lg font-bold text-amber-400">{fairPlayStatus.blockedAnomaliesCount}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Anti-Cheat & Privacy Enforcement</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Minimum answer-latency validation, randomized server-keyed questions, and NDPA minor visibility filtering ({fairPlayStatus.minorPrivacyRule}).
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h3 className="font-display text-base font-bold text-white">
                    Recent Official Tournament Results
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">2026 Podium Archive</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentResults.map((res) => (
                  <div
                    key={res.tournamentTitle}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>{res.division}</span>
                      <span className="text-emerald-400 font-bold">{res.date}</span>
                    </div>
                    <h4 className="font-display text-sm font-bold text-white">{res.tournamentTitle}</h4>
                    <div className="space-y-1 text-[11px] font-mono pt-1 border-t border-slate-800/80">
                      <div className="text-amber-300 font-semibold">1st · {res.winner}</div>
                      <div className="text-slate-300">2nd · {res.runnerUp}</div>
                      <div className="text-slate-400">3rd · {res.thirdPlace}</div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 text-[10px] font-mono text-slate-400">
                      <span>Top Score: {res.winningScore} pts</span>
                      <span>{res.totalEntrants} Entrants · {res.verifiedIntegrity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        )}

      {/* LEADERBOARD TAB */}
      {activeTab === "leaderboard" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                All-Nigeria Verified Academic Rankings
              </h3>
              <p className="text-xs text-slate-400">
                Daily, weekly, and all-time verified results respecting student privacy preferences ({profileVisibility.replaceAll("_", " ")}).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-800 p-1 text-[11px] font-mono">
                {([
                  { id: "daily", label: "Daily" },
                  { id: "weekly", label: "Weekly" },
                  { id: "all", label: "All-Time" },
                ] as const).map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => {
                      sounds.playClick();
                      setTimeframe(tf.id);
                    }}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                      timeframe === tf.id
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-800 p-1 text-[11px] font-mono">
                {["All", "JUNIOR", "TEEN", "YOUTH", "SENIOR"].map((zone) => (
                  <button
                    key={zone}
                    onClick={() => {
                      sounds.playClick();
                      setLeaderboardZoneFilter(zone);
                    }}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                      leaderboardZoneFilter === zone
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>

              {userSchool && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setFriendsClubOnly((prev) => !prev);
                  }}
                  className={`flex items-center gap-1.5 text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    friendsClubOnly
                      ? "bg-indigo-950 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{friendsClubOnly ? "School/Club Scope" : "All Verified"}</span>
                </button>
              )}
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
                  <th className="py-3 px-3 text-right font-semibold">Safety</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {leaderboardEntries
                  .filter((p) => !blockedUsers.includes(p.name))
                  .filter((p) => leaderboardZoneFilter === "All" || p.zone === leaderboardZoneFilter)
                  .filter((p) => !friendsClubOnly || !userSchool || p.school === userSchool)
                  .map((player, idx) => (
                    <tr
                      key={`${player.rank}-${player.name}-${idx}`}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="py-3 px-3">
                        {idx + 1 === 1 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-950">
                            1
                          </span>
                        ) : idx + 1 === 2 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 font-bold text-slate-950">
                            2
                          </span>
                        ) : idx + 1 === 3 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 font-bold text-white">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">#{idx + 1}</span>
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
                        <span className="text-[11px] font-medium text-emerald-300">
                          {player.badge}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                        {player.score.toLocaleString()} pts
                      </td>
                      <td className="py-3 px-3 text-right">
                        {onReportTarget && (
                          <button
                            type="button"
                            onClick={() =>
                              onReportTarget({
                                targetType: "LEADERBOARD_PLAYER",
                                targetId: `lb-${player.name}`,
                                targetLabel: `${player.name} (${player.school || "Scholar"})`,
                                authorName: player.name,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:border-rose-700 hover:text-rose-300 transition-colors"
                            title="Report or Block"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Report</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                {leaderboardEntries.filter((p) => !blockedUsers.includes(p.name)).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No public qualifier results yet for this timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REGIONAL RANKINGS TAB */}
      {activeTab === "regional" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono">
                <MapPin className="w-4 h-4" />
                <span>National State & Geopolitical Zone Rankings</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mt-1">
                Regional & State Academic Standings
              </h3>
              <p className="text-xs text-slate-400">
                Combined scholar performance across Nigeria&apos;s geopolitical regions and leading secondary institutions.
              </p>
            </div>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="All Regions">All Regions</option>
              <option value="South-West">South-West</option>
              <option value="North-Central">North-Central</option>
              <option value="South-East">South-East</option>
              <option value="North-West">North-West</option>
              <option value="South-South">South-South</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regionalRankings
              .filter((r) => regionFilter === "All Regions" || r.region === regionFilter)
              .map((region) => (
                <div
                  key={region.state}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-amber-400">Rank #{region.rank}</span>
                    <span className="text-slate-400">{region.region} Zone</span>
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold text-white">{region.state}</h4>
                    <p className="text-xs text-slate-400">Leading School: {region.topSchool}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Scholars</span>
                      <span className="font-bold text-white">{region.scholarsCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Avg Score</span>
                      <span className="font-bold text-emerald-400">{region.averageScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Points</span>
                      <span className="font-bold text-amber-300">{(region.totalPoints / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SCHOOL DERBY TAB (100% COMPLETE INTERSCHOLASTIC STANDINGS) */}
      {activeTab === "schools" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono">
                <School className="w-4 h-4" />
                <span>National Interscholastic League · Season 2026</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mt-1">
                Verified Secondary School Derby Standings
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated merit points, gold medals, and registered scholar tallies across all accredited Nigerian secondary institutions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search school name..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-52"
                />
              </div>

              {/* State filter */}
              <select
                value={schoolStateFilter}
                onChange={(e) => setSchoolStateFilter(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="All States">All States</option>
                <option value="Lagos State">Lagos State</option>
                <option value="Abuja FCT">Abuja FCT</option>
                <option value="Ogun State">Ogun State</option>
                <option value="Enugu State">Enugu State</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="text-[10px] text-slate-400 font-mono block">Registered Schools</span>
              <span className="text-lg font-bold font-mono text-white">48 Nationwide</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="text-[10px] text-slate-400 font-mono block">Active Student Competitors</span>
              <span className="text-lg font-bold font-mono text-emerald-400">7,810 Scholars</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="text-[10px] text-slate-400 font-mono block">Olympiad Gold Medals</span>
              <span className="text-lg font-bold font-mono text-amber-400">76 Conferred</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="text-[10px] text-slate-400 font-mono block">Derby Leader</span>
              <span className="text-sm font-bold text-white truncate block">King&apos;s College Lagos</span>
            </div>
          </div>

          {/* School Derby Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-3.5 px-4 font-semibold">Rank</th>
                  <th className="py-3.5 px-4 font-semibold">Institution</th>
                  <th className="py-3.5 px-4 font-semibold">Classification</th>
                  <th className="py-3.5 px-4 font-semibold">Location</th>
                  <th className="py-3.5 px-4 text-center font-semibold">Medal Tally (G / S / B)</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Scholars</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Total Merit XP</th>
                  <th className="py-3.5 px-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {VERIFIED_SCHOOL_DERBY.filter((sch) => {
                  if (schoolStateFilter !== "All States" && sch.state !== schoolStateFilter) return false;
                  if (schoolSearch.trim()) {
                    const q = schoolSearch.toLowerCase();
                    return sch.name.toLowerCase().includes(q) || sch.city.toLowerCase().includes(q);
                  }
                  return true;
                }).map((school) => {
                  const isUserSchool = joinedSchoolId === school.id;
                  return (
                    <tr
                      key={school.id}
                      className={`transition-colors ${
                        isUserSchool ? "bg-emerald-950/30 border-l-4 border-l-emerald-500" : "hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        {school.derbyRank === 1 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-950 text-xs">
                            1
                          </span>
                        ) : school.derbyRank === 2 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 font-bold text-slate-950 text-xs">
                            2
                          </span>
                        ) : school.derbyRank === 3 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 font-bold text-white text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">#{school.derbyRank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-xs">
                            {school.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{school.name}</span>
                              {isUserSchool && (
                                <span className="rounded bg-emerald-950 border border-emerald-800 px-1.5 py-0.2 text-[9px] font-mono text-emerald-400">
                                  Your Team
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 italic">
                              &ldquo;{school.motto}&rdquo;
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                          {school.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-400">
                        {school.city}, {school.state}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1">
                          <span className="text-amber-400 font-bold">{school.goldMedals}G</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-300 font-bold">{school.silverMedals}S</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-amber-700 font-bold">{school.bronzeMedals}B</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300 tabular-nums">
                        {school.scholarsCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400 tabular-nums text-sm">
                        {school.totalXP.toLocaleString()} XP
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setJoinedSchoolId(school.id);
                          }}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                            isUserSchool
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          {isUserSchool ? "Linked" : "Link School"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
