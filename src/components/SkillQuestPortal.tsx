"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookMarked,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Dna,
  FileCode2,
  FolderPlus,
  Globe,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Route,
  Search,
  Shield,
  Sigma,
  Terminal,
  TrendingUp,
  Users,
  XCircle,
  Zap,
  Atom,
} from "lucide-react";
import {
  AgeZone,
  ClassTaskAssignment,
  CustomInstructorCourse,
  LearningCourse,
  LearningPathItem,
  LearningTestQuestion,
  OrganizationTenantItem,
  SkillAssignmentSubmission,
  SkillQuestProgressRecord,
} from "@/types/naijaplay";
import { COMPREHENSIVE_COURSES } from "@/data/mockData";
import {
  COURSE_PRACTICAL_PROMPTS,
  SKILLQUEST_LEARNING_PATHS,
} from "@/data/ecosystemData";
import { sounds } from "@/lib/audio";

interface SkillQuestPortalProps {
  ageZone: AgeZone;
  playerDisplayName: string;
  isAuthenticated: boolean;
  onRequestAuth: (tab?: "signin" | "register") => void;
  onAwardXP: (amount: number, reason: string) => void;
  onVerifiedXP: (amount: number, totalXP: number, level: number) => void;
  onMissionProgress: (missionId: string, delta: number) => void;
  onEarnCertificate: (certDetails: {
    id: string;
    courseId: string;
    courseTitle: string;
    issuedDate: string;
    scorePercent: number;
    grade: "Distinction" | "Merit" | "Pass";
  }) => void;
}

type WorkspaceMode = "paths" | "catalog" | "classroom" | "author";

