"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Gamepad2,
  Flame,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Timer,
  ChevronRight,
  Calculator,
  Terminal,
  Atom,
  Globe,
  Scale,
  TrendingUp,
  Cpu,
  Brain,
  Code2,
  Layers,
  Play,
  SpellCheck,
  Lock,
  KeyRound,
  LogIn,
  Search,
  ShieldCheck,
  History,
  Infinity as InfinityIcon,
  Sliders,
  Compass,
} from "lucide-react";
import {
  AgeZone,
  GameCategoryFilter,
  GameDifficulty,
  GameHistoryRecord,
  GameMode,
  PersonalGameStats,
} from "@/types/naijaplay";
import {
  AGE_CALIBRATED_QUESTIONS,
  NAIJA_TRIVIA_QUESTIONS,
  CORE_GAME_CATALOG,
  GameQuestionItem,
  MEMORY_DECKS_BY_ZONE,
  WORD_CIPHER_DATASET,
  CODE_DEBUGGER_DATASET,
  WordCipherItem,
  CodeDebuggerItem,
} from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface GameArenaProps {
  ageZone: AgeZone;
  onAwardXP: (amount: number, reason: string) => void;
  onVerifiedXP: (amount: number, totalXP: number, level: number) => void;
  onMissionProgress: (missionId: string, delta: number) => void;
  isAuthenticated: boolean;
  onRequestAuth: (tab?: "signin" | "register") => void;
  onGameCompleted?: () => void;
}

interface GameDefinition {
  id: string;
  title: string;
  discipline: string;
  description: string;
  durationSeconds: number;
  xpReward: number;
}

type ArenaTab =
  | "catalog"
  | "trivia"
  | "drills"
  | "memory"
  | "cipher"
  | "math_blitz"
  | "debugger"
  | "history";

interface ShuffledQuizQuestion {
  original: GameQuestionItem;
  shuffledOptions: Array<{ text: string; originalIndex: number }>;
}

interface MemoryCardState {
  cardId: string;
  pairKey: string;
  label: string;
  sublabel: string;
  category: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface VerifiedRoundSummary {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracyPercent: number;
  durationSeconds: number;
  awardedXP: number;
  difficulty: GameDifficulty;
  mode: GameMode;
  verifiedByServer: boolean;
}

interface SavedRoundDraft {
  gameId: string;
  kind: "trivia" | "drills";
  sessionId: string;
  questionIds: string[];
  questionIndex: number;
  answers: number[];
  score: number;
  difficulty: GameDifficulty;
  mode: GameMode;
  ageZone: AgeZone;
}

const DRAFT_STORAGE_KEY = "np_saved_round_draft_v1";

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildRandomizedRound(bank: GameQuestionItem[]): ShuffledQuizQuestion[] {
  return shuffleArray(bank).map((q) => ({
    original: q,
    shuffledOptions: shuffleArray(
      q.options.map((text, originalIndex) => ({ text, originalIndex })),
    ),
  }));
}

export const GameArena: React.FC<GameArenaProps> = ({
  ageZone,
  onAwardXP,
  onVerifiedXP,
  onMissionProgress,
  isAuthenticated,
  onRequestAuth,
  onGameCompleted,
}) => {
  // Top-level library & mode configuration
  const [activeTab, setActiveTab] = useState<ArenaTab>("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<GameCategoryFilter>("ALL");
  const [difficulty, setDifficulty] = useState<GameDifficulty>("STANDARD");
  const [gameMode, setGameMode] = useState<GameMode>("TIMED");

  // History & personal statistics loaded from PostgreSQL
  const [historyRecords, setHistoryRecords] = useState<GameHistoryRecord[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalGameStats | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Saved in-progress resume draft
  const [savedDraft, setSavedDraft] = useState<SavedRoundDraft | null>(null);

  const loadGameHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      const res = await fetch("/api/games/sessions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.history ?? []);
        setPersonalStats(data.stats ?? null);
      }
    } catch {
      // Silent fail — history remains empty
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
    fetch("/api/games/sessions", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setHistoryRecords(data.history ?? []);
          setPersonalStats(data.stats ?? null);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SavedRoundDraft;
          if (parsed.ageZone === ageZone && parsed.sessionId && parsed.questionIds?.length) {
            setSavedDraft(parsed);
          }
        }
      } catch {
        // Ignore corrupt draft
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ageZone]);

  // Helper to start/complete skill-game sessions on backend
  const startServerSession = useCallback(
    async (gameId: string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      const response = await fetch("/api/games/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "start", gameId, difficulty, mode: gameMode }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not start saved session.");
      }
      return result.session.id as string;
    },
    [difficulty, gameMode],
  );

