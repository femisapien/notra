import {
  OFFERING_API_URL,
  OFFERING_ENGINE_LABEL,
  OFFERING_MARKDOWN_URL,
  OFFERING_TITLE,
  OFFERING_URL,
} from "@/constants/offering";
import type { OfferingScanResult } from "@/types/offering";
import { markdownSection } from "@/utils/markdown";

function citationLines(result: OfferingScanResult): string[] {
  if (result.citations.length === 0) {
    return ["No cited sites in this answer."];
  }
  return [
    "| Site | Citations | Share |",
    "| --- | --- | --- |",
    ...result.citations.map(
      (row) => `| [${row.domain}](${row.url}) | ${row.count} | ${row.share}% |`
    ),
  ];
}

function resultLines(result: OfferingScanResult): string[] {
  const target = result.feature ?? result.brand;
  const verdict = result.known
    ? `${OFFERING_ENGINE_LABEL} mentioned **${target}**.`
    : `${OFFERING_ENGINE_LABEL} did not mention **${target}**.`;
  const lines = [
    verdict,
    "",
    `Asked: “${result.prompt}”`,
    "",
    result.answer || "_Empty answer._",
  ];
  if (result.queries.length > 0) {
    lines.push(
      "",
      "Searched:",
      "",
      ...result.queries.map((query) => `- ${query}`)
    );
  }
  return lines;
}

function resultSection(
  result: OfferingScanResult | null,
  invalidInput: string | null
): string[] {
  if (result) {
    return [
      markdownSection("Result", resultLines(result)),
      markdownSection("Sites GPT-5.6 cited", citationLines(result)),
    ];
  }
  if (invalidInput !== null) {
    return [
      markdownSection("Result", [
        invalidInput.length > 0
          ? `\`${invalidInput}\` is not a valid product or brand.`
          : "Pass a brand query parameter, at least two characters.",
      ]),
    ];
  }
  return [];
}

export function buildOfferingMarkdown(
  result: OfferingScanResult | null,
  invalidInput: string | null
): string {
  return [
    `# ${OFFERING_TITLE}`,
    "",
    "Check whether GPT-5.6 with native search names a product feature when a buyer asks what that product offers. The feature under test is never put in the question, so a mention cannot come from echoing the prompt.",
    "",
    ...resultSection(result, invalidInput),
    markdownSection("How to use", [
      `- Markdown: GET \`${OFFERING_MARKDOWN_URL}?brand=<product>&feature=<feature>\``,
      `- JSON: GET \`${OFFERING_API_URL}?brand=<product>&feature=<feature>\`, or POST \`${OFFERING_API_URL}\` with body \`{"brand": "<product>", "feature": "<feature>"}\``,
      `- Browser: \`${OFFERING_URL}?brand=<product>&feature=<feature>\``,
    ]),
    markdownSection("How it works", [
      "The scan asks a buyer question about the product only, with GPT-5.6 native search. It then looks for the feature in the answer and ranks the domains ChatGPT cited.",
      "",
      "A miss means ChatGPT did not name that feature in this snapshot. It is not a score across engines or over time.",
    ]),
  ].join("\n");
}
