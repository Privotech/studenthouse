"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PRISMA_SCHEMA_MODELS, SchemaEntityDescriptor } from "@naijaplay/database";

const DOMAINS: ReadonlyArray<SchemaEntityDescriptor["domain"] | "ALL"> = [
  "ALL",
  "IDENTITY",
  "SCHOOLS",
  "GAMING",
  "PROGRESSION",
  "LEARNING",
  "COMPETITIONS",
  "COMMUNITY",
  "SAFETY",
  "PLATFORM",
];

interface ThreatRecord {
  id: string;
  threat: string;
  stride: string;
  severity: "Critical" | "High";
  control: string;
  verificationTarget: string;
}

const THREAT_MODEL_RECORDS: ReadonlyArray<ThreatRecord> = [
  {
    id: "TM-01",
    threat: "Account Takeover (ATO)",
    stride: "Spoofing",
    severity: "Critical",
    control:
      "Argon2id/bcrypt password hashing, HttpOnly + SameSite=Lax cookies, 5 req/min IP rate limit, immediate session invalidation on status change.",
    verificationTarget: "User.accountStatus + Auth.js Session Strategy",
  },
  {
    id: "TM-02",
    threat: "Unauthorized Access to Children's Data",
    stride: "Information Disclosure",
    severity: "Critical",
    control:
      "PII isolated in User table; PlayerProfile defaults to PRIVATE_GUARDIAN_ONLY; Guardian linkedChildIds and Teacher authorizedSchoolIds verified server-side.",
    verificationTarget: "authorizeAction() in @naijaplay/permissions",
  },
  {
    id: "TM-03",
    threat: "Privilege Escalation / Minor Self-Granting Guardian Consent",
    stride: "Elevation of Privilege",
    severity: "Critical",
    control:
      "Server-resolved AgeZone from dateOfBirth; blocks PLAYER role or guardianUserId === childUserId from granting consent (GUARDIAN_SELF_GRANT_FORBIDDEN).",
    verificationTarget: "tests/phase1-foundation.test.ts (Suite 2)",
  },
  {
    id: "TM-04",
    threat: "Game Score Manipulation & Speed-Hacks",
    stride: "Tampering",
    severity: "High",
    control:
      "verifyGameScoreSubmission() validates minimum reaction time per question, question count bounds, and recalculates authoritative score on server.",
    verificationTarget: "verifyGameScoreSubmission() in @naijaplay/game-engine",
  },
  {
    id: "TM-05",
    threat: "XP Ledger Manipulation & Duplicate Mission Rewards",
    stride: "Tampering / Repudiation",
    severity: "High",
    control:
      "Append-only XPTransaction ledger; composite unique constraint [missionId, playerProfileId, periodKey] and @unique idempotencyKey.",
    verificationTarget: "AuthoritativeXPLedger in @naijaplay/game-engine",
  },
  {
    id: "TM-06",
    threat: "Fake Accounts & Bot Leaderboard Farming",
    stride: "Spoofing / DoS",
    severity: "High",
    control:
      "School registration code approval workflow, mandatory email/guardian verification before ACTIVE status, and sliding-window rate limits.",
    verificationTarget: "PlayerOnboardingSchema + SchoolMembership",
  },
  {
    id: "TM-07",
    threat: "Unmoderated Creative Submissions & Spam",
    stride: "Tampering",
    severity: "Critical",
    control:
      "CreativeSubmission defaults to ModerationStatus.PENDING_REVIEW; zero public visibility prior to explicit MODERATOR approval.",
    verificationTarget: "CreativeSubmission + ModerationAction models",
  },
  {
    id: "TM-08",
    threat: "Malicious File Uploads & EXIF Geolocation Leakage",
    stride: "Info Disclosure / EoP",
    severity: "High",
    control:
      "PNG magic-byte validation, 2MB ceiling, canvas-generated images without source EXIF, and authenticated Cloudinary delivery.",
    verificationTarget: "docs/security/SECURITY_REQUIREMENTS.md",
  },
  {
    id: "TM-09",
    threat: "Abuse of Moderation or Admin Tools",
    stride: "Repudiation",
    severity: "High",
    control:
      "Append-only AuditLog records actorUserId, actorRole, and mandatory rationale; even PLATFORM_ADMIN is blocked from direct XP balance edits.",
    verificationTarget: "AuditLog + IMMUTABLE_LEDGER_VIOLATION rule",
  },
];

