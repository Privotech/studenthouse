import { describe, expect, it } from "vitest";
import {
  createClassTaskAssignment,
  createCustomInstructorCourse,
  createOrganizationTenant,
  createTalentCompetition,
  createTalentSubmission,
  joinOrganizationByCode,
  listClassTasksForOrgs,
  listCustomCoursesForUser,
  listTalentCompetitionsForUser,
  listTalentSubmissions,
  recordSkillQuestExamResult,
  setUserEntitlement,
  upsertJudgeScorecard,
} from "@/lib/ecosystem-db";

describe("NaijaPlay Ecosystem 3-in-1 Core Invariants", () => {
  it("prevents duplicate XP rewards when repeating a SkillQuest exam", async () => {
    const userId = `test-sq-user-${Date.now()}`;
    const first = await recordSkillQuestExamResult({
      userId,
      courseId: "math-calculus-intro",
      courseTitle: "Calculus & Quantitative Reasoning",
      scorePercent: 80,
      grade: "Merit",
      xpReward: 200,
      criteriaMet: ["Quiz Assessment: 80%"],
    });
    expect(first.awardedXP).toBe(200);
    expect(first.alreadyRewarded).toBe(false);

    const second = await recordSkillQuestExamResult({
      userId,
      courseId: "math-calculus-intro",
      courseTitle: "Calculus & Quantitative Reasoning",
      scorePercent: 100,
      grade: "Distinction",
      xpReward: 200,
      criteriaMet: ["Quiz Assessment: 100%"],
    });
    expect(second.awardedXP).toBe(0);
    expect(second.alreadyRewarded).toBe(true);
    expect(second.record.scorePercent).toBe(100);
  });

  it("enforces strict tenant isolation between School A and School B", async () => {
    const adminA = `admin-a-${Date.now()}`;
    const adminB = `admin-b-${Date.now()}`;
    const studentB = `student-b-${Date.now()}`;

    const schoolA = await createOrganizationTenant({
      userId: adminA,
      name: "School Alpha",
      orgType: "SCHOOL",
      stateCode: "Lagos",
      creatorRole: "SCHOOL_ADMIN",
    });
    const schoolB = await createOrganizationTenant({
      userId: adminB,
      name: "School Beta",
      orgType: "SCHOOL",
      stateCode: "Abuja",
      creatorRole: "SCHOOL_ADMIN",
    });

    await joinOrganizationByCode({
      userId: studentB,
      joinCode: schoolB.joinCode,
      role: "LEARNER",
    });

    await createClassTaskAssignment({
      organizationId: schoolA.id,
      organizationName: schoolA.name,
      classLabel: "SSS 3 Physics",
      courseId: "physics-quantum-mechanics",
      courseTitle: "Quantum & Classical Mechanics",
      dueDate: "2026-12-20",
      instructions: "School Alpha confidential lab",
      assignedBy: "Principal A",
    });

    await createCustomInstructorCourse({
      authorUserId: adminA,
      organizationId: schoolA.id,
      authorName: "Principal A",
      title: "School A Private Olympiad Prep",
      category: "Mathematics",
      level: "Advanced",
      targetZone: "TEEN",
      overview: "Private internal problem set",
      practicalPrompt: "Solve internal worksheet",
      xpReward: 150,
      sections: [{ title: "Module 1", body: "Content for School A only." }],
      quiz: [
        {
          id: "qa-1",
          question: "2 + 2?",
          options: ["3", "4", "5"],
          correctAnswer: 1,
          explanation: "Basic arithmetic.",
        },
      ],
    });

    const privateCompA = await createTalentCompetition({
      title: "School Alpha Robotics Cup",
      category: "Engineering & Robotics",
      visibility: "SCHOOL_ORG",
      organizationId: schoolA.id,
      organizationName: schoolA.name,
      sponsorName: null,
      sponsorshipDisclosure: null,
      targetZone: "TEEN",
      status: "OPEN",
      deadline: "2026-12-28",
      recognitionAward: "School Trophy",
      rubric: [{ id: "c1", label: "Build", maxPoints: 100, description: "Quality" }],
      createdByUserId: adminA,
      organizerName: "Principal A",
    });

    // Student B (only in School B) MUST NOT see School A tasks, courses, or private competitions
    const tasksForB = await listClassTasksForOrgs([schoolB.id]);
    expect(tasksForB.some((t) => t.organizationId === schoolA.id)).toBe(false);

    const coursesForB = await listCustomCoursesForUser([schoolB.id]);
    expect(coursesForB.some((c) => c.organizationId === schoolA.id)).toBe(false);

    const compsForB = await listTalentCompetitionsForUser([schoolB.id]);
    expect(compsForB.some((c) => c.id === privateCompA.id)).toBe(false);

    // Admin A sees School A data cleanly
    const compsForA = await listTalentCompetitionsForUser([schoolA.id]);
    expect(compsForA.some((c) => c.id === privateCompA.id)).toBe(true);
  });

  it("rejects duplicate Talent Arena entries and isolates concurrent judge scores", async () => {
    const organizer = `org-judge-test-${Date.now()}`;
    const contestant = `contestant-${Date.now()}`;
    const judge1 = `judge-1-${Date.now()}`;
    const judge2 = `judge-2-${Date.now()}`;

    const comp = await createTalentCompetition({
      title: "Multi-Judge Innovation Challenge",
      category: "Software & AI",
      visibility: "PUBLIC",
      organizationId: null,
      organizationName: null,
      sponsorName: null,
      sponsorshipDisclosure: null,
      targetZone: "ALL",
      status: "JUDGING",
      deadline: "2026-12-30",
      recognitionAward: "Finalist Certificate",
      rubric: [
        { id: "r1", label: "Execution", maxPoints: 50, description: "Working demo" },
        { id: "r2", label: "Impact", maxPoints: 50, description: "Problem fit" },
      ],
      createdByUserId: organizer,
      organizerName: "Ecosystem Directorate",
    });

    const firstEntry = await createTalentSubmission({
      competitionId: comp.id,
      userId: contestant,
      participantName: "Amina Bello",
      participantZone: "YOUTH",
      schoolName: "ABU Zaria",
      projectTitle: "Agric Soil Sensor",
      category: "Software & AI",
      projectSummary: "Offline moisture & NPK analyzer.",
      artifactUrl: "https://github.com/example/soil-sensor",
    });
    expect(firstEntry.duplicate).toBeUndefined();
    expect(firstEntry.submission?.id).toBeTruthy();

    const duplicateEntry = await createTalentSubmission({
      competitionId: comp.id,
      userId: contestant,
      participantName: "Amina Bello",
      participantZone: "YOUTH",
      schoolName: "ABU Zaria",
      projectTitle: "Duplicate Project",
      category: "Software & AI",
      projectSummary: "Should be blocked cleanly.",
      artifactUrl: "",
    });
    expect(duplicateEntry.duplicate).toBe(true);

    const subId = firstEntry.submission!.id;
    await upsertJudgeScorecard({
      competitionId: comp.id,
      submissionId: subId,
      judgeUserId: judge1,
      judgeName: "Prof. Adeyemi",
      scoresByCriterion: { r1: 45, r2: 45 }, // 90
      feedback: "Excellent sensor calibration.",
    });
    await upsertJudgeScorecard({
      competitionId: comp.id,
      submissionId: subId,
      judgeUserId: judge2,
      judgeName: "Engr. Okafor",
      scoresByCriterion: { r1: 40, r2: 40 }, // 80
      feedback: "Clean telemetry schema.",
    });

    const subs = await listTalentSubmissions(new Set([comp.id]));
    const updatedSub = subs.find((s) => s.id === subId)!;
    expect(updatedSub.judgeScores).toHaveLength(2);
    expect(updatedSub.averageScore).toBe(85);
  });

  it("handles idempotent subscription entitlement updates", async () => {
    const userId = `sub-user-${Date.now()}`;
    const key = `pay-ref-${Date.now()}`;
    const first = await setUserEntitlement({
      userId,
      planCode: "SCHOLAR_PLUS",
      idempotencyKey: key,
    });
    expect(first.deduplicated).toBe(false);
    expect(first.entitlement.planCode).toBe("SCHOLAR_PLUS");

    const retry = await setUserEntitlement({
      userId,
      planCode: "SCHOLAR_PLUS",
      idempotencyKey: key,
    });
    expect(retry.deduplicated).toBe(true);
    expect(retry.entitlement.outcomesUnaffectedByPayment).toBe(true);
  });
});
