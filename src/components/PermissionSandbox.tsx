"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Play, RotateCcw } from "lucide-react";
import {
  AccountStatus,
  AgeZone,
  ConsentScope,
  ConsentStatus,
  UserRole,
} from "@naijaplay/shared";

interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  role: UserRole;
  accountStatus: AccountStatus;
  dateOfBirth: string;
  action: string;
  consentStatus: ConsentStatus;
  grantedScopes: ConsentScope[];
  revokedAt: string | null;
  targetMinAgeZone?: AgeZone;
  targetMaxAgeZone?: AgeZone;
  targetChildUserId?: string;
  targetSchoolId?: string;
  actorUserId: string;
}

const PRESET_SCENARIOS: ReadonlyArray<ScenarioPreset> = [
  {
    id: "junior-valid-play",
    label: "Junior (10y) · Authorized Game Play",
    description:
      "10-year-old player with active GuardianConsent (CORE_GAMEPLAY_AND_LEARNING) starting a game session.",
    actorUserId: "11111111-1111-4111-8111-111111111111",
    role: UserRole.PLAYER,
    accountStatus: AccountStatus.ACTIVE,
    dateOfBirth: "2016-05-15",
    action: "game:play",
    consentStatus: ConsentStatus.GRANTED,
    grantedScopes: [ConsentScope.CORE_GAMEPLAY_AND_LEARNING],
    revokedAt: null,
  },
  {
    id: "minor-self-grant-blocked",
    label: "Child Safety · Minor Self-Grant Attempt",
    description:
      "A 12-year-old player attempts to call guardian:grant_consent on their own account.",
    actorUserId: "11111111-1111-4111-8111-111111111111",
    role: UserRole.PLAYER,
    accountStatus: AccountStatus.ACTIVE,
    dateOfBirth: "2014-08-20",
    action: "guardian:grant_consent",
    consentStatus: ConsentStatus.PENDING,
    grantedScopes: [],
    revokedAt: null,
    targetChildUserId: "11111111-1111-4111-8111-111111111111",
  },
  {
    id: "revoked-consent-blocked",
    label: "Consent Revocation · Immediate Block",
    description:
      "Parent revokes consent (ConsentStatus.REVOKED); minor immediately loses access to game:play.",
    actorUserId: "11111111-1111-4111-8111-111111111111",
    role: UserRole.PLAYER,
    accountStatus: AccountStatus.ACTIVE,
    dateOfBirth: "2015-03-10",
    action: "game:play",
    consentStatus: ConsentStatus.REVOKED,
    grantedScopes: [ConsentScope.CORE_GAMEPLAY_AND_LEARNING],
    revokedAt: "2026-10-30T14:20:00.000Z",
  },
  {
    id: "minor-messaging-prohibited",
    label: "NDPA Rule · Direct Messaging Blocked",
    description:
      "Attempt to invoke unrestricted private messaging (prohibited platform-wide to protect children).",
    actorUserId: "11111111-1111-4111-8111-111111111111",
    role: UserRole.PLAYER,
    accountStatus: AccountStatus.ACTIVE,
    dateOfBirth: "2012-11-04",
    action: "messaging:direct_message",
    consentStatus: ConsentStatus.GRANTED,
    grantedScopes: [
      ConsentScope.CORE_GAMEPLAY_AND_LEARNING,
      ConsentScope.CLUB_PARTICIPATION,
    ],
    revokedAt: null,
  },
  {
    id: "junior-in-youth-tournament",
    label: "Age Boundary · Junior Entering Youth League",
    description:
      "A 10-year-old Junior player attempts to register for an 18–25 Youth Zone tournament.",
    actorUserId: "11111111-1111-4111-8111-111111111111",
    role: UserRole.PLAYER,
    accountStatus: AccountStatus.ACTIVE,
    dateOfBirth: "2016-05-15",
    action: "tournament:enter",
    consentStatus: ConsentStatus.GRANTED,
    grantedScopes: [
      ConsentScope.CORE_GAMEPLAY_AND_LEARNING,
      ConsentScope.TOURNAMENT_PARTICIPATION,
    ],
    revokedAt: null,
    targetMinAgeZone: AgeZone.YOUTH,
    targetMaxAgeZone: AgeZone.YOUTH,
  },
  {
    id: "admin-direct-xp-mutation",
    label: "Ledger Invariant · Admin Direct XP Edit Blocked",
    description:
      "Even PLATFORM_ADMIN is blocked from directly mutating XP balances outside the append-only ledger.",
    actorUserId: "99999999-9999-4999-8999-999999999999",
    role: UserRole.PLATFORM_ADMIN,
    accountStatus: AccountStatus.ACTIVE,
    dateOfBirth: "1992-01-10",
    action: "xp:mutate_balance_directly",
    consentStatus: ConsentStatus.GRANTED,
    grantedScopes: [],
    revokedAt: null,
  },
];

