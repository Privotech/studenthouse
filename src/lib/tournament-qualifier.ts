import { createHash } from "node:crypto";

export const TOURNAMENT_QUALIFIER_QUESTIONS = [
  {
    discipline: "Pure Mathematics",
    question: "If f(x) = 3x² - 12x + 7, at what critical value of x does the local extremum occur?",
    options: ["x = 2", "x = 4", "x = -2", "x = 0"],
    correctIndex: 0,
    rationale: "Differentiating f(x) yields f'(x) = 6x - 12. Setting f'(x) = 0 gives x = 2.",
  },
  {
    discipline: "Computer Science",
    question: "What is the worst-case time complexity of standard unrandomized Quickselect algorithm?",
    options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"],
    correctIndex: 0,
    rationale: "When bad pivot partitions occur repeatedly, standard Quickselect degrades to O(n²), though average runtime is O(n).",
  },
  {
    discipline: "Physical Science",
    question: "A projectile is launched vertically at 19.6 m/s in standard gravity (g = 9.8 m/s²). Neglecting drag, what is its maximum elevation?",
    options: ["19.6 meters", "39.2 meters", "9.8 meters", "14.7 meters"],
    correctIndex: 0,
    rationale: "Using v² = u² - 2gh at max height where v=0: h = (19.6)² / (2 * 9.8) = 19.6 meters.",
  },
  {
    discipline: "Trade & Economics",
    question: "Under the AfCFTA protocol on Trade in Goods, what percentage of tariff lines must State Parties liberalize during phase one?",
    options: ["90% of tariff lines", "50% of tariff lines", "75% of tariff lines", "100% of tariff lines"],
    correctIndex: 0,
    rationale: "The AfCFTA Agreement mandates 90% tariff liberalization across commercial product lines during the initial phase.",
  },
] as const;

export function getShuffledQualifierQuestion(
  questionIndex: number,
  seed: string,
) {
  const question = TOURNAMENT_QUALIFIER_QUESTIONS[questionIndex];
  if (!question) {
    throw new RangeError(`Unknown tournament qualifier question index: ${questionIndex}`);
  }

  const optionOrder = question.options.map((_, index) => index);
  for (let index = optionOrder.length - 1; index > 0; index -= 1) {
    const digest = createHash("sha256")
      .update(`${seed}:${questionIndex}:${index}`)
      .digest();
    const swapIndex = digest.readUInt32BE(0) % (index + 1);
    [optionOrder[index], optionOrder[swapIndex]] = [optionOrder[swapIndex]!, optionOrder[index]!];
  }

  const { discipline, question: prompt, options } = question;
  return {
    discipline,
    question: prompt,
    options: optionOrder.map((optionIndex) => options[optionIndex]!),
    correctIndex: optionOrder.indexOf(question.correctIndex),
  };
}
