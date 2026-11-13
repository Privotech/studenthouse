import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { calculatePlayerLevelFromXP } from "@naijaplay/game-engine";
import {
  COMMERCIAL_PLANS_CATALOG,
  INITIAL_TALENT_COMPETITIONS,
  INITIAL_TALENT_SHOWCASE_PROFILES,
  INITIAL_TALENT_SUBMISSIONS,
} from "@/data/ecosystemData";
import { getNeonConnectionString, isNeonConfigured } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import {
  AgeZone,
  ClassTaskAssignment,
  CustomInstructorCourse,
  JudgeScorecardItem,
  OrganizationMemberRole,
  OrganizationTenantItem,
  OrganizationType,
  PortfolioProjectItem,
  ProductEntitlementState,
  SkillAssignmentSubmission,
  SkillQuestProgressRecord,
  SubscriptionPlanCode,
  TalentCompetitionItem,
  TalentCompetitionSubmission,
  TalentProfileData,
} from "@/types/naijaplay";

let ecosystemTablesInitialized = false;

// In-memory fallback stores for local tests & offline resilience
const memSqProgress = new Map<string, SkillQuestProgressRecord[]>();
const memSqAssignments = new Map<string, SkillAssignmentSubmission[]>();
const memSqCourses: CustomInstructorCourse[] = [];
const memSqClassTasks: ClassTaskAssignment[] = [];

const memTalentProfiles = new Map<string, TalentProfileData>(
  INITIAL_TALENT_SHOWCASE_PROFILES.map((p) => [p.userId, p]),
);
const memCompetitions: TalentCompetitionItem[] = [...INITIAL_TALENT_COMPETITIONS];
const memSubmissions: TalentCompetitionSubmission[] = [...INITIAL_TALENT_SUBMISSIONS];

const memOrganizations = new Map<
  string,
  {
    id: string;
    name: string;
    orgType: OrganizationType;
    joinCode: string;
    stateCode: string;
    planTier: SubscriptionPlanCode;
    createdAt: string;
  }
>();
const memOrgMemberships: Array<{
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  createdAt: string;
}> = [];
const memSubscriptions = new Map<string, ProductEntitlementState>();
const memIdempotencyKeys = new Set<string>();

export async function initEcosystemTablesIfRemote(): Promise<void> {
  if (!isNeonConfigured || ecosystemTablesInitialized) return;
  const sql = neon(getNeonConnectionString());

  await sql`
    CREATE TABLE IF NOT EXISTS np_organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      org_type TEXT NOT NULL,
      join_code TEXT UNIQUE NOT NULL,
      state_code TEXT NOT NULL,
      plan_tier TEXT NOT NULL DEFAULT 'SCHOOL_LICENSE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_org_memberships (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES np_organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (organization_id, user_id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_subscriptions (
      user_id TEXT PRIMARY KEY,
      plan_code TEXT NOT NULL DEFAULT 'FREE_SCHOLAR',
      idempotency_key TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_sq_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      score_percent INTEGER NOT NULL,
      grade TEXT NOT NULL,
      certificate_id TEXT NOT NULL,
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      criteria_met JSONB NOT NULL DEFAULT '[]'::jsonb,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, course_id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_sq_assignments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      project_title TEXT NOT NULL,
      artifact_url TEXT NOT NULL DEFAULT '',
      summary_notes TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      instructor_feedback TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_sq_courses (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      author_user_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      level TEXT NOT NULL,
      target_zone TEXT NOT NULL,
      overview TEXT NOT NULL,
      practical_prompt TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 150,
      sections JSONB NOT NULL DEFAULT '[]'::jsonb,
      quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_sq_class_tasks (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      class_label TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      due_date TEXT NOT NULL,
      instructions TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_ta_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      username TEXT NOT NULL,
      age_zone TEXT NOT NULL,
      school TEXT NOT NULL,
      state TEXT NOT NULL,
      headline TEXT NOT NULL,
      primary_category TEXT NOT NULL,
      bio TEXT NOT NULL,
      skills JSONB NOT NULL DEFAULT '[]'::jsonb,
      portfolio JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_ta_competitions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      visibility TEXT NOT NULL,
      organization_id TEXT,
      organization_name TEXT,
      sponsor_name TEXT,
      sponsorship_disclosure TEXT,
      target_zone TEXT NOT NULL DEFAULT 'ALL',
      status TEXT NOT NULL DEFAULT 'OPEN',
      deadline TEXT NOT NULL,
      recognition_award TEXT NOT NULL,
      rubric JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_by_user_id TEXT NOT NULL,
      organizer_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_ta_submissions (
      id TEXT PRIMARY KEY,
      competition_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      participant_name TEXT NOT NULL,
      participant_zone TEXT NOT NULL,
      school_name TEXT NOT NULL,
      project_title TEXT NOT NULL,
      category TEXT NOT NULL,
      project_summary TEXT NOT NULL,
      artifact_url TEXT NOT NULL,
      moderation_status TEXT NOT NULL DEFAULT 'APPROVED',
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (competition_id, user_id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS np_ta_judge_scores (
      id TEXT PRIMARY KEY,
      competition_id TEXT NOT NULL,
      submission_id TEXT NOT NULL,
      judge_user_id TEXT NOT NULL,
      judge_name TEXT NOT NULL,
      scores_by_criterion JSONB NOT NULL DEFAULT '{}'::jsonb,
      total_score INTEGER NOT NULL DEFAULT 0,
      feedback TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (competition_id, submission_id, judge_user_id)
    );
  `;

  ecosystemTablesInitialized = true;
}

// ============================================================================
// ORGANIZATIONS & MULTI-TENANT ISOLATION
// ============================================================================

