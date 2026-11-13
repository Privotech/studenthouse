import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { COMPREHENSIVE_COURSES } from "@/data/mockData";
import {
  COURSE_PRACTICAL_PROMPTS,
  SKILLQUEST_LEARNING_PATHS,
} from "@/data/ecosystemData";
import { logAuditEvent } from "@/lib/db";
import { getAuthenticatedActor, getClientIp } from "@/lib/ecosystem-auth";
import {
  createClassTaskAssignment,
  createCustomInstructorCourse,
  createSkillQuestAssignment,
  getSkillQuestAssignments,
  getSkillQuestProgress,
  getUserOrgMembership,
  listClassTasksForOrgs,
  listCustomCoursesForUser,
  listOrganizationsForUser,
  recordSkillQuestExamResult,
} from "@/lib/ecosystem-db";

const ExamCompleteSchema = z.object({
  action: z.literal("complete_exam"),
  courseId: z.string().min(2).max(80),
  answers: z.array(z.number().int().min(-1).max(10)).min(1).max(20),
});

const AssignmentSubmitSchema = z.object({
  action: z.literal("submit_assignment"),
  courseId: z.string().min(2).max(80),
  projectTitle: z.string().trim().min(4).max(140),
  artifactUrl: z.string().trim().max(260).optional().default(""),
  summaryNotes: z.string().trim().min(12).max(2000),
});

const CreateCourseSchema = z.object({
  action: z.literal("create_course"),
  organizationId: z.string().trim().min(3).max(80).nullable().optional(),
  title: z.string().trim().min(5).max(120),
  category: z.enum([
    "Mathematics",
    "Computer Science",
    "Physical Sciences",
    "Biological Sciences",
    "English & Literature",
    "Financial Economics",
    "African & World History",
    "Civic Governance & Law",
    "Artificial Intelligence",
    "Renewable Energy & Engineering",
    "Biotechnology & Health",
    "International Relations & Geopolitics",
  ]),
  level: z.enum(["Foundational", "Intermediate", "Advanced", "Professional"]),
  targetZone: z.enum(["JUNIOR", "TEEN", "YOUTH", "SENIOR"]),
  overview: z.string().trim().min(15).max(800),
  practicalPrompt: z.string().trim().min(10).max(500),
  sectionTitle: z.string().trim().min(4).max(120),
  sectionBody: z.string().trim().min(20).max(2500),
  quizQuestion: z.string().trim().min(8).max(300),
  quizOptions: z.array(z.string().trim().min(1).max(160)).min(3).max(4),
  quizCorrectIndex: z.number().int().min(0).max(3),
  quizExplanation: z.string().trim().min(6).max(400),
});

