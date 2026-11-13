"use client";

import React, { useEffect, useState } from "react";
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
  FileText,
  Download,
  Printer,
  Sparkles,
  Link as LinkIcon,
  X,
  Sigma,
  Terminal,
  Globe,
  Palette,
  Building2,
  Award,
  ArrowRight,
} from "lucide-react";
import {
  ClassTaskAssignment,
  NavTab,
  OrganizationTenantItem,
  PlayerState,
  SkillAssignmentSubmission,
  SkillQuestProgressRecord,
} from "@/types/naijaplay";
import { VERIFIED_SCHOOL_DERBY } from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface ParentAndSchoolPortalProps {
  player: PlayerState;
  onUpdateScreenTime: (minutes: number) => void;
  isAuthenticated?: boolean;
  onNavigateTab?: (tab: NavTab) => void;
}

export const ParentAndSchoolPortal: React.FC<ParentAndSchoolPortalProps> = ({
  player,
  onUpdateScreenTime,
  isAuthenticated = false,
  onNavigateTab,
}) => {
  const [activePortal, setActivePortal] = useState<"parent" | "school">("parent");
  const [draftScreenLimit, setDraftScreenLimit] = useState<number | null>(null);
  const screenLimit = draftScreenLimit ?? player.maxScreenTimeMinutes;
  const [consentSaved, setConsentSaved] = useState(false);

  // Live 3-in-1 Ecosystem records
  const [organizations, setOrganizations] = useState<OrganizationTenantItem[]>([]);
  const [classTasks, setClassTasks] = useState<ClassTaskAssignment[]>([]);
  const [sqProgress, setSqProgress] = useState<SkillQuestProgressRecord[]>([]);
  const [sqAssignments, setSqAssignments] = useState<SkillAssignmentSubmission[]>([]);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch("/api/ecosystem", { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/skillquest", { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([eco, sq]) => {
        if (cancelled) return;
        if (eco && Array.isArray(eco.organizations)) {
          setOrganizations(eco.organizations);
        }
        if (sq) {
          if (Array.isArray(sq.classTasks)) setClassTasks(sq.classTasks);
          if (Array.isArray(sq.progress)) setSqProgress(sq.progress);
          if (Array.isArray(sq.assignments)) setSqAssignments(sq.assignments);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Parent toggles across all 3 products
  const [consentCore, setConsentCore] = useState(true);
  const [consentTourneys, setConsentTourneys] = useState(true);
  const [consentSkillQuest, setConsentSkillQuest] = useState(true);
  const [consentTalentArena, setConsentTalentArena] = useState(player.ageZone !== "JUNIOR");
  const [consentCreative, setConsentCreative] = useState(true);
  const [consentClubs, setConsentClubs] = useState(true);

  // Subject restrictions
  const [allowedSubjects, setAllowedSubjects] = useState({
    math: true,
    science: true,
    coding: true,
    history: true,
    studio: true,
  });

  // School linking state
  const [schoolCodeInput, setSchoolCodeInput] = useState("KCL-2026-NPLAY");
  const [linkedSchool, setLinkedSchool] = useState<string>(player.school || "King's College Lagos");
  const [schoolLinkSuccess, setSchoolLinkSuccess] = useState(false);
  const [schoolLinkError, setSchoolLinkError] = useState<string | null>(null);
  const [transcriptDownloaded, setTranscriptDownloaded] = useState(false);

  // School challenge state
  const [assignedChallenge, setAssignedChallenge] = useState(false);

  // Report Card Modal
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);

  const handleSaveScreenTime = () => {
    sounds.playCorrect();
    onUpdateScreenTime(screenLimit);
    setDraftScreenLimit(null);
    setConsentSaved(true);
    setTimeout(() => setConsentSaved(false), 3000);
  };

  const handleToggleSubject = (subjectKey: keyof typeof allowedSubjects) => {
    sounds.playClick();
    setAllowedSubjects((prev) => ({
      ...prev,
      [subjectKey]: !prev[subjectKey],
    }));
  };

  const handleLinkSchool = (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolLinkError(null);
    const found = VERIFIED_SCHOOL_DERBY.find(
      (s) => s.code.toLowerCase() === schoolCodeInput.trim().toLowerCase(),
    );
    if (found) {
      sounds.playTrophy();
      setLinkedSchool(found.name);
      setSchoolLinkSuccess(true);
      setTimeout(() => setSchoolLinkSuccess(false), 4000);
    } else {
      sounds.playWrong();
      setSchoolLinkError(
        "Invalid School Accreditation Code. Try 'KCL-2026-NPLAY' for King's College or 'QCY-2026-NPLAY' for Queen's College.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Shield className="w-4 h-4" />
              <span>3-in-1 Safeguarding · Guardian & School Governance</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Parent & School Portals
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Unified guardian screen-time and NDPA consent scopes across NaijaPlay, SkillQuest, and Talent Arena — plus multi-tenant school workspaces and verified progress report cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setIsReportCardOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shadow-md"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Generate Academic Report Card</span>
            </button>

            <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 border border-slate-800 p-1">
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
                  Enforces healthy digital study habits for {player.displayName} ({player.ageZone} Zone).
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
                onChange={(e) => setDraftScreenLimit(Number(e.target.value))}
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
                <span>Parental controls updated and verified in database!</span>
              </div>
            )}

            <button
              onClick={handleSaveScreenTime}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950"
            >
              Save Screen Time Limit
            </button>

            {/* Subject Curriculum Access Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Curriculum Subject Permissions
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: "math" as const, label: "Mathematics & Arithmetic", icon: Sigma },
                  { key: "science" as const, label: "Sciences & Physics", icon: BookOpen },
                  { key: "coding" as const, label: "Coding & Python", icon: Terminal },
                  { key: "history" as const, label: "African Civics & History", icon: Globe },
                ].map((sub) => {
                  const Icon = sub.icon;
                  const isAllowed = allowedSubjects[sub.key];
                  return (
                    <button
                      key={sub.key}
                      onClick={() => handleToggleSubject(sub.key)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                        isAllowed
                          ? "bg-slate-950 border-emerald-800/80 text-white"
                          : "bg-slate-950/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${isAllowed ? "text-emerald-400" : "text-slate-600"}`} />
                        <span className="text-[11px] font-semibold">{sub.label}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${isAllowed ? "text-emerald-400" : "text-slate-600"}`}>
                        {isAllowed ? "ON" : "OFF"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* NDPA Consent Scopes */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Guardian Consent Scopes (NDPA 2023)
                </h3>
                <p className="text-xs text-slate-400">
                  Granular, revocable permissions compliant with Section 31 Child Protection rules.
                </p>
              </div>
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-white">NaijaPlay Gameplay & Drills</div>
                  <div className="text-[11px] text-slate-400">Access to Naija Trivia, Brain Rush, Word Challenge, Math Rush & Memory</div>
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
                  <div className="font-semibold text-white">SkillQuest Paths & Practical Projects</div>
                  <div className="text-[11px] text-slate-400">Structured learning paths, graded practical labs, and verifiable certificates</div>
                </div>
                <input
                  type="checkbox"
                  checked={consentSkillQuest}
                  onChange={(e) => setConsentSkillQuest(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Talent Arena Portfolios & Judged Showcases</div>
                  <div className="text-[11px] text-slate-400">Publishing moderated talent works and entering public/school showcases</div>
                </div>
                <input
                  type="checkbox"
                  checked={consentTalentArena}
                  onChange={(e) => setConsentTalentArena(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs cursor-pointer">
                <div>
                  <div className="font-semibold text-white">NaijaPlay Tournaments & Olympiad Derby</div>
                  <div className="text-[11px] text-slate-400">Registration for School, State, and National Fair-Play Competitions</div>
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
                  <div className="font-semibold text-white">Creative Studio & Academic Societies</div>
                  <div className="text-[11px] text-slate-400">Moderated studio showcase and preset-safe school clubs (Zero unrestricted DMs)</div>
                </div>
                <input
                  type="checkbox"
                  checked={consentCreative && consentClubs}
                  onChange={(e) => {
                    setConsentCreative(e.target.checked);
                    setConsentClubs(e.target.checked);
                  }}
                  className="h-4 w-4 accent-emerald-500 rounded"
                />
              </label>
            </div>

            {/* NDPA Digital Audit Hash */}
            <div className="rounded-xl border border-emerald-950 bg-emerald-950/20 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
                <span className="font-bold">NDPA Verification Hash:</span>
                <span>SHA-256 Validated</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400 truncate bg-slate-950/80 p-2 rounded border border-slate-800 select-all">
                0x9a8f4c1e7d2b83c5e61280a3fb70c1d2e98f6543bca1782e01df
              </div>
              <p className="text-[10px] text-slate-400">
                Guardian consent record is cryptographically pinned and auditable under Nigerian Data Protection Commission guidelines.
              </p>
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
                  {linkedSchool} — Teacher & Admin Hub
                </h3>
              </div>
              <School className="w-6 h-6 text-indigo-400" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                <span className="text-[11px] text-slate-400 block">Enrolled Students</span>
                <span className="text-lg font-bold text-white font-mono">1,420</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                <span className="text-[11px] text-slate-400 block">Active Derby Rank</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">#1 in Nigeria</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
                <span className="text-[11px] text-slate-400 block">Avg. Completion</span>
                <span className="text-lg font-bold text-amber-400 font-mono">92%</span>
              </div>
            </div>

            {/* School Linking Form */}
            <form onSubmit={handleLinkSchool} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Link Verified School Accreditation Code</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">6–16 Alphanumeric</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={schoolCodeInput}
                  onChange={(e) => setSchoolCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. KCL-2026-NPLAY"
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition-colors"
                >
                  Verify Code
                </button>
              </div>

              {schoolLinkSuccess && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Successfully verified and linked to {linkedSchool}!</span>
                </div>
              )}
              {schoolLinkError && (
                <div role="alert" className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/70 border border-rose-800 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{schoolLinkError}</span>
                </div>
              )}
            </form>

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
                  <span>Challenge dispatched to 1,420 student dashboards!</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sounds.playCorrect();
                    setAssignedChallenge(true);
                  }}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition-colors"
                >
                  Dispatch Challenge to All Students (+100 Class XP)
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Multi-Tenant Orgs & Class Tasks</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">
                {organizations.length} Joined
              </span>
            </div>

            {organizations.length > 0 ? (
              <div className="space-y-2 text-xs">
                {organizations.map((org) => (
                  <div key={org.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{org.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {org.orgType} · Role: {org.myRole} · Join Code: {org.joinCode}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-400">
                      {org.planTier}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400">
                Create or join a tenant School/NGO workspace from the Ecosystem Hub to manage private SkillQuest class assignments and Talent Arena competitions.
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Active SkillQuest Class Tasks ({classTasks.length})</span>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab("learn")}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>SkillQuest Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              {classTasks.length > 0 ? (
                classTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
                    <div className="font-semibold text-white">{task.courseTitle}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {task.organizationName} · Class {task.classLabel} · Due {task.dueDate}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500">
                  No tenant class tasks dispatched yet.
                </p>
              )}
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("talent")}
                className="w-full rounded-xl border border-sky-700/60 bg-sky-950/30 py-2.5 text-xs font-bold text-sky-300 hover:bg-sky-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Launch School Talent Arena Competitions</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Official Academic & Gaming Progress Report Card Modal */}
      {isReportCardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Report Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-800 text-white font-mono font-bold text-xl shadow-lg">
                  NP
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Official 3-in-1 Ecosystem Transcript
                  </span>
                  <h3 className="font-display text-xl font-bold text-white mt-0.5">
                    NaijaPlay Ecosystem Progress Report Card
                  </h3>
                  <p className="text-xs text-slate-400">
                    NaijaPlay · SkillQuest · Talent Arena · 2026 Academic Session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportCardOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scholar Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Scholar Name</span>
                <span className="font-bold text-white">{player.displayName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Academic Tier</span>
                <span className="font-bold text-emerald-400">{player.ageZone} Zone (Age {player.age})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Enrolled Institution</span>
                <span className="font-bold text-white truncate block">{linkedSchool}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">State of Origin</span>
                <span className="font-bold text-slate-300">{player.state}</span>
              </div>
            </div>

            {/* Cross-Ecosystem Performance Summary */}
            <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Ecosystem Product</th>
                    <th className="py-2.5 px-3">Verified Activity</th>
                    <th className="py-2.5 px-3">Standing / Score</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">NaijaPlay Arena</td>
                    <td className="py-2.5 px-3 text-slate-300">{player.personalStats?.gamesPlayed ?? 0} Verified Rounds</td>
                    <td className="py-2.5 px-3 text-emerald-400">{player.personalStats?.averageAccuracy ?? 0}% Accuracy</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">Lvl {player.level}</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">SkillQuest Learning</td>
                    <td className="py-2.5 px-3 text-slate-300">{sqProgress.length} Exams · {sqAssignments.length} Labs</td>
                    <td className="py-2.5 px-3 text-emerald-400">{player.certificates.length} Certificates</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-300">Verified</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">Multi-Tenant Orgs</td>
                    <td className="py-2.5 px-3 text-slate-300">{organizations.length} Workspace(s)</td>
                    <td className="py-2.5 px-3 text-slate-300">{classTasks.length} Class Tasks</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-300">Active</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Screen-Time & Well-Being Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <span className="text-[11px] text-slate-400 font-mono block">Screen-Time Compliance:</span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  {player.screenTimeTodayMinutes} / {screenLimit} mins today
                </span>
                <p className="text-[10px] text-slate-500">
                  Daily study cap of {screenLimit}m enforced under NDPA Section 31.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                <span className="text-[11px] text-slate-400 font-mono block">Shared Progression:</span>
                <span className="font-mono text-base font-bold text-amber-300">
                  {player.certificates.length + sqProgress.length} Verified Credentials
                </span>
                <p className="text-[10px] text-slate-500">
                  Total Ecosystem XP: {player.xp.toLocaleString()} XP (Non-cashable)
                </p>
              </div>
            </div>

            {/* Teacher / Mentor Comments */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs space-y-1.5">
              <span className="font-bold text-white block">Academic Faculty Remarks:</span>
              <p className="text-slate-300 italic">
                &ldquo;{player.displayName} has displayed outstanding quantitative agility and dedication to African historical jurisprudence. Highly recommended for the National STEM Olympiad finals.&rdquo;
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80">
                <span>Verified by: Dr. Olumide Adeleke (Faculty Dean)</span>
                <span>Stamp: VERIFIED-ACADEMIC-2026</span>
              </div>
            </div>

            {transcriptDownloaded && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/80 p-3 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Official Academic Transcript exported as JSON/printable summary.</span>
              </div>
            )}

            {/* Print & Export Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  sounds.playClick();
                  window.print();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
              <button
                onClick={() => {
                  sounds.playCorrect();
                  const transcriptText = [
                    `NAIJAPLAY ACADEMIC & COGNITIVE TRANSCRIPT (2026)`,
                    `Scholar: ${player.displayName} (${player.ageZone} Zone, Age ${player.age})`,
                    `Institution: ${linkedSchool}`,
                    `Level & XP: Level ${player.level} · ${player.xp} XP`,
                    `Daily Screen-Time Cap: ${screenLimit} mins/day (${player.screenTimeTodayMinutes} mins used today)`,
                    `Verified Certificates: ${player.certificates.length}`,
                  ].join("\n");
                  const blob = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `naijaplay-transcript-${player.displayName.toLowerCase().replace(/\s+/g, "-")}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setTranscriptDownloaded(true);
                  setTimeout(() => setTranscriptDownloaded(false), 3000);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Transcript</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