export async function listOrganizationsForUser(userId: string): Promise<OrganizationTenantItem[]> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT o.id, o.name, o.org_type, o.join_code, o.state_code, o.plan_tier, o.created_at,
             m.role AS my_role,
             (SELECT COUNT(*)::int FROM np_org_memberships mc WHERE mc.organization_id = o.id) AS member_count
      FROM np_organizations o
      INNER JOIN np_org_memberships m ON m.organization_id = o.id
      WHERE m.user_id = ${userId}
      ORDER BY o.created_at DESC
    `) as Array<{
      id: string;
      name: string;
      org_type: OrganizationType;
      join_code: string;
      state_code: string;
      plan_tier: SubscriptionPlanCode;
      created_at: string;
      my_role: OrganizationMemberRole;
      member_count: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      orgType: r.org_type,
      joinCode: r.join_code,
      stateCode: r.state_code,
      planTier: r.plan_tier,
      myRole: r.my_role,
      memberCount: Number(r.member_count || 1),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  return memOrgMemberships
    .filter((m) => m.userId === userId)
    .map((m) => {
      const org = memOrganizations.get(m.organizationId)!;
      const memberCount = memOrgMemberships.filter((x) => x.organizationId === org.id).length;
      return {
        ...org,
        myRole: m.role,
        memberCount,
      };
    });
}

export async function getUserOrgMembership(
  userId: string,
  organizationId: string,
): Promise<{ organizationId: string; name: string; role: OrganizationMemberRole } | null> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT o.id AS organization_id, o.name, m.role
      FROM np_org_memberships m
      INNER JOIN np_organizations o ON o.id = m.organization_id
      WHERE m.user_id = ${userId} AND m.organization_id = ${organizationId}
      LIMIT 1
    `) as Array<{ organization_id: string; name: string; role: OrganizationMemberRole }>;
    if (!rows.length) return null;
    return {
      organizationId: rows[0]!.organization_id,
      name: rows[0]!.name,
      role: rows[0]!.role,
    };
  }

  const membership = memOrgMemberships.find(
    (m) => m.userId === userId && m.organizationId === organizationId,
  );
  const org = memOrganizations.get(organizationId);
  if (!membership || !org) return null;
  return { organizationId: org.id, name: org.name, role: membership.role };
}

export async function createOrganizationTenant(params: {
  userId: string;
  name: string;
  orgType: OrganizationType;
  stateCode: string;
  creatorRole: OrganizationMemberRole;
}): Promise<OrganizationTenantItem> {
  const id = `org_${randomUUID()}`;
  const joinCode = `${params.orgType.slice(0, 3)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const planTier: SubscriptionPlanCode =
    params.orgType === "NGO" ? "NGO_PROGRAMME" : "SCHOOL_LICENSE";
  const createdAt = new Date().toISOString();

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    await sql`
      INSERT INTO np_organizations (id, name, org_type, join_code, state_code, plan_tier, created_at)
      VALUES (${id}, ${params.name}, ${params.orgType}, ${joinCode}, ${params.stateCode}, ${planTier}, NOW())
    `;
    await sql`
      INSERT INTO np_org_memberships (id, organization_id, user_id, role, created_at)
      VALUES (${randomUUID()}, ${id}, ${params.userId}, ${params.creatorRole}, NOW())
    `;
  } else {
    memOrganizations.set(id, {
      id,
      name: params.name,
      orgType: params.orgType,
      joinCode,
      stateCode: params.stateCode,
      planTier,
      createdAt,
    });
    memOrgMemberships.push({
      organizationId: id,
      userId: params.userId,
      role: params.creatorRole,
      createdAt,
    });
  }

  return {
    id,
    name: params.name,
    orgType: params.orgType,
    joinCode,
    stateCode: params.stateCode,
    planTier,
    myRole: params.creatorRole,
    memberCount: 1,
    createdAt,
  };
}

export async function joinOrganizationByCode(params: {
  userId: string;
  joinCode: string;
  role?: OrganizationMemberRole;
}): Promise<OrganizationTenantItem | null> {
  const cleanCode = params.joinCode.trim().toUpperCase();
  const role: OrganizationMemberRole = params.role || "LEARNER";

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const orgs = (await sql`
      SELECT id, name, org_type, join_code, state_code, plan_tier, created_at
      FROM np_organizations
      WHERE UPPER(join_code) = ${cleanCode}
      LIMIT 1
    `) as Array<{
      id: string;
      name: string;
      org_type: OrganizationType;
      join_code: string;
      state_code: string;
      plan_tier: SubscriptionPlanCode;
      created_at: string;
    }>;
    if (!orgs.length) return null;
    const org = orgs[0]!;
    await sql`
      INSERT INTO np_org_memberships (id, organization_id, user_id, role, created_at)
      VALUES (${randomUUID()}, ${org.id}, ${params.userId}, ${role}, NOW())
      ON CONFLICT (organization_id, user_id) DO NOTHING
    `;
    const list = await listOrganizationsForUser(params.userId);
    return list.find((item) => item.id === org.id) ?? null;
  }

  const org = Array.from(memOrganizations.values()).find(
    (o) => o.joinCode.toUpperCase() === cleanCode,
  );
  if (!org) return null;
  const exists = memOrgMemberships.some(
    (m) => m.organizationId === org.id && m.userId === params.userId,
  );
  if (!exists) {
    memOrgMemberships.push({
      organizationId: org.id,
      userId: params.userId,
      role,
      createdAt: new Date().toISOString(),
    });
  }
  const list = await listOrganizationsForUser(params.userId);
  return list.find((item) => item.id === org.id) ?? null;
}

// ============================================================================
// COMMERCIAL PLANS & ENTITLEMENTS
// ============================================================================

export async function getUserEntitlement(userId: string): Promise<ProductEntitlementState> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT plan_code, updated_at FROM np_subscriptions WHERE user_id = ${userId} LIMIT 1
    `) as Array<{ plan_code: SubscriptionPlanCode; updated_at: string }>;
    if (rows.length) {
      const code = rows[0]!.plan_code;
      const spec = COMMERCIAL_PLANS_CATALOG[code] ?? COMMERCIAL_PLANS_CATALOG.FREE_SCHOLAR;
      return {
        ...spec,
        updatedAt: new Date(rows[0]!.updated_at).toISOString(),
      };
    }
  } else if (memSubscriptions.has(userId)) {
    return memSubscriptions.get(userId)!;
  }

  return {
    ...COMMERCIAL_PLANS_CATALOG.FREE_SCHOLAR,
    updatedAt: new Date().toISOString(),
  };
}