const AssignClassTaskSchema = z.object({
  action: z.literal("assign_class_task"),
  organizationId: z.string().trim().min(3).max(80),
  classLabel: z.string().trim().min(2).max(60),
  courseId: z.string().min(2).max(80),
  courseTitle: z.string().trim().min(3).max(140),
  dueDate: z.string().trim().min(4).max(30),
  instructions: z.string().trim().min(8).max(600),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    const orgs = actor ? await listOrganizationsForUser(actor.userId) : [];
    const orgIds = orgs.map((o) => o.id);

    const [progress, assignments, customCourses, classTasks] = await Promise.all([
      actor ? getSkillQuestProgress(actor.userId) : Promise.resolve([]),
      actor ? getSkillQuestAssignments(actor.userId) : Promise.resolve([]),
      listCustomCoursesForUser(orgIds),
      actor ? listClassTasksForOrgs(orgIds) : Promise.resolve([]),
    ]);

    return NextResponse.json(
      {
        authenticated: Boolean(actor),
        learningPaths: SKILLQUEST_LEARNING_PATHS,
        practicalPrompts: COURSE_PRACTICAL_PROMPTS,
        customCourses,
        progress,
        assignments,
        classTasks,
        organizations: orgs,
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("SkillQuest GET error:", error);
    return NextResponse.json({ error: "Could not load SkillQuest data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    if (!actor) {
      return NextResponse.json(
        { error: "Sign in to submit assessments, practical work, or author courses." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    // 1. Server-verified Course Examination Grading
    const parsedExam = ExamCompleteSchema.safeParse(body);
    if (parsedExam.success) {
      const { courseId, answers } = parsedExam.data;
      const orgIds = (await listOrganizationsForUser(actor.userId)).map((o) => o.id);
      const customCourses = await listCustomCoursesForUser(orgIds);

      const builtInCourse = COMPREHENSIVE_COURSES.find((c) => c.id === courseId);
      const customCourse = customCourses.find((c) => c.id === courseId);

      const courseTitle = builtInCourse?.title ?? customCourse?.title;
      const quizBank = builtInCourse?.examination ?? customCourse?.quiz;
      const xpReward = builtInCourse?.xpReward ?? customCourse?.xpReward ?? 150;

      if (!courseTitle || !quizBank || quizBank.length === 0) {
        return NextResponse.json({ error: "Course examination not found." }, { status: 404 });
      }

      if (answers.length !== quizBank.length) {
        return NextResponse.json(
          { error: "Submitted answers do not match the assessment length." },
          { status: 422 },
        );
      }

      let correct = 0;
      quizBank.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) correct++;
      });
      const scorePercent = Math.round((correct / quizBank.length) * 100);
      const grade: "Distinction" | "Merit" | "Pass" =
        scorePercent >= 90 ? "Distinction" : scorePercent >= 75 ? "Merit" : "Pass";

      const criteriaMet = [
        `Quiz Assessment: ${scorePercent}% (${correct}/${quizBank.length} verified)`,
        scorePercent >= 70 ? "Minimum Mastery Threshold (70%) Satisfied" : "Retake Recommended (<70%)",
      ];

      const result = await recordSkillQuestExamResult({
        userId: actor.userId,
        playerProfileId: actor.playerProfileId,
        courseId,
        courseTitle,
        scorePercent,
        grade,
        xpReward,
        criteriaMet,
      });

      await logAuditEvent({
        user_id: actor.userId,
        event_type: "SKILLQUEST_COMPLETE",
        ip_address: getClientIp(request),
        details: { courseId, scorePercent, awardedXP: result.awardedXP },
      });

      return NextResponse.json(
        {
          progressRecord: result.record,
          scorePercent,
          grade,
          awardedXP: result.awardedXP,
          alreadyRewarded: result.alreadyRewarded,
          totalXP: result.totalXP,
          level: result.level,
        },
        { status: 201 },
      );
    }

    // 2. Practical Project / Assignment Submission
    const parsedAssign = AssignmentSubmitSchema.safeParse(body);
    if (parsedAssign.success) {
      const submission = await createSkillQuestAssignment({
        userId: actor.userId,
        courseId: parsedAssign.data.courseId,
        projectTitle: parsedAssign.data.projectTitle,
        artifactUrl: parsedAssign.data.artifactUrl,
        summaryNotes: parsedAssign.data.summaryNotes,
      });

      return NextResponse.json({ assignment: submission }, { status: 201 });
    }

    // 3. Instructor Course Authoring
    const parsedCourse = CreateCourseSchema.safeParse(body);
    if (parsedCourse.success) {
      const data = parsedCourse.data;
      let verifiedOrgId: string | null = null;
      if (data.organizationId) {
        const membership = await getUserOrgMembership(actor.userId, data.organizationId);
        if (
          !membership ||
          !["INSTRUCTOR", "SCHOOL_ADMIN", "ORGANIZER"].includes(membership.role)
        ) {
          return NextResponse.json(
            { error: "Only instructors or administrators within that organization can publish org-scoped courses." },
            { status: 403 },
          );
        }
        verifiedOrgId = membership.organizationId;
      }

      const course = await createCustomInstructorCourse({
        authorUserId: actor.userId,
        organizationId: verifiedOrgId,
        authorName: actor.displayName,
        title: data.title,
        category: data.category,
        level: data.level,
        targetZone: data.targetZone,
        overview: data.overview,
        practicalPrompt: data.practicalPrompt,
        xpReward: 160,
        sections: [{ title: data.sectionTitle, body: data.sectionBody }],
        quiz: [
          {
            id: `sq-q-${Date.now()}`,
            question: data.quizQuestion,
            options: data.quizOptions,
            correctAnswer: Math.min(data.quizCorrectIndex, data.quizOptions.length - 1),
            explanation: data.quizExplanation,
          },
        ],
      });

      await logAuditEvent({
        user_id: actor.userId,
        event_type: "SKILLQUEST_COURSE_CREATE",
        ip_address: getClientIp(request),
        details: { courseId: course.id, organizationId: verifiedOrgId },
      });

      return NextResponse.json({ course }, { status: 201 });
    }

    // 4. Tenant-Isolated School / Class Task Assignment
    const parsedTask = AssignClassTaskSchema.safeParse(body);
    if (parsedTask.success) {
      const data = parsedTask.data;
      const membership = await getUserOrgMembership(actor.userId, data.organizationId);
      if (
        !membership ||
        !["INSTRUCTOR", "SCHOOL_ADMIN", "ORGANIZER"].includes(membership.role)
      ) {
        return NextResponse.json(
          { error: "Forbidden: instructor or school admin membership in this organization is required." },
          { status: 403 },
        );
      }

      const task = await createClassTaskAssignment({
        organizationId: membership.organizationId,
        organizationName: membership.name,
        classLabel: data.classLabel,
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        dueDate: data.dueDate,
        instructions: data.instructions,
        assignedBy: actor.displayName,
      });

      return NextResponse.json({ classTask: task }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid SkillQuest request payload." }, { status: 400 });
  } catch (error) {
    console.error("SkillQuest POST error:", error);
    return NextResponse.json({ error: "Failed to process SkillQuest action." }, { status: 500 });
  }
}
