"use client";

import React, { useState } from "react";
import {
  Shield,
  School,
  Clock,
  CheckCircle2,
  Lock,
  UserCheck,
  BookOpen,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { PlayerState } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";

interface ParentAndSchoolPortalProps {
  player: PlayerState;
  onUpdateScreenTime: (minutes: number) => void;
}

export const ParentAndSchoolPortal: React.FC<ParentAndSchoolPortalProps> = ({
  player,
  onUpdateScreenTime,
}) => {
  const [activePortal, setActivePortal] = useState<"parent" | "school">("parent");
  const [screenLimit, setScreenLimit] = useState(player.maxScreenTimeMinutes);
  const [consentSaved, setConsentSaved] = useState(false);

  // Parent toggles
  const [consentCore, setConsentCore] = useState(true);
  const [consentTourneys, setConsentTourneys] = useState(true);
  const [consentCreative, setConsentCreative] = useState(true);
  const [consentClubs, setConsentClubs] = useState(true);

  // School challenge state
  const [assignedChallenge, setAssignedChallenge] = useState(false);

  const handleSaveScreenTime = () => {
    sounds.playCorrect();
    onUpdateScreenTime(screenLimit);
    setConsentSaved(true);
    setTimeout(() => setConsentSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Shield className="w-4 h-4" />
              <span>Module 7 · Institutional & Guardian Ecosystem</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Parent & School Portals
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Equipping parents with screen-time oversight and consent controls, while empowering Nigerian teachers and schools to assign challenges and track student progress.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 border border-slate-800 p-1 self-start md:self-auto">
            <button
              onClick={() => {
                sounds.playClick();
                setActivePortal("parent");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activePortal === "parent" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Parent Portal</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActivePortal("school");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activePortal === "school" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>School Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* PARENT PORTAL VIEW */}
      {activePortal === "parent" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Guardian Screen Time Controls */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Daily Usage & Screen-Time Cap
                </h3>
                <p className="text-xs text-slate-400">
                  Enforces healthy digital habits for {player.displayName} ({player.ageZone} Zone).
                </p>
              </div>
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Today&apos;s Usage:</span>
                <span className="text-amber-400 font-mono font-bold">
                  {player.screenTimeTodayMinutes} / {screenLimit} Minutes
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${Math.min(100, Math.round((player.screenTimeTodayMinutes / screenLimit) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Set Daily Limit (Minutes):</span>
                <span className="font-mono text-indigo-400 font-bold">{screenLimit} mins/day</span>
              </div>
              <input
                type="range"
                min="30"
                max="240"
                step="15"
                value={screenLimit}
                onChange={(e) => setScreenLimit(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>30m (Strict)</span>
                <span>90m (Recommended)</span>
                <span>240m (Max)</span>
              </div>
            </div>

            {consentSaved && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Parental controls updated successfully!</span>
              </div>
            )}

            <button
              onClick={handleSaveScreenTime}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950"
            >
              Save Screen Time Limit
            </button>
          </div>

          {/* NDPA Consent Scopes */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Guardian Consent Scopes (NDPA 2023)
                </h3>
                <p className="text-xs text-slate-400">
                  Granular, revocable permissions for minor accounts.
                </p>
              </div>
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Core Gameplay & Learning</div>
                  <div className="text-[11px] text-slate-400">Access to Trivia, Math Rush, Word Challenge, and Lessons</div>
                </div>
                <input
                  type="checkbox"
                  checked={consentCore}
                  onChange={(e) => setConsentCore(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Tournament Participation</div>
                  <div className="text-[11px] text-slate-400">Registration for School & Regional Competitions</div>
                </div>
                <input
                  type="checkbox"
                  checked={consentTourneys}
                  onChange={(e) => setConsentTourneys(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Creative Studio Submissions</div>
                  <div className="text-[11px] text-slate-400">Publishing drawings and stories to moderated showcase</div>
                </div>
                <input
                  type="checkbox"
                  checked={consentCreative}
                  onChange={(e) => setConsentCreative(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Moderated Club Membership</div>
                  <div className="text-[11px] text-slate-400">Joining school coding, sports, and science clubs</div>
                </div>
                <input
                  type="checkbox"
                  checked={consentClubs}
                  onChange={(e) => setConsentClubs(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500 rounded"
                />
              </label>
            </div>

          </div>
        </div>
      )}

      {/* SCHOOL PORTAL VIEW */}
      {activePortal === "school" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  Verified Institutional Account
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-0.5">
                  King&apos;s College Lagos — Teacher Hub
                </h3>
              </div>
              <School className="w-6 h-6 text-indigo-400" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                <span className="text-[11px] text-slate-400 block">Enrolled Students</span>
                <span className="text-lg font-bold text-white font-mono">240</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                <span className="text-[11px] text-slate-400 block">Active Derby Rank</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">#1 in Lagos</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                <span className="text-[11px] text-slate-400 block">Avg. Completion</span>
                <span className="text-lg font-bold text-amber-400 font-mono">88%</span>
              </div>
            </div>

            {/* Teacher Assignment Tool */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Assign Classroom Challenge
                </h4>
                <span className="text-[11px] text-slate-400">Class: SS2 Gold</span>
              </div>

              <p className="text-xs text-slate-300">
                Current Assignment: <strong className="text-white">African History — The Nok Culture & Benin Earthworks</strong>
              </p>

              {assignedChallenge ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Challenge dispatched to 240 student dashboards!</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sounds.playCorrect();
                    setAssignedChallenge(true);
                  }}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md"
                >
                  Dispatch Challenge to All Students (+100 Class XP)
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
            <h3 className="font-display text-base font-bold text-white border-b border-slate-800 pb-3">
              Top Student Performers This Week
            </h3>

            <div className="space-y-2.5 text-xs">
              {[
                { name: "ChidiExplorer", score: "7,200 XP", status: "All Missions Complete" },
                { name: "Ifeanyi_Pro", score: "8,450 XP", status: "Trivia Derby Leader" },
                { name: "Amina_Tech", score: "6,900 XP", status: "Coding Quest Master" },
                { name: "Bayo_Math", score: "6,400 XP", status: "Brain Rush Gold" },
              ].map((std, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div>
                    <div className="font-semibold text-white">{std.name}</div>
                    <div className="text-[11px] text-slate-400">{std.status}</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{std.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