export async function setUserEntitlement(params: {
  userId: string;
  planCode: SubscriptionPlanCode;
  idempotencyKey?: string;
}): Promise<{ entitlement: ProductEntitlementState; deduplicated: boolean }> {
  const key = params.idempotencyKey?.trim();
  if (key && memIdempotencyKeys.has(`${params.userId}:${key}`)) {
    const existing = await getUserEntitlement(params.userId);
    return { entitlement: existing, deduplicated: true };
  }

  const spec = COMMERCIAL_PLANS_CATALOG[params.planCode];
  const state: ProductEntitlementState = {
    ...spec,
    updatedAt: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    if (key) {
      const prev = (await sql`
        SELECT plan_code, updated_at FROM np_subscriptions
        WHERE user_id = ${params.userId} AND idempotency_key = ${key}
        LIMIT 1
      `) as Array<{ plan_code: SubscriptionPlanCode; updated_at: string }>;
      if (prev.length) {
        return {
          entitlement: {
            ...COMMERCIAL_PLANS_CATALOG[prev[0]!.plan_code],
            updatedAt: new Date(prev[0]!.updated_at).toISOString(),
          },
          deduplicated: true,
        };
      }
    }
    await sql`
      INSERT INTO np_subscriptions (user_id, plan_code, idempotency_key, updated_at)
      VALUES (${params.userId}, ${params.planCode}, ${key ?? null}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        plan_code = EXCLUDED.plan_code,
        idempotency_key = EXCLUDED.idempotency_key,
        updated_at = NOW()
    `;
  } else {
    memSubscriptions.set(params.userId, state);
  }

  if (key) memIdempotencyKeys.add(`${params.userId}:${key}`);
  return { entitlement: state, deduplicated: false };
}

// ============================================================================
// SKILLQUEST DATA ACCESS (PROGRESS, ASSIGNMENTS, CUSTOM COURSES, CLASS TASKS)
// ============================================================================

export async function getSkillQuestProgress(userId: string): Promise<SkillQuestProgressRecord[]> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT id, course_id, course_title, score_percent, grade, certificate_id, xp_awarded, criteria_met, completed_at
      FROM np_sq_progress
      WHERE user_id = ${userId}
      ORDER BY completed_at DESC
    `) as Array<{
      id: string;
      course_id: string;
      course_title: string;
      score_percent: number;
      grade: "Distinction" | "Merit" | "Pass";
      certificate_id: string;
      xp_awarded: number;
      criteria_met: string[];
      completed_at: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      courseTitle: r.course_title,
      scorePercent: r.score_percent,
      grade: r.grade,
      certificateId: r.certificate_id,
      xpAwarded: r.xp_awarded,
      criteriaMet: Array.isArray(r.criteria_met) ? r.criteria_met : [],
      completedAt: new Date(r.completed_at).toISOString(),
    }));
  }

  return memSqProgress.get(userId) ?? [];
}

export async function recordSkillQuestExamResult(params: {
  userId: string;
  playerProfileId?: string;
  courseId: string;
  courseTitle: string;
  scorePercent: number;
  grade: "Distinction" | "Merit" | "Pass";
  xpReward: number;
  criteriaMet: string[];
}): Promise<{
  record: SkillQuestProgressRecord;
  awardedXP: number;
  alreadyRewarded: boolean;
  totalXP?: number;
  level?: number;
}> {
  const certificateId = `SQ-${new Date().getFullYear()}-${params.courseId.toUpperCase().slice(0, 12)}-${params.userId.slice(0, 6).toUpperCase()}`;
  const existingList = await getSkillQuestProgress(params.userId);
  const existing = existingList.find((r) => r.courseId === params.courseId);
  const passed = params.scorePercent >= 70;
  const shouldGrantXP = passed && (!existing || existing.xpAwarded === 0);
  const xpToAward = shouldGrantXP ? params.xpReward : 0;

  const record: SkillQuestProgressRecord = {
    id: existing?.id ?? `sqp_${randomUUID()}`,
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    scorePercent: Math.max(existing?.scorePercent ?? 0, params.scorePercent),
    grade: existing && existing.scorePercent > params.scorePercent ? existing.grade : params.grade,
    certificateId: existing?.certificateId ?? certificateId,
    xpAwarded: existing ? Math.max(existing.xpAwarded, xpToAward) : xpToAward,
    completedAt: new Date().toISOString(),
    criteriaMet: params.criteriaMet,
  };

  let totalXP: number | undefined;
  let level: number | undefined;

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());

    await sql`
      INSERT INTO np_sq_progress (
        id, user_id, course_id, course_title, score_percent, grade, certificate_id, xp_awarded, criteria_met, completed_at
      ) VALUES (
        ${record.id}, ${params.userId}, ${params.courseId}, ${params.courseTitle},
        ${record.scorePercent}, ${record.grade}, ${record.certificateId}, ${record.xpAwarded},
        ${JSON.stringify(record.criteriaMet)}, NOW()
      )
      ON CONFLICT (user_id, course_id) DO UPDATE SET
        score_percent = GREATEST(np_sq_progress.score_percent, EXCLUDED.score_percent),
        grade = CASE WHEN EXCLUDED.score_percent >= np_sq_progress.score_percent THEN EXCLUDED.grade ELSE np_sq_progress.grade END,
        xp_awarded = GREATEST(np_sq_progress.xp_awarded, EXCLUDED.xp_awarded),
        criteria_met = EXCLUDED.criteria_met,
        completed_at = NOW()
    `;

    if (xpToAward > 0 && params.playerProfileId) {
      await prisma.$transaction(async (tx) => {
        const key = `skillquest-course-${params.playerProfileId}-${params.courseId}`;
        const existingTx = await tx.xPTransaction.findUnique({ where: { idempotencyKey: key } });
        const profile = await tx.playerProfile.findUnique({ where: { id: params.playerProfileId! } });
        if (!profile) return;

        if (!existingTx) {
          await tx.xPTransaction.create({
            data: {
              playerProfileId: profile.id,
              source: "LEARNING_LESSON",
              referenceId: params.courseId,
              idempotencyKey: key,
              amount: xpToAward,
            },
          });
          const nextXp = profile.totalXp + xpToAward;
          const prog = calculatePlayerLevelFromXP(nextXp);
          await tx.playerProfile.update({
            where: { id: profile.id },
            data: { totalXp: nextXp, level: prog.level },
          });
          totalXP = nextXp;
          level = prog.level;
        } else {
          totalXP = profile.totalXp;
          level = profile.level;
        }
      });
    }
  } else {
    const rest = existingList.filter((r) => r.courseId !== params.courseId);
    memSqProgress.set(params.userId, [record, ...rest]);
  }

  return {
    record,
    awardedXP: xpToAward,
    alreadyRewarded: Boolean(existing && existing.xpAwarded > 0),
    totalXP,
    level,
  };
}

export async function getSkillQuestAssignments(userId: string): Promise<SkillAssignmentSubmission[]> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT id, course_id, project_title, artifact_url, summary_notes, status, instructor_feedback, submitted_at
      FROM np_sq_assignments
      WHERE user_id = ${userId}
      ORDER BY submitted_at DESC
    `) as Array<{
      id: string;
      course_id: string;
      project_title: string;
      artifact_url: string;
      summary_notes: string;
      status: "SUBMITTED" | "REVIEWED";
      instructor_feedback: string | null;
      submitted_at: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      projectTitle: r.project_title,
      artifactUrl: r.artifact_url,
      summaryNotes: r.summary_notes,
      status: r.status,
      instructorFeedback: r.instructor_feedback ?? undefined,
      submittedAt: new Date(r.submitted_at).toISOString(),
    }));
  }

  return memSqAssignments.get(userId) ?? [];
}

