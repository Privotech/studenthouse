"use client";

import React from "react";
import {
  Gamepad2,
  Trophy,
  BookOpen,
  Palette,
  Users,
  User,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { NavTab } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const TABS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "compete", label: "Compete", icon: Trophy },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "studio", label: "Studio", icon: Palette },
  { id: "clubs", label: "Clubs", icon: Users },
  { id: "profile", label: "Profile", icon: User },
  { id: "portals", label: "Portals", icon: Shield },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0B111E]/95 backdrop-blur-md px-1 py-2 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-4xl items-center">
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
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-0.5 py-1 text-[9px] sm:flex-none sm:px-2.5 sm:text-[11px] font-medium transition-all ${
                isActive
                  ? "text-emerald-400 bg-emerald-950/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-emerald-400" : ""}`} />
              <span className="mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
