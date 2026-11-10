"use client";

import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Crown,
  BookOpen,
  Terminal,
  Globe,
  TrendingUp,
  Sparkles,
  Trophy,
  Medal,
  Award,
  Zap,
  ShieldCheck,
  Flame,
  Users,
  CheckCircle2,
  Palette,
  Atom,
  Search,
  Filter,
  Check,
  Lock,
  Pin,
  X,
  Shield,
  ArrowRight,
} from "lucide-react";
import { BadgeCategory, BadgeTier, PlayerState } from "@/types/naijaplay";
import {
  BADGE_DEFINITIONS,
  BadgeDefinition,
  TIER_CONFIG,
} from "@/data/badges";
import { sounds } from "@/lib/audio";

interface BadgeCabinetProps {
  player: PlayerState;
  onSetFeaturedBadge?: (badgeId: string) => void;
}

export const BadgeCabinet: React.FC<BadgeCabinetProps> = ({
  player,
  onSetFeaturedBadge,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNLOCKED" | "IN_PROGRESS">("ALL");
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  // Map icon name to Lucide component
  const getBadgeIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case "GraduationCap":
        return <GraduationCap className={className} />;
      case "Crown":
        return <Crown className={className} />;
      case "BookOpen":
        return <BookOpen className={className} />;
      case "Terminal":
        return <Terminal className={className} />;
      case "Globe":
        return <Globe className={className} />;
      case "TrendingUp":
        return <TrendingUp className={className} />;
      case "Sparkles":
        return <Sparkles className={className} />;
      case "Trophy":
        return <Trophy className={className} />;
      case "Medal":
        return <Medal className={className} />;
      case "Award":
        return <Award className={className} />;
      case "Zap":
        return <Zap className={className} />;
      case "ShieldCheck":
        return <ShieldCheck className={className} />;
      case "Flame":
        return <Flame className={className} />;
      case "Users":
        return <Users className={className} />;
      case "CheckCircle2":
        return <CheckCircle2 className={className} />;
      case "Palette":
        return <Palette className={className} />;
      case "Atom":
        return <Atom className={className} />;
      default:
        return <Shield className={className} />;
    }
  };

  // Compute evaluations for all badges
  const evaluatedBadges = useMemo(() => {
    return BADGE_DEFINITIONS.map((badge) => {
      const evaluation = badge.evaluate(player);
      return {
        badge,
        evaluation,
        isFeatured: player.featuredBadgeId === badge.id,
      };
    });
  }, [player]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = evaluatedBadges.length;
    const unlocked = evaluatedBadges.filter((b) => b.evaluation.isUnlocked).length;
    const totalXp = evaluatedBadges
      .filter((b) => b.evaluation.isUnlocked)
      .reduce((sum, b) => sum + b.badge.xpBonus, 0);

    const bronzeCount = evaluatedBadges.filter(
      (b) => b.badge.tier === "BRONZE" && b.evaluation.isUnlocked,
    ).length;
    const silverCount = evaluatedBadges.filter(
      (b) => b.badge.tier === "SILVER" && b.evaluation.isUnlocked,
    ).length;
    const goldCount = evaluatedBadges.filter(
      (b) => b.badge.tier === "GOLD" && b.evaluation.isUnlocked,
    ).length;
    const obsidianCount = evaluatedBadges.filter(
      (b) => b.badge.tier === "OBSIDIAN" && b.evaluation.isUnlocked,
    ).length;

    return {
      total,
      unlocked,
      totalXp,
      bronzeCount,
      silverCount,
      goldCount,
      obsidianCount,
      percent: Math.round((unlocked / total) * 100),
    };
  }, [evaluatedBadges]);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    return evaluatedBadges.filter((item) => {
      if (selectedCategory !== "ALL" && item.badge.category !== selectedCategory) {
        return false;
      }
      if (statusFilter === "UNLOCKED" && !item.evaluation.isUnlocked) {
        return false;
      }
      if (statusFilter === "IN_PROGRESS" && item.evaluation.isUnlocked) {
        return false;
      }
      return true;
    });
  }, [evaluatedBadges, selectedCategory, statusFilter]);

  const handleBadgeClick = (badge: BadgeDefinition) => {
    sounds.playClick();
    setSelectedBadge(badge);
  };

  const handleTogglePin = (badgeId: string) => {
    sounds.playTrophy();
    if (onSetFeaturedBadge) {
      onSetFeaturedBadge(player.featuredBadgeId === badgeId ? "" : badgeId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. ACHIEVEMENT MILESTONE SUMMARY HERO */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                <Award className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Academic & Competition Honours
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              Scholarly Badge & Milestone Registry
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Insignias conferred for verified course completions, distinction examination scores, interscholastic olympiad victories, and continuous study discipline.
            </p>
          </div>

          {/* Metric Overview Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">
                Bronze
              </span>
              <span className="font-mono text-xl font-bold text-amber-300 mt-0.5 block">
                {stats.bronzeCount}
              </span>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 block">
                Silver
              </span>
              <span className="font-mono text-xl font-bold text-slate-200 mt-0.5 block">
                {stats.silverCount}
              </span>
            </div>

            <div className="rounded-xl border border-yellow-800/60 bg-yellow-950/20 p-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 block">
                Gold
              </span>
              <span className="font-mono text-xl font-bold text-yellow-300 mt-0.5 block">
                {stats.goldCount}
              </span>
            </div>

            <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                Obsidian
              </span>
              <span className="font-mono text-xl font-bold text-emerald-300 mt-0.5 block">
                {stats.obsidianCount}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-1 font-mono">
            <span>
              Cumulative Registry Standing:{" "}
              <strong className="text-white">
                {stats.unlocked} of {stats.total} Honours Conferred
              </strong>
            </span>
            <span className="text-emerald-400 font-bold">
              +{stats.totalXp.toLocaleString()} Total Milestone Bonus XP Earned
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-teal-300 transition-all duration-500"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. CATEGORY TABS & STATUS FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { id: "ALL", label: "All Disciplines" },
            { id: "LEARNING", label: "Learning & Academics" },
            { id: "COMPETITION", label: "Competitions & Olympiads" },
            { id: "DISCIPLINE", label: "Discipline & Streaks" },
            { id: "CREATIVE_COMMUNITY", label: "Societies & Studio" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                selectedCategory === cat.id
                  ? "border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-950 border border-slate-800 p-1 self-start md:self-auto text-xs font-mono">
          <button
            onClick={() => {
              sounds.playClick();
              setStatusFilter("ALL");
            }}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({evaluatedBadges.length})
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setStatusFilter("UNLOCKED");
            }}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === "UNLOCKED"
                ? "bg-emerald-900/60 text-emerald-300 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Conferred ({stats.unlocked})
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setStatusFilter("IN_PROGRESS");
            }}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === "IN_PROGRESS"
                ? "bg-slate-800 text-amber-300 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            In Progress ({stats.total - stats.unlocked})
          </button>
        </div>
      </div>

      {/* 3. VISUAL BADGE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBadges.map(({ badge, evaluation, isFeatured }) => {
          const tierStyle = TIER_CONFIG[badge.tier];
          const isUnlocked = evaluation.isUnlocked;

          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              className={`group cursor-pointer rounded-2xl border p-4.5 transition-all duration-200 relative flex flex-col justify-between space-y-4 shadow-lg ${
                isUnlocked
                  ? `bg-gradient-to-br ${tierStyle.badgeBg} ${tierStyle.badgeBorder} ${tierStyle.glowColor}`
                  : "bg-slate-950/80 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-85"
              }`}
            >
              {/* Featured Ribbon / Badge Pin */}
              {isFeatured && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-md">
                  <Pin className="w-2.5 h-2.5 fill-white" />
                  <span>Featured</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Header Row: Tier Emblem & Category */}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-md transition-transform group-hover:scale-105 ${
                      isUnlocked
                        ? `${tierStyle.accentBg} ${tierStyle.ringColor} ring-2`
                        : "bg-slate-900 border-slate-800 text-slate-600"
                    }`}
                  >
                    {isUnlocked ? (
                      getBadgeIcon(badge.iconName, "w-5 h-5")
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2 py-0.5 border ${
                      isUnlocked
                        ? tierStyle.accentBg
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    }`}
                  >
                    {tierStyle.label}
                  </span>
                </div>

                {/* Badge Title & Description */}
                <div>
                  <h3
                    className={`font-display text-base font-bold transition-colors ${
                      isUnlocked
                        ? "text-white group-hover:text-emerald-300"
                        : "text-slate-400"
                    }`}
                  >
                    {badge.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {badge.desc}
                  </p>
                </div>
              </div>

              {/* Progress & Status Footer */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Milestone</span>
                  <span
                    className={`font-semibold ${
                      isUnlocked ? tierStyle.textColor : "text-slate-400"
                    }`}
                  >
                    {evaluation.formattedProgress}
                  </span>
                </div>

                {/* Micro Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isUnlocked
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                    style={{ width: `${evaluation.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">
                    +{badge.xpBonus} XP Bonus
                  </span>
                  <span
                    className={`font-semibold ${
                      isUnlocked ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {isUnlocked ? "Conferred" : "In Progress"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. INTERACTIVE BADGE INSPECTOR MODAL */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          {(() => {
            const evaluation = selectedBadge.evaluate(player);
            const tierStyle = TIER_CONFIG[selectedBadge.tier];
            const isUnlocked = evaluation.isUnlocked;
            const isFeatured = player.featuredBadgeId === selectedBadge.id;

            return (
              <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7 text-slate-100 shadow-2xl space-y-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2 py-0.5 border ${tierStyle.accentBg}`}
                    >
                      {tierStyle.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Category: {selectedBadge.category.replace("_", " & ")}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSelectedBadge(null);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Badge Visual Showcase */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div
                    className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border shadow-xl ${
                      isUnlocked
                        ? `${tierStyle.accentBg} ${tierStyle.ringColor} ring-4`
                        : "bg-slate-950 border-slate-800 text-slate-600"
                    }`}
                  >
                    {isUnlocked ? (
                      getBadgeIcon(selectedBadge.iconName, "w-10 h-10")
                    ) : (
                      <Lock className="w-8 h-8 text-slate-600" />
                    )}
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left">
                    <h3 className="font-display text-xl font-bold text-white">
                      {selectedBadge.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedBadge.desc}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">
                        +{selectedBadge.xpBonus} XP Conferred
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        Target: {selectedBadge.targetMilestone} {selectedBadge.milestoneUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historical Lore / Scholarly Context */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5 text-xs">
                  <span className="font-mono font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                    Academic Lore & Significance
                  </span>
                  <p className="text-slate-300 leading-relaxed italic">
                    &ldquo;{selectedBadge.lore}&rdquo;
                  </p>
                </div>

                {/* Live Milestone Progress Metric */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Milestone Progress:</span>
                    <span
                      className={`font-bold ${
                        isUnlocked ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {evaluation.formattedProgress} ({evaluation.progressPercent}%)
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${evaluation.progressPercent}%` }}
                    />
                  </div>

                  {evaluation.conferredNote && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{evaluation.conferredNote}</span>
                    </div>
                  )}
                </div>

                {/* Actions: Pin / Close */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  {isUnlocked && onSetFeaturedBadge ? (
                    <button
                      onClick={() => handleTogglePin(selectedBadge.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                        isFeatured
                          ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950"
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isFeatured ? "fill-slate-300" : ""}`} />
                      <span>{isFeatured ? "Unpin from Profile Header" : "Set as Featured Badge"}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">
                      Reach milestone to unlock badge and equip to profile
                    </span>
                  )}

                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSelectedBadge(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors ml-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