export async function createSkillQuestAssignment(params: {
  userId: string;
  courseId: string;
  projectTitle: string;
  artifactUrl: string;
  summaryNotes: string;
}): Promise<SkillAssignmentSubmission> {
  const item: SkillAssignmentSubmission = {
    id: `sqa_${randomUUID()}`,
    courseId: params.courseId,
    projectTitle: params.projectTitle,
    artifactUrl: params.artifactUrl,
    summaryNotes: params.summaryNotes,
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    await sql`
      INSERT INTO np_sq_assignments (
        id, user_id, course_id, project_title, artifact_url, summary_notes, status, submitted_at
      ) VALUES (
        ${item.id}, ${params.userId}, ${item.courseId}, ${item.projectTitle},
        ${item.artifactUrl}, ${item.summaryNotes}, ${item.status}, NOW()
      )
    `;
  } else {
    const prev = memSqAssignments.get(params.userId) ?? [];
    memSqAssignments.set(params.userId, [item, ...prev]);
  }
  return item;
}

export async function listCustomCoursesForUser(userOrgIds: string[]): Promise<CustomInstructorCourse[]> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT id, organization_id, author_name, title, category, level, target_zone, overview, practical_prompt, xp_reward, sections, quiz, created_at
      FROM np_sq_courses
      ORDER BY created_at DESC
      LIMIT 40
    `) as Array<{
      id: string;
      organization_id: string | null;
      author_name: string;
      title: string;
      category: CustomInstructorCourse["category"];
      level: CustomInstructorCourse["level"];
      target_zone: AgeZone;
      overview: string;
      practical_prompt: string;
      xp_reward: number;
      sections: Array<{ title: string; body: string }>;
      quiz: CustomInstructorCourse["quiz"];
      created_at: string;
    }>;

    return rows
      .filter((r) => !r.organization_id || userOrgIds.includes(r.organization_id))
      .map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        authorName: r.author_name,
        title: r.title,
        category: r.category,
        level: r.level,
        targetZone: r.target_zone,
        overview: r.overview,
        practicalPrompt: r.practical_prompt,
        xpReward: r.xp_reward,
        sections: Array.isArray(r.sections) ? r.sections : [],
        quiz: Array.isArray(r.quiz) ? r.quiz : [],
        createdAt: new Date(r.created_at).toISOString(),
      }));
  }

  return memSqCourses.filter(
    (c) => !c.organizationId || userOrgIds.includes(c.organizationId),
  );
}

export async function createCustomInstructorCourse(
  input: Omit<CustomInstructorCourse, "id" | "createdAt"> & { authorUserId: string },
): Promise<CustomInstructorCourse> {
  const course: CustomInstructorCourse = {
    id: `sqc_${randomUUID().slice(0, 8)}`,
    organizationId: input.organizationId,
    authorName: input.authorName,
    title: input.title,
    category: input.category,
    level: input.level,
    targetZone: input.targetZone,
    overview: input.overview,
    practicalPrompt: input.practicalPrompt,
    xpReward: input.xpReward,
    sections: input.sections,
    quiz: input.quiz,
    createdAt: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    await sql`
      INSERT INTO np_sq_courses (
        id, organization_id, author_user_id, author_name, title, category, level, target_zone,
        overview, practical_prompt, xp_reward, sections, quiz, created_at
      ) VALUES (
        ${course.id}, ${course.organizationId}, ${input.authorUserId}, ${course.authorName},
        ${course.title}, ${course.category}, ${course.level}, ${course.targetZone},
        ${course.overview}, ${course.practicalPrompt}, ${course.xpReward},
        ${JSON.stringify(course.sections)}, ${JSON.stringify(course.quiz)}, NOW()
      )
    `;
  } else {
    memSqCourses.unshift(course);
  }
  return course;
}

export async function listClassTasksForOrgs(userOrgIds: string[]): Promise<ClassTaskAssignment[]> {
  if (userOrgIds.length === 0) return [];
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT id, organization_id, organization_name, class_label, course_id, course_title, due_date, instructions, assigned_by, created_at
      FROM np_sq_class_tasks
      ORDER BY created_at DESC
      LIMIT 60
    `) as Array<{
      id: string;
      organization_id: string;
      organization_name: string;
      class_label: string;
      course_id: string;
      course_title: string;
      due_date: string;
      instructions: string;
      assigned_by: string;
      created_at: string;
    }>;

    return rows
      .filter((r) => userOrgIds.includes(r.organization_id))
      .map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        organizationName: r.organization_name,
        classLabel: r.class_label,
        courseId: r.course_id,
        courseTitle: r.course_title,
        dueDate: r.due_date,
        instructions: r.instructions,
        assignedBy: r.assigned_by,
        createdAt: new Date(r.created_at).toISOString(),
      }));
  }

  return memSqClassTasks.filter((t) => userOrgIds.includes(t.organizationId));
}

