"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  ExternalLink,
  FolderKanban,
  Gavel,
  Layers,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";
import {
  AgeZone,
  OrganizationTenantItem,
  TalentCategory,
  TalentCompetitionItem,
  TalentCompetitionSubmission,
  TalentProfileData,
} from "@/types/naijaplay";
import {
  INITIAL_TALENT_COMPETITIONS,
  INITIAL_TALENT_SHOWCASE_PROFILES,
  INITIAL_TALENT_SUBMISSIONS,
} from "@/data/ecosystemData";
import { sounds } from "@/lib/audio";

interface TalentArenaPortalProps {
  ageZone: AgeZone;
  playerDisplayName: string;
  isAuthenticated: boolean;
  onRequestAuth: (tab?: "signin" | "register") => void;
  onAwardXP: (amount: number, reason: string) => void;
}

type TalentTab = "competitions" | "showcases" | "portfolio" | "organizer_judge";

const TALENT_CATEGORIES: TalentCategory[] = [
  "Software & AI",
  "Digital Art & Design",
  "Engineering & Robotics",
  "Creative Writing & Debate",
  "STEM Research",
];

export const TalentArenaPortal: React.FC<TalentArenaPortalProps> = ({
  ageZone,
  playerDisplayName,
  isAuthenticated,
  onRequestAuth,
  onAwardXP,
}) => {
  const [activeTab, setActiveTab] = useState<TalentTab>("competitions");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [profiles, setProfiles] = useState<TalentProfileData[]>(
    INITIAL_TALENT_SHOWCASE_PROFILES,
  );
  const [myProfile, setMyProfile] = useState<TalentProfileData | null>(null);
  const [competitions, setCompetitions] = useState<TalentCompetitionItem[]>(
    INITIAL_TALENT_COMPETITIONS,
  );
  const [submissions, setSubmissions] = useState<TalentCompetitionSubmission[]>(
    INITIAL_TALENT_SUBMISSIONS,
  );
  const [organizations, setOrganizations] = useState<OrganizationTenantItem[]>([]);

  // Selected competition for entry / results / judging
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(
    INITIAL_TALENT_COMPETITIONS[0]?.id ?? "",
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Entry submission state
  const [entryTitle, setEntryTitle] = useState("");
  const [entryCategory, setEntryCategory] = useState<TalentCategory>("Software & AI");
  const [entrySummary, setEntrySummary] = useState("");
  const [entryUrl, setEntryUrl] = useState("");

  // My Portfolio profile form state
  const [headline, setHeadline] = useState("");
  const [primaryCategory, setPrimaryCategory] =
    useState<TalentCategory>("Software & AI");
  const [bio, setBio] = useState("");
  const [skillsText, setSkillsText] = useState("TypeScript, System Design, UI Architecture");
  const [projTitle, setProjTitle] = useState("");
  const [projCategory, setProjCategory] = useState<TalentCategory>("Software & AI");
  const [projSummary, setProjSummary] = useState("");
  const [projUrl, setProjUrl] = useState("");

  // Competition Creator state
  const [newCompTitle, setNewCompTitle] = useState("");
  const [newCompCategory, setNewCompCategory] =
    useState<TalentCategory>("Software & AI");
  const [newCompVisibility, setNewCompVisibility] = useState<
    "PUBLIC" | "SCHOOL_ORG" | "SPONSORED"
  >("PUBLIC");
  const [newCompOrgId, setNewCompOrgId] = useState("");
  const [newCompSponsor, setNewCompSponsor] = useState("");
  const [newCompDeadline, setNewCompDeadline] = useState("2026-12-30");
  const [newCompAward, setNewCompAward] = useState(
    "Verified Finalist Certificate + Lab Fellowship",
  );

  // Judge Scoring State per submissionId
  const [judgeDrafts, setJudgeDrafts] = useState<
    Record<string, { scores: Record<string, number>; feedback: string }>
  >({});

  // Certificate modal for finalist recognition
  const [certTarget, setCertTarget] = useState<{
    participantName: string;
    projectTitle: string;
    competitionTitle: string;
    averageScore: number;
    rank: number;
  } | null>(null);

  const loadTalentArena = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    fetch("/api/talent-arena", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.profiles)) setProfiles(data.profiles);
        if (Array.isArray(data.competitions)) {
          setCompetitions(data.competitions);
          if (data.competitions.length > 0 && !selectedCompetitionId) {
            setSelectedCompetitionId(data.competitions[0].id);
          }
        }
        if (Array.isArray(data.submissions)) setSubmissions(data.submissions);
        if (Array.isArray(data.organizations)) {
          setOrganizations(data.organizations);
          if (data.organizations[0]?.id) setNewCompOrgId(data.organizations[0].id);
        }
        if (data.myProfile) {
          setMyProfile(data.myProfile);
          setHeadline(data.myProfile.headline);
          setPrimaryCategory(data.myProfile.primaryCategory);
          setBio(data.myProfile.bio);
          setSkillsText((data.myProfile.skills ?? []).join(", "));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadTalentArena();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const callApi = async (payload: Record<string, unknown>) => {
    setErrorMessage(null);
    setStatusMessage(null);
    if (!isAuthenticated) {
      onRequestAuth("signin");
      return null;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    const res = await fetch("/api/talent-arena", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMessage(data.error || "Action could not be completed.");
      return null;
    }
    return data;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const data = await callApi({
      action: "save_profile",
      headline,
      primaryCategory,
      bio,
      skills,
    });
    if (data?.profile) {
      setMyProfile(data.profile);
      setProfiles((prev) => [
        data.profile,
        ...prev.filter((p) => p.userId !== data.profile.userId),
      ]);
      sounds.playCorrect();
      setStatusMessage("Talent profile saved and listed in Approved Showcases.");
    }
  };

  const handleAddPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callApi({
      action: "add_portfolio_item",
      title: projTitle,
      category: projCategory,
      summary: projSummary,
      mediaUrl: projUrl,
      tags: [projCategory.split(" ")[0] || "Talent", ageZone],
    });
    if (data?.profile) {
      setMyProfile(data.profile);
      setProfiles((prev) => [
        data.profile,
        ...prev.filter((p) => p.userId !== data.profile.userId),
      ]);
      setProjTitle("");
      setProjSummary("");
      setProjUrl("");
      sounds.playTrophy();
      setStatusMessage("Project added to your Talent Arena portfolio.");
      onAwardXP(40, "Talent Portfolio Publication");
    }
  };

  const handleSubmitCompetitionEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callApi({
      action: "submit_entry",
      competitionId: selectedCompetitionId,
      projectTitle: entryTitle,
      category: entryCategory,
      projectSummary: entrySummary,
      artifactUrl: entryUrl,
    });
    if (data?.submission) {
      setSubmissions((prev) => [data.submission, ...prev]);
      setEntryTitle("");
      setEntrySummary("");
      setEntryUrl("");
      sounds.playTrophy();
      setStatusMessage("Competition entry registered and ready for rubric judging.");
      onAwardXP(60, "Talent Arena Competition Entry");
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callApi({
      action: "create_competition",
      title: newCompTitle,
      category: newCompCategory,
      visibility: newCompVisibility,
      organizationId: newCompVisibility === "SCHOOL_ORG" ? newCompOrgId : null,
      sponsorName: newCompVisibility === "SPONSORED" ? newCompSponsor : null,
      targetZone: "ALL",
      deadline: newCompDeadline,
      recognitionAward: newCompAward,
    });
    if (data?.competition) {
      setCompetitions((prev) => [data.competition, ...prev]);
      setSelectedCompetitionId(data.competition.id);
      setNewCompTitle("");
      setNewCompSponsor("");
      sounds.playTrophy();
      setStatusMessage("Competition created with structured rubric & fair-play safeguards.");
    }
  };

  const handleSubmitJudgeScore = async (sub: TalentCompetitionSubmission) => {
    const activeComp = competitions.find((c) => c.id === sub.competitionId);
    if (!activeComp) return;
    const draft = judgeDrafts[sub.id];
    const scoresByCriterion: Record<string, number> = {};
    for (const crit of activeComp.rubric) {
      scoresByCriterion[crit.id] = draft?.scores[crit.id] ?? Math.round(crit.maxPoints * 0.8);
    }
    const feedback =
      draft?.feedback?.trim() ||
      "Clear methodology and solid technical execution under competition rubric.";

    const data = await callApi({
      action: "submit_judge_score",
      competitionId: activeComp.id,
      submissionId: sub.id,
      scoresByCriterion,
      feedback,
    });
    if (data?.scorecard) {
      sounds.playCorrect();
      setStatusMessage(
        `Judge scorecard saved (${data.scorecard.totalScore}/100) without overwriting peer judges.`,
      );
      loadTalentArena();
    }
  };

  const activeCompetition =
    competitions.find((c) => c.id === selectedCompetitionId) ?? competitions[0];
  const competitionSubmissions = activeCompetition
    ? submissions
        .filter((s) => s.competitionId === activeCompetition.id)
        .sort((a, b) => b.averageScore - a.averageScore)
    : [];

  const filteredProfiles = profiles.filter((p) => {
    const matchesCat =
      selectedCategory === "ALL" || p.primaryCategory === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-[#111229] p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Talent Arena · Portfolios, Showcases & Judged Competitions</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-normal normal-case">
                {competitions.length} Active Challenges · {profiles.length} Verified Portfolios
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Discover. Showcase. Compete. Get Recognised.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Publish real engineering, software, art, and research portfolios, enter blind-rubric talent cups, and collect merit-based judge feedback and finalist certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-1.5 text-xs font-mono">
            {(
              [
                { id: "competitions", label: "Competitions", icon: Trophy },
                { id: "showcases", label: "Talent Showcases", icon: Compass },
                { id: "portfolio", label: "My Portfolio", icon: Briefcase },
                { id: "organizer_judge", label: "Organizer & Judge", icon: Gavel },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab(tab.id);
                    setErrorMessage(null);
                    setStatusMessage(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold transition-colors ${
                    active
                      ? "bg-sky-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-rose-700/60 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
          {errorMessage}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 1: COMPETITIONS, SPONSORED CHALLENGES & FINALIST RESULTS     */}
      {/* ================================================================ */}
      {activeTab === "competitions" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Competition List */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="font-display text-base font-bold text-white px-1">
              Open Showcases & Sponsored Challenges
            </h2>
            {competitions.map((comp) => {
              const isSelected = activeCompetition?.id === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCompetitionId(comp.id);
                  }}
                  className={`w-full text-left rounded-2xl border p-4.5 transition-all space-y-2 ${
                    isSelected
                      ? "border-sky-500 bg-sky-950/25 shadow-lg"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-sky-400 font-bold">{comp.category}</span>
                    <span className="text-slate-400">
                      {comp.visibility.replace("_", " ")} · {comp.status}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-white">
                    {comp.title}
                  </h3>
                  {comp.sponsorshipDisclosure && (
                    <p className="text-[11px] text-amber-300/90 leading-snug">
                      Sponsor: {comp.sponsorName} · Merit Judging Guaranteed
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <span>Deadline: {comp.deadline}</span>
                    <span className="text-slate-200 tabular-nums">
                      {comp.submissionsCount} Entries
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Competition Workspace: Rubric, Standings, Entry Form */}
          {activeCompetition && (
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-sky-400">
                    <span>{activeCompetition.category}</span>
                    <span className="text-slate-600">·</span>
                    <span>Zone: {activeCompetition.targetZone}</span>
                    <span className="text-slate-600">·</span>
                    <span>Organizer: {activeCompetition.organizerName}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {activeCompetition.title}
                  </h2>
                  <p className="text-xs text-amber-300 font-mono">
                    Recognition: {activeCompetition.recognitionAward}
                  </p>
                </div>

                {activeCompetition.sponsorshipDisclosure && (
                  <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-200 leading-relaxed">
                    <Shield className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
                    {activeCompetition.sponsorshipDisclosure}
                  </div>
                )}

                {/* Weighted Rubric */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase block">
                    Transparent Scoring Rubric (100 Points Total)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {activeCompetition.rubric.map((crit) => (
                      <div
                        key={crit.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-white">{crit.label}</span>
                          <span className="text-sky-400 font-bold tabular-nums">
                            /{crit.maxPoints}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {crit.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Standings & Finalist Feedback */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-white">
                      Submitted Projects & Judge Standings ({competitionSubmissions.length})
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Averaged Across All Panel Judges
                    </span>
                  </div>

                  {competitionSubmissions.length === 0 ? (
                    <p className="py-4 text-xs text-slate-400">
                      No submissions yet — be the first scholar to submit your build below.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {competitionSubmissions.map((sub, idx) => (
                        <div
                          key={sub.id}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-mono text-slate-400">
                                Rank #{idx + 1} · {sub.participantName} ({sub.schoolName}) ·{" "}
                                {sub.participantZone}
                              </span>
                              <h4 className="font-display text-sm font-bold text-white">
                                {sub.projectTitle}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-base font-extrabold text-sky-400 tabular-nums">
                                {sub.averageScore > 0 ? `${sub.averageScore}/100` : "Pending Judging"}
                              </span>
                              {sub.averageScore > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCertTarget({
                                      participantName: sub.participantName,
                                      projectTitle: sub.projectTitle,
                                      competitionTitle: activeCompetition.title,
                                      averageScore: sub.averageScore,
                                      rank: idx + 1,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-600/50 bg-amber-950/30 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300 hover:bg-amber-900/40"
                                >
                                  <Award className="w-3 h-3" />
                                  <span>Certificate</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-300">{sub.projectSummary}</p>
                          {sub.judgeScores.length > 0 && (
                            <div className="pt-2 border-t border-slate-800/80 space-y-1">
                              {sub.judgeScores.map((js) => (
                                <p key={js.id} className="text-[11px] text-slate-400">
                                  <strong className="text-slate-200 font-mono">
                                    {js.judgeName} ({js.totalScore}/100):
                                  </strong>{" "}
                                  {js.feedback}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Entry Form */}
              <form
                onSubmit={handleSubmitCompetitionEntry}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-white">
                    Register & Submit Project Entry
                  </h3>
                  <span className="font-mono text-[11px] text-slate-400">
                    1 verified entry per scholar
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Project Title</label>
                    <input
                      type="text"
                      required
                      value={entryTitle}
                      onChange={(e) => setEntryTitle(e.target.value)}
                      placeholder="e.g. Solar Irrigation Controller"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Discipline</label>
                    <select
                      value={entryCategory}
                      onChange={(e) => setEntryCategory(e.target.value as TalentCategory)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                    >
                      {TALENT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">
                    Project Summary & Methodology
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={entrySummary}
                    onChange={(e) => setEntrySummary(e.target.value)}
                    placeholder="Describe your prototype, problem solved, and test outcomes..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">
                    Artifact / Repo / Demo Link
                  </label>
                  <input
                    type="text"
                    value={entryUrl}
                    onChange={(e) => setEntryUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors"
                >
                  Submit Entry to Competition
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: APPROVED TALENT SHOWCASES                                 */}
      {/* ================================================================ */}
      {activeTab === "showcases" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Discover talent by name, technical stack, or discipline..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs sm:text-sm text-slate-200"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              {["ALL", ...TALENT_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-sky-600 text-white font-bold"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.userId}
                className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono text-sky-400 font-bold">
                      {profile.primaryCategory} · {profile.ageZone}
                    </span>
                    <h3 className="font-display text-lg font-bold text-white">
                      {profile.displayName}
                    </h3>
                    <p className="text-xs text-slate-300">{profile.headline}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {profile.school} · {profile.state}
                    </p>
                  </div>
                  <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{profile.bio}</p>

                <p className="text-[11px] font-mono text-slate-400">
                  Skills: {profile.skills.join(" · ")}
                </p>

                {profile.portfolio.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block">
                      Approved Portfolio Projects ({profile.portfolio.length})
                    </span>
                    {profile.portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{item.title}</span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {item.moderationStatus}
                          </span>
                        </div>
                        <p className="text-slate-400">{item.summary}</p>
                        {item.mediaUrl && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400">
                            <ExternalLink className="w-3 h-3" />
                            <span>{item.mediaUrl}</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: MY TALENT PROFILE & PORTFOLIO BUILDER                     */}
      {/* ================================================================ */}
      {activeTab === "portfolio" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4 text-xs"
          >
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white">
                Talent Identity & Bio ({playerDisplayName})
              </h2>
              <p className="text-slate-400">
                Minor-safe public portfolio: never displays private email, phone, or street location.
              </p>
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Talent Headline</label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Full-Stack Civic Builder & Mathematics Olympiad Scholar"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Primary Category</label>
              <select
                value={primaryCategory}
                onChange={(e) => setPrimaryCategory(e.target.value as TalentCategory)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              >
                {TALENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">
                Technical & Creative Skills (comma separated)
              </label>
              <input
                type="text"
                required
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">About Your Work</label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share what projects you build, research interests, and achievements..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500"
            >
              Save Talent Profile
            </button>
          </form>

          <div className="space-y-5">
            <form
              onSubmit={handleAddPortfolioItem}
              className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4 text-xs"
            >
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Add Portfolio Project
                  </h2>
                  <p className="text-slate-400">
                    Showcase technical repos, design studies, engineering schematics, or essays.
                  </p>
                </div>
                <Layers className="w-5 h-5 text-sky-400" />
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. Offline Solar Telemetry Dashboard"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Category</label>
                <select
                  value={projCategory}
                  onChange={(e) => setProjCategory(e.target.value as TalentCategory)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  {TALENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">
                  Repository or Demo URL (optional)
                </label>
                <input
                  type="text"
                  value={projUrl}
                  onChange={(e) => setProjUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Project Summary</label>
                <textarea
                  rows={3}
                  required
                  value={projSummary}
                  onChange={(e) => setProjSummary(e.target.value)}
                  placeholder="What does it solve and how did you build or validate it?"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Portfolio Artifact</span>
              </button>
            </form>

            {myProfile && myProfile.portfolio.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-2.5">
                <h3 className="font-display text-sm font-bold text-white">
                  Your Published Items ({myProfile.portfolio.length})
                </h3>
                {myProfile.portfolio.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1"
                  >
                    <div className="font-bold text-sky-300">{p.title}</div>
                    <p className="text-slate-400">{p.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: ORGANIZER COMPETITION CREATOR & JUDGE RUBRIC DESK         */}
      {/* ================================================================ */}
      {activeTab === "organizer_judge" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organizer Wizard */}
          <form
            onSubmit={handleCreateCompetition}
            className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4 text-xs"
          >
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Launch Competition or Challenge
                </h2>
                <p className="text-slate-400">
                  Includes a standardized 100-point rubric and mandatory sponsor disclosure when applicable.
                </p>
              </div>
              <FolderKanban className="w-5 h-5 text-sky-400" />
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Competition Title</label>
              <input
                type="text"
                required
                value={newCompTitle}
                onChange={(e) => setNewCompTitle(e.target.value)}
                placeholder="e.g. Lagos Secondary Robotics & Clean Energy Challenge"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Category</label>
                <select
                  value={newCompCategory}
                  onChange={(e) => setNewCompCategory(e.target.value as TalentCategory)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  {TALENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-mono text-slate-400 mb-1">Visibility Scope</label>
                <select
                  value={newCompVisibility}
                  onChange={(e) =>
                    setNewCompVisibility(
                      e.target.value as "PUBLIC" | "SCHOOL_ORG" | "SPONSORED",
                    )
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  <option value="PUBLIC">Public Discovery Cup</option>
                  <option value="SCHOOL_ORG">School / Organization Private</option>
                  <option value="SPONSORED">Sponsored Brand / NGO Challenge</option>
                </select>
              </div>
            </div>

            {newCompVisibility === "SCHOOL_ORG" && (
              <div>
                <label className="block font-mono text-slate-400 mb-1">
                  Host Organization (Tenant Isolated)
                </label>
                <select
                  value={newCompOrgId}
                  onChange={(e) => setNewCompOrgId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  {organizations.length === 0 ? (
                    <option value="">Join or create an organization in Ecosystem Hub</option>
                  ) : (
                    organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.myRole})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {newCompVisibility === "SPONSORED" && (
              <div>
                <label className="block font-mono text-slate-400 mb-1">
                  Disclosed Sponsor / NGO Partner Name
                </label>
                <input
                  type="text"
                  required
                  value={newCompSponsor}
                  onChange={(e) => setNewCompSponsor(e.target.value)}
                  placeholder="e.g. Tony Elumelu STEM Youth Grant"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Submission Deadline</label>
                <input
                  type="date"
                  required
                  value={newCompDeadline}
                  onChange={(e) => setNewCompDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block font-mono text-slate-400 mb-1">Recognition & Award</label>
                <input
                  type="text"
                  required
                  value={newCompAward}
                  onChange={(e) => setNewCompAward(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500"
            >
              Launch Competition
            </button>
          </form>

          {/* Judge Rubric Desk */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Judge Rubric Evaluation Desk
                </h2>
                <p className="text-xs text-slate-400">
                  Each judge&apos;s evaluation is stored independently per judge account so concurrent reviews never overwrite each other.
                </p>
              </div>
              <ClipboardCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>

            {activeCompetition && (
              <div className="space-y-3">
                <div className="text-xs font-mono text-sky-400">
                  Evaluating: {activeCompetition.title}
                </div>
                {competitionSubmissions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">
                    Select a competition with entries to begin rubric scoring.
                  </p>
                ) : (
                  competitionSubmissions.map((sub) => {
                    const draft = judgeDrafts[sub.id] ?? {
                      scores: Object.fromEntries(
                        activeCompetition.rubric.map((r) => [
                          r.id,
                          Math.round(r.maxPoints * 0.8),
                        ]),
                      ),
                      feedback: "",
                    };
                    const draftTotal = activeCompetition.rubric.reduce(
                      (sum, r) => sum + Number(draft.scores[r.id] ?? 0),
                      0,
                    );

                    return (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">
                              {sub.projectTitle}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              By {sub.participantName} · Current Avg: {sub.averageScore}/100
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 tabular-nums">
                            Draft: {draftTotal}/100
                          </span>
                        </div>

                        <div className="space-y-2">
                          {activeCompetition.rubric.map((crit) => {
                            const val = draft.scores[crit.id] ?? 0;
                            return (
                              <div key={crit.id} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                                  <span>{crit.label}</span>
                                  <span className="tabular-nums">
                                    {val} / {crit.maxPoints}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={crit.maxPoints}
                                  value={val}
                                  onChange={(e) => {
                                    const nextVal = Number(e.target.value);
                                    setJudgeDrafts((prev) => ({
                                      ...prev,
                                      [sub.id]: {
                                        scores: { ...draft.scores, [crit.id]: nextVal },
                                        feedback: draft.feedback,
                                      },
                                    }));
                                  }}
                                  className="w-full accent-sky-500"
                                />
                              </div>
                            );
                          })}
                        </div>

                        <textarea
                          rows={2}
                          value={draft.feedback}
                          onChange={(e) => {
                            const nextFb = e.target.value;
                            setJudgeDrafts((prev) => ({
                              ...prev,
                              [sub.id]: {
                                scores: draft.scores,
                                feedback: nextFb,
                              },
                            }));
                          }}
                          placeholder="Constructive judge feedback on strengths & next engineering steps..."
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
                        />

                        <button
                          type="button"
                          onClick={() => handleSubmitJudgeScore(sub)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                        >
                          Record Judge Scorecard
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finalist Certificate Modal */}
      {certTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-3xl border-2 border-amber-500/50 bg-[#070b14] p-8 text-slate-100 shadow-2xl space-y-5 text-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-amber-400 font-bold block">
              Talent Arena · Official Finalist Recognition
            </span>
            <h2 className="font-display text-2xl font-extrabold text-white">
              Certificate of Technical & Creative Merit
            </h2>
            <p className="text-xs text-slate-400">Presented to</p>
            <h3 className="font-display text-2xl font-extrabold text-sky-300">
              {certTarget.participantName}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              For achieving{" "}
              <strong className="text-amber-300 font-mono">
                Rank #{certTarget.rank} ({certTarget.averageScore}/100 rubric score)
              </strong>{" "}
              with project <strong>{certTarget.projectTitle}</strong> in{" "}
              <strong>{certTarget.competitionTitle}</strong>.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setCertTarget(null)}
                className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
