import { expect, test } from "bun:test";

import {
  accuracyVerdictQuestions,
  probabilitiesFromChoice,
  rankedProbabilitiesFromAnswers,
} from "../src/utils/accuracy-evaluation";

test("builds one choice question per claim with the claim text bound in", () => {
  const questions = accuracyVerdictQuestions([
    "Starter is $49",
    "Starter is $399",
    "Founded in 1998",
  ]);
  expect(Object.keys(questions)).toEqual(["c0", "c1", "c2"]);
  expect(questions.c0?.type).toBe("choice");
  expect(questions.c0?.instructions).toContain("Starter is $49");
  expect(questions.c1?.instructions).toContain("Starter is $399");
});

test("reads Jev choice probabilities and falls back to the chosen label", () => {
  expect(
    probabilitiesFromChoice({
      type: "choice",
      choice: "inaccurate",
      probabilities: { accurate: 0.05, inaccurate: 0.9, unverifiable: 0.05 },
    })
  ).toEqual({ accurate: 0.05, inaccurate: 0.9, unverifiable: 0.05 });
  expect(probabilitiesFromChoice({ choice: "accurate" })).toEqual({
    accurate: 1,
    inaccurate: 0,
    unverifiable: 0,
  });
});

test("maps dynamic answer ids onto claim indexes", () => {
  const ranked = rankedProbabilitiesFromAnswers(
    {
      c0: {
        choice: "accurate",
        probabilities: { accurate: 0.95, inaccurate: 0.03, unverifiable: 0.02 },
      },
      c1: { choice: "unverifiable" },
    },
    2
  );
  expect(ranked.get(0)?.accurate).toBe(0.95);
  expect(ranked.get(1)).toEqual({
    accurate: 0,
    inaccurate: 0,
    unverifiable: 1,
  });
});
