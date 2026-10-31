"use client";

import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Flame,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { AgeZone, ClubItem } from "@/types/naijaplay";
import { CLUBS } from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface ClubsAndCommunityProps {
  ageZone: AgeZone;
  onAwardXP: (amount: number, reason: string) => void;
}

export const ClubsAndCommunity: React.FC<ClubsAndCommunityProps> = ({
  ageZone,
  onAwardXP,
}) => {
  const [clubs, setClubs] = useState<ClubItem[]>(CLUBS);
  const [selectedClub, setSelectedClub] = useState<ClubItem>(CLUBS[0]!);

  const handleToggleJoin = (clubId: string) => {
    sounds.playTrophy();
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id === clubId) {
          const willJoin = !c.isJoined;
          if (willJoin) {
            onAwardXP(50, `Joined Academic Society: ${c.name}`);
          }
          const updated = {
            ...c,
            isJoined: willJoin,
            membersCount: willJoin ? c.membersCount + 1 : c.membersCount - 1,
          };
          if (selectedClub.id === clubId) {
            setSelectedClub(updated);
          }
          return updated;
        }
        return c;
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Users className="w-4 h-4" />
              <span>Module 5 · Academic Societies & Research Circles</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Scholarly Communities & Societies
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Collaborate around computer science, quantitative mathematics, biotechnology, and constitutional law. Structured group sessions with zero unmoderated private DMs.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>NDPA Safe Community Standard Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Clubs Directory (Left Column) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 font-mono">
            Browse Academic Societies ({clubs.length})
          </div>

          <div className="space-y-3">
            {clubs.map((club) => {
              const isSelected = selectedClub.id === club.id;
              return (
                <div
                  key={club.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedClub(club);
                  }}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition-all shadow-md ${
                    isSelected
                      ? "border-emerald-500 bg-slate-900 shadow-emerald-950/40"
                      : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-white">
                          {club.name}
                        </span>
                        {club.isJoined && (
                          <span className="rounded bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                            Enrolled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {club.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                    <span>{club.membersCount.toLocaleString()} Scholars</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {club.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Club Hub & Activities (Right Column) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 shadow-xl">
          <div className="rounded-xl bg-slate-950 p-5 space-y-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
                {selectedClub.category} Society
              </span>
              <span className="font-mono text-xs text-slate-400">
                {selectedClub.membersCount.toLocaleString()} Active Scholars
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-white">
              {selectedClub.name}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedClub.tagline}
            </p>

            <div className="pt-2">
              <button
                onClick={() => handleToggleJoin(selectedClub.id)}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-md ${
                  selectedClub.isJoined
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950"
                }`}
              >
                {selectedClub.isJoined ? "Leave Society" : "Join Society (+50 XP)"}
              </button>
            </div>
          </div>

          {/* Academic Activities */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              Active Society Curriculum & Problem Sets
            </h4>
            <div className="space-y-2">
              {selectedClub.activities.map((act, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{act}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">+40 XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
