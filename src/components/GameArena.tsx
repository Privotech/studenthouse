"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Gamepad2,
  HelpCircle,
  Zap,
  Flame,
  Award,
  ArrowRight,
  RotateCcw,
  Sparkles,
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
  BookOpen,
  Brain,
  Code2,
  Layers,
  Check,
  Shuffle,
  Lightbulb,
  Play,
  SpellCheck,
} from "lucide-react";
import { AgeZone } from "@/types/naijaplay";
import {
  AGE_CALIBRATED_QUESTIONS,
  GameQuestionItem,
  MEMORY_DECKS_BY_ZONE,
  WORD_CIPHER_DATASET,
  CODE_DEBUGGER_DATASET,
  MemoryCardDefinition,
  WordCipherItem,
  CodeDebuggerItem,
} from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface GameArenaProps {
  ageZone: AgeZone;
  onAwardXP: (amount: number, reason: string) => void;
  onMissionProgress: (missionId: string, delta: number) => void;
}

interface GameDefinition {
  id: string;
  title: string;
  discipline: string;
  description: string;
  durationSeconds: number;
  xpReward: number;
}

type ArenaTab = "drills" | "memory" | "cipher" | "math_blitz" | "debugger";

interface MemoryCardState {
  cardId: string;
  pairKey: string;
  label: string;
  sublabel: string;
  category: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const GameArena: React.FC<GameArenaProps> = ({
  ageZone,
  onAwardXP,
  onMissionProgress,
}) => {
  // Navigation between game modules
  const [activeTab, setActiveTab] = useState<ArenaTab>("drills");

  // =========================================================================
  // 1. FORMAL SPEED DRILLS STATE (ALL FORMAL GAMES RETAINED & EXPANDED)
  // =========================================================================
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(20);
  const [isGameCompleted, setIsGameCompleted] = useState<boolean>(false);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);

  // Retrieve questions calibrated for the player's active age zone
  const questionsForZone: GameQuestionItem[] =
    AGE_CALIBRATED_QUESTIONS[ageZone] || AGE_CALIBRATED_QUESTIONS.TEEN!;

  // 6 Age-calibrated formal game definitions per zone (all original games + 3 new per zone)
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

