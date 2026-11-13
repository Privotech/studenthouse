"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Sparkles,
  Award,
  Flame,
  Clock,
  Shield,
  CheckCircle2,
  GraduationCap,
  Sigma,
  Terminal,
  Globe,
  BookOpen,
  Database,
  Lock,
  KeyRound,
  ShieldCheck,
  Gift,
  Coins,
  Ban,
  BarChart3,
  Eye,
  Layers,
  Building2,
  ArrowRight,
} from "lucide-react";
import { NavTab, PlayerState, ProfileVisibility } from "@/types/naijaplay";
import { AVATAR_CRESTS } from "@/data/mockData";
import { BADGE_DEFINITIONS, TIER_CONFIG } from "@/data/badges";
import { BadgeCabinet } from "@/components/BadgeCabinet";
import { sounds } from "@/lib/audio";

interface PlayerProfileViewProps {
  player: PlayerState;
  onUpdateAvatarCrest: (crest: string) => void;
  onUpdateName: (name: string) => void;
  onUpdateAge: (age: number) => void;
  onSetFeaturedBadge?: (badgeId: string) => void;
  onOpenAuth?: (tab?: "signin" | "register") => void;
  onOpenRewards?: () => void;
  onUpdatePrivacy?: (visibility: ProfileVisibility) => Promise<void> | void;
  onUnblockUser?: (targetName: string) => Promise<void> | void;
  onNavigateTab?: (tab: NavTab) => void;
  userEmail?: string;
  isAuthenticated?: boolean;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  player,
  onUpdateAvatarCrest,
  onUpdateName,
  onUpdateAge,
  onSetFeaturedBadge,
  onOpenAuth,
  onOpenRewards,
  onUpdatePrivacy,
  onUnblockUser,
  onNavigateTab,
  userEmail,
  isAuthenticated = false,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(player.displayName);
  const [passport, setPassport] = useState<{
    planName: string;
    orgCount: number;
    sqCoursesPassed: number;
    sqLabsSubmitted: number;
    talentHeadline: string;
    portfolioCount: number;
  }>({
    planName: "Free Scholar",
    orgCount: 0,
    sqCoursesPassed: 0,
    sqLabsSubmitted: 0,
    talentHeadline: "Emerging African Innovator",
    portfolioCount: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch("/api/ecosystem", { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/skillquest", { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/talent-arena", { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([eco, sq, ta]) => {
        if (cancelled) return;
        setPassport({
          planName: eco?.entitlement?.planName || "Free Scholar",
          orgCount: Array.isArray(eco?.organizations) ? eco.organizations.length : 0,
          sqCoursesPassed: Array.isArray(sq?.progress) ? sq.progress.length : 0,
          sqLabsSubmitted: Array.isArray(sq?.assignments) ? sq.assignments.length : 0,
          talentHeadline: ta?.myProfile?.headline || "Set up your Talent Arena portfolio",
          portfolioCount: Array.isArray(ta?.myProfile?.portfolio) ? ta.myProfile.portfolio.length : 0,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const featuredBadge = player.featuredBadgeId
    ? BADGE_DEFINITIONS.find((b) => b.id === player.featuredBadgeId)
    : null;

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    sounds.playClick();
    onUpdateName(newName.trim());
    setEditingName(false);
  };

  const progressPercent = Math.min(
    100,
    Math.round((player.xp / player.nextLevelXp) * 100),
  );

  return (
    <div className="space-y-6">
      {/* Profile Card Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Monogram Display */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-slate-900 text-white font-mono font-extrabold text-3xl shadow-2xl shadow-emerald-950/80 border-4 border-slate-800">
              {player.avatarInitials}
            </div>
            <div className="absolute -bottom-2 -right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-950 shadow-md">
              Lvl {player.level}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {editingName ? (
                <form onSubmit={handleNameSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-lg bg-slate-950 border border-emerald-500 px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-white">
                    {player.displayName}
                  </h2>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-slate-400 hover:text-emerald-400"
                  >
                    Edit
                  </button>
                </div>
              )}

              <span className="rounded-md bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-mono text-emerald-300">
                {player.ageZone} Tier (Age {player.age})
              </span>

              {featuredBadge && (
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-mono font-bold border ${TIER_CONFIG[featuredBadge.tier].accentBg}`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>Featured: {featuredBadge.title}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-mono">
              {player.username ? `@${player.username} · ` : ""}
              {userEmail ? `${userEmail} · ` : ""}
              {player.school} · {player.state}
            </p>

            {/* Age Display / Adjustment */}
            <div className="pt-2 max-w-sm flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 shrink-0">Age: {player.age}</span>
              {isAuthenticated ? (
                <div className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Age & Tier Locked</span>
                </div>
              ) : (
                <>
                  <input
                    type="range"
                    min="6"
                    max="30"
                    value={player.age}
                    onChange={(e) => onUpdateAge(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-500">Max 30</span>
                </>
              )}
            </div>

            {/* Level XP Bar */}
            <div className="pt-2 max-w-md space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Degree Progression to Level {player.level + 1}</span>
                <span className="text-emerald-400 font-bold">
                  {player.xp} / {player.nextLevelXp} XP
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crest Insignia Selection */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-white">
          Scholarly Crest Insignia
        </h3>
        <p className="text-xs text-slate-400">
          Select your academic emblem to display across examination rosters and interscholastic derbies.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {AVATAR_CRESTS.map((crest) => {
            const isSelected = player.avatarCrest === crest.id;
            return (
              <button
                key={crest.id}
                onClick={() => {
                  sounds.playClick();
                  onUpdateAvatarCrest(crest.id);
                }}
                className={`rounded-xl border p-3 text-center transition-all flex flex-col items-center justify-between space-y-1.5 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-950/40 shadow-lg ring-1 ring-emerald-500"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-emerald-400 text-lg">
                  {crest.symbol}
                </div>
                <span className="text-xs font-bold text-white">{crest.label}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">{crest.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Statistics & Verified Score History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Personal Statistics & Score History
              </h3>
              <p className="text-xs text-slate-400">
                Server-verified academic gameplay telemetry across Naija Trivia, Brain Rush, Word, Math, and Memory modes.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Favorite: {player.personalStats?.favoriteGameTitle || "Naija Trivia"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <span className="text-[10px] text-slate-400 block">Games Played</span>
            <span className="text-xl font-bold text-white">
              {player.personalStats?.gamesPlayed ?? 0}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <span className="text-[10px] text-slate-400 block">Avg. Accuracy</span>
            <span className="text-xl font-bold text-emerald-400">
              {player.personalStats?.averageAccuracy ?? 0}%
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <span className="text-[10px] text-slate-400 block">Best Score</span>
            <span className="text-xl font-bold text-amber-300">
              {(player.personalStats?.bestScore ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <span className="text-[10px] text-slate-400 block">Verified XP Total</span>
            <span className="text-xl font-bold text-white">
              {player.xp.toLocaleString()} XP
            </span>
          </div>
        </div>

        {player.personalStats && player.personalStats.recentHistory.length > 0 ? (
          <div className="space-y-2 pt-1">
            {player.personalStats.recentHistory.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs font-mono"
              >
                <div>
                  <span className="font-sans font-semibold text-white">{entry.gameTitle}</span>
                  <span className="text-slate-500 ml-2">
                    {entry.correctAnswers}/{entry.questionsAnswered} · {entry.durationSeconds}s
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">{entry.accuracyPercent}% Acc</span>
                  <span className="text-amber-300 font-bold">{entry.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-mono">
            Play any verified round in the Games Arena to record live personal telemetry.
          </p>
        )}
      </div>

      {/* 3-in-1 Ecosystem Passport (SkillQuest, Talent Arena & Entitlements) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                3-in-1 Ecosystem Passport
              </h3>
              <p className="text-xs text-slate-400">
                Unified progress & boundaries across NaijaPlay, SkillQuest, Talent Arena & multi-tenant organizations.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {passport.planName} · {passport.orgCount} Organization(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400 font-bold">
                <span>NAIJAPLAY</span>
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold text-white">
                {player.personalStats?.gamesPlayed ?? 0} Verified Rounds · Lvl {player.level}
              </div>
              <p className="text-[11px] text-slate-400">
                Non-cashable progression XP shared cleanly while respecting product permissions.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("games")}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 pt-1"
              >
                <span>Open NaijaPlay Arena</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px] text-indigo-400 font-bold">
                <span>SKILLQUEST</span>
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold text-white">
                {passport.sqCoursesPassed} Verified Exams · {passport.sqLabsSubmitted} Labs
              </div>
              <p className="text-[11px] text-slate-400">
                Structured learning paths, practical labs, and instructor classroom cohorts.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("learn")}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 pt-1"
              >
                <span>Open SkillQuest</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px] text-sky-400 font-bold">
                <span>TALENT ARENA</span>
                <Award className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold text-white truncate">
                {passport.portfolioCount} Portfolio Work(s)
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {passport.talentHeadline}
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("talent")}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 pt-1"
              >
                <span>Open Talent Arena</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Settings & Blocked Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Eye className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Privacy & Leaderboard Visibility
              </h3>
              <p className="text-xs text-slate-400">
                Control how your name and scores appear across leaderboards and school club competitions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {([
              {
                id: "PRIVATE_GUARDIAN_ONLY",
                title: "Private Guardian",
                desc: "Hidden from public leaderboards. Recommended for Juniors.",
              },
              {
                id: "SCHOOL_AND_CLUB_ONLY",
                title: "School & Clubs",
                desc: "Visible only to classmates and enrolled school society peers.",
              },
              {
                id: "PUBLIC_OPT_IN",
                title: "Public Opt-In",
                desc: "Eligible for National & Regional verified leaderboards.",
              },
            ] as const).map((opt) => {
              const currentVis = player.profileVisibility || "SCHOOL_AND_CLUB_ONLY";
              const isSelected = currentVis === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onUpdatePrivacy?.(opt.id);
                  }}
                  className={`rounded-xl border p-3.5 text-left transition-all space-y-1 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{opt.title}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Ban className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Blocked Accounts ({player.blockedUsers?.length ?? 0})
              </h3>
              <p className="text-xs text-slate-400">
                Hidden from showcases, leaderboards, and club boards.
              </p>
            </div>
          </div>

          {player.blockedUsers && player.blockedUsers.length > 0 ? (
            <div className="space-y-2">
              {player.blockedUsers.map((blockedName) => (
                <div
                  key={blockedName}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs"
                >
                  <span className="font-mono font-semibold text-slate-200">{blockedName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onUnblockUser?.(blockedName);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-slate-800"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
              No blocked scholars. You can report or block disruptive content from leaderboards, clubs, or the Creative Studio.
            </div>
          )}
        </div>
      </div>

      {/* Verified Academic Certificates */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Official Certificates of Academic Excellence
            </h3>
            <p className="text-xs text-slate-400">
              Formal credentials awarded upon passing rigorous subject examinations.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {player.certificates.length} Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {player.certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-2xl border border-emerald-900/60 bg-gradient-to-br from-slate-950 to-emerald-950/20 p-5 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">{cert.id}</span>
                  <span className="text-slate-400">{cert.issuedDate}</span>
                </div>
                <h4 className="font-display text-base font-bold text-white">
                  {cert.courseTitle}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <span className="font-mono text-emerald-400 font-bold">
                  Score: {cert.scorePercent}% ({cert.grade})
                </span>
                <span className="rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                  Accredited
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pan-African Rewards & Airtime Vault Section */}
      <div className="rounded-2xl border border-amber-900/60 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-950/40">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-white">
                  Pan-African Rewards & Airtime Store
                </h3>
                <span className="rounded bg-amber-950 border border-amber-800 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  Phase 11 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Redeem mobile data, MTN/Airtel/Glo airtime, WAEC scratch cards, and JAMB UTME e-PINs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-amber-500/40 px-3.5 py-2 font-mono">
              <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block leading-none">Coin Vault</span>
                <span className="text-sm font-extrabold text-amber-300">
                  {player.coins > 0 ? player.coins.toLocaleString() : "1,850"} Coins
                </span>
              </div>
            </div>

            {onOpenRewards && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenRewards();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-500 transition-colors shadow-md shadow-amber-950/50"
              >
                <span>Open Rewards Store</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NeonDB Identity & Security Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-white">
                  PostgreSQL & Security Engine
                </h3>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                  NeonDB Serverless
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cryptographic authentication, brute-force mitigation, and session integrity.
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("signin");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Switch / Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("register");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Register New</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Password Algorithm</span>
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-sm font-bold font-mono text-white">PBKDF2-SHA256</p>
            <p className="text-[10px] text-slate-500">100,000 Key Derivation Iterations</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Salt & Timing Shield</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-sm font-bold font-mono text-emerald-400">Constant-Time Safe</p>
            <p className="text-[10px] text-slate-500">16-Byte Cryptographic Salt per User</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Brute-Force Rate Limit</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-sm font-bold font-mono text-amber-400">5 Tries / 15-Min Lock</p>
            <p className="text-[10px] text-slate-500">Sliding Window IP & Account Defense</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Session Bearer</span>
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-sm font-bold font-mono text-white">64-Hex Secure Token</p>
            <p className="text-[10px] text-slate-500">7-Day Expiry & HttpOnly Cookie</p>
          </div>
        </div>
      </div>

      {/* Dynamic Scholarly Badge & Achievement Cabinet */}
      <BadgeCabinet
        player={player}
        onSetFeaturedBadge={onSetFeaturedBadge}
      />
    </div>
  );
};
