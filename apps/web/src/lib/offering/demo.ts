import { OFFERING_ENGINE_LABEL } from "@/constants/offering";
import {
  citationShareFor,
  offeringMatchedTerm,
  offeringSourcesFrom,
} from "@/lib/offering/evaluate";
import { buildOfferingPrompt } from "@/lib/offering/prompt";
import type { OfferingScanResult } from "@/types/offering";

const DEMO_SOURCE_URLS: Record<string, { url: string; title: string }[]> = {
  notra: [
    { url: "https://www.usenotra.com", title: "Notra" },
    { url: "https://www.usenotra.com/features", title: "Features" },
    { url: "https://docs.usenotra.com", title: "Docs" },
    { url: "https://news.ycombinator.com/item?id=1", title: "Hacker News" },
    { url: "https://www.g2.com/products/notra", title: "G2" },
  ],
  resend: [
    { url: "https://resend.com", title: "Resend" },
    { url: "https://resend.com/docs", title: "Docs" },
    { url: "https://resend.com/blog", title: "Blog" },
    { url: "https://github.com/resend", title: "GitHub" },
  ],
  linear: [
    { url: "https://linear.app", title: "Linear" },
    { url: "https://linear.app/docs", title: "Docs" },
    { url: "https://www.reddit.com/r/linear", title: "Reddit" },
    { url: "https://www.g2.com/products/linear", title: "G2" },
  ],
};

const FALLBACK_SOURCE_URLS = [
  { url: "https://www.reddit.com", title: "Reddit" },
  { url: "https://en.wikipedia.org", title: "Wikipedia" },
];

const KNOWN_DEMO_ANSWERS: Record<string, string> = {
  notra:
    "Notra is a GEO platform for tracking how AI engines mention a brand. Public pages describe mention tracking, citation analysis, AI traffic, and an agent readiness audit that checks whether a site is ready for coding agents. They also publish pages from GEO gaps.",
  resend:
    "Resend is an email API for developers. Current docs cover transactional sending, inbound emails, webhooks, and React email templates. Inbound emails let you receive mail at your domain and handle it in code.",
};

const UNKNOWN_DEMO_ANSWERS: Record<string, string> = {
  linear:
    "Linear is a project management tool for software teams. Sources describe issues, projects, cycles, roadmaps, and an API. Several pages focus on issue tracking and keyboard-driven workflows.",
};

function sampleKey(brand: string): string {
  return brand.toLowerCase();
}

function demoAnswer(brand: string, feature: string | null): string {
  const key = sampleKey(brand);
  if (feature && KNOWN_DEMO_ANSWERS[key]) {
    return KNOWN_DEMO_ANSWERS[key];
  }
  if (UNKNOWN_DEMO_ANSWERS[key]) {
    return UNKNOWN_DEMO_ANSWERS[key];
  }
  return `${brand} shows up as a software product in public listings. Pages mention a website, docs, and typical SaaS features such as accounts and an API. Nothing more specific showed up in this pass.`;
}

export function isOfferingDemoMode(): boolean {
  return process.env.NODE_ENV === "development";
}

export function buildDemoOfferingScan(input: {
  brand: string;
  feature: string | null;
}): OfferingScanResult {
  const key = sampleKey(input.brand);
  const prompt = buildOfferingPrompt(input.brand);
  const answer = demoAnswer(input.brand, input.feature);
  const matchedTerm = offeringMatchedTerm({
    answer,
    brand: input.brand,
    feature: input.feature,
  });
  const sources = offeringSourcesFrom(
    DEMO_SOURCE_URLS[key] ?? FALLBACK_SOURCE_URLS
  );

  return {
    brand: input.brand,
    feature: input.feature,
    prompt,
    known: matchedTerm !== null,
    matchedTerm,
    answer,
    engine: OFFERING_ENGINE_LABEL,
    queries: [`what does ${input.brand} offer`, `${input.brand} features`],
    sources,
    citations: citationShareFor(sources, input.brand),
    cached: false,
  };
}