export const SkillQuestPortal: React.FC<SkillQuestPortalProps> = ({
  ageZone,
  playerDisplayName,
  isAuthenticated,
  onRequestAuth,
  onAwardXP,
  onVerifiedXP,
  onMissionProgress,
  onEarnCertificate,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("paths");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [zoneFilter, setZoneFilter] = useState<"MY_ZONE" | "ALL">("MY_ZONE");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Persisted SkillQuest state from /api/skillquest
  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>(
    SKILLQUEST_LEARNING_PATHS,
  );
  const [progressRecords, setProgressRecords] = useState<SkillQuestProgressRecord[]>([]);
  const [assignments, setAssignments] = useState<SkillAssignmentSubmission[]>([]);
  const [customCourses, setCustomCourses] = useState<CustomInstructorCourse[]>([]);
  const [classTasks, setClassTasks] = useState<ClassTaskAssignment[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationTenantItem[]>([]);
  const [practicalPrompts, setPracticalPrompts] = useState<Record<string, string>>(
    COURSE_PRACTICAL_PROMPTS,
  );

  // Active Course View State
  const [activeCourse, setActiveCourse] = useState<LearningCourse | null>(null);
  const [courseSubTab, setCourseSubTab] = useState<
    "lecture" | "flashcards" | "project" | "exam"
  >("lecture");
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());

  // Exam State
  const [examQuestionIndex, setExamQuestionIndex] = useState<number>(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isOptionSubmitted, setIsOptionSubmitted] = useState<boolean>(false);
  const [examCompleted, setExamCompleted] = useState<boolean>(false);
  const [examScorePercent, setExamScorePercent] = useState<number>(0);
  const [examGrade, setExamGrade] = useState<"Distinction" | "Merit" | "Pass">("Pass");
  const [lastCertId, setLastCertId] = useState<string>("");
  const [examStatusNote, setExamStatusNote] = useState<string | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  // Practical Project Form State
  const [projectTitle, setProjectTitle] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [summaryNotes, setSummaryNotes] = useState("");
  const [projectFeedback, setProjectFeedback] = useState<string | null>(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Classroom Task Assignment State
  const [taskOrgId, setTaskOrgId] = useState("");
  const [taskClassLabel, setTaskClassLabel] = useState("SSS 2 STEM Cohort");
  const [taskCourseId, setTaskCourseId] = useState(
    COMPREHENSIVE_COURSES[0]?.id ?? "math-calculus-intro",
  );
  const [taskDueDate, setTaskDueDate] = useState("2026-12-10");
  const [taskInstructions, setTaskInstructions] = useState("");
  const [classroomFeedback, setClassroomFeedback] = useState<string | null>(null);

  // Instructor Course Authoring Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<LearningCourse["category"]>("Computer Science");
  const [newLevel, setNewLevel] = useState<LearningCourse["level"]>("Intermediate");
  const [newTargetZone, setNewTargetZone] = useState<AgeZone>(ageZone);
  const [newOrgId, setNewOrgId] = useState<string>("");
  const [newOverview, setNewOverview] = useState("");
  const [newPracticalPrompt, setNewPracticalPrompt] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("Core Concept & Architecture");
  const [newSectionBody, setNewSectionBody] = useState("");
  const [newQuizQ, setNewQuizQ] = useState("");
  const [newQuizOpt0, setNewQuizOpt0] = useState("");
  const [newQuizOpt1, setNewQuizOpt1] = useState("");
  const [newQuizOpt2, setNewQuizOpt2] = useState("");
  const [newQuizCorrect, setNewQuizCorrect] = useState<number>(0);
  const [newQuizExplanation, setNewQuizExplanation] = useState("");
  const [authorFeedback, setAuthorFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    fetch("/api/skillquest", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        if (Array.isArray(data.learningPaths)) setLearningPaths(data.learningPaths);
        if (Array.isArray(data.progress)) setProgressRecords(data.progress);
        if (Array.isArray(data.assignments)) setAssignments(data.assignments);
        if (Array.isArray(data.customCourses)) setCustomCourses(data.customCourses);
        if (Array.isArray(data.classTasks)) setClassTasks(data.classTasks);
        if (Array.isArray(data.organizations)) {
          setOrganizations(data.organizations);
          if (data.organizations[0]?.id) {
            setTaskOrgId(data.organizations[0].id);
          }
        }
        if (data.practicalPrompts) {
          setPracticalPrompts(data.practicalPrompts);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const allCourses = useMemo<LearningCourse[]>(() => {
    const convertedCustom: LearningCourse[] = customCourses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      level: c.level,
      targetZone: c.targetZone,
      iconName: "BookOpen",
      xpReward: c.xpReward,
      overview: c.overview,
      learningOutcomes: [
        `Authored by Instructor ${c.authorName}`,
        `Practical Deliverable: ${c.practicalPrompt}`,
      ],
      curriculumSections: c.sections.map((s) => ({
        title: s.title,
        body: [s.body],
      })),
      examination: c.quiz,
    }));
    return [...convertedCustom, ...COMPREHENSIVE_COURSES];
  }, [customCourses]);

  const completedCourseIds = useMemo(
    () => new Set(progressRecords.filter((r) => r.scorePercent >= 70).map((r) => r.courseId)),
    [progressRecords],
  );

  const categories = [
    "All",
    "Mathematics",
    "Computer Science",
    "Artificial Intelligence",
    "Physical Sciences",
    "Renewable Energy & Engineering",
    "Biological Sciences",
    "Biotechnology & Health",
    "English & Literature",
    "Financial Economics",
    "African & World History",
    "Civic Governance & Law",
    "International Relations & Geopolitics",
  ];

  const filteredCourses = allCourses.filter((course) => {
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "All" || course.level === selectedLevel;
    const matchesZone = zoneFilter === "ALL" || course.targetZone === ageZone;
    const matchesSearch =
      searchQuery.trim() === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLevel && matchesZone && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Mathematics":
        return <Sigma className="w-5 h-5 text-emerald-400" />;
      case "Computer Science":
        return <Terminal className="w-5 h-5 text-sky-400" />;
      case "Artificial Intelligence":
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case "Physical Sciences":
        return <Atom className="w-5 h-5 text-cyan-400" />;
      case "Renewable Energy & Engineering":
        return <Zap className="w-5 h-5 text-amber-400" />;
      case "Biological Sciences":
      case "Biotechnology & Health":
        return <Dna className="w-5 h-5 text-teal-400" />;
      case "English & Literature":
        return <BookMarked className="w-5 h-5 text-purple-400" />;
      case "Financial Economics":
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case "African & World History":
        return <Globe className="w-5 h-5 text-orange-400" />;
      case "Civic Governance & Law":
      case "International Relations & Geopolitics":
        return <Shield className="w-5 h-5 text-rose-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
    }
  };

  const resetExam = () => {
    setExamQuestionIndex(0);
    setExamAnswers({});
    setSelectedOption(null);
    setIsOptionSubmitted(false);
    setExamCompleted(false);
    setExamScorePercent(0);
    setExamStatusNote(null);
    setShowCertificateModal(false);
  };

  const startCourse = (
    course: LearningCourse,
    initialTab: "lecture" | "flashcards" | "project" | "exam" = "lecture",
  ) => {
    sounds.playClick();
    setActiveCourse(course);
    setCourseSubTab(initialTab);
    setActiveCardIndex(0);
    setIsCardFlipped(false);
    setReviewedCards(new Set());
    setProjectFeedback(null);
    resetExam();
  };

  const handleSelectOption = (optIdx: number) => {
    if (isOptionSubmitted) return;
    setSelectedOption(optIdx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !activeCourse) return;
    setIsOptionSubmitted(true);
    const currentQ: LearningTestQuestion = activeCourse.examination[examQuestionIndex]!;
    if (selectedOption === currentQ.correctAnswer) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }
    setExamAnswers((prev) => ({
      ...prev,
      [examQuestionIndex]: selectedOption,
    }));
  };

  const handleNextQuestion = async () => {
    if (!activeCourse) return;
    sounds.playClick();

    if (examQuestionIndex + 1 < activeCourse.examination.length) {
      setExamQuestionIndex((i) => i + 1);
      setSelectedOption(null);
      setIsOptionSubmitted(false);
      return;
    }

    const answerArray = activeCourse.examination.map((_, idx) => examAnswers[idx] ?? -1);
    let correctCount = 0;
    activeCourse.examination.forEach((q, idx) => {
      if (answerArray[idx] === q.correctAnswer) correctCount++;
    });

    const localPercent = Math.round(
      (correctCount / activeCourse.examination.length) * 100,
    );
    const localGrade: "Distinction" | "Merit" | "Pass" =
      localPercent >= 90 ? "Distinction" : localPercent >= 75 ? "Merit" : "Pass";

    let finalPercent = localPercent;
    let finalGrade = localGrade;
    let certId = `SQ-2026-${activeCourse.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isAuthenticated) {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
        const res = await fetch("/api/skillquest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: "complete_exam",
            courseId: activeCourse.id,
            answers: answerArray,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          finalPercent = data.scorePercent ?? localPercent;
          finalGrade = data.grade ?? localGrade;
          certId = data.progressRecord?.certificateId ?? certId;
          if (data.progressRecord) {
            setProgressRecords((prev) => [
              data.progressRecord,
              ...prev.filter((r) => r.courseId !== activeCourse.id),
            ]);
          }
          if (typeof data.totalXP === "number" && typeof data.level === "number" && data.awardedXP > 0) {
            onVerifiedXP(data.awardedXP, data.totalXP, data.level);
            setExamStatusNote(
              `Server-verified mastery recorded (+${data.awardedXP} XP added atomically).`,
            );
          } else if (data.alreadyRewarded) {
            setExamStatusNote(
              "Completed again for practice — duplicate XP reward safely prevented by server idempotency.",
            );
          }
        }
      } catch {
        setExamStatusNote("Saved locally; sign in to persist SkillQuest credentials permanently.");
      }
    } else {
      setExamStatusNote("Preview mode: Sign in to persist certificates & earn server-verified XP.");
    }

    setExamScorePercent(finalPercent);
    setExamGrade(finalGrade);
    setLastCertId(certId);
    setExamCompleted(true);
    sounds.playTrophy();

    if (finalPercent >= 70) {
      onAwardXP(activeCourse.xpReward, `SkillQuest Mastery: ${activeCourse.title}`);
      onMissionProgress("m-2", 1);
      onEarnCertificate({
        id: certId,
        courseId: activeCourse.id,
        courseTitle: activeCourse.title,
        issuedDate: new Date().toISOString().split("T")[0]!,
        scorePercent: finalPercent,
        grade: finalGrade,
      });
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    if (!isAuthenticated) {
      onRequestAuth("signin");
      return;
    }
    setIsSubmittingProject(true);
    setProjectFeedback(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      const res = await fetch("/api/skillquest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "submit_assignment",
          courseId: activeCourse.id,
          projectTitle,
          artifactUrl,
          summaryNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProjectFeedback(data.error || "Could not submit practical assignment.");
      } else {
        setAssignments((prev) => [data.assignment, ...prev]);
        setProjectTitle("");
        setArtifactUrl("");
        setSummaryNotes("");
        sounds.playCorrect();
        setProjectFeedback("Practical project saved to your SkillQuest portfolio record.");
      }
    } catch {
      setProjectFeedback("Network issue submitting practical work.");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequestAuth("signin");
      return;
    }
    setAuthorFeedback(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      const res = await fetch("/api/skillquest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "create_course",
          organizationId: newOrgId || null,
          title: newTitle,
          category: newCategory,
          level: newLevel,
          targetZone: newTargetZone,
          overview: newOverview,
          practicalPrompt: newPracticalPrompt,
          sectionTitle: newSectionTitle,
          sectionBody: newSectionBody,
          quizQuestion: newQuizQ,
          quizOptions: [newQuizOpt0, newQuizOpt1, newQuizOpt2],
          quizCorrectIndex: newQuizCorrect,
          quizExplanation: newQuizExplanation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthorFeedback(data.error || "Could not publish course.");
      } else {
        setCustomCourses((prev) => [data.course, ...prev]);
        setNewTitle("");
        setNewOverview("");
        setNewPracticalPrompt("");
        setNewSectionBody("");
        setNewQuizQ("");
        setNewQuizOpt0("");
        setNewQuizOpt1("");
        setNewQuizOpt2("");
        setNewQuizExplanation("");
        sounds.playTrophy();
        setAuthorFeedback("Course published to SkillQuest Catalogue!");
      }
    } catch {
      setAuthorFeedback("Network error publishing course.");
    }
  };

  const handleAssignClassTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequestAuth("signin");
      return;
    }
    setClassroomFeedback(null);
    const chosenCourse = allCourses.find((c) => c.id === taskCourseId);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      const res = await fetch("/api/skillquest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "assign_class_task",
          organizationId: taskOrgId,
          classLabel: taskClassLabel,
          courseId: taskCourseId,
          courseTitle: chosenCourse?.title || taskCourseId,
          dueDate: taskDueDate,
          instructions: taskInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClassroomFeedback(data.error || "Could not assign task.");
      } else {
        setClassTasks((prev) => [data.classTask, ...prev]);
        setTaskInstructions("");
        sounds.playCorrect();
        setClassroomFeedback("Tenant-scoped classroom assignment published.");
      }
    } catch {
      setClassroomFeedback("Network error creating classroom assignment.");
    }
  };

  const activeCoursePrompt = activeCourse
    ? customCourses.find((c) => c.id === activeCourse.id)?.practicalPrompt ||
      practicalPrompts[activeCourse.id] ||
      `Apply core principles from ${activeCourse.title} to a real Nigerian civic, engineering, or school problem and summarize your solution steps.`
    : "";

  const activeCourseAssignments = activeCourse
    ? assignments.filter((a) => a.courseId === activeCourse.id)
    : [];

  return (
    <div className="space-y-6">
      {/* SkillQuest Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-[#08131d] p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>SkillQuest · Structured Learning & Skills</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-normal normal-case">
                {completedCourseIds.size} Courses Verified · {assignments.length} Practical Projects
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Learn. Practise. Build. Grow.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Follow curated learning paths, study interactive lectures & flashcards, submit hands-on practical projects, and earn verifiable SkillQuest certificates.
            </p>
          </div>

          {activeCourse ? (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveCourse(null);
                resetExam();
              }}
              className="self-start lg:self-auto flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to SkillQuest</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-1.5 text-xs font-mono">
              {(
                [
                  { id: "paths", label: "Learning Paths", icon: Route },
                  { id: "catalog", label: `Courses (${allCourses.length})`, icon: BookOpen },
                  { id: "classroom", label: "School & Classes", icon: Users },
                  { id: "author", label: "Instructor Studio", icon: FolderPlus },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = workspaceMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setWorkspaceMode(tab.id);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold transition-colors ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* VIEW A: LEARNING PATHS                                           */}
      {/* ================================================================ */}
      {!activeCourse && workspaceMode === "paths" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Structured Career & Academic Paths
              </h2>
              <p className="text-xs text-slate-400">
                Guided multi-course sequences leading to domain mastery badges and practical portfolio milestones.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWorkspaceMode("catalog")}
              className="self-start sm:self-auto text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Browse Full Course Catalogue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {learningPaths.map((path) => {
              const pathCourses = path.courseIds
                .map((id) => allCourses.find((c) => c.id === id))
                .filter((c): c is LearningCourse => Boolean(c));
              const doneCount = pathCourses.filter((c) => completedCourseIds.has(c.id)).length;
              const pct =
                pathCourses.length > 0
                  ? Math.round((doneCount / pathCourses.length) * 100)
                  : 0;
              const isZoneMatch = path.targetZones.includes(ageZone);

              return (
                <div
                  key={path.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">
                        {path.trackCode} · {path.estimatedWeeks} Weeks
                      </span>
                      <span className={isZoneMatch ? "text-emerald-300" : "text-slate-400"}>
                        {path.targetZones.join(" / ")}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {path.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        {path.outcomeSummary}
                      </p>
                    </div>

                    {/* Course Steps inside Path */}
                    <div className="space-y-2 pt-1">
                      {pathCourses.map((course, idx) => {
                        const completed = completedCourseIds.has(course.id);
                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => startCourse(course)}
                            className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 flex items-center justify-between gap-2 hover:border-emerald-500/60 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-xs font-bold text-slate-400 tabular-nums">
                                0{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  {course.title}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">
                                  {course.category} · +{course.xpReward} XP
                                </div>
                              </div>
                            </div>
                            {completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">
                        Milestone: <strong className="text-amber-300">{path.milestoneBadge}</strong>
                      </span>
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {doneCount}/{pathCourses.length} Completed ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW B: COURSE CATALOGUE                                         */}
      {/* ================================================================ */}
      {!activeCourse && workspaceMode === "catalog" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects, practical labs, algorithms, or instructor modules..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setZoneFilter("MY_ZONE");
                }}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  zoneFilter === "MY_ZONE"
                    ? "bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>My {ageZone} Tier</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setZoneFilter("ALL");
                }}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                  zoneFilter === "ALL"
                    ? "bg-slate-800 text-emerald-400 font-bold border border-emerald-500/50"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                All Tiers
              </button>
              {["All", "Foundational", "Intermediate", "Advanced"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedLevel(lvl);
                  }}
                  className={`px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                    selectedLevel === lvl
                      ? "bg-slate-800 text-emerald-400 font-bold border border-emerald-500/50"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => {
              const isCompleted = completedCourseIds.has(course.id);
              const isCustom = customCourses.some((c) => c.id === course.id);
              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        {getCategoryIcon(course.category)}
                      </span>
                      <span className="text-slate-300">
                        {course.level} · {course.targetZone}
                        {isCustom ? " · Instructor Authored" : ""}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold block">
                        {course.category}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white mt-0.5 leading-snug">
                        {course.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {course.overview}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-mono flex items-center justify-between">
                      <span>
                        {course.curriculumSections.length} Lessons · Practical Lab · Quiz
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {isCompleted ? "Verified" : `+${course.xpReward} XP`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCourse(course, "project")}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Project Lab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startCourse(course, "lecture")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <span>Open Course</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW C: TENANT-ISOLATED SCHOOL & CLASSROOM MANAGEMENT            */}
      {/* ================================================================ */}
      {!activeCourse && workspaceMode === "classroom" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  My Cohort & Class Assignments
                </h2>
                <p className="text-xs text-slate-400">
                  Strictly scoped to schools and academies you belong to (cross-tenant isolation enforced server-side).
                </p>
              </div>
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>

            {organizations.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs text-slate-300 space-y-2">
                <p>
                  You are not enrolled in a School or Academy workspace yet. Create or join one via the{" "}
                  <strong>Ecosystem Hub</strong> to receive scoped class tasks and isolated school leaderboards.
                </p>
              </div>
            ) : classTasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No active class assignments in your enrolled organizations yet.
              </p>
            ) : (
              <div className="space-y-3">
                {classTasks.map((task) => {
                  const targetCourse = allCourses.find((c) => c.id === task.courseId);
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-emerald-400 font-bold">
                          {task.organizationName} · {task.classLabel}
                        </span>
                        <span className="text-amber-300">Due {task.dueDate}</span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-white">
                        {task.courseTitle}
                      </h3>
                      <p className="text-xs text-slate-300">{task.instructions}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                        <span className="text-slate-400">Assigned by {task.assignedBy}</span>
                        {targetCourse && (
                          <button
                            type="button"
                            onClick={() => startCourse(targetCourse, "lecture")}
                            className="font-bold text-emerald-400 hover:text-emerald-300"
                          >
                            Launch Assigned Course →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form
            onSubmit={handleAssignClassTask}
            className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4"
          >
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white">
                Assign Class Task (Instructor / School Admin)
              </h2>
              <p className="text-xs text-slate-400">
                Assign a SkillQuest module to a specific cohort inside an organization where you hold Instructor or Admin permissions.
              </p>
            </div>

            {classroomFeedback && (
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-3 text-xs text-emerald-200">
                {classroomFeedback}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-slate-400 mb-1">
                  Target Organization Tenant
                </label>
                <select
                  value={taskOrgId}
                  onChange={(e) => setTaskOrgId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  {organizations.length === 0 ? (
                    <option value="">Create/Join an Organization in Ecosystem Hub first</option>
                  ) : (
                    organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.myRole})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Cohort / Class Label</label>
                  <input
                    type="text"
                    required
                    value={taskClassLabel}
                    onChange={(e) => setTaskClassLabel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Curriculum Course</label>
                <select
                  value={taskCourseId}
                  onChange={(e) => setTaskCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.targetZone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">
                  Deliverable & Rubric Expectations
                </label>
                <textarea
                  rows={3}
                  required
                  value={taskInstructions}
                  onChange={(e) => setTaskInstructions(e.target.value)}
                  placeholder="Complete formal quiz >= 80% and submit practical calculation memo..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={!taskOrgId}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
              >
                Publish Scoped Classroom Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW D: INSTRUCTOR & COURSE-AUTHOR STUDIO                        */}
      {/* ================================================================ */}
      {!activeCourse && workspaceMode === "author" && (
        <form
          onSubmit={handleCreateCourse}
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 max-w-3xl mx-auto space-y-4"
        >
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-display text-xl font-bold text-white">
              Instructor Course-Author Studio
            </h2>
            <p className="text-xs text-slate-400">
              Author structured SkillQuest lessons, practical lab prompts, and formal verification questions for public learners or your private school tenant.
            </p>
          </div>

          {authorFeedback && (
            <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-3 text-xs text-emerald-200">
              {authorFeedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-mono text-slate-400 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Distributed Microgrid Control & Telemetry"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Discipline</label>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as LearningCourse["category"])
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              >
                {categories
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as LearningCourse["level"])}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  <option value="Foundational">Foundational</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-slate-400 mb-1">Age Tier</label>
                <select
                  value={newTargetZone}
                  onChange={(e) => setNewTargetZone(e.target.value as AgeZone)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  <option value="JUNIOR">JUNIOR</option>
                  <option value="TEEN">TEEN</option>
                  <option value="YOUTH">YOUTH</option>
                  <option value="SENIOR">SENIOR</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-slate-400 mb-1">
                Visibility Scope (Public or Organization-Isolated)
              </label>
              <select
                value={newOrgId}
                onChange={(e) => setNewOrgId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              >
                <option value="">Public SkillQuest Catalogue (All Scholars)</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    Private to {org.name} ({org.myRole})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-slate-400 mb-1">Course Overview</label>
              <textarea
                rows={2}
                required
                value={newOverview}
                onChange={(e) => setNewOverview(e.target.value)}
                placeholder="Summarize skills learners will master..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-slate-400 mb-1">
                Practical Project Prompt
              </label>
              <input
                type="text"
                required
                value={newPracticalPrompt}
                onChange={(e) => setNewPracticalPrompt(e.target.value)}
                placeholder="Build or analyze a concrete practical deliverable..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-slate-400 mb-1">Lesson Title</label>
              <input
                type="text"
                required
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono text-slate-400 mb-1">Lesson Content</label>
              <textarea
                rows={4}
                required
                value={newSectionBody}
                onChange={(e) => setNewSectionBody(e.target.value)}
                placeholder="Write structured instructional narrative and worked formulas..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
              />
            </div>

            <div className="sm:col-span-2 border-t border-slate-800 pt-3">
              <span className="font-mono font-bold text-emerald-400 block mb-2">
                Verification Assessment Question
              </span>
              <input
                type="text"
                required
                value={newQuizQ}
                onChange={(e) => setNewQuizQ(e.target.value)}
                placeholder="Enter assessment question..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200 mb-2"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  required
                  value={newQuizOpt0}
                  onChange={(e) => setNewQuizOpt0(e.target.value)}
                  placeholder="Option A"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                />
                <input
                  type="text"
                  required
                  value={newQuizOpt1}
                  onChange={(e) => setNewQuizOpt1(e.target.value)}
                  placeholder="Option B"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                />
                <input
                  type="text"
                  required
                  value={newQuizOpt2}
                  onChange={(e) => setNewQuizOpt2(e.target.value)}
                  placeholder="Option C"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newQuizCorrect}
                  onChange={(e) => setNewQuizCorrect(Number(e.target.value))}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                >
                  <option value={0}>Correct: Option A</option>
                  <option value={1}>Correct: Option B</option>
                  <option value={2}>Correct: Option C</option>
                </select>
                <input
                  type="text"
                  required
                  value={newQuizExplanation}
                  onChange={(e) => setNewQuizExplanation(e.target.value)}
                  placeholder="Explanation shown after submission..."
                  className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Module to SkillQuest</span>
          </button>
        </form>
      )}

      {/* ================================================================ */}
      {/* ACTIVE COURSE VIEW (LECTURE / FLASHCARDS / PROJECT LAB / EXAM)   */}
      {/* ================================================================ */}
      {activeCourse && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {activeCourse.category} · {activeCourse.level} Level
              </span>
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
                {(
                  [
                    { id: "lecture", label: "Lessons & Cases" },
                    { id: "flashcards", label: "Flashcards" },
                    { id: "project", label: "Practical Lab" },
                    { id: "exam", label: "Verification Exam" },
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      if (sub.id === "exam") resetExam();
                      setCourseSubTab(sub.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      courseSubTab === sub.id
                        ? sub.id === "exam"
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                {activeCourse.title}
              </h2>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                {activeCourse.overview}
              </p>
            </div>
          </div>

          {courseSubTab === "lecture" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <h4 className="font-display text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Core Competencies & Outcomes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCourse.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>

              {activeCourse.curriculumSections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4"
                >
                  <h3 className="font-display text-lg font-bold text-emerald-300 border-b border-slate-800 pb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {section.body.map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>
                  {section.keyFormulasOrTakeaways && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase block">
                        Key Formulations & Takeaways
                      </span>
                      <ul className="list-disc list-inside space-y-1 font-mono text-xs text-emerald-400">
                        {section.keyFormulasOrTakeaways.map((f, fIdx) => (
                          <li key={fIdx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {section.caseStudy && (
                    <div className="rounded-xl border border-sky-900/60 bg-sky-950/20 p-4 space-y-1.5">
                      <span className="text-xs font-mono font-bold text-sky-400 uppercase block">
                        Applied Case Study: {section.caseStudy.title}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {section.caseStudy.narrative}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {courseSubTab === "flashcards" && (
            <div className="space-y-5">
              {(() => {
                const defaultCards = [
                  {
                    term: `${activeCourse.title} Core Premise`,
                    definition: activeCourse.overview,
                    context: "Primary conceptual summary.",
                  },
                  ...activeCourse.learningOutcomes.map((lo, idx) => ({
                    term: `Competency #${idx + 1}`,
                    definition: lo,
                    context: activeCourse.category,
                  })),
                ];
                const cards =
                  activeCourse.flashcards && activeCourse.flashcards.length > 0
                    ? activeCourse.flashcards
                    : defaultCards;
                const card = cards[activeCardIndex] || cards[0]!;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>
                        Card {activeCardIndex + 1} of {cards.length}
                      </span>
                      <span className="text-emerald-400">
                        {reviewedCards.size} Reviewed
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsCardFlipped(!isCardFlipped);
                        setReviewedCards((prev) => new Set(prev).add(activeCardIndex));
                      }}
                      className="w-full text-left min-h-[220px] rounded-2xl border border-slate-700 bg-slate-950 p-7 flex flex-col justify-between hover:border-emerald-500/60 transition-all"
                    >
                      <span className="text-[11px] font-mono text-slate-400">
                        {isCardFlipped ? "Definition & Application" : "Key Term · Tap to reveal"}
                      </span>
                      <div className="py-5 text-center space-y-2">
                        {!isCardFlipped ? (
                          <h3 className="font-display text-2xl font-bold text-white">
                            {card.term}
                          </h3>
                        ) : (
                          <>
                            <p className="text-base font-semibold text-emerald-200">
                              {card.definition}
                            </p>
                            <p className="text-xs text-slate-400">{card.context}</p>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex justify-between">
                        <span>{activeCourse.title}</span>
                        <span>{isCardFlipped ? "Side B" : "Side A"}</span>
                      </div>
                    </button>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={activeCardIndex === 0}
                        onClick={() => {
                          setActiveCardIndex((i) => Math.max(0, i - 1));
                          setIsCardFlipped(false);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeCardIndex + 1 < cards.length) {
                            setActiveCardIndex((i) => i + 1);
                            setIsCardFlipped(false);
                          } else {
                            resetExam();
                            setCourseSubTab("exam");
                          }
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        {activeCardIndex + 1 < cards.length ? "Next Card" : "Begin Exam"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {courseSubTab === "project" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 uppercase">
                  <Layers className="w-4 h-4" />
                  <span>Practical Project Brief</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{activeCoursePrompt}</p>
                <p className="text-xs font-mono text-slate-400">
                  Transparency Criteria: Explain your method cleanly and include any repository, document, or studio link.
                </p>
              </div>

              <form
                onSubmit={handleSubmitAssignment}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 text-xs"
              >
                <h3 className="font-display text-base font-bold text-white">
                  Submit Practical Deliverable
                </h3>
                {projectFeedback && (
                  <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-3 text-emerald-200">
                    {projectFeedback}
                  </div>
                )}
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Lagos Microgrid Battery Sizing Calculation"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">
                    Optional Artifact / Repository / Doc Link
                  </label>
                  <input
                    type="text"
                    value={artifactUrl}
                    onChange={(e) => setArtifactUrl(e.target.value)}
                    placeholder="https://github.com/... or Studio reference"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">
                    Solution Methodology & Reflections
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={summaryNotes}
                    onChange={(e) => setSummaryNotes(e.target.value)}
                    placeholder="Summarize your calculations, design choices, or code architecture..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmittingProject ? "Saving..." : "Submit Practical Project"}
                </button>
              </form>

              {activeCourseAssignments.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
                  <h4 className="font-display text-sm font-bold text-white">
                    Your Submitted Deliverables ({activeCourseAssignments.length})
                  </h4>
                  {activeCourseAssignments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-emerald-300">{item.projectTitle}</span>
                        <span className="text-slate-400">
                          {item.status} · {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300">{item.summaryNotes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {courseSubTab === "exam" && (
            <div className="max-w-2xl mx-auto space-y-6">
              {!examCompleted ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-mono">
                    <span className="text-emerald-400 font-bold">
                      Question {examQuestionIndex + 1} of {activeCourse.examination.length}
                    </span>
                    <span className="text-slate-400">{activeCourse.title}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-white leading-snug">
                    {activeCourse.examination[examQuestionIndex]?.question}
                  </h3>

                  <div className="space-y-2.5">
                    {activeCourse.examination[examQuestionIndex]?.options.map((opt, oIdx) => {
                      const isSelected = selectedOption === oIdx;
                      const isCorrect =
                        oIdx === activeCourse.examination[examQuestionIndex]?.correctAnswer;
                      let style =
                        "border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-700";
                      if (isOptionSubmitted) {
                        if (isCorrect) style = "border-emerald-500 bg-emerald-950/70 text-emerald-200 font-bold";
                        else if (isSelected) style = "border-rose-500 bg-rose-950/70 text-rose-200";
                      } else if (isSelected) {
                        style = "border-emerald-500 bg-emerald-950/40 text-white";
                      }
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isOptionSubmitted}
                          onClick={() => handleSelectOption(oIdx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${style}`}
                        >
                          <span>{opt}</span>
                          {isOptionSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                          )}
                          {isOptionSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isOptionSubmitted ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs text-slate-300">
                      <span className="font-bold text-emerald-400 font-mono block">
                        Verification Rationale
                      </span>
                      <p>{activeCourse.examination[examQuestionIndex]?.explanation}</p>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 ml-auto"
                      >
                        <span>
                          {examQuestionIndex + 1 < activeCourse.examination.length
                            ? "Next Question"
                            : "Verify & Finish Exam"}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={selectedOption === null}
                        onClick={handleSubmitAnswer}
                        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
                      >
                        Confirm Answer
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-5">
                  <div className="inline-flex p-4 rounded-2xl bg-slate-800 text-emerald-400">
                    <GraduationCap className="w-9 h-9" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Assessment Completed
                    </h2>
                    <p className="text-xs text-slate-300">{activeCourse.title}</p>
                  </div>
                  <div className="inline-flex flex-col items-center p-5 rounded-2xl bg-slate-950 border border-slate-800 min-w-44">
                    <span className="font-mono text-4xl font-extrabold text-emerald-400 tabular-nums">
                      {examScorePercent}%
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-bold">
                      Grade: {examGrade}
                    </span>
                  </div>
                  {examStatusNote && (
                    <p className="text-xs font-mono text-emerald-300">{examStatusNote}</p>
                  )}
                  {examScorePercent >= 70 ? (
                    <button
                      type="button"
                      onClick={() => setShowCertificateModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Verified Certificate</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetExam}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-6 py-2.5 text-xs font-bold text-white"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retake Assessment (70% Required)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official Verified SkillQuest Certificate Modal (personalized to real scholar!) */}
      {showCertificateModal && activeCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-3xl border-2 border-emerald-500/50 bg-[#070b14] p-8 text-slate-100 shadow-2xl space-y-6">
            <div className="text-center space-y-2 border-b border-slate-800 pb-5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 font-bold block">
                SkillQuest · NaijaPlay Ecosystem Credential
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Certificate of Academic Excellence
              </h2>
            </div>

            <div className="text-center space-y-3 py-2">
              <p className="text-xs text-slate-400">This formally certifies that</p>
              <h3 className="font-display text-2xl font-extrabold text-emerald-300">
                {playerDisplayName}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                satisfied transparent SkillQuest mastery criteria with a verified assessment score of{" "}
                <strong className="text-white font-mono">
                  {examScorePercent}% ({examGrade})
                </strong>{" "}
                in
              </p>
              <h4 className="font-display text-lg font-bold text-white">
                {activeCourse.title}
              </h4>
              <p className="font-mono text-[11px] text-slate-400">
                Criteria: Minimum 70% Verified Score · Discipline: {activeCourse.category} · Level:{" "}
                {activeCourse.level}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Issued Date</span>
                <span className="text-slate-300">{new Date().toISOString().split("T")[0]}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-500 block">Credential ID</span>
                <span className="text-emerald-400 font-bold">{lastCertId}</span>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
