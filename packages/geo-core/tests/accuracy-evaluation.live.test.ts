import { expect, test } from "bun:test";

import { getEvaluationClient } from "@notra/ai/evaluation/client";

import { ACCURACY_CONFIDENCE_FLOOR } from "../src/constants/accuracy-analysis";
import { verdictFromProbabilities } from "../src/utils/accuracy-analysis";
import {
  accuracyVerdictQuestions,
  buildAccuracyEvaluationState,
  probabilitiesFromChoice,
} from "../src/utils/accuracy-evaluation";

const hasGateway = Boolean(
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
);

test.skipIf(!hasGateway)(
  "Jev ranks planted brand claims against Brand Facts",
  async () => {
    const facts = [
      {
        id: "price",
        statement: "Acorn's starter plan is $49 per month.",
        category: "pricing" as const,
      },
    ];
    const claims = [
      {
        statement: "Acorn's starter plan is $49 per month.",
        evidence: [
          {
            checkId: "1",
            quote: "Acorn starts at $49 per month.",
            prompt: "What does Acorn cost?",
            engine: "openai",
            capturedAt: "2026-09-01T00:00:00.000Z",
            sources: [],
          },
        ],
      },
      {
        statement: "Acorn's starter plan is $399 per month.",
        evidence: [
          {
            checkId: "2",
            quote: "Acorn starts at $399 per month.",
            prompt: "What does Acorn cost?",
            engine: "openai",
            capturedAt: "2026-09-01T00:00:00.000Z",
            sources: [],
          },
        ],
      },
      {
        statement: "Acorn was founded in 1998 in Reykjavik.",
        evidence: [
          {
            checkId: "3",
            quote: "Acorn was founded in 1998 in Reykjavik.",
            prompt: "Who founded Acorn?",
            engine: "openai",
            capturedAt: "2026-09-01T00:00:00.000Z",
            sources: [],
          },
        ],
      },
    ];
    const result = await getEvaluationClient().evaluate({
      feature: "geo_accuracy_live_test",
      state: buildAccuracyEvaluationState(facts, claims, "Acorn"),
      questions: accuracyVerdictQuestions(
        claims.map((claim) => claim.statement)
      ),
      timeoutMs: 15_000,
    });
    const answers = result.answers as Record<string, unknown>;
    const accurate = verdictFromProbabilities(
      probabilitiesFromChoice(answers.c0)
    );
    const inaccurate = verdictFromProbabilities(
      probabilitiesFromChoice(answers.c1)
    );
    const unknown = probabilitiesFromChoice(answers.c2);
    expect(accurate).toBe("accurate");
    expect(inaccurate).toBe("inaccurate");
    const unknownVerdict = verdictFromProbabilities(unknown);
    expect(
      unknownVerdict === "unverifiable" ||
        Math.max(unknown.accurate, unknown.inaccurate, unknown.unverifiable) <
          ACCURACY_CONFIDENCE_FLOOR
    ).toBe(true);
  },
  { timeout: 30_000 }
);
