"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getFaviconUrl } from "@notra/geo-core/utils/reference-display";
import { EngineIcon } from "@notra/ui/components/geo/engine-icon";
import { GeoBar } from "@notra/ui/components/geo/geo-bar";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { m, useReducedMotion } from "motion/react";

import { TrackedSignupLink } from "@/components/tracked-signup-link";
import {
  OFFERING_CITATION_BAR_COLOR,
  OFFERING_MOTION,
  OFFERING_SIGNUP_SOURCE,
} from "@/constants/offering";
import type { OfferingResultCardProps } from "@/types/offering";

const cardClass =
  "flex flex-col gap-4 rounded-2xl border border-[#1E1E1E14] bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.03]";
const metaClass =
  "font-sans text-[0.8125rem]/5 text-[#1E1E1E99] dark:text-white/50";
const bodyClass =
  "font-sans text-[0.875rem]/5.5 text-pretty text-[#1E1E1EBF] dark:text-white/70";
const headingClass =
  "font-display text-[1.125rem]/6 font-medium tracking-[-0.02em] text-[#1E1E1E] dark:text-white";

export function OfferingResultCard({ result }: OfferingResultCardProps) {
  const reduceMotion = useReducedMotion();
  const cardMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: OFFERING_MOTION.enter },
        exit: { opacity: 0, transition: OFFERING_MOTION.exit },
      };
  const target = result.feature ?? result.brand;
  const verdict = result.known
    ? `${result.engine} mentioned it`
    : `${result.engine} did not mention it`;
  const summary = result.known
    ? `${target} showed up when we asked what ${result.brand} offers.`
    : `${target} did not show up when we asked what ${result.brand} offers.`;
  const ctaLabel = result.known
    ? "Scan Claude, Gemini and Perplexity"
    : "Track this prompt across engines";

  return (
    <m.div aria-live="polite" className="flex flex-col gap-3" {...cardMotion}>
      <div className={cardClass}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#1E1E1E14] bg-[#F7F5FB] dark:border-white/10 dark:bg-white/[0.06]">
            <EngineIcon className="size-5" engine="chatgpt" />
          </span>
          <div className="flex min-w-0 grow flex-col">
            <h3 className={headingClass}>{verdict}</h3>
            <p className={metaClass}>
              {result.engine} with native search
              {result.cached ? " · cached" : null}
            </p>
          </div>
        </div>
        <p className={bodyClass}>{summary}</p>
        <p className={metaClass}>Asked: “{result.prompt}”</p>
        {result.queries.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {result.queries.map((query) => (
              <span
                className="rounded-lg border border-[#1E1E1E14] bg-[#F7F5FB] px-2 py-1 font-sans text-[0.75rem]/4 text-[#1E1E1E99] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/50"
                key={query}
              >
                {query}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className={cardClass}>
        <h3 className={headingClass}>Sites {result.engine} cited</h3>
        {result.citations.length === 0 ? (
          <p className={bodyClass}>
            This answer did not cite any sites. That usually means search found
            little to go on.
          </p>
        ) : (
          <ol className="flex flex-col">
            {result.citations.map((row) => (
              <li
                className="flex items-center gap-3 border-b border-[#1E1E1E0D] py-2.5 last:border-b-0 dark:border-white/10"
                key={row.domain}
              >
                {/* biome-ignore lint/performance/noImgElement: favicon URL is per-domain and not a Next Image host */}
                <img
                  alt=""
                  className="size-5 shrink-0 rounded-sm"
                  height={20}
                  src={getFaviconUrl(row.domain)}
                  width={20}
                />
                <a
                  className={`min-w-0 truncate font-sans text-[0.875rem]/5 ${
                    row.isBrand
                      ? "font-medium text-[#1E1E1E] dark:text-white"
                      : "text-[#1E1E1E] dark:text-white"
                  }`}
                  href={row.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {row.domain}
                </a>
                <GeoBar
                  className="h-1.5 min-w-16 flex-1"
                  fillColor={OFFERING_CITATION_BAR_COLOR}
                  max={100}
                  value={row.share}
                />
                <span className="w-10 shrink-0 text-right font-sans text-[0.8125rem]/5 text-[#1E1E1E99] tabular-nums dark:text-white/50">
                  {row.share}%
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {result.answer ? (
        <div className={cardClass}>
          <h3 className={headingClass}>What it said</h3>
          <p className={`${bodyClass} whitespace-pre-wrap`}>{result.answer}</p>
        </div>
      ) : null}

      <div className={cardClass}>
        <p className={bodyClass}>
          {result.known
            ? "This is one snapshot on one engine. Notra runs the same kind of prompt across ChatGPT, Claude, Gemini and Perplexity on a schedule."
            : "If ChatGPT cannot name the feature, a buyer asking what you offer will not hear about it. Notra tracks those misses and turns them into pages worth publishing."}
        </p>
        <CtaButton
          className="font-display h-auto w-fit rounded-[2.5625rem] px-6 py-3 text-[1.125rem] leading-[1.14] font-medium tracking-[-0.015em]"
          nativeButton={false}
          render={<TrackedSignupLink source={OFFERING_SIGNUP_SOURCE} />}
        >
          {ctaLabel}
          <HugeiconsIcon className="size-4" icon={ArrowUpRight01Icon} />
        </CtaButton>
      </div>
    </m.div>
  );
}
