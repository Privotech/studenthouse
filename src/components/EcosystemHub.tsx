"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  CreditCard,
  Gamepad2,
  GraduationCap,
  Lock,
  Plus,
  Search,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import {
  AgeZone,
  NavTab,
  OrganizationMemberRole,
  OrganizationTenantItem,
  OrganizationType,
  ProductEntitlementState,
  SubscriptionPlanCode,
  TalentCompetitionItem,
  TalentProfileData,
} from "@/types/naijaplay";
import { CORE_GAME_CATALOG, COMPREHENSIVE_COURSES } from "@/data/mockData";
import {
  COMMERCIAL_PLANS_CATALOG,
  INITIAL_TALENT_COMPETITIONS,
  INITIAL_TALENT_SHOWCASE_PROFILES,
  SKILLQUEST_LEARNING_PATHS,
} from "@/data/ecosystemData";
import { sounds } from "@/lib/audio";

interface EcosystemHubProps {
  ageZone: AgeZone;
  isAuthenticated: boolean;
  onRequestAuth: (tab?: "signin" | "register") => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const EcosystemHub: React.FC<EcosystemHubProps> = ({
  ageZone,
  isAuthenticated,
  onRequestAuth,
  onNavigateTab,
}) => {
  const [unifiedQuery, setUnifiedQuery] = useState("");
  const [activeSharedPanel, setActiveSharedPanel] = useState<
    "overview" | "search" | "organizations" | "plans"
  >("overview");

  const [organizations, setOrganizations] = useState<OrganizationTenantItem[]>([]);
  const [entitlement, setEntitlement] = useState<ProductEntitlementState>({
    ...COMMERCIAL_PLANS_CATALOG.FREE_SCHOLAR,
    updatedAt: new Date().toISOString(),
  });
  const [competitionsCount, setCompetitionsCount] = useState(
    INITIAL_TALENT_COMPETITIONS.length,
  );
  const [showcasesCount, setShowcasesCount] = useState(
    INITIAL_TALENT_SHOWCASE_PROFILES.length,
  );

  // Org forms
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<OrganizationType>("SCHOOL");
  const [orgState, setOrgState] = useState("Lagos");
  const [creatorRole, setCreatorRole] =
    useState<OrganizationMemberRole>("SCHOOL_ADMIN");
  const [joinCode, setJoinCode] = useState("");
  const [joinRole, setJoinRole] = useState<OrganizationMemberRole>("LEARNER");
  const [hubStatus, setHubStatus] = useState<string | null>(null);
  const [hubError, setHubError] = useState<string | null>(null);

  const [talentComps, setTalentComps] = useState<TalentCompetitionItem[]>(
    INITIAL_TALENT_COMPETITIONS,
  );
  const [talentProfiles, setTalentProfiles] = useState<TalentProfileData[]>(
    INITIAL_TALENT_SHOWCASE_PROFILES,
  );

  useEffect(() => {
    let cancelled = false;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    Promise.all([
      fetch("/api/ecosystem", { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/talent-arena", { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([ecoData, taData]) => {
        if (cancelled) return;
        if (ecoData) {
          if (Array.isArray(ecoData.organizations)) setOrganizations(ecoData.organizations);
          if (ecoData.entitlement) setEntitlement(ecoData.entitlement);
          if (ecoData.stats) {
            setCompetitionsCount(ecoData.stats.competitionsOpen);
            setShowcasesCount(ecoData.stats.talentShowcases);
          }
        }
        if (taData) {
          if (Array.isArray(taData.competitions)) setTalentComps(taData.competitions);
          if (Array.isArray(taData.profiles)) setTalentProfiles(taData.profiles);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleEcosystemAction = async (payload: Record<string, unknown>) => {
    setHubError(null);
    setHubStatus(null);
    if (!isAuthenticated) {
      onRequestAuth("signin");
      return null;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    const res = await fetch("/api/ecosystem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setHubError(data.error || "Could not process request.");
      return null;
    }
    return data;
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await handleEcosystemAction({
      action: "create_organization",
      name: orgName,
      orgType,
      stateCode: orgState,
      creatorRole,
    });
    if (data?.organization) {
      setOrganizations((prev) => [data.organization, ...prev]);
      setOrgName("");
      sounds.playTrophy();
      setHubStatus(
        `Tenant Workspace "${data.organization.name}" created. Invite Code: ${data.organization.joinCode}`,
      );
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await handleEcosystemAction({
      action: "join_organization",
      joinCode,
      role: joinRole,
    });
    if (data?.organization) {
      setOrganizations((prev) => [
        data.organization,
        ...prev.filter((o) => o.id !== data.organization.id),
      ]);
      setJoinCode("");
      sounds.playCorrect();
      setHubStatus(`Joined isolated workspace "${data.organization.name}" cleanly.`);
    }
  };

  const handleSelectPlan = async (planCode: SubscriptionPlanCode) => {
    const idempotencyKey = `plan-${planCode}-${new Date().toISOString().slice(0, 13)}`;
    const data = await handleEcosystemAction({
      action: "activate_plan",
      planCode,
      idempotencyKey,
    });
    if (data?.entitlement) {
      setEntitlement(data.entitlement);
      sounds.playCorrect();
      setHubStatus(
        data.deduplicated
          ? `Plan entitlement confirmed (${data.entitlement.planName}).`
          : `Activated ${data.entitlement.planName} · Safeguard: zero effect on competition fairness.`,
      );
    }
  };

  const trimmedQuery = unifiedQuery.trim().toLowerCase();
  const matchedGames = trimmedQuery
    ? CORE_GAME_CATALOG.filter(
        (g) =>
          g.title.toLowerCase().includes(trimmedQuery) ||
          g.description.toLowerCase().includes(trimmedQuery),
      ).slice(0, 4)
    : CORE_GAME_CATALOG.slice(0, 3);
  const matchedCourses = trimmedQuery
    ? COMPREHENSIVE_COURSES.filter(
        (c) =>
          c.title.toLowerCase().includes(trimmedQuery) ||
          c.category.toLowerCase().includes(trimmedQuery),
      ).slice(0, 4)
    : COMPREHENSIVE_COURSES.filter((c) => c.targetZone === ageZone).slice(0, 3);
  const matchedTalent = trimmedQuery
    ? talentComps.filter(
        (t) =>
          t.title.toLowerCase().includes(trimmedQuery) ||
          t.category.toLowerCase().includes(trimmedQuery),
      )
    : talentComps.slice(0, 2);
  const matchedProfiles = trimmedQuery
    ? talentProfiles.filter(
        (p) =>
          p.displayName.toLowerCase().includes(trimmedQuery) ||
          p.headline.toLowerCase().includes(trimmedQuery),
      )
    : [];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6 sm:p-7 space-y-6 shadow-xl">
      {/* Header + Shared Platform Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>NaijaPlay Ecosystem · 3-in-1 Connected Platform</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white mt-0.5">
            One Account. Three Experiences. Shared Progress.
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between NaijaPlay, SkillQuest, and Talent Arena while keeping unified safety controls, XP ledger, and organization boundaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-1.5 text-xs font-mono">
          {(
            [
              { id: "overview", label: "3 Products" },
              { id: "search", label: "Unified Search" },
              { id: "organizations", label: `Workspaces (${organizations.length})` },
              { id: "plans", label: "Plans & Safeguards" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveSharedPanel(tab.id);
              }}
              className={`rounded-xl px-3 py-1.5 font-semibold transition-colors ${
                activeSharedPanel === tab.id
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {hubStatus && (
        <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{hubStatus}</span>
        </div>
      )}
      {hubError && (
        <div className="rounded-xl border border-rose-700/60 bg-rose-950/40 px-4 py-2.5 text-xs text-rose-200">
          {hubError}
        </div>
      )}

      {/* 1. THREE PRODUCTS LAUNCHPAD */}
      {activeSharedPanel === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Product 1: NaijaPlay */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">PRODUCT 01 · GAMING</span>
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">NaijaPlay</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Naija Trivia, Brain Rush, Word Challenge, Math Rush & Memory Match with verified scoring, challenges, clubs, and age-safe tournaments.
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                6 Games · Verified Anti-Cheat · Tournaments
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("games")}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
            >
              <span>Enter NaijaPlay Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product 2: SkillQuest */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">PRODUCT 02 · LEARNING</span>
                <GraduationCap className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">SkillQuest</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Structured learning paths, lessons, practical projects, instructor course authoring, scoped class assignments, and verifiable certificates.
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                {SKILLQUEST_LEARNING_PATHS.length} Paths · {COMPREHENSIVE_COURSES.length}+ Courses · Labs
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("learn")}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-500 transition-colors"
            >
              <span>Open SkillQuest Academy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product 3: Talent Arena */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-sky-400 font-bold">PRODUCT 03 · DISCOVERY</span>
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">Talent Arena</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Technical & creative portfolios, moderated project showcases, rubric-judged competitions, school cups, and transparent finalist recognition.
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                {competitionsCount} Challenges · {showcasesCount} Showcases · Judge Desk
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("talent")}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors"
            >
              <span>Enter Talent Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. UNIFIED DISCOVERY SEARCH */}
      {activeSharedPanel === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={unifiedQuery}
              onChange={(e) => setUnifiedQuery(e.target.value)}
              placeholder="Search across all 3 products: trivia, AI, solar, robotics, Figma/design, calculus..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
              <span className="font-mono font-bold text-emerald-400 block">
                NaijaPlay Games ({matchedGames.length})
              </span>
              {matchedGames.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onNavigateTab("games")}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900 p-2.5 hover:border-emerald-500/60"
                >
                  <div className="font-bold text-white">{g.title}</div>
                  <div className="text-[11px] text-slate-400">{g.subtitle}</div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
              <span className="font-mono font-bold text-amber-400 block">
                SkillQuest Courses ({matchedCourses.length})
              </span>
              {matchedCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onNavigateTab("learn")}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900 p-2.5 hover:border-amber-500/60"
                >
                  <div className="font-bold text-white">{c.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {c.category} · {c.level}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
              <span className="font-mono font-bold text-sky-400 block">
                Talent Arena ({matchedTalent.length + matchedProfiles.length})
              </span>
              {matchedTalent.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onNavigateTab("talent")}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900 p-2.5 hover:border-sky-500/60"
                >
                  <div className="font-bold text-white">{t.title}</div>
                  <div className="text-[11px] text-slate-400">{t.category}</div>
                </button>
              ))}
              {matchedProfiles.map((p) => (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => onNavigateTab("talent")}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-900 p-2.5 hover:border-sky-500/60"
                >
                  <div className="font-bold text-white">{p.displayName}</div>
                  <div className="text-[11px] text-slate-400">{p.headline}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-TENANT ORGANIZATIONS & ROLE WORKSPACES */}
      {activeSharedPanel === "organizations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Your Multi-Tenant Workspaces
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tenant isolation enforced: School A members cannot view School B tasks, courses, or private competitions.
                </p>
              </div>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>

            {organizations.length === 0 ? (
              <p className="text-slate-400 py-3">
                No school, academy, or NGO workspace connected yet. Create one or join with an organization invite code.
              </p>
            ) : (
              <div className="space-y-2.5">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">{org.name}</span>
                      <span className="text-emerald-400 font-bold">
                        Role: {org.myRole}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>
                        {org.orgType} · {org.stateCode} · {org.memberCount} Member(s)
                      </span>
                      <span className="text-amber-300 font-bold">
                        Code: {org.joinCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleJoinOrg}
              className="pt-3 border-t border-slate-800 space-y-2"
            >
              <span className="font-mono font-bold text-slate-300 block">
                Join Existing School or NGO by Code
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. SCH-4X9K2"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 font-mono"
                />
                <select
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value as OrganizationMemberRole)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
                >
                  <option value="LEARNER">Learner</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="JUDGE">Judge</option>
                </select>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-800 border border-slate-700 font-bold text-white hover:bg-slate-700 py-2"
                >
                  Join Workspace
                </button>
              </div>
            </form>
          </div>

          <form
            onSubmit={handleCreateOrg}
            className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Provision School, Academy or NGO Tenant
                </h3>
                <p className="text-[11px] text-slate-400">
                  Creates an isolated tenant boundary across SkillQuest classrooms & Talent Arena competitions.
                </p>
              </div>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Organization Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. King's College Lagos STEM Directorate"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Type</label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
                >
                  <option value="SCHOOL">School</option>
                  <option value="ACADEMY">Academy</option>
                  <option value="NGO">NGO Programme</option>
                  <option value="SPONSOR_PARTNER">Sponsor Partner</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-slate-400 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={orgState}
                  onChange={(e) => setOrgState(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block font-mono text-slate-400 mb-1">Your Scoped Role</label>
                <select
                  value={creatorRole}
                  onChange={(e) =>
                    setCreatorRole(e.target.value as OrganizationMemberRole)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
                >
                  <option value="SCHOOL_ADMIN">School Admin</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ORGANIZER">Organizer</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-500"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tenant Workspace</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. COMMERCIAL PLANS & CHILD SAFEGUARD GUARANTEES */}
      {activeSharedPanel === "plans" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-4 text-xs text-emerald-200 flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Child-Safe Commercial Charter:</strong> Zero behavioural advertising to minors, XP remains strictly non-cashable and non-transferable, and paid plans never influence game physics, exam grades, or Talent Arena judging outcomes. Active Tier:{" "}
              <strong className="font-mono text-white">{entitlement.planName}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {Object.values(COMMERCIAL_PLANS_CATALOG).map((plan) => {
              const isCurrent = entitlement.planCode === plan.planCode;
              return (
                <div
                  key={plan.planCode}
                  className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-950/20"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold">{plan.planCode}</span>
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h3 className="font-display text-base font-bold text-white">
                      {plan.planName}
                    </h3>
                    <p className="font-mono text-lg font-extrabold text-amber-300">
                      {plan.monthlyPriceLabel}
                    </p>
                    <ul className="space-y-1 text-[11px] text-slate-300 pt-2 border-t border-slate-800">
                      <li>
                        NaijaPlay Sessions: {String(plan.naijaplayDailySessionsLimit)}
                      </li>
                      <li>
                        SkillQuest Custom Paths: {plan.skillquestCustomPaths ? "Included" : "Standard"}
                      </li>
                      <li>
                        Org Competitions: {plan.talentArenaOrgCompetitions ? "Unlocked" : "Public Only"}
                      </li>
                      <li>Fair-Play Guarantee: Outcomes Unaffected</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(plan.planCode)}
                    className={`w-full rounded-xl py-2 font-bold transition-colors ${
                      isCurrent
                        ? "bg-slate-800 text-emerald-400 cursor-default"
                        : "bg-emerald-600 text-white hover:bg-emerald-500"
                    }`}
                  >
                    {isCurrent ? "Active Plan" : "Activate Entitlement"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
