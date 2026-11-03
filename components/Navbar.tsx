"use client";

import { Volume2, VolumeX, Flame, Sparkles, Map, Shield, KeyRound, LogIn, LogOut, UserCheck } from "lucide-react";
import { AgeZone } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";
import { PWAInstallButton } from "@/components/PWAInstallButton";

interface NavbarProps {
  ageZone: AgeZone;
  onZoneChange: (zone: AgeZone) => void;
  xp: number;
  level: number;
  streakDays: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRoadmap: () => void;
  onOpenPortals: () => void;
  onOpenAuth: (tab?: "signin" | "register") => void;
  isAuthenticated: boolean;
  userName: string;
  userInitials: string;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  ageZone,
  onZoneChange,
  xp,
  level,
  streakDays,
  soundEnabled,
  onToggleSound,
  onOpenRoadmap,
  onOpenPortals,
  onOpenAuth,
  isAuthenticated,
  userName,
  userInitials,
  onSignOut,
}) => {
  const getZoneLabel = (zone: AgeZone) => {
    switch (zone) {
      case "JUNIOR":
        return "Junior (Ages 6–12)";
      case "TEEN":
        return "Teen (Ages 13–17)";
      case "YOUTH":
        return "Youth (Ages 18–24)";
      case "SENIOR":
        return "Senior (Ages 25–30)";
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0B111E]/95 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-lg shadow-emerald-900/30 font-bold font-mono text-white text-base">
              NP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-extrabold tracking-tight text-white">
                  NaijaPlay
                </span>
                <span className="hidden sm:inline-block rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                  {getZoneLabel(ageZone)}
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                Play. Learn. Compete. Become. · African Academic & Entertainment Ecosystem
              </p>
            </div>
          </div>
        </div>

        {/* Central Controls: Age Zone Switcher (Ages 6 to 30) */}
        <div className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/90 border border-slate-800 p-1">
          <button
            onClick={() => {
              sounds.playClick();
              onZoneChange("JUNIOR");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              ageZone === "JUNIOR"
                ? "bg-emerald-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Junior (6–12)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onZoneChange("TEEN");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              ageZone === "TEEN"
                ? "bg-emerald-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Teen (13–17)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onZoneChange("YOUTH");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              ageZone === "YOUTH"
                ? "bg-emerald-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Youth (18–24)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onZoneChange("SENIOR");
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              ageZone === "SENIOR"
                ? "bg-emerald-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Senior (25–30)
          </button>
        </div>

        {/* Right Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-400 font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streakDays}d Streak</span>
          </div>

          {/* Player Level & XP */}
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 text-xs font-bold text-emerald-300 font-mono">
            <span>Lvl {level}</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              ({xp} XP)
            </span>
          </div>

          {/* Authentication Status / Profile Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("signin");
                }}
                className="flex items-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-white hover:border-emerald-500 transition-colors"
                title={`Signed in as ${userName}. Click to view security details.`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-mono text-white">
                  {userInitials}
                </div>
                <span className="hidden md:inline font-mono text-emerald-300 max-w-[90px] truncate">
                  {userName}
                </span>
                <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  onSignOut();
                }}
                title="Sign Out"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-800/60 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("signin");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("register");
                }}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              onToggleSound();
            }}
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            aria-label="Toggle sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Roadmap & Concept Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenRoadmap();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span>Roadmap</span>
          </button>

          {/* Portals Access */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenPortals();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Portals</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
