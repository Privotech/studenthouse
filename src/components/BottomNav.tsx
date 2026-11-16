"use client";

import React from "react";
import {
  Gamepad2,
  Trophy,
  GraduationCap,
  Palette,
  Users,
  User,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { NavTab } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const TABS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Hub", icon: LayoutDashboard },
  { id: "games", label: "NaijaPlay", icon: Gamepad2 },
  { id: "learn", label: "SkillQuest", icon: GraduationCap },
  { id: "talent", label: "Talent", icon: Sparkles },
  { id: "compete", label: "Compete", icon: Trophy },
  { id: "studio", label: "Studio", icon: Palette },
  { id: "clubs", label: "Clubs", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0B111E]/95 px-2 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-md sm:px-4 lg:px-3 lg:pt-3">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-1 sm:gap-2 lg:gap-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                onTabChange(tab.id);
              }}
              aria-label={tab.label}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 text-[9px] font-medium transition-all sm:px-2 sm:text-[11px] lg:min-h-14 lg:px-3 lg:py-2 lg:text-xs ${
                isActive
                  ? "text-emerald-400 bg-emerald-950/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform lg:h-6 lg:w-6 ${isActive ? "scale-110 text-emerald-400" : ""}`} />
              <span className="mt-1 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