export function PermissionSandbox() {
  const [role, setRole] = useState<UserRole>(UserRole.PLAYER);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>(AccountStatus.ACTIVE);
  const [dateOfBirth, setDateOfBirth] = useState<string>("2016-05-15");
  const [action, setAction] = useState<string>("game:play");
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(ConsentStatus.GRANTED);
  const [grantedScopes, setGrantedScopes] = useState<ConsentScope[]>([
    ConsentScope.CORE_GAMEPLAY_AND_LEARNING,
  ]);
  const [targetMinAgeZone, setTargetMinAgeZone] = useState<AgeZone | "">("");
  const [activePresetId, setActivePresetId] = useState<string>("junior-valid-play");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseState, setResponseState] = useState<{
    httpStatus: number;
    body: Record<string, unknown>;
  } | null>(null);

  const runVerification = async (overridePayload?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const requestBody = overridePayload ?? {
        actor: {
          userId: "11111111-1111-4111-8111-111111111111",
          role,
          accountStatus,
          dateOfBirth: role === UserRole.PLAYER ? dateOfBirth : undefined,
          consentRecord:
            role === UserRole.PLAYER
              ? {
                  guardianUserId: "88888888-8888-4888-8888-888888888888",
                  childUserId: "11111111-1111-4111-8111-111111111111",
                  status: consentStatus,
                  grantedScopes,
                  revokedAt:
                    consentStatus === ConsentStatus.REVOKED
                      ? new Date().toISOString()
                      : null,
                }
              : null,
          linkedChildIds: ["11111111-1111-4111-8111-111111111111"],
          authorizedSchoolIds: ["school-lagos-01"],
        },
        action,
        targetResource: {
          targetChildUserId: "11111111-1111-4111-8111-111111111111",
          targetSchoolId: "school-lagos-01",
          minAgeZone: targetMinAgeZone ? (targetMinAgeZone as AgeZone) : undefined,
        },
      };

      const res = await fetch("/api/v1/architecture/verify-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      setResponseState({ httpStatus: res.status, body: data });
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id);
    setRole(preset.role);
    setAccountStatus(preset.accountStatus);
    setDateOfBirth(preset.dateOfBirth);
    setAction(preset.action);
    setConsentStatus(preset.consentStatus);
    setGrantedScopes(preset.grantedScopes);
    setTargetMinAgeZone(preset.targetMinAgeZone ?? "");

    void runVerification({
      actor: {
        userId: preset.actorUserId,
        role: preset.role,
        accountStatus: preset.accountStatus,
        dateOfBirth: preset.dateOfBirth,
        consentRecord: {
          guardianUserId: "88888888-8888-4888-8888-888888888888",
          childUserId: preset.actorUserId,
          status: preset.consentStatus,
          grantedScopes: preset.grantedScopes,
          revokedAt: preset.revokedAt,
        },
        linkedChildIds: ["11111111-1111-4111-8111-111111111111"],
        authorizedSchoolIds: ["school-lagos-01"],
      },
      action: preset.action,
      targetResource: {
        targetChildUserId: preset.targetChildUserId ?? "11111111-1111-4111-8111-111111111111",
        targetSchoolId: preset.targetSchoolId ?? "school-lagos-01",
        minAgeZone: preset.targetMinAgeZone,
        maxAgeZone: preset.targetMaxAgeZone,
      },
    });
  };

  const toggleScope = (scope: ConsentScope) => {
    setGrantedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Column: Preset Scenarios & Actor Controls */}
      <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Server-Side RBAC & Age-Zone Policy Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Executes <code className="font-mono text-emerald-400">authorizeAction()</code> in <code className="font-mono text-slate-300">@naijaplay/permissions</code> via <code className="font-mono text-slate-300">POST /api/v1/architecture/verify-permissions</code>
              </p>
            </div>
          </div>

          {/* Preset Test Scenarios */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              One-Click Acceptance Test Scenarios
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors cursor-pointer ${
                    activePresetId === preset.id
                      ? "border-emerald-500/70 bg-emerald-950/30 text-white"
                      : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{preset.label}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Actor & Action Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Actor Role (<code className="font-mono text-[11px]">UserRole</code>)
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setRole(e.target.value as UserRole);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={accountStatus}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setAccountStatus(e.target.value as AccountStatus);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(AccountStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Player Date of Birth (Server-Resolved)
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setDateOfBirth(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Action (<code className="font-mono text-[11px]">PlatformAction</code>)
              </label>
              <select
                value={action}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setAction(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="game:play">game:play</option>
                <option value="mission:claim_reward">mission:claim_reward</option>
                <option value="learning:enroll">learning:enroll</option>
                <option value="tournament:enter">tournament:enter</option>
                <option value="creative:submit">creative:submit</option>
                <option value="club:join">club:join</option>
                <option value="messaging:direct_message">messaging:direct_message</option>
                <option value="guardian:grant_consent">guardian:grant_consent</option>
                <option value="guardian:view_child_activity">guardian:view_child_activity</option>
                <option value="school:view_class_roster">school:view_class_roster</option>
                <option value="moderation:review_queue">moderation:review_queue</option>
                <option value="admin:manage_platform">admin:manage_platform</option>
                <option value="xp:mutate_balance_directly">xp:mutate_balance_directly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Guardian Consent Status
              </label>
              <select
                value={consentStatus}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setConsentStatus(e.target.value as ConsentStatus);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(ConsentStatus).map((cs) => (
                  <option key={cs} value={cs}>
                    {cs}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Activity Min AgeZone Gate
              </label>
              <select
                value={targetMinAgeZone}
                onChange={(e) => {
                  setActivePresetId("custom");
                  setTargetMinAgeZone(e.target.value as AgeZone | "");
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Any Zone (JUNIOR+)</option>
                <option value={AgeZone.JUNIOR}>JUNIOR (6–12)</option>
                <option value={AgeZone.TEEN}>TEEN (13–17)</option>
                <option value={AgeZone.YOUTH}>YOUTH (18–25)</option>
              </select>
            </div>
          </div>

          {/* Consent Scope Checkboxes */}
          <div>
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              Granted Guardian Consent Scopes
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.values(ConsentScope).map((scope) => {
                const active = grantedScopes.includes(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => {
                      setActivePresetId("custom");
                      toggleScope(scope);
                    }}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                      active
                        ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-300"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {scope}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => applyPreset(PRESET_SCENARIOS[0]!)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => void runVerification()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {isLoading ? "Evaluating Policy..." : "Evaluate Server Policy"}
          </button>
        </div>
      </div>

      {/* Right Column: Live API Decision & NDPA Privacy Output */}
      <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-semibold text-white">
              Server Policy Evaluation Result
            </span>
            {responseState && (
              <span
                className={`text-xs font-mono font-semibold ${
                  responseState.httpStatus === 200 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                HTTP {responseState.httpStatus}
              </span>
            )}
          </div>

          {!responseState ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Select a preset scenario or click <strong>Evaluate Server Policy</strong> to inspect the server-side authorization decision and NDPA child-safety invariants.
              </p>
              <button
                type="button"
                onClick={() => applyPreset(PRESET_SCENARIOS[0]!)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Run Default Scenario
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`rounded-lg border p-3.5 ${
                  responseState.httpStatus === 200
                    ? "border-emerald-800/70 bg-emerald-950/25"
                    : "border-rose-800/70 bg-rose-950/25"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {responseState.httpStatus === 200 ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">
                        AUTHORIZED — Action Permitted by Policy Engine
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-300">
                        BLOCKED — Zero-Trust Security Invariant Enforced
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-400 mb-1.5">
                  Standardized JSON Envelope (<code className="font-mono text-[11px]">ApiResponse&lt;T&gt;</code>)
                </div>
                <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-[11px] font-mono text-slate-200 leading-relaxed">
                  {JSON.stringify(responseState.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Engine: @naijaplay/permissions</span>
          <span>NDPA Child Protection Active</span>
        </div>
      </div>
    </div>
  );
}