export async function createClassTaskAssignment(
  input: Omit<ClassTaskAssignment, "id" | "createdAt">,
): Promise<ClassTaskAssignment> {
  const task: ClassTaskAssignment = {
    ...input,
    id: `sqt_${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    await sql`
      INSERT INTO np_sq_class_tasks (
        id, organization_id, organization_name, class_label, course_id, course_title, due_date, instructions, assigned_by, created_at
      ) VALUES (
        ${task.id}, ${task.organizationId}, ${task.organizationName}, ${task.classLabel},
        ${task.courseId}, ${task.courseTitle}, ${task.dueDate}, ${task.instructions}, ${task.assignedBy}, NOW()
      )
    `;
  } else {
    memSqClassTasks.unshift(task);
  }
  return task;
}

// ============================================================================
// TALENT ARENA DATA ACCESS (PROFILES, COMPETITIONS, SUBMISSIONS, JUDGING)
// ============================================================================

export async function listAllTalentProfiles(): Promise<TalentProfileData[]> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT user_id, display_name, username, age_zone, school, state, headline, primary_category, bio, skills, portfolio, updated_at
      FROM np_ta_profiles
      ORDER BY updated_at DESC
      LIMIT 30
    `) as Array<{
      user_id: string;
      display_name: string;
      username: string;
      age_zone: AgeZone;
      school: string;
      state: string;
      headline: string;
      primary_category: TalentProfileData["primaryCategory"];
      bio: string;
      skills: string[];
      portfolio: PortfolioProjectItem[];
      updated_at: string;
    }>;

    const remoteProfiles: TalentProfileData[] = rows.map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      username: r.username,
      ageZone: r.age_zone,
      school: r.school,
      state: r.state,
      headline: r.headline,
      primaryCategory: r.primary_category,
      bio: r.bio,
      skills: Array.isArray(r.skills) ? r.skills : [],
      portfolio: Array.isArray(r.portfolio) ? r.portfolio : [],
      updatedAt: new Date(r.updated_at).toISOString(),
    }));

    const existingIds = new Set(remoteProfiles.map((p) => p.userId));
    return [
      ...remoteProfiles,
      ...INITIAL_TALENT_SHOWCASE_PROFILES.filter((p) => !existingIds.has(p.userId)),
    ];
  }

  return Array.from(memTalentProfiles.values());
}

export async function upsertTalentProfile(profile: TalentProfileData): Promise<TalentProfileData> {
  const clean: TalentProfileData = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    await sql`
      INSERT INTO np_ta_profiles (
        user_id, display_name, username, age_zone, school, state, headline, primary_category, bio, skills, portfolio, updated_at
      ) VALUES (
        ${clean.userId}, ${clean.displayName}, ${clean.username}, ${clean.ageZone},
        ${clean.school}, ${clean.state}, ${clean.headline}, ${clean.primaryCategory},
        ${clean.bio}, ${JSON.stringify(clean.skills)}, ${JSON.stringify(clean.portfolio)}, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        headline = EXCLUDED.headline,
        primary_category = EXCLUDED.primary_category,
        bio = EXCLUDED.bio,
        skills = EXCLUDED.skills,
        portfolio = EXCLUDED.portfolio,
        updated_at = NOW()
    `;
  } else {
    memTalentProfiles.set(clean.userId, clean);
  }
  return clean;
}

