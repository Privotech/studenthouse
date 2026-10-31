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
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>(["tourn-1"]);
  const [activeTab, setActiveTab] = useState<"tournaments" | "leaderboard" | "schools">("tournaments");

  const filteredTournaments = TOURNAMENTS.filter((t) => {
    if (filterType !== "All" && t.type !== filterType) return false;
    return true;
  });

  const handleJoin = (tourney: Tournament) => {
    sounds.playTrophy();
    if (!joinedTournaments.includes(tourney.id)) {
      setJoinedTournaments([...joinedTournaments, tourney.id]);
      onAwardXP(50, `Registered for ${tourney.title}`);
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

                  <button
                    onClick={() => handleJoin(tourney)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                      isJoined
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Enrolled · Examination Ready</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>Register for Olympiad (+50 XP)</span>
                      </>
                    )}
                  </button>
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
    </div>
  );
};
