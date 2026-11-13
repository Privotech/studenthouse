"use client";

import { Volume2, VolumeX, Flame, Map, Shield, KeyRound, LogIn, LogOut, Menu, X, Coins, Bell, Clock, Check } from "lucide-react";
import { useState } from "react";
import { AgeZone, NavTab, NotificationItem } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";
import { PWAInstallButton } from "@/components/PWAInstallButton";

interface NavbarProps {
  ageZone: AgeZone;
  onZoneChange: (zone: AgeZone) => void;
  xp: number;
  level: number;
  streakDays: number;
  coins?: number;
  onOpenRewards?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRoadmap: () => void;
  onOpenPortals: () => void;
  onOpenAuth: (tab?: "signin" | "register") => void;
  isAuthenticated: boolean;
  userName: string;
  userInitials: string;
  onSignOut: () => void;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
  screenTimeTodayMinutes?: number;
  maxScreenTimeMinutes?: number;
  activeTab?: NavTab;
  onNavigateTab?: (tab: NavTab) => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  ageZone,
  onZoneChange,
  xp,
  level,
  streakDays,
  coins = 0,
  onOpenRewards,
  soundEnabled,
  onToggleSound,
  onOpenRoadmap,
  onOpenPortals,
  onOpenAuth,
  isAuthenticated,
  userName,
  userInitials,
  onSignOut,
  notifications = [],
  onMarkAllRead,
  screenTimeTodayMinutes = 0,
  maxScreenTimeMinutes = 120,
  activeTab = "home",
  onNavigateTab,
}) => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

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
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0B111E]/95 backdrop-blur-md px-2 sm:px-4 lg:px-3 py-3 sm:py-3.5">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 sm:gap-4 lg:gap-5">
        {/* Brand & Identity */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-lg shadow-emerald-900/30 font-bold font-mono text-white text-base sm:text-lg">
              NP
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-white">
                  NaijaPlay Ecosystem
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono font-semibold text-emerald-400">
                  · {getZoneLabel(ageZone)}
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                NaijaPlay · SkillQuest · Talent Arena · Shared Progress & Safeguarding
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <div className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-mono ml-2">
              {(
                [
                  { id: "home", label: "Hub", activeMatch: ["home"] },
                  { id: "games", label: "NaijaPlay", activeMatch: ["games", "compete", "studio", "clubs"] },
                  { id: "learn", label: "SkillQuest", activeMatch: ["learn"] },
                  { id: "talent", label: "Talent Arena", activeMatch: ["talent"] },
                ] as const
              ).map((item) => {
                const isProdActive = (item.activeMatch as readonly string[]).includes(activeTab);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onNavigateTab(item.id);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 font-semibold transition-colors whitespace-nowrap ${
                      isProdActive
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/60 px-2.5 py-1.5 text-xs font-bold text-emerald-300 font-mono">
            Lvl {level}
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navbar-menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Central Controls: Age Tier (Locked when signed in / registered) */}
        {isAuthenticated ? (
          <div className="hidden 2xl:flex items-center gap-2 rounded-xl bg-slate-900/90 border border-emerald-900/40 px-3.5 py-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-400">Academic Tier:</span>
              <span className="font-bold text-emerald-300">{getZoneLabel(ageZone)}</span>
            </div>
            <span className="ml-1 text-[10px] font-mono text-slate-400 flex items-center gap-1" title="Age tier is permanently calibrated to your verified academic record and cannot be changed">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Locked</span>
            </span>
          </div>
        ) : (
          <div className="hidden 2xl:flex items-center gap-1 rounded-xl bg-slate-900/90 border border-slate-800 p-1.5">
            <button
              onClick={() => {
                sounds.playClick();
                onZoneChange("JUNIOR");
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                ageZone === "SENIOR"
                  ? "bg-emerald-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Senior (25–30)
            </button>
          </div>
        )}

        {/* Right Stats & Actions */}
        <div
          id="mobile-navbar-menu"
          className={`${mobileMenuOpen ? "flex" : "hidden"} w-full shrink-0 flex-wrap items-center justify-start gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-2 sm:w-auto sm:justify-end sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0 lg:gap-3 xl:gap-3.5 sm:flex`}
        >
          {onNavigateTab && (
            <div className="flex w-full items-center gap-1 rounded-lg bg-slate-900/90 p-1 lg:hidden">
              {(
                [
                  { id: "home", label: "Hub" },
                  { id: "games", label: "NaijaPlay" },
                  { id: "learn", label: "SkillQuest" },
                  { id: "talent", label: "Talent Arena" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onNavigateTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 rounded-md px-2 py-2 text-[11px] font-semibold transition-colors ${
                    activeTab === item.id
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex w-full items-center justify-between gap-1 rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2 sm:hidden">
              <span className="text-xs text-slate-400 font-mono">Calibrated Tier:</span>
              <span className="text-xs font-bold font-mono text-emerald-300 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                {getZoneLabel(ageZone)} (Locked)
              </span>
            </div>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-1 rounded-lg bg-slate-900/90 p-1 sm:hidden">
              {(["JUNIOR", "TEEN", "YOUTH", "SENIOR"] as const).map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onZoneChange(zone);
                    setMobileMenuOpen(false);
                  }}
                  aria-pressed={ageZone === zone}
                  className={`flex-1 rounded-md px-2 py-2 text-[11px] font-semibold transition-colors ${
                    ageZone === zone
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {zone === "JUNIOR" ? "Junior" : zone === "TEEN" ? "Teen" : zone === "YOUTH" ? "Youth" : "Senior"}
                </button>
              ))}
            </div>
          )}

          {/* Daily Streak */}
          <div className="hidden 2xl:flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-amber-400 font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streakDays}d Streak</span>
          </div>

          {/* Active Screen-Time Usage Indicator (for Authenticated Users) */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenPortals();
              }}
              title="Today's active screen time & Guardian control cap"
              className="hidden xl:flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-[11px] font-mono text-slate-300 hover:border-indigo-500/50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{screenTimeTodayMinutes}/{maxScreenTimeMinutes}m</span>
            </button>
          )}

          {/* Player Level & XP */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1.5 text-xs font-bold text-emerald-300 font-mono">
            <span>Lvl {level}</span>
            <span className="text-slate-400 text-[11px] hidden 2xl:inline">
              ({xp} XP)
            </span>
          </div>

          {/* Notifications & Announcements Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setNotifOpen((prev) => !prev);
              }}
              aria-label="Notifications and Announcements"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-mono font-extrabold text-slate-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">
                      Notifications & Announcements
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Platform updates, verified scores & safety alerts
                    </p>
                  </div>
                  {onMarkAllRead && unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onMarkAllRead();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">
                      No notifications right now.
                    </p>
                  ) : (
                    notifications.slice(0, 12).map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 text-xs space-y-1 ${
                          item.readAt
                            ? "border-slate-800/60 bg-slate-950/50 text-slate-400"
                            : "border-emerald-800/50 bg-slate-950 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                          <span className="font-bold text-emerald-400">
                            {item.category}
                          </span>
                          <span className="text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-semibold text-white">{item.title}</div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {item.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pan-African Rewards & Airtime Store Button */}
          {onOpenRewards && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenRewards();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 px-2.5 py-1.5 text-xs font-bold text-amber-300 font-mono hover:bg-amber-900/40 transition-colors shadow-sm"
              title="Pan-African Rewards Store · Redeem Airtime & Vouchers"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{coins > 0 ? coins.toLocaleString() : "1,850"}</span>
            </button>
          )}


          {/* Authentication Status / Profile Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("signin");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-bold text-white hover:border-emerald-500 transition-colors"
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
                  setMobileMenuOpen(false);
                }}
                title="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-800/60 transition-colors"
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
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("register");
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition-colors"
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
              setMobileMenuOpen(false);
            }}
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
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
              setMobileMenuOpen(false);
            }}
            className="hidden 2xl:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span>Roadmap</span>
          </button>

          {/* Portals Access */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenPortals();
              setMobileMenuOpen(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 sm:px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden 2xl:inline">Portals</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};

