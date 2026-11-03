"use client";

import React from "react";
import {
  Flame,
  Award,
  Gamepad2,
  Trophy,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Zap,
  Layers,
  Users,
  Sigma,
  Terminal,
  Atom,
  Dna,
  TrendingUp,
  Shield,
  GraduationCap,
} from "lucide-react";
import { AgeZone, DailyMission, NavTab, PlayerState } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";

interface HomeViewProps {
  player: PlayerState;
  missions: DailyMission[];
  onClaimMission: (missionId: string) => void;
  onNavigateTab: (tab: NavTab) => void;
  onZoneChange: (zone: AgeZone) => void;
  onOpenRoadmap: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  player,
  missions,
  onClaimMission,
  onNavigateTab,
  onZoneChange,
  onOpenRoadmap,
}) => {
  const progressPercent = Math.min(
    100,
    Math.round((player.xp / player.nextLevelXp) * 100),
  );

  return (
    <div className="space-y-8 pb-12">
      {/* 1. WELCOME BACK SCHOLAR HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-[#0A101C] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                Academic Dashboard
              </span>
              <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                Verified Scholar
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              {/* Monogram Avatar Badge */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-slate-900 border border-emerald-500/40 text-white font-mono font-bold text-xl shadow-lg">
                {player.avatarInitials}
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  {player.displayName}
                </h1>
                <p className="text-xs text-slate-300 font-mono">
                  Level {player.level} Scholar · {player.school} · {player.state}
                </p>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="pt-2 max-w-lg space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Degree Progression to Level {player.level + 1}</span>
                <span className="font-bold text-emerald-400">
                  {player.xp} / {player.nextLevelXp} XP
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key Metrics Counters */}
          <div className="grid grid-cols-3 gap-3 self-stretch lg:self-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">Academic XP</span>
              <span className="font-display text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
                {player.xp.toLocaleString()}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">Honours</span>
              <span className="font-display text-xl sm:text-2xl font-extrabold text-amber-400 font-mono mt-0.5 block">
                {player.badges.length}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">Discipline</span>
              <span className="font-display text-xl sm:text-2xl font-extrabold text-amber-500 font-mono mt-0.5 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                {player.streakDays}d
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S MISSIONS CHECKLIST */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="font-display text-lg font-bold text-white">
                Daily Academic Missions
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete daily goals to build academic consistency and unlock formal certificates.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {missions.filter((m) => m.claimed).length} / {missions.length} Claimed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all space-y-3 ${
                mission.claimed
                  ? "border-slate-800/60 bg-slate-950/40 opacity-70"
                  : mission.completed
                  ? "border-emerald-500/80 bg-emerald-950/30 shadow-lg shadow-emerald-950"
                  : "border-slate-800 bg-slate-950/80"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    +{mission.xpReward} XP
                  </span>
                  {mission.claimed && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <h3 className="font-display text-sm font-bold text-white">
                  {mission.title}
                </h3>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {mission.description}
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>Progress</span>
                  <span>
                    {mission.progress} / {mission.target}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800 mb-3">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%`,
                    }}
                  />
                </div>

                {mission.claimed ? (
                  <span className="block text-center text-[11px] font-bold text-slate-500 py-1.5 rounded-lg bg-slate-900 font-mono">
                    Claimed
                  </span>
                ) : mission.completed ? (
                  <button
                    onClick={() => onClaimMission(mission.id)}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-950"
                  >
                    Claim +{mission.xpReward} XP
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigateTab("learn")}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    View Subject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CORE ACADEMIC DISCIPLINES DISCOVERY STRIP */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Core Academic Disciplines & Testing
            </h2>
            <p className="text-xs text-slate-400">
              Verified curriculum across all 8 fields of higher learning.
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onNavigateTab("learn");
            }}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>Explore All 8 Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Mathematics */}
          <div
            onClick={() => {
              sounds.playClick();
              onNavigateTab("learn");
            }}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                  <Sigma className="w-5 h-5" />
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                  Advanced
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-300">
                Calculus & Quantitative Reasoning
              </h3>
              <p className="text-xs text-slate-300">
                Limits, differential equations, integral calculus, and engineering optimization models.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 font-mono">
              <span>5-Question Exam</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                Study & Test <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Computer Science */}
          <div
            onClick={() => {
              sounds.playClick();
              onNavigateTab("learn");
            }}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-slate-800 text-blue-400 border border-slate-700">
                  <Terminal className="w-5 h-5" />
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                  Advanced
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-blue-300">
                Computer Science & Algorithmic Logic
              </h3>
              <p className="text-xs text-slate-300">
                Asymptotic Big-O complexity, binary search trees, graph theory, and ACID databases.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 font-mono">
              <span>5-Question Exam</span>
              <span className="font-semibold text-blue-400 flex items-center gap-1">
                Study & Test <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Macroeconomics */}
          <div
            onClick={() => {
              sounds.playClick();
              onNavigateTab("learn");
            }}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                  Advanced
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-300">
                Macroeconomics & Wealth Architecture
              </h3>
              <p className="text-xs text-slate-300">
                Sovereign monetary policy, GDP components, DCF valuation, and capital allocation.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 font-mono">
              <span>5-Question Exam</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                Study & Test <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CREATIVE STUDIO & OLYMPIAD SPOTLIGHT BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
              <Layers className="w-4 h-4" />
              <span>Photoshop Web Studio</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              Engineering Diagrams & Digital Studio
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open image files, annotate architectural diagrams, apply image filters, and publish peer-reviewed visual compositions to the Scholarly Showcase.
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onNavigateTab("studio");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950 w-full sm:w-auto self-start"
          >
            <span>Launch Photoshop Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
              <Trophy className="w-4 h-4" />
              <span>National Interscholastic Olympiad</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              STEM & Quantitative Olympiad Derby
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              1,420 registered scholars from King&apos;s College, Queen&apos;s College, Loyola Jesuit, and national secondary schools competing for laboratory research grants.
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onNavigateTab("compete");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors w-full sm:w-auto self-start"
          >
            <span>View Competition Standings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
