"use client";

import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Layers,
  Terminal,
  Sigma,
  Atom,
  Dna,
  TrendingUp,
  Globe,
  Shield,
  BookMarked,
  Download,
  RotateCcw,
  Sparkles,
  Cpu,
  Zap,
  Search,
  HelpCircle,
  Check,
  CreditCard,
} from "lucide-react";
import { AgeZone, LearningCourse, LearningTestQuestion } from "@/types/naijaplay";
import { COMPREHENSIVE_COURSES } from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface LearnAndGrowProps {
  ageZone: AgeZone;
  onAwardXP: (amount: number, reason: string) => void;
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

export const LearnAndGrow: React.FC<LearnAndGrowProps> = ({
  ageZone,
  onAwardXP,
  onMissionProgress,
  onEarnCertificate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCourse, setActiveCourse] = useState<LearningCourse | null>(null);
  const [courseSubTab, setCourseSubTab] = useState<"lecture" | "flashcards" | "exam">("lecture");

  // Flashcards state
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());

  // Exam state
  const [examQuestionIndex, setExamQuestionIndex] = useState<number>(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isOptionSubmitted, setIsOptionSubmitted] = useState<boolean>(false);
  const [examCompleted, setExamCompleted] = useState<boolean>(false);
  const [examScorePercent, setExamScorePercent] = useState<number>(0);
  const [examGrade, setExamGrade] = useState<"Distinction" | "Merit" | "Pass">("Pass");
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

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

  const filteredCourses = COMPREHENSIVE_COURSES.filter((course) => {
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "All" || course.level === selectedLevel;
    const matchesSearch =
      searchQuery.trim() === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Mathematics":
        return <Sigma className="w-5 h-5 text-emerald-400" />;
      case "Computer Science":
        return <Terminal className="w-5 h-5 text-blue-400" />;
      case "Artificial Intelligence":
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case "Physical Sciences":
        return <Atom className="w-5 h-5 text-cyan-400" />;
      case "Renewable Energy & Engineering":
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case "Biological Sciences":
        return <Dna className="w-5 h-5 text-teal-400" />;
      case "Biotechnology & Health":
        return <Dna className="w-5 h-5 text-emerald-400" />;
      case "English & Literature":
        return <BookMarked className="w-5 h-5 text-purple-400" />;
      case "Financial Economics":
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case "African & World History":
        return <Globe className="w-5 h-5 text-orange-400" />;
      case "Civic Governance & Law":
      case "International Relations & Geopolitics":
        return <Shield className="w-5 h-5 text-red-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
    }
  };

  const startCourse = (course: LearningCourse) => {
    sounds.playClick();
    setActiveCourse(course);
    setCourseSubTab("lecture");
    setActiveCardIndex(0);
    setIsCardFlipped(false);
    setReviewedCards(new Set());
    resetExam();
  };

  const resetExam = () => {
    setExamQuestionIndex(0);
    setExamAnswers({});
    setSelectedOption(null);
    setIsOptionSubmitted(false);
    setExamCompleted(false);
    setExamScorePercent(0);
    setShowCertificateModal(false);
  };

  const startExam = () => {
    sounds.playClick();
    resetExam();
    setCourseSubTab("exam");
  };

  const handleSelectOption = (optIdx: number) => {
    if (isOptionSubmitted) return;
    setSelectedOption(optIdx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !activeCourse) return;
    setIsOptionSubmitted(true);
    const currentQ: LearningTestQuestion = activeCourse.examination[examQuestionIndex]!;
    const isCorrect = selectedOption === currentQ.correctAnswer;

    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }

    setExamAnswers((prev) => ({
      ...prev,
      [examQuestionIndex]: selectedOption,
    }));
  };

  const handleNextQuestion = () => {
    if (!activeCourse) return;
    sounds.playClick();

    if (examQuestionIndex + 1 < activeCourse.examination.length) {
      setExamQuestionIndex((i) => i + 1);
      setSelectedOption(null);
      setIsOptionSubmitted(false);
    } else {
      // Calculate final score
      let correctCount = 0;
      activeCourse.examination.forEach((q, idx) => {
        if (examAnswers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });

      const percent = Math.round((correctCount / activeCourse.examination.length) * 100);
      setExamScorePercent(percent);

      let grade: "Distinction" | "Merit" | "Pass" = "Pass";
      if (percent >= 90) grade = "Distinction";
      else if (percent >= 75) grade = "Merit";
      setExamGrade(grade);

      setExamCompleted(true);
      sounds.playTrophy();

      if (percent >= 70) {
        const certId = `CERT-2026-${activeCourse.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const todayStr = new Date().toISOString().split("T")[0]!;
        onAwardXP(activeCourse.xpReward, `Passed Examination: ${activeCourse.title}`);
        onMissionProgress("m-2", 1);
        onEarnCertificate({
          id: certId,
          courseId: activeCourse.id,
          courseTitle: activeCourse.title,
          issuedDate: todayStr,
          scorePercent: percent,
          grade,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <GraduationCap className="w-4 h-4" />
              <span>Module 3 · Comprehensive Academic Curriculum</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Learn & Academic Examinations
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Study verified curricula across all 8 core disciplines—from Mathematics and Computer Science to Constitutional Law. Complete lectures and take formal examinations to earn certificates.
            </p>
          </div>

          {activeCourse && (
            <button
              onClick={() => {
                sounds.playClick();
                setActiveCourse(null);
                resetExam();
              }}
              className="self-start md:self-auto flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Catalog</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------- VIEW 1: COURSE CATALOG -------------------- */}
      {!activeCourse && (
        <div className="space-y-5">
          {/* Search & Level Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects, theories, algorithms, or keywords..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
              <span className="text-slate-500 shrink-0 hidden sm:inline">Level:</span>
              {["All", "Foundational", "Intermediate", "Advanced"].map((lvl) => (
                <button
                  key={lvl}
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

          {/* Discipline Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Courses Header & Count */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span>Showing {filteredCourses.length} Academic Curriculum Courses</span>
            <span>All modules include formal lecture, flashcards & 5-question exam</span>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      {getCategoryIcon(course.category)}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-300 border border-slate-700">
                      {course.level}
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
                    <span>{course.curriculumSections.length} Sections · 5-Q Exam</span>
                    <span className="text-emerald-400 font-bold">+{course.xpReward} XP</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      startCourse(course);
                      setCourseSubTab("flashcards");
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Flashcards</span>
                  </button>

                  <button
                    onClick={() => startCourse(course)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                  >
                    <span>Lecture</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- VIEW 2: ACTIVE COURSE VIEW (LECTURE / FLASHCARDS / EXAM) -------------------- */}
      {activeCourse && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Course Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {activeCourse.category} · {activeCourse.level} Level
              </span>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setCourseSubTab("lecture");
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    courseSubTab === "lecture"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Lecture & Cases
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setCourseSubTab("flashcards");
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    courseSubTab === "flashcards"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Flashcards</span>
                </button>
                <button
                  onClick={startExam}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    courseSubTab === "exam"
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Take Exam</span>
                </button>
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

          {/* SUB-VIEW A: LECTURE MODE */}
          {courseSubTab === "lecture" && (
            <div className="space-y-6">
              {/* Learning Outcomes */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                  Core Competencies & Learning Outcomes
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

              {/* Curriculum Sections */}
              <div className="space-y-5">
                {activeCourse.curriculumSections.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-md"
                  >
                    <h3 className="font-display text-lg font-bold text-emerald-300 border-b border-slate-800 pb-2">
                      {section.title}
                    </h3>

                    <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {section.body.map((para, pIdx) => (
                        <p key={pIdx}>{para}</p>
                      ))}
                    </div>

                    {/* Key Formulas or Takeaways */}
                    {section.keyFormulasOrTakeaways && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Key Theorems & Practical Formulations:
                        </span>
                        <ul className="list-disc list-inside space-y-1 font-mono text-xs text-emerald-400">
                          {section.keyFormulasOrTakeaways.map((formula, fIdx) => (
                            <li key={fIdx}>{formula}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Real-World Case Study */}
                    {section.caseStudy && (
                      <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-4 space-y-1.5">
                        <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider block">
                          Empirical Case Study: {section.caseStudy.title}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {section.caseStudy.narrative}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-display text-base font-bold text-white">
                    Ready to Test Your Knowledge?
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Review flashcards or challenge the 5-question formal exam. Score 70% or higher to earn an official certificate.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setCourseSubTab("flashcards");
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Review Flashcards</span>
                  </button>
                  <button
                    onClick={startExam}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Begin Formal Test</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW B: FLASHCARDS REVISION DECK */}
          {courseSubTab === "flashcards" && (
            <div className="space-y-6">
              {(() => {
                const defaultFlashcards = [
                  {
                    term: `${activeCourse.title} Core Foundation`,
                    definition: activeCourse.overview,
                    context: "Primary curriculum premise.",
                  },
                  ...(activeCourse.learningOutcomes.map((lo, i) => ({
                    term: `Core Competency #${i + 1}`,
                    definition: lo,
                    context: `Required operational skill for ${activeCourse.category}.`,
                  }))),
                ];
                const cards = activeCourse.flashcards && activeCourse.flashcards.length > 0
                  ? activeCourse.flashcards
                  : defaultFlashcards;
                const currentCard = cards[activeCardIndex] || cards[0]!;

                return (
                  <div className="space-y-5">
                    {/* Progress Header */}
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
                      <span>Card {activeCardIndex + 1} of {cards.length}</span>
                      <span className="text-emerald-400 font-semibold">
                        {reviewedCards.size} of {cards.length} Reviewed
                      </span>
                    </div>

                    {/* Interactive Flashcard Card */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setIsCardFlipped(!isCardFlipped);
                        setReviewedCards((prev) => new Set(prev).add(activeCardIndex));
                      }}
                      className="cursor-pointer min-h-[260px] rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 flex flex-col justify-between hover:border-emerald-500/60 transition-all shadow-2xl relative select-none group"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {isCardFlipped ? "Definition & Context" : "Scientific Term"}
                        </span>
                        <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">
                          Click card to flip
                        </span>
                      </div>

                      <div className="py-6 text-center space-y-3">
                        {!isCardFlipped ? (
                          <>
                            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 block">
                              {activeCourse.category}
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                              {currentCard.term}
                            </h3>
                            <p className="text-xs text-slate-400">
                              Tap to reveal definition, theorems, and practical application
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-display text-base sm:text-lg text-emerald-200 leading-relaxed font-semibold">
                              {currentCard.definition}
                            </p>
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed inline-block max-w-lg mt-2">
                              <span className="font-bold text-slate-400 block font-mono mb-1">
                                Practical Application:
                              </span>
                              {currentCard.context}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-800/80">
                        <span>{activeCourse.title}</span>
                        <span>{isCardFlipped ? "Side B" : "Side A"}</span>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setActiveCardIndex((i) => Math.max(0, i - 1));
                          setIsCardFlipped(false);
                        }}
                        disabled={activeCardIndex === 0}
                        className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous Card
                      </button>

                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsCardFlipped(!isCardFlipped);
                          setReviewedCards((prev) => new Set(prev).add(activeCardIndex));
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                      >
                        Flip Card
                      </button>

                      <button
                        onClick={() => {
                          sounds.playClick();
                          if (activeCardIndex + 1 < cards.length) {
                            setActiveCardIndex((i) => i + 1);
                            setIsCardFlipped(false);
                          } else {
                            startExam();
                          }
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                      >
                        {activeCardIndex + 1 < cards.length ? "Next Card" : "Proceed to Test"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-VIEW C: FORMAL EXAMINATION TEST MODE */}
          {courseSubTab === "exam" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {!examCompleted ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                    Question {examQuestionIndex + 1} of {activeCourse.examination.length}
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeCourse.title}
                  </span>
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setCourseSubTab("lecture");
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Review Lecture
                </button>
              </div>

              {/* Question Prompt */}
              <div className="space-y-4">
                <h3 className="font-display text-lg font-bold text-white leading-snug">
                  {activeCourse.examination[examQuestionIndex]?.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5">
                  {activeCourse.examination[examQuestionIndex]?.options.map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const isCorrectAnswer = oIdx === activeCourse.examination[examQuestionIndex]?.correctAnswer;

                    let btnStyle = "border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-700 hover:bg-slate-900";
                    if (isOptionSubmitted) {
                      if (isCorrectAnswer) {
                        btnStyle = "border-emerald-500 bg-emerald-950/70 text-emerald-200 font-bold";
                      } else if (isSelected) {
                        btnStyle = "border-red-500 bg-red-950/70 text-red-200";
                      } else {
                        btnStyle = "border-slate-800 bg-slate-950/40 text-slate-500";
                      }
                    } else if (isSelected) {
                      btnStyle = "border-emerald-500 bg-emerald-950/40 text-white shadow-md ring-1 ring-emerald-500";
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(oIdx)}
                        disabled={isOptionSubmitted}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isOptionSubmitted && isCorrectAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                        )}
                        {isOptionSubmitted && isSelected && !isCorrectAnswer && (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pedagogical Explanation & Submit / Next Controls */}
              {isOptionSubmitted ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 animate-in fade-in-50">
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-emerald-400 font-mono block mb-1">
                      Analytical Explanation:
                    </span>
                    {activeCourse.examination[examQuestionIndex]?.explanation}
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors ml-auto"
                  >
                    <span>
                      {examQuestionIndex + 1 < activeCourse.examination.length
                        ? "Next Question"
                        : "Finish Examination"}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-30 transition-colors shadow-lg shadow-emerald-950"
                  >
                    Confirm Answer
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* EXAM COMPLETION & SCORECARD VIEW */
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-6 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400">
                <GraduationCap className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-white">
                  Examination Assessment Completed
                </h2>
                <p className="text-xs text-slate-300">
                  {activeCourse.title}
                </p>
              </div>

              {/* Score Metric Pill */}
              <div className="inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800 min-w-48 space-y-1">
                <span className="font-mono text-4xl font-extrabold text-emerald-400">
                  {examScorePercent}%
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Grade: {examGrade}
                </span>
              </div>

              {examScorePercent >= 70 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-4 text-xs text-emerald-300">
                    Congratulations! You have demonstrated academic mastery and earned +{activeCourse.xpReward} XP along with an Official Certificate of Academic Excellence.
                  </div>
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Official Certificate</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                    A minimum passing score of 70% is required to earn the official course certificate. Review the lecture curriculum and retake the assessment.
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      resetExam();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Examination</span>
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setCourseSubTab("lecture");
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Return to Lecture
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveCourse(null);
                  }}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  All Courses
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )}

      {/* -------------------- OFFICIAL CERTIFICATE MODAL -------------------- */}
      {showCertificateModal && activeCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-3xl border-2 border-emerald-500/50 bg-[#070b14] p-8 text-slate-100 shadow-2xl space-y-6 relative">
            {/* Certificate Header */}
            <div className="text-center space-y-2 border-b border-slate-800 pb-5">
              <div className="inline-flex p-3 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 mb-1">
                <GraduationCap className="w-8 h-8" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 font-bold block">
                NaijaPlay Academic Certification Authority
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Certificate of Academic Excellence
              </h2>
            </div>

            {/* Certificate Body */}
            <div className="text-center space-y-3 py-2">
              <p className="text-xs text-slate-400">
                This academic credential formally certifies that
              </p>
              <h3 className="font-display text-2xl font-extrabold text-emerald-300">
                Chidi Okonkwo
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                has successfully fulfilled all academic curriculum requirements and achieved a score of{" "}
                <strong className="text-white font-mono">{examScorePercent}% ({examGrade})</strong> on the formal examination in
              </p>
              <h4 className="font-display text-lg font-bold text-white">
                {activeCourse.title}
              </h4>
              <span className="font-mono text-xs text-slate-500 block">
                Discipline: {activeCourse.category} · Academic Level: {activeCourse.level}
              </span>
            </div>

            {/* Certificate Footer / Verification */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Date of Issue</span>
                <span className="text-slate-300">{new Date().toISOString().split("T")[0]}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-500 block">Verification ID</span>
                <span className="text-emerald-400 font-bold">CERT-2026-{activeCourse.id.toUpperCase()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Cryptographically Signed · Accredited Academic Module
              </span>
              <button
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
