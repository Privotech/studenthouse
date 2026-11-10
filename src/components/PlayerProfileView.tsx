"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { PlayerState } from "@/types/naijaplay";
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
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  player,
  onUpdateAvatarCrest,
  onUpdateName,
  onUpdateAge,
  onSetFeaturedBadge,
  onOpenAuth,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(player.displayName);

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
              {player.school} · {player.state}
            </p>

            {/* Age Adjustment Slider (Ages 6 to 30) */}
            <div className="pt-2 max-w-sm flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 shrink-0">Age: {player.age}</span>
              <input
                type="range"
                min="6"
                max="30"
                value={player.age}
                onChange={(e) => onUpdateAge(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-500">Max 30</span>
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