export async function listTalentCompetitionsForUser(
  userOrgIds: string[],
): Promise<TalentCompetitionItem[]> {
  let remoteComps: TalentCompetitionItem[] = [];
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const rows = (await sql`
      SELECT c.*,
             (SELECT COUNT(*)::int FROM np_ta_submissions s WHERE s.competition_id = c.id) AS submissions_count
      FROM np_ta_competitions c
      ORDER BY c.created_at DESC
    `) as Array<{
      id: string;
      title: string;
      category: TalentCompetitionItem["category"];
      visibility: TalentCompetitionItem["visibility"];
      organization_id: string | null;
      organization_name: string | null;
      sponsor_name: string | null;
      sponsorship_disclosure: string | null;
      target_zone: TalentCompetitionItem["targetZone"];
      status: TalentCompetitionItem["status"];
      deadline: string;
      recognition_award: string;
      rubric: TalentCompetitionItem["rubric"];
      created_by_user_id: string;
      organizer_name: string;
      submissions_count: number;
      created_at: string;
    }>;

    remoteComps = rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      visibility: r.visibility,
      organizationId: r.organization_id,
      organizationName: r.organization_name,
      sponsorName: r.sponsor_name,
      sponsorshipDisclosure: r.sponsorship_disclosure,
      targetZone: r.target_zone,
      status: r.status,
      deadline: r.deadline,
      recognitionAward: r.recognition_award,
      rubric: Array.isArray(r.rubric) ? r.rubric : [],
      createdByUserId: r.created_by_user_id,
      organizerName: r.organizer_name,
      submissionsCount: Number(r.submissions_count || 0),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  } else {
    remoteComps = memCompetitions;
  }

  const seedMissing = INITIAL_TALENT_COMPETITIONS.filter(
    (seed) => !remoteComps.some((c) => c.id === seed.id),
  );
  const combined = [...remoteComps, ...seedMissing];

  return combined.filter(
    (c) =>
      c.visibility !== "SCHOOL_ORG" ||
      (c.organizationId !== null && userOrgIds.includes(c.organizationId)),
  );
}

export async function createTalentCompetition(
  input: Omit<TalentCompetitionItem, "id" | "submissionsCount" | "createdAt">,
): Promise<TalentCompetitionItem> {
  const item: TalentCompetitionItem = {
    ...input,
    id: `comp_${randomUUID().slice(0, 8)}`,
    submissionsCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    await sql`
      INSERT INTO np_ta_competitions (
        id, title, category, visibility, organization_id, organization_name,
        sponsor_name, sponsorship_disclosure, target_zone, status, deadline,
        recognition_award, rubric, created_by_user_id, organizer_name, created_at
      ) VALUES (
        ${item.id}, ${item.title}, ${item.category}, ${item.visibility}, ${item.organizationId},
        ${item.organizationName}, ${item.sponsorName}, ${item.sponsorshipDisclosure},
        ${item.targetZone}, ${item.status}, ${item.deadline}, ${item.recognitionAward},
        ${JSON.stringify(item.rubric)}, ${item.createdByUserId}, ${item.organizerName}, NOW()
      )
    `;
  } else {
    memCompetitions.unshift(item);
  }
  return item;
}

export async function listTalentSubmissions(
  allowedCompetitionIds: Set<string>,
): Promise<TalentCompetitionSubmission[]> {
  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    const [rawSubRows, rawScoreRows] = await Promise.all([
      sql`SELECT * FROM np_ta_submissions ORDER BY submitted_at DESC`,
      sql`SELECT * FROM np_ta_judge_scores ORDER BY updated_at DESC`,
    ]);
    const subRows = rawSubRows as Array<{
      id: string;
      competition_id: string;
      user_id: string;
      participant_name: string;
      participant_zone: AgeZone;
      school_name: string;
      project_title: string;
      category: TalentCompetitionSubmission["category"];
      project_summary: string;
      artifact_url: string;
      moderation_status: "APPROVED" | "PENDING_REVIEW";
      submitted_at: string;
    }>;
    const scoreRows = rawScoreRows as Array<{
      id: string;
      competition_id: string;
      submission_id: string;
      judge_user_id: string;
      judge_name: string;
      scores_by_criterion: Record<string, number>;
      total_score: number;
      feedback: string;
      updated_at: string;
    }>;

    const scoresBySubmission = new Map<string, JudgeScorecardItem[]>();
    for (const s of scoreRows) {
      const list = scoresBySubmission.get(s.submission_id) ?? [];
      list.push({
        id: s.id,
        competitionId: s.competition_id,
        submissionId: s.submission_id,
        judgeUserId: s.judge_user_id,
        judgeName: s.judge_name,
        scoresByCriterion: s.scores_by_criterion ?? {},
        totalScore: s.total_score,
        feedback: s.feedback,
        updatedAt: new Date(s.updated_at).toISOString(),
      });
      scoresBySubmission.set(s.submission_id, list);
    }

    const remoteMapped: TalentCompetitionSubmission[] = subRows.map((row) => {
      const judgeScores = scoresBySubmission.get(row.id) ?? [];
      const averageScore =
        judgeScores.length > 0
          ? Math.round(
              judgeScores.reduce((acc, item) => acc + item.totalScore, 0) / judgeScores.length,
            )
          : 0;
      return {
        id: row.id,
        competitionId: row.competition_id,
        userId: row.user_id,
        participantName: row.participant_name,
        participantZone: row.participant_zone,
        schoolName: row.school_name,
        projectTitle: row.project_title,
        category: row.category,
        projectSummary: row.project_summary,
        artifactUrl: row.artifact_url,
        moderationStatus: row.moderation_status,
        submittedAt: new Date(row.submitted_at).toISOString(),
        judgeScores,
        averageScore,
      };
    });

    const seedMissing = INITIAL_TALENT_SUBMISSIONS.filter(
      (seed) => !remoteMapped.some((item) => item.id === seed.id),
    ).map((seed) => {
      const extraScores = scoresBySubmission.get(seed.id) ?? [];
      const mergedScores = [...seed.judgeScores];
      for (const extra of extraScores) {
        const idx = mergedScores.findIndex((x) => x.judgeUserId === extra.judgeUserId);
        if (idx >= 0) mergedScores[idx] = extra;
        else mergedScores.push(extra);
      }
      const averageScore =
        mergedScores.length > 0
          ? Math.round(
              mergedScores.reduce((acc, item) => acc + item.totalScore, 0) / mergedScores.length,
            )
          : 0;
      return { ...seed, judgeScores: mergedScores, averageScore };
    });

    return [...remoteMapped, ...seedMissing].filter((s) =>
      allowedCompetitionIds.has(s.competitionId),
    );
  }

  return memSubmissions.filter((s) => allowedCompetitionIds.has(s.competitionId));
}

