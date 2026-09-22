import { expect, test } from "bun:test";

import type { AccuracyAnalysisSample } from "../src/types/accuracy-analysis";
import {
  attachVerdicts,
  clusterAccuracyClaims,
  relatedKnowledgeFacts,
  scoredAccuracyCounts,
  validateAccuracyClaims,
  verdictFromProbabilities,
} from "../src/utils/accuracy-analysis";

const sample: AccuracyAnalysisSample[] = [
  {
    id: "a",
    answer: "Acme costs $49 per month for the starter plan.",
    prompt: "How much is Acme?",
    engine: "openai",
    capturedAt: "2026-09-01T00:00:00.000Z",
    sources: [{ url: "https://news.example", title: "News" }],
  },
  {
    id: "b",
    answer: "Acme costs $49 per month for the starter plan.",
    prompt: "Acme pricing",
    engine: "anthropic",
    capturedAt: "2026-09-02T00:00:00.000Z",
    sources: [],
  },
];

test("drops claims whose quote is not in the answer", () => {
  const claims = validateAccuracyClaims(
    {
      claims: [
        {
          statement: "Acme starter is $49 / month",
          category: "pricing",
          evidence: [{ checkId: "a", quote: "Acme costs $49 per month" }],
        },
        {
          statement: "Invented feature",
          category: "features",
          evidence: [{ checkId: "a", quote: "unlimited seats for free" }],
        },
      ],
    },
    sample
  );
  expect(claims).toHaveLength(1);
  expect(claims[0]?.statement).toBe("Acme starter is $49 / month");
});

test("confidence floor turns a weak argmax into unverifiable", () => {
  expect(
    verdictFromProbabilities({
      accurate: 0.4,
      inaccurate: 0.35,
      unverifiable: 0.25,
    })
  ).toBe("unverifiable");
  expect(
    verdictFromProbabilities({
      accurate: 0.1,
      inaccurate: 0.8,
      unverifiable: 0.1,
    })
  ).toBe("inaccurate");
});

test("score ignores unverifiable and low-confidence labels", () => {
  const claims = attachVerdicts(
    [
      {
        statement: "ok",
        category: "pricing",
        evidence: [],
      },
      {
        statement: "wrong",
        category: "pricing",
        evidence: [],
      },
      {
        statement: "unknown",
        category: "other",
        evidence: [],
      },
    ],
    new Map([
      [0, { accurate: 0.9, inaccurate: 0.05, unverifiable: 0.05 }],
      [1, { accurate: 0.05, inaccurate: 0.9, unverifiable: 0.05 }],
      [2, { accurate: 0.4, inaccurate: 0.3, unverifiable: 0.3 }],
    ])
  );
  expect(scoredAccuracyCounts(claims)).toEqual({
    accurate: 1,
    inaccurate: 1,
    unverifiable: 1,
    score: 0.5,
  });
  expect(
    scoredAccuracyCounts([
      {
        statement: "unknown",
        category: "other",
        verdict: "unverifiable",
        probabilities: { accurate: 0.3, inaccurate: 0.3, unverifiable: 0.4 },
        evidence: [],
      },
    ]).score
  ).toBeNull();
});

test("clusters paraphrases and prefers an inaccurate verdict", () => {
  const clustered = clusterAccuracyClaims([
    {
      statement: "Starter is $49/month",
      category: "pricing",
      verdict: "accurate",
      probabilities: { accurate: 0.9, inaccurate: 0.05, unverifiable: 0.05 },
      evidence: [
        {
          checkId: "a",
          quote: "Acme costs $49 per month",
          prompt: "p",
          engine: "openai",
          capturedAt: "2026-09-01T00:00:00.000Z",
          sources: [],
        },
      ],
    },
    {
      statement: "starter is $49/month",
      category: "pricing",
      verdict: "inaccurate",
      probabilities: { accurate: 0.1, inaccurate: 0.85, unverifiable: 0.05 },
      evidence: [
        {
          checkId: "b",
          quote: "Acme costs $49 per month",
          prompt: "p",
          engine: "anthropic",
          capturedAt: "2026-09-02T00:00:00.000Z",
          sources: [],
        },
      ],
    },
  ]);
  expect(clustered).toHaveLength(1);
  expect(clustered[0]?.verdict).toBe("inaccurate");
  expect(clustered[0]?.evidence).toHaveLength(2);
});

test("related facts prefer overlapping numbers over the same category", () => {
  const facts = [
    {
      id: "a",
      statement: "Starter plan costs $1,000 per year",
      category: "pricing" as const,
      sourceUrl: "https://usenotra.com/pricing",
    },
    {
      id: "b",
      statement: "Growth plan costs $5,000 per year",
      category: "pricing" as const,
    },
    {
      id: "c",
      statement: "Notra is an AI content platform",
      category: "company" as const,
    },
  ];
  expect(
    relatedKnowledgeFacts("Starter is $49 per month", "pricing", facts, 1).map(
      (fact) => fact.id
    )
  ).toEqual(["a"]);
  expect(
    relatedKnowledgeFacts("Headquarters are in Berlin", "company", facts).map(
      (fact) => fact.id
    )
  ).toEqual(["c"]);
});