  // Timer Countdown for Active Formal Game
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeGameId && !isGameCompleted && timerSeconds > 0 && !answerSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((t) => {
          if (t <= 1) {
            handleTimeExpired();
            return 20;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeGameId, isGameCompleted, timerSeconds, answerSubmitted]);

  const handleTimeExpired = () => {
    sounds.playWrong();
    setAnswerSubmitted(true);
    setSelectedOption(-1);
    setStreak(0);
  };

  const startGameSession = (gameId: string) => {
    sounds.playClick();
    setActiveGameId(gameId);
    setQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setStreak(0);
    setTimerSeconds(20);
    setIsGameCompleted(false);
    setAnswerSubmitted(false);
  };

  const handleOptionClick = (optionIdx: number) => {
    if (answerSubmitted) return;
    setSelectedOption(optionIdx);
    setAnswerSubmitted(true);

    const currentQ = questionsForZone[questionIndex];
    if (!currentQ) return;

    if (optionIdx === currentQ.correctAnswer) {
      sounds.playCorrect();
      setScore((s) => s + 100);
      setStreak((st) => st + 1);
      onMissionProgress("m-3", 1);
    } else {
      sounds.playWrong();
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    sounds.playClick();
    if (questionIndex + 1 < questionsForZone.length) {
      setQuestionIndex((i) => i + 1);
      setSelectedOption(null);
      setAnswerSubmitted(false);
      setTimerSeconds(20);
    } else {
      setIsGameCompleted(true);
      sounds.playTrophy();
      const xpEarned = Math.round(score / 5) + 60;
      onAwardXP(xpEarned, "Completed Formal Academic Speed Drill");
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
  // 2. COGNITIVE MEMORY MATRIX GAME STATE
  // =========================================================================
  const [memoryDeck, setMemoryDeck] = useState<MemoryCardState[]>(() => {
    const rawDeck = MEMORY_DECKS_BY_ZONE[ageZone] || MEMORY_DECKS_BY_ZONE.TEEN!;
    return [...rawDeck]
      .sort(() => Math.random() - 0.5)
      .map((c) => ({
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
    // Shuffle cards
    const shuffled = [...rawDeck]
      .sort(() => Math.random() - 0.5)
      .map((c) => ({
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
  }, [ageZone]);

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
        // Match!
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
              onAwardXP(150, "Mastered Cognitive Memory Matrix");
            }
            return updated;
          });
          setFlippedCards([]);
        }, 300);
      } else {
        // Mismatch
        setTimeout(() => {
          sounds.playWrong();
          setMemoryDeck((prev) => {
            const updated = [...prev];
            updated[firstIdx] = { ...updated[firstIdx]!, isFlipped: false };
            updated[secondIdx] = { ...updated[secondIdx]!, isFlipped: false };
            return updated;
          });
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  // =========================================================================
  // 3. LINGUISTIC WORD CIPHER GAME STATE
  // =========================================================================
  const cipherItemsForZone = useMemo(() => {
    return (
      WORD_CIPHER_DATASET.filter((item) => item.targetZone === ageZone) ||
      WORD_CIPHER_DATASET.filter((item) => item.targetZone === "TEEN")
    );
  }, [ageZone]);

  const [cipherIndex, setCipherIndex] = useState<number>(0);
  const [userLetters, setUserLetters] = useState<string[]>([]);
  const [bankLetters, setBankLetters] = useState<Array<{ char: string; originalIdx: number; isUsed: boolean }>>(() => {
    const target = cipherItemsForZone[0] || WORD_CIPHER_DATASET[0]!;
    return target.targetWord
      .split("")
      .sort(() => Math.random() - 0.5)
      .map((char, originalIdx) => ({
        char,
        originalIdx,
        isUsed: false,
      }));
  });
  const [isCipherSolved, setIsCipherSolved] = useState<boolean>(false);
  const [cipherScore, setCipherScore] = useState<number>(0);

  const currentCipher: WordCipherItem | undefined = cipherItemsForZone[cipherIndex] || cipherItemsForZone[0];

  const initCipherWord = useCallback((item?: WordCipherItem) => {
    const target = item || currentCipher;
    if (!target) return;
    const chars = target.targetWord.split("");
    // Scramble letters
    const scrambled = [...chars]
      .sort(() => Math.random() - 0.5)
      .map((char, originalIdx) => ({
        char,
        originalIdx,
        isUsed: false,
      }));
    setBankLetters(scrambled);
    setUserLetters([]);
    setIsCipherSolved(false);
  }, [currentCipher]);

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

    // Auto-check if word length matches
    if (newUserLetters.length === currentCipher.targetWord.length) {
      const candidateWord = newUserLetters.join("");
      if (candidateWord === currentCipher.targetWord) {
        sounds.playCorrect();
        setIsCipherSolved(true);
        setCipherScore((s) => s + 100);
        onAwardXP(120, `Decrypted Cipher: ${currentCipher.targetWord}`);
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

    // Remove from placed
    const newUserLetters = userLetters.filter((_, idx) => idx !== placedIdx);
    setUserLetters(newUserLetters);

    // Mark one matching bank letter as unused
    setBankLetters((prev) => {
      const updated = [...prev];
      const match = updated.find((b) => b.char === removedChar && b.isUsed);
      if (match) {
        match.isUsed = false;
      }
      return updated;
    });
  };

  const handleNextCipher = () => {
    sounds.playClick();
    if (cipherIndex + 1 < cipherItemsForZone.length) {
      const nextIdx = cipherIndex + 1;
      setCipherIndex(nextIdx);
      initCipherWord(cipherItemsForZone[nextIdx]);
    } else {
      setCipherIndex(0);
      initCipherWord(cipherItemsForZone[0]);
    }
  };

  // =========================================================================
  // 4. MENTAL MATH BLITZ (60-SECOND RAPID CALCULATION)
  // =========================================================================
  const [mathIsRunning, setMathIsRunning] = useState<boolean>(false);
  const [mathTimer, setMathTimer] = useState<number>(60);
  const [mathScore, setMathScore] = useState<number>(0);
  const [mathStreak, setMathStreak] = useState<number>(0);
  const [mathProblem, setMathProblem] = useState<{
    equation: string;
    options: number[];
    correctAnswer: number;
  }>({
    equation: "12 * 8",
    options: [96, 84, 106, 92],
    correctAnswer: 96,
  });
  const [mathFinished, setMathFinished] = useState<boolean>(false);

  const generateMathProblem = useCallback(() => {
    let a = 0;
    let b = 0;
    let eq = "";
    let ans = 0;

    if (ageZone === "JUNIOR") {
      const ops = ["+", "-", "*"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      if (op === "+") {
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 10;
        ans = a + b;
        eq = `${a} + ${b}`;
      } else if (op === "-") {
        a = Math.floor(Math.random() * 60) + 30;
        b = Math.floor(Math.random() * 25) + 5;
        ans = a - b;
        eq = `${a} - ${b}`;
      } else {
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        ans = a * b;
        eq = `${a} × ${b}`;
      }
    } else {
      const ops = ["*", "+", "sq", "pct"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      if (op === "*") {
        a = Math.floor(Math.random() * 25) + 11;
        b = Math.floor(Math.random() * 15) + 6;
        ans = a * b;
        eq = `${a} × ${b}`;
      } else if (op === "sq") {
        a = Math.floor(Math.random() * 16) + 7;
        ans = a * a;
        eq = `${a}²`;
      } else if (op === "pct") {
        a = [10, 20, 25, 50, 75][Math.floor(Math.random() * 5)]!;
        b = (Math.floor(Math.random() * 20) + 4) * 20;
        ans = Math.round((a / 100) * b);
        eq = `${a}% of ${b}`;
      } else {
        a = Math.floor(Math.random() * 200) + 120;
        b = Math.floor(Math.random() * 180) + 80;
        ans = a + b;
        eq = `${a} + ${b}`;
      }
    }

    // Generate 3 believable distinct distractors
    const offsets = [-10, 10, -1, 1, -2, 2, -5, 5].sort(() => Math.random() - 0.5);
    const opts = new Set<number>([ans]);
    for (const offset of offsets) {
      if (opts.size >= 4) break;
      const distractor = ans + offset;
      if (distractor !== ans && distractor > 0) {
        opts.add(distractor);
      }
    }
    while (opts.size < 4) {
      opts.add(ans + Math.floor(Math.random() * 30) - 15);
    }

    setMathProblem({
      equation: eq,
      options: Array.from(opts).sort(() => Math.random() - 0.5),
      correctAnswer: ans,
    });
  }, [ageZone]);

  const startMathBlitz = () => {
    sounds.playClick();
    setMathScore(0);
    setMathStreak(0);
    setMathTimer(60);
    setMathIsRunning(true);
    setMathFinished(false);
    generateMathProblem();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mathIsRunning && mathTimer > 0) {
      interval = setInterval(() => {
        setMathTimer((t) => {
          if (t <= 1) {
            setMathIsRunning(false);
            setMathFinished(true);
            sounds.playTrophy();
            onAwardXP(Math.round(mathScore / 5) + 50, "Mental Math Blitz Survival");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mathIsRunning, mathTimer, mathScore, onAwardXP]);

  const handleMathAnswer = (chosen: number) => {
    if (!mathIsRunning) return;
    if (chosen === mathProblem.correctAnswer) {
      sounds.playCorrect();
      setMathScore((s) => s + 100 * (mathStreak + 1));
      setMathStreak((st) => st + 1);
      generateMathProblem();
    } else {
      sounds.playWrong();
      setMathStreak(0);
      generateMathProblem();
    }
  };

  // =========================================================================
  // 5. CODE SYNTAX BUG HUNTER GAME STATE
  // =========================================================================
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
  };

  const handleDebuggerSubmit = () => {
    if (selectedBugLine === null) return;
    setDebuggerSubmitted(true);
    if (selectedBugLine === currentDebuggerItem.bugLineIndex) {
      sounds.playCorrect();
      setDebuggerScore((s) => s + 150);
      onAwardXP(150, `Bug Identified: ${currentDebuggerItem.title}`);
    } else {
      sounds.playWrong();
    }
  };

  const handleNextDebugger = () => {
    sounds.playClick();
    if (debuggerIndex + 1 < CODE_DEBUGGER_DATASET.length) {
      setDebuggerIndex((i) => i + 1);
    } else {
      setDebuggerIndex(0);
    }
    setSelectedBugLine(null);
    setDebuggerSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Gamepad2 className="w-4 h-4" />
              <span>Module 1 · Age-Calibrated Learning Games & Speed Arena</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Academic Game Arena
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              All games are designed as rigorous learning instruments calibrated specifically for your selected age tier ({ageZone}: Ages {ageZone === "JUNIOR" ? "6–12" : ageZone === "TEEN" ? "13–17" : ageZone === "YOUTH" ? "18–24" : "25–30"}).
            </p>
          </div>

          {activeGameId && activeTab === "drills" && (
            <button
              onClick={() => {
                sounds.playClick();
                setActiveGameId(null);
              }}
              className="self-start md:self-auto rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              ← Back to All Drills
            </button>
          )}
        </div>
      </div>

      {/* Game Mode Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("drills");
            setActiveGameId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === "drills"
              ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Timer className="w-4 h-4 text-emerald-300" />
          <span>Academic Speed Drills (6 Calibrated)</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("memory");
            initMemoryGame();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === "memory"
              ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Brain className="w-4 h-4 text-blue-400" />
          <span>Cognitive Memory Matrix</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("cipher");
            initCipherWord();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === "cipher"
              ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <SpellCheck className="w-4 h-4 text-purple-400" />
          <span>Linguistic Word Cipher</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("math_blitz");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === "math_blitz"
              ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-400" />
          <span>Mental Math Blitz (60s)</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab("debugger");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === "debugger"
              ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>Code Syntax Bug Hunter</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: FORMAL SPEED DRILLS (ORIGINAL FULL EXPERIENCE + 3 NEW DRILLS)
          ===================================================================== */}
      {activeTab === "drills" && (
        <>
          {/* Game Selector Shelf */}
          {!activeGameId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Available Academic Drills ({ageZone} Tier)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Speed drills sharpen quantitative recall, algorithmic deduction, and conceptual speed.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                  {currentGames.length} Drills Calibrated
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
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-300 border border-slate-700">
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
                        <span>{game.durationSeconds}s Per Question</span>
                        <span className="text-slate-300">Timed Drill</span>
                      </div>
                    </div>

                    <button
                      onClick={() => startGameSession(game.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
                    >
                      <span>Launch Drill</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Gameplay Session */}
          {activeGameId && (
            <div className="max-w-2xl mx-auto">
              {!isGameCompleted ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
                  {/* Question Header & Timer Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                        Question {questionIndex + 1} of {questionsForZone.length}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {questionsForZone[questionIndex]?.discipline}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {streak > 1 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono">
                          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span>{streak}x Multiplier</span>
                        </div>
                      )}

                      {/* 20-Second Countdown Timer */}
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
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold text-white leading-snug">
                      {questionsForZone[questionIndex]?.question}
                    </h3>

                    {/* Multiple Choice Options */}
                    <div className="space-y-2.5">
                      {questionsForZone[questionIndex]?.options.map((optionText, optIdx) => {
                        const isSelected = selectedOption === optIdx;
                        const isCorrect = optIdx === questionsForZone[questionIndex]?.correctAnswer;

                        let btnStyle = "border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-900";
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
                            <span>{optionText}</span>
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

                  {/* Immediate Analytical Explanation */}
                  {answerSubmitted && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 animate-in fade-in-50">
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-bold text-emerald-400 font-mono block mb-1">
                          Analytical Solution:
                        </span>
                        {questionsForZone[questionIndex]?.explanation}
                      </div>
                      <button
                        onClick={nextQuestion}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors ml-auto"
                      >
                        <span>
                          {questionIndex + 1 < questionsForZone.length
                            ? "Next Question"
                            : "Finish Speed Drill"}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* GAME SESSION SCORE SUMMARY */
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center space-y-6 shadow-2xl">
                  <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400">
                    <Award className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-display text-2xl font-bold text-white">
                      Academic Drill Completed
                    </h2>
                    <p className="text-xs text-slate-300">
                      Target Tier: {ageZone} (Ages {ageZone === "JUNIOR" ? "6–12" : ageZone === "TEEN" ? "13–17" : ageZone === "YOUTH" ? "18–24" : "25–30"})
                    </p>
                  </div>

                  <div className="inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800 min-w-48 space-y-1">
                    <span className="font-mono text-4xl font-extrabold text-emerald-400">
                      {score} pts
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Total Assessment Score
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => startGameSession(activeGameId)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Retry Drill
                    </button>
                    <button
                      onClick={() => setActiveGameId(null)}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950"
                    >
                      All Academic Drills
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          TAB 2: COGNITIVE MEMORY MATRIX (INTERACTIVE PATTERN MATCHING)
          ===================================================================== */}
      {activeTab === "memory" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                Cognitive Recall & Pattern Matrix
              </span>
              <h2 className="font-display text-lg font-bold text-white">
                STEM & African Heritage Pairs ({ageZone} Calibrated)
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-400">Moves: <strong className="text-white">{memoryMoves}</strong></span>
              <button
                onClick={initMemoryGame}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Grid</span>
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
                    className={`cursor-pointer select-none rounded-2xl border min-h-[140px] p-4 flex flex-col justify-between transition-all transform ${
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
                  Memory Matrix Fully Cleared!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Completed in {memoryMoves} total moves. Precision cognitive recall demonstrated.
                </p>
              </div>
              <div className="font-mono text-3xl font-extrabold text-emerald-400">
                +150 XP Awarded
              </div>
              <button
                onClick={initMemoryGame}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950"
              >
                Play New Matrix
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: LINGUISTIC WORD CIPHER (ANAGRAM UNMIXER)
          ===================================================================== */}
      {activeTab === "cipher" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {currentCipher && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase">
                  {currentCipher.discipline} · {ageZone} Tier
                </span>
                <span className="text-slate-400">
                  Cipher {cipherIndex + 1} of {cipherItemsForZone.length} · Score: {cipherScore}
                </span>
              </div>

              {/* Scholarly Clue */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                  Definition & Context Clue:
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {currentCipher.clue}
                </p>
              </div>

              {/* Answer Target Slots */}
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

              {/* Letter Bank */}
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
                    <span>Linguistic Term Decrypted (+120 XP)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Target: <strong className="font-mono text-white">{currentCipher.targetWord}</strong> · Verified Academic Lexicon
                  </p>
                  <button
                    onClick={handleNextCipher}
                    className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950"
                  >
                    Next Cipher Challenge
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: MENTAL MATH BLITZ (60-SECOND RAPID CALCULATION)
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
                  60-Second Mental Math Blitz
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Solve as many high-speed arithmetic equations as possible before the clock expires. Correct answers build active streak multipliers.
                </p>
              </div>
              <button
                onClick={startMathBlitz}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-500 shadow-xl shadow-emerald-950"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start 60s Blitz</span>
              </button>
            </div>
          )}

          {mathIsRunning && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    Score: {mathScore}
                  </span>
                  {mathStreak > 1 && (
                    <span className="flex items-center gap-1 font-mono text-xs text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {mathStreak}x Multiplier
                    </span>
                  )}
                </div>

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
              </div>

              {/* Equation Statement */}
              <div className="text-center py-4 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                  Evaluate Expression
                </span>
                <h3 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
                  {mathProblem.equation}
                </h3>
              </div>

              {/* Multiple Choice Numerical Options */}
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
                  Blitz Completed!
                </h3>
                <p className="text-xs text-slate-300">
                  Quantitative speed drill finished in 60 seconds.
                </p>
              </div>
              <div className="font-mono text-4xl font-extrabold text-emerald-400">
                {mathScore} pts
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
          TAB 5: CODE SYNTAX BUG HUNTER (INTERACTIVE DEBUGGER SIMULATOR)
          ===================================================================== */}
      {activeTab === "debugger" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
              <span className="text-blue-400 font-bold uppercase">
                {currentDebuggerItem.language} · {currentDebuggerItem.targetZone}
              </span>
              <span className="text-slate-400">
                Challenge {debuggerIndex + 1} of {CODE_DEBUGGER_DATASET.length} · Score: {debuggerScore}
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {currentDebuggerItem.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect the code lines below. Click the exact line containing the bug or vulnerability:
              </p>
            </div>

            {/* Code Block with Clickable Lines */}
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
                      <span className="text-slate-600 select-none w-6 text-right">
                        {lIdx + 1}
                      </span>
                      <span>{line}</span>
                    </div>
                    {isSelected && !debuggerSubmitted && (
                      <span className="text-[10px] uppercase font-mono text-blue-400">
                        Selected Line
                      </span>
                    )}
                    {debuggerSubmitted && isCorrectBug && (
                      <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
                        Bug Located
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions & Explanation */}
            {!debuggerSubmitted ? (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-mono">
                  {selectedBugLine !== null ? `Selected line ${selectedBugLine + 1}` : "Click a line to flag bug"}
                </span>
                <button
                  onClick={handleDebuggerSubmit}
                  disabled={selectedBugLine === null}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-950"
                >
                  Verify Bug Flag
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 animate-in fade-in-50">
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-emerald-400 font-mono">
                    Compiler Analysis & Architectural Explanation:
                  </div>
                  <p>{currentDebuggerItem.explanation}</p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-xs">
                    <span className="text-slate-500 block mb-1">Recommended Fix:</span>
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
    </div>
  );
};