export async function createTalentSubmission(
  input: Omit<
    TalentCompetitionSubmission,
    "id" | "moderationStatus" | "submittedAt" | "judgeScores" | "averageScore"
  >,
): Promise<{ submission?: TalentCompetitionSubmission; duplicate?: boolean }> {
  const existing = (
    await listTalentSubmissions(new Set([input.competitionId]))
  ).find((s) => s.competitionId === input.competitionId && s.userId === input.userId);
  if (existing) {
    return { duplicate: true };
  }

  const item: TalentCompetitionSubmission = {
    ...input,
    id: `sub_${randomUUID().slice(0, 8)}`,
    moderationStatus: "APPROVED",
    submittedAt: new Date().toISOString(),
    judgeScores: [],
    averageScore: 0,
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    try {
      await sql`
        INSERT INTO np_ta_submissions (
          id, competition_id, user_id, participant_name, participant_zone, school_name,
          project_title, category, project_summary, artifact_url, moderation_status, submitted_at
        ) VALUES (
          ${item.id}, ${item.competitionId}, ${item.userId}, ${item.participantName},
          ${item.participantZone}, ${item.schoolName}, ${item.projectTitle}, ${item.category},
          ${item.projectSummary}, ${item.artifactUrl}, ${item.moderationStatus}, NOW()
        )
      `;
    } catch {
      return { duplicate: true };
    }
  } else {
    memSubmissions.unshift(item);
  }

  return { submission: item };
}

export async function upsertJudgeScorecard(params: {
  competitionId: string;
  submissionId: string;
  judgeUserId: string;
  judgeName: string;
  scoresByCriterion: Record<string, number>;
  feedback: string;
}): Promise<JudgeScorecardItem> {
  const totalScore = Object.values(params.scoresByCriterion).reduce(
    (sum, v) => sum + Number(v || 0),
    0,
  );
  const scorecard: JudgeScorecardItem = {
    id: `js_${randomUUID().slice(0, 8)}`,
    competitionId: params.competitionId,
    submissionId: params.submissionId,
    judgeUserId: params.judgeUserId,
    judgeName: params.judgeName,
    scoresByCriterion: params.scoresByCriterion,
    totalScore,
    feedback: params.feedback,
    updatedAt: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    await initEcosystemTablesIfRemote();
    const sql = neon(getNeonConnectionString());
    await sql`
      INSERT INTO np_ta_judge_scores (
        id, competition_id, submission_id, judge_user_id, judge_name, scores_by_criterion, total_score, feedback, updated_at
      ) VALUES (
        ${scorecard.id}, ${scorecard.competitionId}, ${scorecard.submissionId}, ${scorecard.judgeUserId},
        ${scorecard.judgeName}, ${JSON.stringify(scorecard.scoresByCriterion)}, ${scorecard.totalScore},
        ${scorecard.feedback}, NOW()
      )
      ON CONFLICT (competition_id, submission_id, judge_user_id) DO UPDATE SET
        judge_name = EXCLUDED.judge_name,
        scores_by_criterion = EXCLUDED.scores_by_criterion,
        total_score = EXCLUDED.total_score,
        feedback = EXCLUDED.feedback,
        updated_at = NOW()
    `;
  } else {
    const sub = memSubmissions.find((s) => s.id === params.submissionId);
    if (sub) {
      const idx = sub.judgeScores.findIndex((j) => j.judgeUserId === params.judgeUserId);
      if (idx >= 0) sub.judgeScores[idx] = scorecard;
      else sub.judgeScores.push(scorecard);
      sub.averageScore = Math.round(
        sub.judgeScores.reduce((acc, j) => acc + j.totalScore, 0) / sub.judgeScores.length,
      );
    }
  }

  return scorecard;
}

