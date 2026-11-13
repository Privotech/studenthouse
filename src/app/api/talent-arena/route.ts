import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/db";
import { getAuthenticatedActor, getClientIp } from "@/lib/ecosystem-auth";
import {
  createTalentCompetition,
  createTalentSubmission,
  getUserOrgMembership,
  listAllTalentProfiles,
  listOrganizationsForUser,
  listTalentCompetitionsForUser,
  listTalentSubmissions,
  upsertJudgeScorecard,
  upsertTalentProfile,
} from "@/lib/ecosystem-db";

const TalentCategoryEnum = z.enum([
  "Software & AI",
  "Digital Art & Design",
  "Engineering & Robotics",
  "Creative Writing & Debate",
  "STEM Research",
]);

const SaveProfileSchema = z.object({
  action: z.literal("save_profile"),
  headline: z.string().trim().min(4).max(140),
  primaryCategory: TalentCategoryEnum,
  bio: z.string().trim().min(10).max(800),
  skills: z.array(z.string().trim().min(1).max(40)).max(12),
});

const AddPortfolioSchema = z.object({
  action: z.literal("add_portfolio_item"),
  title: z.string().trim().min(4).max(120),
  category: TalentCategoryEnum,
  summary: z.string().trim().min(10).max(800),
  mediaUrl: z.string().trim().max(260).optional().default(""),
  tags: z.array(z.string().trim().min(1).max(32)).max(6).default([]),
});

const CreateCompetitionSchema = z.object({
  action: z.literal("create_competition"),
  title: z.string().trim().min(5).max(140),
  category: TalentCategoryEnum,
  visibility: z.enum(["PUBLIC", "SCHOOL_ORG", "SPONSORED"]),
  organizationId: z.string().trim().min(3).max(80).nullable().optional(),
  sponsorName: z.string().trim().max(120).nullable().optional(),
  sponsorshipDisclosure: z.string().trim().max(320).nullable().optional(),
  targetZone: z.enum(["JUNIOR", "TEEN", "YOUTH", "SENIOR", "ALL"]).default("ALL"),
  deadline: z.string().trim().min(4).max(30),
  recognitionAward: z.string().trim().min(4).max(160),
});

const SubmitEntrySchema = z.object({
  action: z.literal("submit_entry"),
  competitionId: z.string().trim().min(3).max(80),
  projectTitle: z.string().trim().min(4).max(140),
  category: TalentCategoryEnum,
  projectSummary: z.string().trim().min(12).max(1200),
  artifactUrl: z.string().trim().max(260).optional().default(""),
});