  const completeSkillServerSession = useCallback(
    async (
      sessionId: string | null,
      metricCorrect: number,
      metricTotal: number,
      fallbackReason: string,
      fallbackXp: number,
    ) => {
      if (!sessionId) {
        onAwardXP(fallbackXp, fallbackReason);
        return null;
      }
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
        const res = await fetch("/api/games/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: "complete",
            sessionId,
            difficulty,
            mode: gameMode,
            metricCorrect,
            metricTotal,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          onVerifiedXP(data.awardedXP, data.totalXP, data.level);
          void loadGameHistory();
          if (onGameCompleted) onGameCompleted();
          return data as VerifiedRoundSummary;
        }
      } catch {
        // Fallback below
      }
      onAwardXP(fallbackXp, fallbackReason);
      return null;
    },
    [difficulty, gameMode, loadGameHistory, onAwardXP, onGameCompleted, onVerifiedXP],
  );

  // Per-question timer duration based on Difficulty
  const getSecondsPerQuestion = useCallback(
    (zone: AgeZone) => {
      const base =
        zone === "JUNIOR" ? 20 : zone === "TEEN" ? 22 : zone === "YOUTH" ? 25 : 28;
      if (difficulty === "CHALLENGER") return Math.max(12, base - 5);
      if (difficulty === "MASTER") return Math.max(9, base - 9);
      return base;
    },
    [difficulty],
  );

  // =========================================================================
  // 1. NAIJA TRIVIA & BRAIN RUSH QUIZ ENGINE (RANDOMIZED + TIMED/UNTIMED)
  // =========================================================================
  const [activeQuizKind, setActiveQuizKind] = useState<"trivia" | "drills">("drills");
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [roundQuestions, setRoundQuestions] = useState<ShuffledQuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedShuffledOption, setSelectedShuffledOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(20);
  const [isGameCompleted, setIsGameCompleted] = useState<boolean>(false);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmissionError, setScoreSubmissionError] = useState<string | null>(null);
  const [verifiedSummary, setVerifiedSummary] = useState<VerifiedRoundSummary | null>(null);

  const getGamesForZone = (zone: AgeZone): GameDefinition[] => {
    switch (zone) {
      case "JUNIOR":
        return [
          {
            id: "j-math",
            title: "Arithmetic Speed Sprint",
            discipline: "Mathematics (Ages 6–12)",
            description: "Rapid mental arithmetic, multiplication tables, division, and fractions.",
            durationSeconds: 15,
            xpReward: 100,
          },
          {
            id: "j-science",
            title: "Earth Science & Nature Explorer",
            discipline: "Natural Sciences (Ages 6–12)",
            description: "Planetary astronomy, weather cycles, animal adaptations, and plant biology.",
            durationSeconds: 15,
            xpReward: 100,
          },
          {
            id: "j-geo",
            title: "African Geography & Heritage Quest",
            discipline: "Geography & History (Ages 6–12)",
            description: "African rivers, mountain ranges, capital cities, and pre-colonial landmarks.",
            durationSeconds: 15,
            xpReward: 100,
          },
          {
            id: "j-vocab",
            title: "Linguistic Lexicon & Spelling Sprint",
            discipline: "English Vocabulary (Ages 6–12)",
            description: "Antonyms, synonyms, phonetic roots, and syntactic sentence construction.",
            durationSeconds: 15,
            xpReward: 110,
          },
          {
            id: "j-spatial",
            title: "Geometric Shapes & Spatial Logic",
            discipline: "Applied Geometry (Ages 6–12)",
            description: "Perimeter calculations, polygon angles, symmetry lines, and spatial logic.",
            durationSeconds: 15,
            xpReward: 110,
          },
          {
            id: "j-civics",
            title: "Civic Values & Community Leadership",
            discipline: "Social Sciences (Ages 6–12)",
            description: "Democratic principles, community rights, historical national symbols, and ethics.",
            durationSeconds: 15,
            xpReward: 110,
          },
        ];
      case "TEEN":
        return [
          {
            id: "t-algebra",
            title: "Algebraic Equations Speed Lab",
            discipline: "Mathematics (Ages 13–17)",
            description: "Linear systems, quadratic roots, function evaluations, and rapid simplification.",
            durationSeconds: 20,
            xpReward: 140,
          },
          {
            id: "t-physics",
            title: "Physics & Chemistry Diagnostics",
            discipline: "Physical Sciences (Ages 13–17)",
            description: "Newtonian dynamics, kinematics, energy conversion, and periodic table trends.",
            durationSeconds: 20,
            xpReward: 140,
          },
          {
            id: "t-code",
            title: "Python Syntax & Algorithmic Debugger",
            discipline: "Computer Science (Ages 13–17)",
            description: "List comprehensions, control flow, recursion, and string manipulation logic.",
            durationSeconds: 20,
            xpReward: 140,
          },
          {
            id: "t-chem",
            title: "Organic Chemistry & Reaction Kinetics",
            discipline: "Physical Sciences (Ages 13–17)",
            description: "Hydrocarbon nomenclature, acid-base neutralizations, pH metrics, and catalysts.",
            durationSeconds: 20,
            xpReward: 150,
          },
          {
            id: "t-lit",
            title: "Classical Rhetoric & Literary Analysis",
            discipline: "Literature (Ages 13–17)",
            description: "Poetic sonnet meters, tragic flaws, African canons, and argumentative fallacies.",
            durationSeconds: 20,
            xpReward: 150,
          },
          {
            id: "t-econ",
            title: "Microeconomics & Market Equilibria",
            discipline: "Financial Economics (Ages 13–17)",
            description: "Price elasticity of demand, supply shifts, marginal cost, and market clearing.",
            durationSeconds: 20,
            xpReward: 150,
          },
        ];
      case "YOUTH":
        return [
          {
            id: "y-quant",
            title: "Probability & Quantitative Lab",
            discipline: "Applied Mathematics (Ages 18–24)",
            description: "Combinatorics, statistical distributions, calculus derivatives, and risk modeling.",
            durationSeconds: 25,
            xpReward: 180,
          },
          {
            id: "y-algo",
            title: "Data Structures & Complexity Sprint",
            discipline: "Computer Science (Ages 18–24)",
            description: "Asymptotic Big-O analysis, balanced trees, graph traversal, and sorting efficiency.",
            durationSeconds: 25,
            xpReward: 180,
          },
          {
            id: "y-macro",
            title: "Macroeconomic Policy & Market Modeling",
            discipline: "Financial Economics (Ages 18–24)",
            description: "Monetary policy rates, inflationary dynamics, AfCFTA trade, and asset valuation.",
            durationSeconds: 25,
            xpReward: 180,
          },
          {
            id: "y-ai",
            title: "Machine Learning & Matrix Foundations",
            discipline: "Artificial Intelligence (Ages 18–24)",
            description: "Gradient descent calculus, SVD factorization, self-attention, and classification metrics.",
            durationSeconds: 25,
            xpReward: 200,
          },
          {
            id: "y-bio",
            title: "Cellular Biochemistry & Metabolic Pathways",
            discipline: "Biological Sciences (Ages 18–24)",
            description: "Krebs cycle oxidative phosphorylation, enzymatic Michaelis-Menten kinetics, and DNA.",
            durationSeconds: 25,
            xpReward: 200,
          },
          {
            id: "y-trade",
            title: "International Trade & AfCFTA Policy",
            discipline: "Geopolitics & Law (Ages 18–24)",
            description: "Rules of Origin, non-tariff customs clearance, currency clearing, and regional trade.",
            durationSeconds: 25,
            xpReward: 200,
          },
        ];
      case "SENIOR":
        return [
          {
            id: "s-system",
            title: "Distributed Systems Architecture IQ",
            discipline: "Software Engineering (Ages 25–30)",
            description: "CAP Theorem, consensus protocols (Raft/Paxos), ACID guarantees, and caching.",
            durationSeconds: 30,
            xpReward: 220,
          },
          {
            id: "s-finance",
            title: "Corporate Finance & Valuation Drill",
            discipline: "Corporate Finance (Ages 25–30)",
            description: "Discounted Cash Flow (DCF), WACC modeling, capital structure, and M&A logic.",
            durationSeconds: 30,
            xpReward: 220,
          },
          {
            id: "s-law",
            title: "Constitutional Jurisprudence Case Solver",
            discipline: "Jurisprudence & Governance (Ages 25–30)",
            description: "Judicial review precedents, separation of powers, and administrative doctrine.",
            durationSeconds: 30,
            xpReward: 220,
          },
          {
            id: "s-quant",
            title: "Quantitative Risk & Derivative Valuation",
            discipline: "Quantitative Finance (Ages 25–30)",
            description: "Black-Scholes-Merton Greek hedges (Delta, Gamma, Vega), and stochastic modeling.",
            durationSeconds: 30,
            xpReward: 240,
          },
          {
            id: "s-crypto",
            title: "Applied Cryptography & Security Protocols",
            discipline: "Cybersecurity (Ages 25–30)",
            description: "Elliptic curve discrete logarithms, zero-knowledge proofs, and hash collision resistance.",
            durationSeconds: 30,
            xpReward: 240,
          },
          {
            id: "s-juris",
            title: "International Law & Maritime Treaties",
            discipline: "International Law (Ages 25–30)",
            description: "UNCLOS EEZ nautical boundaries, AU Article 4(h) sovereignty, and arbitration treaties.",
            durationSeconds: 30,
            xpReward: 240,
          },
        ];
    }
  };

  const currentGames = getGamesForZone(ageZone);

  const handleTimeExpired = useCallback(() => {
    sounds.playWrong();
    setAnswers((current) => {
      const next = [...current];
      next[questionIndex] = -1;
      return next;
    });
    setAnswerSubmitted(true);
    setSelectedShuffledOption(-1);
    setStreak(0);
  }, [questionIndex]);

  useEffect(() => {
    if (gameMode === "UNTIMED") return;
    let interval: NodeJS.Timeout;
    if (activeGameId && !isGameCompleted && timerSeconds > 0 && !answerSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((t) => {
          if (t <= 1) {
            handleTimeExpired();
            return getSecondsPerQuestion(ageZone);
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [
    activeGameId,
    isGameCompleted,
    timerSeconds,
    answerSubmitted,
    gameMode,
    handleTimeExpired,
    getSecondsPerQuestion,
    ageZone,
  ]);

  const persistRoundDraft = useCallback(
    (nextIndex: number, nextAnswers: number[], nextScore: number) => {
      if (typeof window === "undefined" || !activeGameId || !gameSessionId) return;
      const draft: SavedRoundDraft = {
        gameId: activeGameId,
        kind: activeQuizKind,
        sessionId: gameSessionId,
        questionIds: roundQuestions.map((q) => q.original.id),
        questionIndex: nextIndex,
        answers: nextAnswers,
        score: nextScore,
        difficulty,
        mode: gameMode,
        ageZone,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setSavedDraft(draft);
    },
    [activeGameId, activeQuizKind, ageZone, difficulty, gameMode, gameSessionId, roundQuestions],
  );

  const startQuizRound = async (gameId: string, kind: "trivia" | "drills") => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }

    setScoreSubmissionError(null);
    setVerifiedSummary(null);
    try {
      const newSessionId = await startServerSession(gameId);
      const bank =
        kind === "trivia"
          ? NAIJA_TRIVIA_QUESTIONS[ageZone] || NAIJA_TRIVIA_QUESTIONS.TEEN
          : AGE_CALIBRATED_QUESTIONS[ageZone] || AGE_CALIBRATED_QUESTIONS.TEEN!;
      const randomized = buildRandomizedRound(bank);

      sounds.playClick();
      setActiveTab(kind);
      setActiveQuizKind(kind);
      setActiveGameId(gameId);
      setRoundQuestions(randomized);
      setGameSessionId(newSessionId);
      setQuestionIndex(0);
      setSelectedShuffledOption(null);
      setScore(0);
      setStreak(0);
      setTimerSeconds(getSecondsPerQuestion(ageZone));
      setIsGameCompleted(false);
      setAnswerSubmitted(false);
      setAnswers([]);
      setIsSubmittingScore(false);
    } catch (error) {
      setScoreSubmissionError(
        error instanceof Error ? error.message : "Could not start a saved session.",
      );
    }
  };

  const resumeSavedDraft = () => {
    if (!savedDraft) return;
    const bank =
      savedDraft.kind === "trivia"
        ? NAIJA_TRIVIA_QUESTIONS[ageZone] || NAIJA_TRIVIA_QUESTIONS.TEEN
        : AGE_CALIBRATED_QUESTIONS[ageZone] || AGE_CALIBRATED_QUESTIONS.TEEN!;
    const reconstructed: ShuffledQuizQuestion[] = savedDraft.questionIds
      .map((id) => bank.find((q) => q.id === id))
      .filter((q): q is GameQuestionItem => Boolean(q))
      .map((q) => ({
        original: q,
        shuffledOptions: q.options.map((text, originalIndex) => ({ text, originalIndex })),
      }));

    if (!reconstructed.length) return;
    sounds.playClick();
    setDifficulty(savedDraft.difficulty);
    setGameMode(savedDraft.mode);
    setActiveTab(savedDraft.kind);
    setActiveQuizKind(savedDraft.kind);
    setActiveGameId(savedDraft.gameId);
    setGameSessionId(savedDraft.sessionId);
    setRoundQuestions(reconstructed);
    setQuestionIndex(Math.min(savedDraft.questionIndex, reconstructed.length - 1));
    setAnswers(savedDraft.answers);
    setScore(savedDraft.score);
    setSelectedShuffledOption(null);
    setAnswerSubmitted(false);
    setIsGameCompleted(false);
    setVerifiedSummary(null);
    setTimerSeconds(getSecondsPerQuestion(ageZone));
  };

  const handleOptionClick = (shuffledIdx: number) => {
    if (answerSubmitted) return;
    const activeQ = roundQuestions[questionIndex];
    if (!activeQ) return;
    const chosenOriginalIdx = activeQ.shuffledOptions[shuffledIdx]?.originalIndex ?? -1;

    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex] = chosenOriginalIdx;
    setAnswers(updatedAnswers);
    setSelectedShuffledOption(shuffledIdx);
    setAnswerSubmitted(true);

    const pointsPerHit =
      difficulty === "MASTER" ? 150 : difficulty === "CHALLENGER" ? 125 : 100;
    let nextScore = score;
    if (chosenOriginalIdx === activeQ.original.correctAnswer) {
      sounds.playCorrect();
      nextScore = score + pointsPerHit;
      setScore(nextScore);
      setStreak((st) => st + 1);
      onMissionProgress("m-3", 1);
    } else {
      sounds.playWrong();
      setStreak(0);
    }

    persistRoundDraft(questionIndex, updatedAnswers, nextScore);
  };

  const completeSavedQuiz = async (finalAnswers: number[]) => {
    if (!gameSessionId) {
      setScoreSubmissionError("This round has no active server session.");
      return;
    }

    setIsSubmittingScore(true);
    setScoreSubmissionError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      const response = await fetch("/api/games/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "complete",
          sessionId: gameSessionId,
          answers: finalAnswers,
          questionIds: roundQuestions.map((q) => q.original.id),
          difficulty,
          mode: gameMode,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not verify this game result.");
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setSavedDraft(null);
      }

      setScore(result.score);
      setVerifiedSummary(result);
      onVerifiedXP(result.awardedXP, result.totalXP, result.level);
      void loadGameHistory();
      if (onGameCompleted) onGameCompleted();
    } catch (error) {
      setScoreSubmissionError(
        error instanceof Error ? error.message : "Could not verify this game result.",
      );
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const nextQuestion = () => {
    sounds.playClick();
    if (questionIndex + 1 < roundQuestions.length) {
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      setSelectedShuffledOption(null);
      setAnswerSubmitted(false);
      setTimerSeconds(getSecondsPerQuestion(ageZone));
      persistRoundDraft(nextIdx, answers, score);
    } else {
      setIsGameCompleted(true);
      sounds.playTrophy();
      void completeSavedQuiz(answers);
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    if (discipline.includes("Math") || discipline.includes("Algebra") || discipline.includes("Geometry")) {
      return <Calculator className="w-5 h-5 text-emerald-400" />;
    }
    if (discipline.includes("Computer") || discipline.includes("Software")) {
      return <Terminal className="w-5 h-5 text-blue-400" />;
    }
    if (discipline.includes("AI") || discipline.includes("Intelligence")) {
      return <Cpu className="w-5 h-5 text-indigo-400" />;
    }
    if (discipline.includes("Science") || discipline.includes("Physics") || discipline.includes("Chemistry")) {
      return <Atom className="w-5 h-5 text-cyan-400" />;
    }
    if (discipline.includes("Finance") || discipline.includes("Economic")) {
      return <TrendingUp className="w-5 h-5 text-amber-400" />;
    }
    if (discipline.includes("Law") || discipline.includes("Jurisprudence") || discipline.includes("Civic")) {
      return <Scale className="w-5 h-5 text-purple-400" />;
    }
    return <Globe className="w-5 h-5 text-teal-400" />;
  };

  // =========================================================================
  // 2. MEMORY MATCH (COGNITIVE MEMORY MATRIX)
  // =========================================================================
  const memorySessionRef = useRef<string | null>(null);
  const [memoryDeck, setMemoryDeck] = useState<MemoryCardState[]>(() => {
    const rawDeck = MEMORY_DECKS_BY_ZONE[ageZone] || MEMORY_DECKS_BY_ZONE.TEEN!;
    return shuffleArray(rawDeck).map((c) => ({
      cardId: c.id,
      pairKey: c.pairKey,
      label: c.label,
      sublabel: c.sublabel,
      category: c.category,
      isFlipped: false,
      isMatched: false,
    }));
  });
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState<number>(0);
  const [isMemoryCompleted, setIsMemoryCompleted] = useState<boolean>(false);

  const initMemoryGame = useCallback(() => {
    sounds.playClick();
    const rawDeck = MEMORY_DECKS_BY_ZONE[ageZone] || MEMORY_DECKS_BY_ZONE.TEEN!;
    const shuffled = shuffleArray(rawDeck).map((c) => ({
      cardId: c.id,
      pairKey: c.pairKey,
      label: c.label,
      sublabel: c.sublabel,
      category: c.category,
      isFlipped: false,
      isMatched: false,
    }));
    setMemoryDeck(shuffled);
    setFlippedCards([]);
    setMemoryMoves(0);
    setIsMemoryCompleted(false);
    if (isAuthenticated) {
      void startServerSession("memory-match")
        .then((sid) => {
          memorySessionRef.current = sid;
        })
        .catch(() => {
          memorySessionRef.current = null;
        });
    }
  }, [ageZone, isAuthenticated, startServerSession]);

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2) return;
    const card = memoryDeck[index];
    if (!card || card.isFlipped || card.isMatched) return;

    sounds.playClick();
    const newDeck = [...memoryDeck];
    newDeck[index] = { ...card, isFlipped: true };
    setMemoryDeck(newDeck);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((m) => m + 1);
      const firstIdx = newFlipped[0]!;
      const secondIdx = newFlipped[1]!;
      const firstCard = newDeck[firstIdx]!;
      const secondCard = newDeck[secondIdx]!;

      if (firstCard.pairKey === secondCard.pairKey) {
        sounds.playCorrect();
        setTimeout(() => {
          setMemoryDeck((prev) => {
            const updated = [...prev];
            updated[firstIdx] = { ...updated[firstIdx]!, isMatched: true };
            updated[secondIdx] = { ...updated[secondIdx]!, isMatched: true };

            const allMatched = updated.every((c) => c.isMatched);
            if (allMatched) {
              setIsMemoryCompleted(true);
              sounds.playTrophy();
              const pairCount = Math.max(1, Math.floor(updated.length / 2));
              void completeSkillServerSession(
                memorySessionRef.current,
                pairCount,
                pairCount,
                "Cleared Memory Match Matrix",
                150,
              );
            }
            return updated;
          });
          setFlippedCards([]);
        }, 300);
      } else {
        setTimeout(() => {
          sounds.playWrong();
          setMemoryDeck((prev) => {
            const updated = [...prev];
            updated[firstIdx] = { ...updated[firstIdx]!, isFlipped: false };
            updated[secondIdx] = { ...updated[secondIdx]!, isFlipped: false };
            return updated;
          });
          setFlippedCards([]);
        }, 850);
      }
    }
  };

  // =========================================================================
  // 3. WORD CHALLENGE (LINGUISTIC WORD CIPHER)
  // =========================================================================
  const cipherSessionRef = useRef<string | null>(null);
  const cipherItemsForZone = useMemo(() => {
    const filtered = WORD_CIPHER_DATASET.filter((item) => item.targetZone === ageZone);
    return filtered.length ? filtered : WORD_CIPHER_DATASET.filter((item) => item.targetZone === "TEEN");
  }, [ageZone]);

  const [cipherIndex, setCipherIndex] = useState<number>(0);
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [bankLetters, setBankLetters] = useState<Array<{ char: string; originalIdx: number; isUsed: boolean }>>(() => {
    const target = cipherItemsForZone[0] || WORD_CIPHER_DATASET[0]!;
    return shuffleArray(target.targetWord.split("")).map((char, originalIdx) => ({
      char,
      originalIdx,
      isUsed: false,
    }));
  });
  const [isCipherSolved, setIsCipherSolved] = useState<boolean>(false);
  const [cipherScore, setCipherScore] = useState<number>(0);

  const currentCipher: WordCipherItem | undefined = cipherItemsForZone[cipherIndex] || cipherItemsForZone[0];

  const initCipherWord = useCallback(
    (item?: WordCipherItem) => {
      const target = item || currentCipher;
      if (!target) return;
      const scrambled = shuffleArray(target.targetWord.split("")).map((char, originalIdx) => ({
        char,
        originalIdx,
        isUsed: false,
      }));
      setBankLetters(scrambled);
      setUserLetters([]);
      setIsCipherSolved(false);
      if (isAuthenticated && !cipherSessionRef.current) {
        void startServerSession("word-challenge")
          .then((sid) => {
            cipherSessionRef.current = sid;
          })
          .catch(() => {
            cipherSessionRef.current = null;
          });
      }
    },
    [currentCipher, isAuthenticated, startServerSession],
  );

  const handleBankLetterClick = (bankIdx: number) => {
    if (isCipherSolved) return;
    const letter = bankLetters[bankIdx];
    if (!letter || letter.isUsed || !currentCipher) return;

    sounds.playClick();
    const newBank = [...bankLetters];
    newBank[bankIdx] = { ...letter, isUsed: true };
    setBankLetters(newBank);

    const newUserLetters = [...userLetters, letter.char];
    setUserLetters(newUserLetters);

    if (newUserLetters.length === currentCipher.targetWord.length) {
      const candidateWord = newUserLetters.join("");
      if (candidateWord === currentCipher.targetWord) {
        sounds.playCorrect();
        setIsCipherSolved(true);
        setCipherScore((s) => s + 100);
        const sid = cipherSessionRef.current;
        cipherSessionRef.current = null;
        void completeSkillServerSession(
          sid,
          1,
          1,
          `Decrypted Word Challenge: ${currentCipher.targetWord}`,
          120,
        );
      } else {
        sounds.playWrong();
      }
    }
  };

  const handleRemovePlacedLetter = (placedIdx: number) => {
    if (isCipherSolved) return;
    sounds.playClick();
    const removedChar = userLetters[placedIdx];
    if (!removedChar) return;
    setUserLetters(userLetters.filter((_, idx) => idx !== placedIdx));
    setBankLetters((prev) => {
      const updated = [...prev];
      const match = updated.find((b) => b.char === removedChar && b.isUsed);
      if (match) match.isUsed = false;
      return updated;
    });
  };

  const handleNextCipher = () => {
    sounds.playClick();
    const nextIdx = cipherIndex + 1 < cipherItemsForZone.length ? cipherIndex + 1 : 0;
    setCipherIndex(nextIdx);
    initCipherWord(cipherItemsForZone[nextIdx]);
  };

  // =========================================================================
  // 4. MATH RUSH (MENTAL MATH BLITZ — TIMED 60S & UNTIMED PRACTICE)
  // =========================================================================
  const mathSessionRef = useRef<string | null>(null);
  const [mathIsRunning, setMathIsRunning] = useState<boolean>(false);
  const [mathTimer, setMathTimer] = useState<number>(60);
  const [mathScore, setMathScore] = useState<number>(0);
  const [mathCorrectCount, setMathCorrectCount] = useState<number>(0);
  const [mathAttemptCount, setMathAttemptCount] = useState<number>(0);
  const [mathStreak, setMathStreak] = useState<number>(0);
  const [mathProblem, setMathProblem] = useState<{
    equation: string;
    options: number[];
    correctAnswer: number;
  }>({
    equation: "12 × 8",
    options: [96, 84, 106, 92],
    correctAnswer: 96,
  });
  const [mathFinished, setMathFinished] = useState<boolean>(false);

  const generateMathProblem = useCallback(() => {
    let a = 0;
    let b = 0;
    let eq = "";
    let ans = 0;
    const scaleBoost = difficulty === "MASTER" ? 2 : difficulty === "CHALLENGER" ? 1.5 : 1;

    if (ageZone === "JUNIOR") {
      const ops = ["+", "-", "*"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      if (op === "+") {
        a = Math.floor((Math.random() * 45 + 10) * scaleBoost);
        b = Math.floor((Math.random() * 45 + 10) * scaleBoost);
        ans = a + b;
        eq = `${a} + ${b}`;
      } else if (op === "-") {
        a = Math.floor((Math.random() * 60 + 35) * scaleBoost);
        b = Math.floor((Math.random() * 25 + 5) * scaleBoost);
        ans = a - b;
        eq = `${a} - ${b}`;
      } else {
        a = Math.floor(Math.random() * (difficulty === "MASTER" ? 15 : 12)) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        ans = a * b;
        eq = `${a} × ${b}`;
      }
    } else {
      const ops = ["*", "+", "sq", "pct"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      if (op === "*") {
        a = Math.floor((Math.random() * 22 + 11) * scaleBoost);
        b = Math.floor(Math.random() * 14 + 6);
        ans = a * b;
        eq = `${a} × ${b}`;
      } else if (op === "sq") {
        a = Math.floor(Math.random() * (difficulty === "MASTER" ? 24 : 16)) + 7;
        ans = a * a;
        eq = `${a}²`;
      } else if (op === "pct") {
        a = [10, 20, 25, 50, 75][Math.floor(Math.random() * 5)]!;
        b = (Math.floor(Math.random() * 20) + 4) * 20;
        ans = Math.round((a / 100) * b);
        eq = `${a}% of ${b}`;
      } else {
        a = Math.floor((Math.random() * 200 + 120) * scaleBoost);
        b = Math.floor((Math.random() * 180 + 80) * scaleBoost);
        ans = a + b;
        eq = `${a} + ${b}`;
      }
    }

    const offsets = shuffleArray([-10, 10, -1, 1, -2, 2, -5, 5]);
    const opts = new Set<number>([ans]);
    for (const offset of offsets) {
      if (opts.size >= 4) break;
      const distractor = ans + offset;
      if (distractor !== ans && distractor > 0) opts.add(distractor);
    }
    while (opts.size < 4) {
      opts.add(ans + Math.floor(Math.random() * 30) - 15);
    }

    setMathProblem({
      equation: eq,
      options: shuffleArray(Array.from(opts)),
      correctAnswer: ans,
    });
  }, [ageZone, difficulty]);

  const finishMathRush = useCallback(
    (correctCount: number, attemptCount: number) => {
      setMathIsRunning(false);
      setMathFinished(true);
      sounds.playTrophy();
      const sid = mathSessionRef.current;
      mathSessionRef.current = null;
      void completeSkillServerSession(
        sid,
        correctCount,
        Math.max(1, attemptCount),
        "Math Rush Sprint Completed",
        Math.round(mathScore / 5) + 50,
      );
    },
    [completeSkillServerSession, mathScore],
  );

  const startMathBlitz = () => {
    sounds.playClick();
    setMathScore(0);
    setMathCorrectCount(0);
    setMathAttemptCount(0);
    setMathStreak(0);
    setMathTimer(60);
    setMathIsRunning(true);
    setMathFinished(false);
    generateMathProblem();
    if (isAuthenticated) {
      void startServerSession("math-rush")
        .then((sid) => {
          mathSessionRef.current = sid;
        })
        .catch(() => {
          mathSessionRef.current = null;
        });
    }
  };

  useEffect(() => {
    if (gameMode === "UNTIMED") return;
    let interval: NodeJS.Timeout;
    if (mathIsRunning && mathTimer > 0) {
      interval = setInterval(() => {
        setMathTimer((t) => {
          if (t <= 1) {
            finishMathRush(mathCorrectCount, mathAttemptCount);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mathIsRunning, mathTimer, gameMode, finishMathRush, mathCorrectCount, mathAttemptCount]);

  const handleMathAnswer = (chosen: number) => {
    if (!mathIsRunning) return;
    const nextAttempts = mathAttemptCount + 1;
    setMathAttemptCount(nextAttempts);

    let nextCorrect = mathCorrectCount;
    if (chosen === mathProblem.correctAnswer) {
      sounds.playCorrect();
      nextCorrect = mathCorrectCount + 1;
      setMathCorrectCount(nextCorrect);
      setMathScore((s) => s + 100 * (mathStreak + 1));
      setMathStreak((st) => st + 1);
    } else {
      sounds.playWrong();
      setMathStreak(0);
    }

    if (gameMode === "UNTIMED" && nextAttempts >= 10) {
      finishMathRush(nextCorrect, nextAttempts);
    } else {
      generateMathProblem();
    }
  };

  // =========================================================================
  // 5. CODE SYNTAX BUG HUNTER
  // =========================================================================
  const debuggerSessionRef = useRef<string | null>(null);
  const [debuggerIndex, setDebuggerIndex] = useState<number>(0);
  const [selectedBugLine, setSelectedBugLine] = useState<number | null>(null);
  const [debuggerSubmitted, setDebuggerSubmitted] = useState<boolean>(false);
  const [debuggerScore, setDebuggerScore] = useState<number>(0);

  const currentDebuggerItem: CodeDebuggerItem =
    CODE_DEBUGGER_DATASET[debuggerIndex] || CODE_DEBUGGER_DATASET[0]!;

  const handleDebuggerLineClick = (lineIdx: number) => {
    if (debuggerSubmitted) return;
    sounds.playClick();
    setSelectedBugLine(lineIdx);
    if (isAuthenticated && !debuggerSessionRef.current) {
      void startServerSession("code-bug-hunter")
        .then((sid) => {
          debuggerSessionRef.current = sid;
        })
        .catch(() => {
          debuggerSessionRef.current = null;
        });
    }
  };

  const handleDebuggerSubmit = () => {
    if (selectedBugLine === null) return;
    setDebuggerSubmitted(true);
    const isHit = selectedBugLine === currentDebuggerItem.bugLineIndex;
    if (isHit) {
      sounds.playCorrect();
      setDebuggerScore((s) => s + 150);
    } else {
      sounds.playWrong();
    }
    const sid = debuggerSessionRef.current;
    debuggerSessionRef.current = null;
    void completeSkillServerSession(
      sid,
      isHit ? 1 : 0,
      1,
      `Bug Hunter: ${currentDebuggerItem.title}`,
      isHit ? 150 : 0,
    );
  };

  const handleNextDebugger = () => {
    sounds.playClick();
    setDebuggerIndex((i) => (i + 1 < CODE_DEBUGGER_DATASET.length ? i + 1 : 0));
    setSelectedBugLine(null);
    setDebuggerSubmitted(false);
  };

  // Catalog filtering & personalized recommendation
  const filteredCatalog = useMemo(() => {
    return CORE_GAME_CATALOG.filter((game) => {
      if (categoryFilter !== "ALL" && game.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          game.title.toLowerCase().includes(q) ||
          game.subtitle.toLowerCase().includes(q) ||
          game.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  const launchCatalogGame = (arenaMode: ArenaTab) => {
    sounds.playClick();
    if (arenaMode === "trivia") {
      void startQuizRound("naija-trivia", "trivia");
      return;
    }
    if (arenaMode === "memory") {
      setActiveTab("memory");
      initMemoryGame();
      return;
    }
    if (arenaMode === "cipher") {
      setActiveTab("cipher");
      initCipherWord();
      return;
    }
    setActiveTab(arenaMode);
    if (arenaMode === "drills") setActiveGameId(null);
  };

  // =========================================================================
  // LOCKED GATE WHEN NOT AUTHENTICATED
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-900/60 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-6 sm:p-10 shadow-2xl">
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-emerald-950/90 border-2 border-emerald-500/50 text-emerald-400 shadow-2xl shadow-emerald-950">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            </div>

            <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              Authentication Required · Registered Scholars Only
            </p>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Sign In or Register to Enter Games
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Naija Trivia, Brain Rush, Word Challenge, Math Rush, Memory Match, and Bug Hunter require an authenticated profile. Signing up locks your calibrated age tier, saves score history in PostgreSQL, and enables server anti-cheat verification.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  sounds.playClick();
                  onRequestAuth("signin");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 shadow-xl shadow-emerald-950 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Your Account</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  onRequestAuth("register");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-6 py-3 text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-all"
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Create Scholar Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner + Difficulty & Timed/Untimed Controls */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              <Gamepad2 className="w-4 h-4" />
              <span>NaijaPlay Game Arena · {ageZone} Tier</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Game Library & Verification Arena
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Play Naija Trivia, Brain Rush, Word Challenge, Math Rush, and Memory Match in Timed or Untimed modes with server-side anti-cheat verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Difficulty Selector */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-mono">
              <span className="px-2 text-slate-400 hidden sm:inline flex items-center gap-1">
                <Sliders className="w-3 h-3" />
              </span>
              {(["STANDARD", "CHALLENGER", "MASTER"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setDifficulty(lvl);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                    difficulty === lvl
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {lvl === "STANDARD" ? "Standard" : lvl === "CHALLENGER" ? "Challenger" : "Master"}
                </button>
              ))}
            </div>

            {/* Timed vs Untimed Selector */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setGameMode("TIMED");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  gameMode === "TIMED"
                    ? "bg-amber-600 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Timed</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setGameMode("UNTIMED");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  gameMode === "UNTIMED"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Untimed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saved In-Progress Round Banner */}
        {savedDraft && !activeGameId && (
          <div className="rounded-xl border border-amber-700/60 bg-amber-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-amber-200 font-mono">
              Saved round in progress: <strong>{savedDraft.gameId.toUpperCase()}</strong> · Question{" "}
              {savedDraft.questionIndex + 1} of {savedDraft.questionIds.length} ({savedDraft.mode})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                  setSavedDraft(null);
                }}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-300 hover:text-white"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={resumeSavedDraft}
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 font-bold text-slate-950 hover:bg-amber-400"
              >
                Resume Round →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: "catalog" as const, label: "Game Library", icon: Compass, color: "text-emerald-400" },
          { id: "trivia" as const, label: "Naija Trivia", icon: Globe, color: "text-green-400" },
          { id: "drills" as const, label: "Brain Rush Drills", icon: Timer, color: "text-emerald-300" },
          { id: "cipher" as const, label: "Word Challenge", icon: SpellCheck, color: "text-purple-400" },
          { id: "math_blitz" as const, label: "Math Rush", icon: Calculator, color: "text-amber-400" },
          { id: "memory" as const, label: "Memory Match", icon: Brain, color: "text-blue-400" },
          { id: "debugger" as const, label: "Bug Hunter", icon: Code2, color: "text-cyan-400" },
          { id: "history" as const, label: `Score History (${historyRecords.length})`, icon: History, color: "text-slate-300" },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                setActiveTab(tab.id);
                if (tab.id === "memory") initMemoryGame();
                if (tab.id === "cipher") initCipherWord();
                if (tab.id === "trivia" && activeQuizKind !== "trivia") {
                  void startQuizRound("naija-trivia", "trivia");
                }
                if (tab.id === "drills") setActiveGameId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 0: SEARCHABLE GAME LIBRARY & CATEGORIES
          ===================================================================== */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Search & Category Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games (Naija Trivia, Brain Rush, Math, Word...)"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              {(
                [
                  { key: "ALL", label: "All Categories" },
                  { key: "TRIVIA", label: "Trivia" },
                  { key: "SPEED_RUSH", label: "Speed Rush" },
                  { key: "WORD", label: "Word" },
                  { key: "MATH", label: "Math" },
                  { key: "MEMORY", label: "Memory" },
                  { key: "CODING", label: "Coding" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setCategoryFilter(cat.key);
                  }}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    categoryFilter === cat.key
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCatalog.map((game) => {
              const isRecommended = game.recommendedZones.includes(ageZone);
              return (
                <div
                  key={game.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all shadow-lg"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">
                        {game.category.replace("_", " ")}
                      </span>
                      <span className="text-amber-300 font-bold">
                        {isRecommended ? "Recommended · " : ""}
                        {game.xpRange}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">
                        {game.title}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        {game.subtitle}
                      </p>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {game.description}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Difficulty: {difficulty}</span>
                      <span>Mode: {gameMode}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => launchCatalogGame(game.arenaMode)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Launch {game.title}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 1 & 2: NAIJA TRIVIA & BRAIN RUSH DRILLS
          ===================================================================== */}
      {(activeTab === "trivia" || activeTab === "drills") && (
        <>
          {activeTab === "drills" && !activeGameId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Brain Rush Speed Drills ({ageZone} Tier)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Questions and answer options are randomized each session and verified by the server.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                  {currentGames.length} Subjects Calibrated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentGames.map((game) => (
                  <div
                    key={game.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                          {getDisciplineIcon(game.discipline)}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-300">
                          +{game.xpReward} XP
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-emerald-400 font-semibold block">
                          {game.discipline}
                        </span>
                        <h3 className="font-display text-lg font-bold text-white mt-0.5">
                          {game.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                          {game.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-mono flex items-center justify-between">
                        <span>{gameMode === "UNTIMED" ? "No Time Limit" : `${getSecondsPerQuestion(ageZone)}s / Question`}</span>
                        <span className="text-slate-300">{difficulty}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => void startQuizRound(game.id, "drills")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                    >
                      <span>Start Brain Rush</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "trivia" && !activeGameId && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center max-w-xl mx-auto space-y-4">
              <Globe className="w-10 h-10 text-emerald-400 mx-auto" />
              <h2 className="font-display text-2xl font-bold text-white">
                Naija Trivia · {ageZone} Edition
              </h2>
              <p className="text-xs text-slate-300">
                Test your command of Nigerian geography, constitutional milestones, pioneers, arts, and heritage with shuffled questions.
              </p>
              <button
                onClick={() => void startQuizRound("naija-trivia", "trivia")}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950"
              >
                Start Naija Trivia Round →
              </button>
            </div>
          )}

          {activeGameId && roundQuestions.length > 0 && (
            <div className="max-w-2xl mx-auto">
              {!isGameCompleted ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                        {activeQuizKind === "trivia" ? "Naija Trivia" : "Brain Rush"} · Q{questionIndex + 1}/{roundQuestions.length}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {roundQuestions[questionIndex]?.original.discipline} · {difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {streak > 1 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono">
                          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span>{streak}x</span>
                        </div>
                      )}

                      {gameMode === "TIMED" ? (
                        <div
                          className={`flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            timerSeconds <= 5
                              ? "bg-red-950 text-red-300 border-red-700 animate-pulse"
                              : "bg-slate-950 text-slate-300 border-slate-800"
                          }`}
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span>{timerSeconds}s</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-800/60 bg-indigo-950/40 text-indigo-300">
                          <InfinityIcon className="w-3.5 h-3.5" />
                          <span>Untimed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold text-white leading-snug">
                      {roundQuestions[questionIndex]?.original.question}
                    </h3>

                    <div className="space-y-2.5">
                      {roundQuestions[questionIndex]?.shuffledOptions.map((opt, optIdx) => {
                        const isSelected = selectedShuffledOption === optIdx;
                        const isCorrect =
                          opt.originalIndex === roundQuestions[questionIndex]?.original.correctAnswer;

                        let btnStyle =
                          "border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-900";
                        if (answerSubmitted) {
                          if (isCorrect) {
                            btnStyle = "border-emerald-500 bg-emerald-950/70 text-emerald-200 font-bold";
                          } else if (isSelected) {
                            btnStyle = "border-red-500 bg-red-950/70 text-red-200";
                          } else {
                            btnStyle = "border-slate-800 bg-slate-950/40 text-slate-500";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleOptionClick(optIdx)}
                            disabled={answerSubmitted}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt.text}</span>
                            {answerSubmitted && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                            {answerSubmitted && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {answerSubmitted && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-bold text-emerald-400 font-mono block mb-1">
                          Verified Explanation:
                        </span>
                        {roundQuestions[questionIndex]?.original.explanation}
                      </div>
                      <button
                        onClick={nextQuestion}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors ml-auto"
                      >
                        <span>
                          {questionIndex + 1 < roundQuestions.length
                            ? "Next Question"
                            : "Finish & Verify Score"}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* RESULT SUMMARY + SERVER ANTI-CHEAT VERIFICATION */
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400">
                      <Award className="w-10 h-10" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {activeQuizKind === "trivia" ? "Naija Trivia Result Summary" : "Brain Rush Result Summary"}
                    </h2>
                    <p className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {verifiedSummary?.verifiedByServer
                          ? "Server Anti-Cheat Verified & Saved to PostgreSQL"
                          : "Result Summary"}
                      </span>
                    </p>
                  </div>

                  {isSubmittingScore && (
                    <p className="text-center text-sm text-amber-300">
                      Verifying timing telemetry and persisting score...
                    </p>
                  )}
                  {scoreSubmissionError && (
                    <p role="alert" className="text-center text-sm text-red-300">
                      {scoreSubmissionError}
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                      <span className="text-[10px] text-slate-400 block">Final Score</span>
                      <span className="text-xl font-extrabold text-emerald-400">
                        {score.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                      <span className="text-[10px] text-slate-400 block">Accuracy</span>
                      <span className="text-xl font-extrabold text-white">
                        {verifiedSummary
                          ? `${verifiedSummary.accuracyPercent}%`
                          : `${Math.round(
                              (answers.filter(
                                (a, i) => a === roundQuestions[i]?.original.correctAnswer,
                              ).length /
                                Math.max(1, roundQuestions.length)) *
                                100,
                            )}%`}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                      <span className="text-[10px] text-slate-400 block">XP Earned</span>
                      <span className="text-xl font-extrabold text-amber-400">
                        +{verifiedSummary?.awardedXP ?? 0}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                      <span className="text-[10px] text-slate-400 block">Duration</span>
                      <span className="text-xl font-extrabold text-slate-200">
                        {verifiedSummary?.durationSeconds ?? "--"}s
                      </span>
                    </div>
                  </div>

                  {/* Question Review Breakdown */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-left">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase block">
                      Answer Review
                    </span>
                    {roundQuestions.map((item, idx) => {
                      const picked = answers[idx];
                      const ok = picked === item.original.correctAnswer;
                      return (
                        <div
                          key={item.original.id}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs flex items-start justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white">{item.original.question}</p>
                            <p className="text-[11px] text-slate-400">
                              Correct: {item.original.options[item.original.correctAnswer]}
                            </p>
                          </div>
                          {ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => void startQuizRound(activeGameId, activeQuizKind)}
                      disabled={isSubmittingScore}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Play Shuffled Replay
                    </button>
                    <button
                      onClick={() => {
                        setActiveGameId(null);
                        setActiveTab("catalog");
                      }}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950"
                    >
                      Back to Game Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          TAB 3: MEMORY MATCH
          ===================================================================== */}
      {activeTab === "memory" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                Memory Match · {difficulty} · {gameMode}
              </span>
              <h2 className="font-display text-lg font-bold text-white">
                STEM & Heritage Concept Matrix ({ageZone})
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-400">Moves: <strong className="text-white">{memoryMoves}</strong></span>
              <button
                onClick={initMemoryGame}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Shuffle Matrix</span>
              </button>
            </div>
          </div>

          {!isMemoryCompleted ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {memoryDeck.map((card, idx) => {
                const isRevealed = card.isFlipped || card.isMatched;

                return (
                  <div
                    key={idx}
                    onClick={() => handleCardClick(idx)}
                    className={`cursor-pointer select-none rounded-2xl border min-h-[140px] p-4 flex flex-col justify-between transition-all ${
                      card.isMatched
                        ? "border-emerald-500/80 bg-emerald-950/40 text-emerald-200 opacity-90"
                        : isRevealed
                        ? "border-blue-500/80 bg-slate-900 text-white shadow-xl"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400">
                        {isRevealed ? card.category : "MATRIX"}
                      </span>
                      {card.isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>

                    <div className="text-center py-2">
                      {isRevealed ? (
                        <>
                          <h4 className="font-display font-bold text-sm sm:text-base text-white">
                            {card.label}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {card.sublabel}
                          </p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-600">
                          <Layers className="w-6 h-6" />
                          <span className="text-[10px] font-mono">Tap Card</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[9px] font-mono text-right text-slate-500">
                      {isRevealed ? (card.isMatched ? "MATCHED" : "REVEALED") : "CARD"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-5 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400">
                <Brain className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  Memory Match Verified & Cleared!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Completed in {memoryMoves} moves ({difficulty} {gameMode}). Score logged to history.
                </p>
              </div>
              <button
                onClick={initMemoryGame}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
              >
                Play New Shuffled Matrix
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: WORD CHALLENGE (WORD CIPHER)
          ===================================================================== */}
      {activeTab === "cipher" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {currentCipher && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase">
                  Word Challenge · {currentCipher.discipline} · {ageZone}
                </span>
                <span className="text-slate-400">
                  Puzzle {cipherIndex + 1}/{cipherItemsForZone.length} · Score: {cipherScore}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                  {difficulty === "MASTER" ? "Abbreviated Hint:" : "Definition & Context Clue:"}
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {difficulty === "MASTER"
                    ? `${currentCipher.clue.slice(0, Math.ceil(currentCipher.clue.length * 0.65))}...`
                    : currentCipher.clue}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 block text-center">
                  Assemble the {currentCipher.targetWord.length}-letter term:
                </span>
                <div className="flex items-center justify-center gap-2 flex-wrap min-h-[56px]">
                  {Array.from({ length: currentCipher.targetWord.length }).map((_, slotIdx) => {
                    const char = userLetters[slotIdx];
                    return (
                      <button
                        key={slotIdx}
                        onClick={() => handleRemovePlacedLetter(slotIdx)}
                        className={`w-11 h-12 rounded-xl border font-mono text-lg font-bold flex items-center justify-center transition-all ${
                          char
                            ? isCipherSolved
                              ? "border-emerald-500 bg-emerald-950/80 text-emerald-200 shadow-md"
                              : "border-blue-500 bg-blue-950/60 text-white shadow-md hover:border-red-500"
                            : "border-slate-800 bg-slate-950/80 text-slate-600 border-dashed"
                        }`}
                      >
                        {char || ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isCipherSolved ? (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-mono text-slate-400 block text-center">
                    Available Letters (Tap to place):
                  </span>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {bankLetters.map((item, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleBankLetterClick(bIdx)}
                        disabled={item.isUsed}
                        className={`w-11 h-11 rounded-xl border font-mono text-base font-bold transition-all ${
                          item.isUsed
                            ? "border-slate-800/40 bg-slate-950/30 text-slate-700 cursor-not-allowed"
                            : "border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-600 shadow"
                        }`}
                      >
                        {item.char}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                      onClick={() => initCipherWord()}
                      className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-mono text-slate-400 hover:text-white"
                    >
                      Clear & Reshuffle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Word Challenge Solved & Logged</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Answer: <strong className="font-mono text-white">{currentCipher.targetWord}</strong>
                  </p>
                  <button
                    onClick={handleNextCipher}
                    className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950"
                  >
                    Next Word Challenge
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: MATH RUSH
          ===================================================================== */}
      {activeTab === "math_blitz" && (
        <div className="max-w-xl mx-auto space-y-6">
          {!mathIsRunning && !mathFinished && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-6 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 text-amber-400">
                <Calculator className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-white">
                  Math Rush ({gameMode === "TIMED" ? "60s Sprint" : "10-Question Untimed"})
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Difficulty: {difficulty}. Answer rapidly to build streak multipliers and persist verified scores.
                </p>
              </div>
              <button
                onClick={startMathBlitz}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-500 shadow-xl shadow-emerald-950"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Math Rush</span>
              </button>
            </div>
          )}

          {mathIsRunning && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    Score: {mathScore}
                  </span>
                  {mathStreak > 1 && (
                    <span className="flex items-center gap-1 font-mono text-xs text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {mathStreak}x
                    </span>
                  )}
                </div>

                {gameMode === "TIMED" ? (
                  <div
                    className={`flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-lg border ${
                      mathTimer <= 10
                        ? "bg-red-950 text-red-300 border-red-700 animate-pulse"
                        : "bg-slate-950 text-slate-300 border-slate-800"
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{mathTimer}s</span>
                  </div>
                ) : (
                  <span className="font-mono text-xs text-indigo-300 font-bold">
                    {mathAttemptCount + 1} / 10
                  </span>
                )}
              </div>

              <div className="text-center py-4 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                  Evaluate Expression ({difficulty})
                </span>
                <h3 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
                  {mathProblem.equation}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {mathProblem.options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => handleMathAnswer(opt)}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-lg sm:text-xl font-mono font-bold text-slate-200 hover:border-emerald-500 hover:bg-slate-900 active:scale-95 transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mathFinished && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-6 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400">
                <Award className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-bold text-white">
                  Math Rush Verified!
                </h3>
                <p className="text-xs text-slate-300">
                  {mathCorrectCount} / {mathAttemptCount} solved cleanly ({difficulty} · {gameMode}).
                </p>
              </div>
              <div className="font-mono text-4xl font-extrabold text-emerald-400">
                {mathScore.toLocaleString()} pts
              </div>
              <button
                onClick={startMathBlitz}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 6: CODE BUG HUNTER
          ===================================================================== */}
      {activeTab === "debugger" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
              <span className="text-blue-400 font-bold uppercase">
                {currentDebuggerItem.language} · {currentDebuggerItem.targetZone}
              </span>
              <span className="text-slate-400">
                Challenge {debuggerIndex + 1}/{CODE_DEBUGGER_DATASET.length} · Score: {debuggerScore}
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {currentDebuggerItem.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click the line containing the bug or security flaw:
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs sm:text-sm space-y-1 overflow-x-auto">
              {currentDebuggerItem.codeLines.map((line, lIdx) => {
                const isSelected = selectedBugLine === lIdx;
                const isCorrectBug = lIdx === currentDebuggerItem.bugLineIndex;

                let lineStyle = "hover:bg-slate-900 text-slate-300 border-transparent";
                if (debuggerSubmitted) {
                  if (isCorrectBug) {
                    lineStyle = "bg-emerald-950/80 text-emerald-200 border-emerald-500/80 font-bold";
                  } else if (isSelected) {
                    lineStyle = "bg-red-950/80 text-red-200 border-red-500/80";
                  } else {
                    lineStyle = "text-slate-600";
                  }
                } else if (isSelected) {
                  lineStyle = "bg-blue-950/80 text-blue-200 border-blue-500 font-bold";
                }

                return (
                  <div
                    key={lIdx}
                    onClick={() => handleDebuggerLineClick(lIdx)}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg border flex items-center justify-between transition-colors ${lineStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 select-none w-6 text-right">{lIdx + 1}</span>
                      <span>{line}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {!debuggerSubmitted ? (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-mono">
                  {selectedBugLine !== null ? `Selected line ${selectedBugLine + 1}` : "Click a line"}
                </span>
                <button
                  onClick={handleDebuggerSubmit}
                  disabled={selectedBugLine === null}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors shadow-lg shadow-emerald-950"
                >
                  Verify Bug Flag
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-emerald-400 font-mono">
                    Explanation & Fix:
                  </div>
                  <p>{currentDebuggerItem.explanation}</p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-xs">
                    {currentDebuggerItem.fix}
                  </div>
                </div>
                <button
                  onClick={handleNextDebugger}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors ml-auto block"
                >
                  Next Code Challenge
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: SAVED SCORE HISTORY & PERSONAL STATISTICS
          ===================================================================== */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Verified Score History & Personal Statistics
              </h2>
              <p className="text-xs text-slate-400">
                All completed game rounds audited on the server and persisted in PostgreSQL.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadGameHistory()}
              className="self-start sm:self-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-emerald-400 hover:border-emerald-600"
            >
              {loadingHistory ? "Refreshing..." : "Refresh History"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[11px] text-slate-400 block">Games Played</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {personalStats?.gamesPlayed ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[11px] text-slate-400 block">Average Accuracy</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                {personalStats?.averageAccuracy ?? 0}%
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[11px] text-slate-400 block">Personal Best Score</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
                {(personalStats?.bestScore ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-[11px] text-slate-400 block">Favorite Game</span>
              <span className="text-sm font-bold text-emerald-300 mt-2 block truncate">
                {personalStats?.favoriteGameTitle ?? "Naija Trivia"}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-3 px-4">Game</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Anti-Cheat</th>
                  <th className="py-3 px-4 text-right">Verified Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {historyRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-950/60">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-white">{row.gameTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {new Date(row.recordedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {row.accuracyPercent}% ({row.correctAnswers}/{row.questionsAnswered})
                    </td>
                    <td className="py-3 px-4 text-slate-300">{row.durationSeconds}s</td>
                    <td className="py-3 px-4 text-emerald-300">
                      {row.isVerified ? "Verified" : "Flagged"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {row.score.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
                {historyRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Complete any game round above to populate your verified score ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