export function SchemaAndThreatExplorer() {
  const [selectedDomain, setSelectedDomain] = useState<SchemaEntityDescriptor["domain"] | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"SCHEMA" | "THREAT_MODEL">("SCHEMA");

  const filteredModels = useMemo(() => {
    return PRISMA_SCHEMA_MODELS.filter((model) => {
      const matchesDomain = selectedDomain === "ALL" || model.domain === selectedDomain;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        model.modelName.toLowerCase().includes(q) ||
        model.domain.toLowerCase().includes(q) ||
        model.securityInvariant.toLowerCase().includes(q);
      return matchesDomain && matchesQuery;
    });
  }, [selectedDomain, searchQuery]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Relational Database Architecture (27 Models) & STRIDE Threat Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL single source of truth (<code className="font-mono text-emerald-400">packages/database/prisma/schema.prisma</code>) · Validated with <code className="font-mono text-slate-300">prisma validate</code>
          </p>
        </div>

        {/* Segmented Control: Schema vs Threat Model */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setActiveTab("SCHEMA")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "SCHEMA"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Prisma Models (27)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("THREAT_MODEL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "THREAT_MODEL"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            STRIDE Threat Model (9)
          </button>
        </div>
      </div>

      {activeTab === "SCHEMA" ? (
        <div className="space-y-4">
          {/* Domain Filter Bar & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {DOMAINS.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setSelectedDomain(domain)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedDomain === domain
                      ? "bg-slate-800 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter models or invariants..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* High-Density Data Grid */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                  <th className="py-2.5 px-3.5 font-medium">Model Name</th>
                  <th className="py-2.5 px-3.5 font-medium">Domain</th>
                  <th className="py-2.5 px-3.5 font-medium">Unique Constraints & Indexes</th>
                  <th className="py-2.5 px-3.5 font-medium">Deletion & Retention Policy</th>
                  <th className="py-2.5 px-3.5 font-medium">Security & Integrity Invariant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No Prisma models match the current filter.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDomain("ALL");
                          setSearchQuery("");
                        }}
                        className="text-emerald-400 underline ml-1 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((model) => (
                    <tr key={model.modelName} className="hover:bg-slate-900/50 align-top">
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                        {model.modelName}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {model.domain}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-300">
                        <div>Unique: {model.uniqueConstraints.join(", ")}</div>
                        <div className="text-slate-500 mt-0.5">
                          Idx: {model.indexes.join(" · ")}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-300 max-w-xs">
                        {model.deletionPolicy}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-300 max-w-sm">
                        {model.securityInvariant}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                <th className="py-2.5 px-3.5 font-medium">ID</th>
                <th className="py-2.5 px-3.5 font-medium">Threat Scenario</th>
                <th className="py-2.5 px-3.5 font-medium">STRIDE · Severity</th>
                <th className="py-2.5 px-3.5 font-medium">Architectural Mitigation Implemented</th>
                <th className="py-2.5 px-3.5 font-medium">Verification Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {THREAT_MODEL_RECORDS.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/50 align-top">
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-amber-400 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="py-2.5 px-3.5 font-medium text-white">
                    {item.threat}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap">
                    <span>{item.stride}</span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <span
                      className={
                        item.severity === "Critical"
                          ? "text-rose-400 font-semibold"
                          : "text-amber-400 font-medium"
                      }
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 max-w-md">
                    {item.control}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-400">
                    {item.verificationTarget}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