const SubmitJudgeScoreSchema = z.object({
  action: z.literal("submit_judge_score"),
  competitionId: z.string().trim().min(3).max(80),
  submissionId: z.string().trim().min(3).max(80),
  scoresByCriterion: z.record(z.string(), z.number().min(0).max(100)),
  feedback: z.string().trim().min(6).max(800),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    const orgs = actor ? await listOrganizationsForUser(actor.userId) : [];
    const orgIds = orgs.map((o) => o.id);

    const [profiles, competitions] = await Promise.all([
      listAllTalentProfiles(),
      listTalentCompetitionsForUser(orgIds),
    ]);

    const allowedIds = new Set(competitions.map((c) => c.id));
    const submissions = await listTalentSubmissions(allowedIds);
    const myProfile = actor ? profiles.find((p) => p.userId === actor.userId) ?? null : null;

    return NextResponse.json(
      {
        authenticated: Boolean(actor),
        myProfile,
        profiles,
        competitions,
        submissions,
        organizations: orgs,
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Talent Arena GET error:", error);
    return NextResponse.json({ error: "Could not load Talent Arena data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    if (!actor) {
      return NextResponse.json(
        { error: "Sign in to manage portfolios, submit entries, or evaluate competitions." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const orgs = await listOrganizationsForUser(actor.userId);
    const orgIds = orgs.map((o) => o.id);

    // 1. Save / Update Talent Profile
    const parsedProfile = SaveProfileSchema.safeParse(body);
    if (parsedProfile.success) {
      const profiles = await listAllTalentProfiles();
      const existing = profiles.find((p) => p.userId === actor.userId);
      const updated = await upsertTalentProfile({
        userId: actor.userId,
        displayName: actor.displayName,
        username: actor.username,
        ageZone: actor.ageZone,
        school: actor.school,
        state: actor.state,
        headline: parsedProfile.data.headline,
        primaryCategory: parsedProfile.data.primaryCategory,
        bio: parsedProfile.data.bio,
        skills: parsedProfile.data.skills,
        portfolio: existing?.portfolio ?? [],
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ profile: updated }, { status: 201 });
    }

    // 2. Add Portfolio Showcase Item
    const parsedPortfolio = AddPortfolioSchema.safeParse(body);
    if (parsedPortfolio.success) {
      const profiles = await listAllTalentProfiles();
      const existing = profiles.find((p) => p.userId === actor.userId);
      const item = {
        id: `pf_${randomUUID().slice(0, 8)}`,
        title: parsedPortfolio.data.title,
        category: parsedPortfolio.data.category,
        summary: parsedPortfolio.data.summary,
        mediaUrl: parsedPortfolio.data.mediaUrl || undefined,
        tags: parsedPortfolio.data.tags,
        moderationStatus: "APPROVED" as const,
        createdAt: new Date().toISOString(),
      };

      const updated = await upsertTalentProfile({
        userId: actor.userId,
        displayName: actor.displayName,
        username: actor.username,
        ageZone: actor.ageZone,
        school: actor.school,
        state: actor.state,
        headline: existing?.headline || `${parsedPortfolio.data.category} Builder`,
        primaryCategory: existing?.primaryCategory || parsedPortfolio.data.category,
        bio: existing?.bio || `${actor.displayName} is showcasing original technical and creative work across NaijaPlay Ecosystem.`,
        skills: existing?.skills ?? [parsedPortfolio.data.category],
        portfolio: [item, ...(existing?.portfolio ?? [])],
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ profile: updated, item }, { status: 201 });
    }

    // 3. Create Competition (enforces org isolation & sponsorship disclosure)
    const parsedComp = CreateCompetitionSchema.safeParse(body);
    if (parsedComp.success) {
      const data = parsedComp.data;
      let orgId: string | null = null;
      let orgName: string | null = null;

      if (data.visibility === "SCHOOL_ORG") {
        if (!data.organizationId) {
          return NextResponse.json(
            { error: "Select an organization workspace to host a School/Organization competition." },
            { status: 400 },
          );
        }
        const membership = await getUserOrgMembership(actor.userId, data.organizationId);
        if (
          !membership ||
          !["ORGANIZER", "SCHOOL_ADMIN", "INSTRUCTOR"].includes(membership.role)
        ) {
          return NextResponse.json(
            { error: "Forbidden: organizer or admin role required inside this organization." },
            { status: 403 },
          );
        }
        orgId = membership.organizationId;
        orgName = membership.name;
      }

      if (data.visibility === "SPONSORED" && !data.sponsorName?.trim()) {
        return NextResponse.json(
          { error: "Sponsored challenges must explicitly disclose sponsor identity." },
          { status: 400 },
        );
      }

      const competition = await createTalentCompetition({
        title: data.title,
        category: data.category,
        visibility: data.visibility,
        organizationId: orgId,
        organizationName: orgName,
        sponsorName: data.visibility === "SPONSORED" ? (data.sponsorName?.trim() ?? null) : null,
        sponsorshipDisclosure:
          data.visibility === "SPONSORED"
            ? data.sponsorshipDisclosure?.trim() ||
              `Transparent Sponsorship by ${data.sponsorName?.trim()}. Merit-based rubric judging only; zero child ad-tracking.`
            : null,
        targetZone: data.targetZone,
        status: "OPEN",
        deadline: data.deadline,
        recognitionAward: data.recognitionAward,
        rubric: [
          {
            id: "crit-exec",
            label: "Execution & Craft",
            maxPoints: 40,
            description: "Completeness, precision, and technical or creative rigor.",
          },
          {
            id: "crit-impact",
            label: "Impact & Purpose",
            maxPoints: 35,
            description: "Practical usefulness and alignment with challenge goals.",
          },
          {
            id: "crit-orig",
            label: "Originality & Clarity",
            maxPoints: 25,
            description: "Distinctive approach and clear communication.",
          },
        ],
        createdByUserId: actor.userId,
        organizerName: actor.displayName,
      });

      return NextResponse.json({ competition }, { status: 201 });
    }

    // 4. Submit Competition Entry (checks eligibility & rejects duplicates safely)
    const parsedEntry = SubmitEntrySchema.safeParse(body);
    if (parsedEntry.success) {
      const comps = await listTalentCompetitionsForUser(orgIds);
      const comp = comps.find((c) => c.id === parsedEntry.data.competitionId);
      if (!comp) {
        return NextResponse.json(
          { error: "Competition not found or restricted to another organization." },
          { status: 404 },
        );
      }
      if (comp.status === "FINALIZED") {
        return NextResponse.json({ error: "Competition submissions are closed." }, { status: 409 });
      }

      const result = await createTalentSubmission({
        competitionId: comp.id,
        userId: actor.userId,
        participantName: actor.displayName,
        participantZone: actor.ageZone,
        schoolName: actor.school,
        projectTitle: parsedEntry.data.projectTitle,
        category: parsedEntry.data.category,
        projectSummary: parsedEntry.data.projectSummary,
        artifactUrl: parsedEntry.data.artifactUrl,
      });

      if (result.duplicate) {
        return NextResponse.json(
          { error: "You already have a registered entry in this competition." },
          { status: 409 },
        );
      }

      await logAuditEvent({
        user_id: actor.userId,
        event_type: "TALENT_SUBMISSION",
        ip_address: getClientIp(request),
        details: { competitionId: comp.id, submissionId: result.submission?.id },
      });

      return NextResponse.json({ submission: result.submission }, { status: 201 });
    }

    // 5. Judge Rubric Scoring (per-judge row prevents concurrent overwrite, enforces role/rubric bounds)
    const parsedJudge = SubmitJudgeScoreSchema.safeParse(body);
    if (parsedJudge.success) {
      const comps = await listTalentCompetitionsForUser(orgIds);
      const comp = comps.find((c) => c.id === parsedJudge.data.competitionId);
      if (!comp) {
        return NextResponse.json({ error: "Competition not accessible." }, { status: 404 });
      }

      // Enforce judging authorization: seniors/adults, competition organizers, or org judges/admins
      const hasOrgJudgeRole = comp.organizationId
        ? orgs.some(
            (o) =>
              o.id === comp.organizationId &&
              ["JUDGE", "ORGANIZER", "SCHOOL_ADMIN", "INSTRUCTOR"].includes(o.myRole),
          )
        : false;
      const isOrganizer = comp.createdByUserId === actor.userId;
      const isAdultReviewer = actor.age >= 18 || ["ADMIN", "GUARDIAN"].includes(actor.role);
      if (!hasOrgJudgeRole && !isOrganizer && !isAdultReviewer) {
        return NextResponse.json(
          { error: "Forbidden: Judge, Organizer, or Instructor credentials (Age 18+) required to score entries." },
          { status: 403 },
        );
      }

      const subs = await listTalentSubmissions(new Set([comp.id]));
      const targetSub = subs.find((s) => s.id === parsedJudge.data.submissionId);
      if (!targetSub) {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }
      if (targetSub.userId === actor.userId) {
        return NextResponse.json(
          { error: "Conflict of interest: judges cannot score their own submission." },
          { status: 403 },
        );
      }

      const sanitizedScores: Record<string, number> = {};
      for (const crit of comp.rubric) {
        const rawVal = Number(parsedJudge.data.scoresByCriterion[crit.id] ?? 0);
        sanitizedScores[crit.id] = Math.max(0, Math.min(crit.maxPoints, Math.round(rawVal)));
      }

      const scorecard = await upsertJudgeScorecard({
        competitionId: comp.id,
        submissionId: targetSub.id,
        judgeUserId: actor.userId,
        judgeName: actor.displayName,
        scoresByCriterion: sanitizedScores,
        feedback: parsedJudge.data.feedback,
      });

      await logAuditEvent({
        user_id: actor.userId,
        event_type: "TALENT_JUDGE_SCORE",
        ip_address: getClientIp(request),
        details: {
          competitionId: comp.id,
          submissionId: targetSub.id,
          totalScore: scorecard.totalScore,
        },
      });

      return NextResponse.json({ scorecard }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid Talent Arena request payload." }, { status: 400 });
  } catch (error) {
    console.error("Talent Arena POST error:", error);
    return NextResponse.json({ error: "Failed to process Talent Arena action." }, { status: 500 });
  }
}