export async function getEcosystemAdminSnapshot() {
  if (!isNeonConfigured) {
    return {
      counts: {
        organizationCount: memOrganizations.size,
        subscriptionCount: memSubscriptions.size,
        sqCourseCount: memSqCourses.length,
        sqProgressCount: Array.from(memSqProgress.values()).reduce((s, a) => s + a.length, 0),
        sqAssignmentCount: Array.from(memSqAssignments.values()).reduce((s, a) => s + a.length, 0),
        sqClassTaskCount: memSqClassTasks.length,
        talentProfileCount: memTalentProfiles.size,
        talentCompetitionCount: memCompetitions.length,
        talentSubmissionCount: memSubmissions.length,
        judgeScoreCount: memSubmissions.reduce((s, item) => s + item.judgeScores.length, 0),
      },
      organizations: Array.from(memOrganizations.values()).slice(0, 12),
      courses: memSqCourses.slice(0, 12).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        instructorName: c.authorName,
        organizationName: c.organizationId,
        createdAt: c.createdAt,
      })),
      competitions: memCompetitions.slice(0, 12).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        visibility: c.visibility,
        status: c.status,
        submissionsCount: c.submissionsCount,
        organizerName: c.organizerName,
      })),
      submissions: memSubmissions.slice(0, 12).map((s) => ({
        id: s.id,
        projectTitle: s.projectTitle,
        participantName: s.participantName,
        category: s.category,
        moderationStatus: s.moderationStatus,
        averageScore: s.averageScore,
        judgesCount: s.judgeScores.length,
        submittedAt: s.submittedAt,
      })),
    };
  }

  await initEcosystemTablesIfRemote();
  const sql = neon(getNeonConnectionString());

  const [
    rawCounts,
    rawOrgs,
    rawCourses,
    rawComps,
    rawSubs,
  ] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*)::int FROM np_organizations) AS org_count,
        (SELECT COUNT(*)::int FROM np_subscriptions) AS sub_count,
        (SELECT COUNT(*)::int FROM np_sq_courses) AS sq_course_count,
        (SELECT COUNT(*)::int FROM np_sq_progress) AS sq_progress_count,
        (SELECT COUNT(*)::int FROM np_sq_assignments) AS sq_assignment_count,
        (SELECT COUNT(*)::int FROM np_sq_class_tasks) AS sq_task_count,
        (SELECT COUNT(*)::int FROM np_ta_profiles) AS ta_profile_count,
        (SELECT COUNT(*)::int FROM np_ta_competitions) AS ta_comp_count,
        (SELECT COUNT(*)::int FROM np_ta_submissions) AS ta_sub_count,
        (SELECT COUNT(*)::int FROM np_ta_judge_scores) AS ta_judge_count
    `,
    sql`SELECT id, name, org_type, join_code, state_code, plan_tier, created_at FROM np_organizations ORDER BY created_at DESC LIMIT 12`,
    sql`
      SELECT c.id, c.title, c.category, c.author_name, o.name AS organization_name, c.created_at
      FROM np_sq_courses c
      LEFT JOIN np_organizations o ON o.id = c.organization_id
      ORDER BY c.created_at DESC
      LIMIT 12
    `,
    sql`
      SELECT c.id, c.title, c.category, c.visibility, c.status, c.organizer_name,
             (SELECT COUNT(*)::int FROM np_ta_submissions s WHERE s.competition_id = c.id) AS submissions_count
      FROM np_ta_competitions c
      ORDER BY c.created_at DESC
      LIMIT 12
    `,
    sql`
      SELECT s.id, s.project_title, s.participant_name, s.category, s.moderation_status, s.submitted_at,
             (SELECT COUNT(*)::int FROM np_ta_judge_scores j WHERE j.submission_id = s.id) AS judges_count,
             COALESCE((SELECT ROUND(AVG(j.total_score))::int FROM np_ta_judge_scores j WHERE j.submission_id = s.id), 0) AS average_score
      FROM np_ta_submissions s
      ORDER BY s.submitted_at DESC
      LIMIT 12
    `,
  ]);

  const cRow = (rawCounts as Array<Record<string, number>>)[0] ?? {};
  const orgRows = rawOrgs as Array<{
    id: string;
    name: string;
    org_type: string;
    join_code: string;
    state_code: string;
    plan_tier: string;
    created_at: string;
  }>;
  const courseRows = rawCourses as Array<{
    id: string;
    title: string;
    category: string;
    author_name: string;
    organization_name: string | null;
    created_at: string;
  }>;
  const compRows = rawComps as Array<{
    id: string;
    title: string;
    category: string;
    visibility: string;
    status: string;
    organizer_name: string;
    submissions_count: number;
  }>;
  const subRows = rawSubs as Array<{
    id: string;
    project_title: string;
    participant_name: string;
    category: string;
    moderation_status: string;
    submitted_at: string;
    judges_count: number;
    average_score: number;
  }>;

  const missingSeedComps = INITIAL_TALENT_COMPETITIONS.filter(
    (seed) => !compRows.some((r) => r.id === seed.id),
  ).map((seed) => ({
    id: seed.id,
    title: seed.title,
    category: seed.category,
    visibility: seed.visibility,
    status: seed.status,
    submissionsCount: seed.submissionsCount,
    organizerName: seed.organizerName,
  }));

  return {
    counts: {
      organizationCount: Number(cRow.org_count ?? 0),
      subscriptionCount: Number(cRow.sub_count ?? 0),
      sqCourseCount: Number(cRow.sq_course_count ?? 0),
      sqProgressCount: Number(cRow.sq_progress_count ?? 0),
      sqAssignmentCount: Number(cRow.sq_assignment_count ?? 0),
      sqClassTaskCount: Number(cRow.sq_task_count ?? 0),
      talentProfileCount: Number(cRow.ta_profile_count ?? 0) + INITIAL_TALENT_SHOWCASE_PROFILES.length,
      talentCompetitionCount: Number(cRow.ta_comp_count ?? 0) + missingSeedComps.length,
      talentSubmissionCount: Number(cRow.ta_sub_count ?? 0) + INITIAL_TALENT_SUBMISSIONS.length,
      judgeScoreCount: Number(cRow.ta_judge_count ?? 0),
    },
    organizations: orgRows.map((o) => ({
      id: o.id,
      name: o.name,
      orgType: o.org_type,
      joinCode: o.join_code,
      stateCode: o.state_code,
      planTier: o.plan_tier,
      createdAt: new Date(o.created_at).toISOString(),
    })),
    courses: courseRows.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      instructorName: c.author_name,
      organizationName: c.organization_name,
      createdAt: new Date(c.created_at).toISOString(),
    })),
    competitions: [
      ...compRows.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        visibility: c.visibility,
        status: c.status,
        submissionsCount: Number(c.submissions_count ?? 0),
        organizerName: c.organizer_name,
      })),
      ...missingSeedComps,
    ].slice(0, 12),
    submissions: subRows.map((s) => ({
      id: s.id,
      projectTitle: s.project_title,
      participantName: s.participant_name,
      category: s.category,
      moderationStatus: s.moderation_status,
      averageScore: Number(s.average_score ?? 0),
      judgesCount: Number(s.judges_count ?? 0),
      submittedAt: new Date(s.submitted_at).toISOString(),
    })),
  };
}

