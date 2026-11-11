import { describe, expect, it } from "vitest";
import {
  getShuffledQualifierQuestion,
  TOURNAMENT_QUALIFIER_QUESTIONS,
} from "@/lib/tournament-qualifier";

describe("tournament qualifier option ordering", () => {
  it("uses a stable, session-specific option order without changing the correct answer", () => {
    const firstSeed = "first-test-session-seed";
    const secondSeed = "second-test-session-seed";
    let orderChangedBetweenSessions = false;

    TOURNAMENT_QUALIFIER_QUESTIONS.forEach((question, questionIndex) => {
      const firstOrder = getShuffledQualifierQuestion(questionIndex, firstSeed);
      const repeatedOrder = getShuffledQualifierQuestion(questionIndex, firstSeed);
      const secondOrder = getShuffledQualifierQuestion(questionIndex, secondSeed);

      expect(firstOrder).toEqual(repeatedOrder);
      expect([...firstOrder.options].sort()).toEqual([...question.options].sort());
      expect(firstOrder.options[firstOrder.correctIndex]).toBe(
        question.options[question.correctIndex],
      );
      if (firstOrder.options.some((option, index) => option !== secondOrder.options[index])) {
        orderChangedBetweenSessions = true;
      }
    });

    expect(orderChangedBetweenSessions).toBe(true);
  });
});
