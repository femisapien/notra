"use client";

import {
  Alert02Icon,
  Clock01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getFaviconUrl } from "@notra/geo-core/utils/reference-display";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import { parseAsString, useQueryState } from "nuqs";
import { type FormEvent, useRef, useState } from "react";

import { AnimatedHeight } from "@/components/ip-checker/animated-height";
import { OfferingResultCard } from "@/components/offering/offering-result-card";
import {
  OFFERING_BRAND_PLACEHOLDER,
  OFFERING_BRAND_QUERY_KEY,
  OFFERING_FEATURE_PLACEHOLDER,
  OFFERING_FEATURE_QUERY_KEY,
  OFFERING_MOTION,
  OFFERING_STATUS_MESSAGES,
} from "@/constants/offering";
import {
  offeringScanRequestSchema,
  offeringScanResultSchema,
} from "@/schemas/offering";
import type {
  OfferingSample,
  OfferingScanResult,
  OfferingScanStatus,
  OfferingToolProps,
} from "@/types/offering";

export function OfferingTool({
  samples,
  initialBrand,
  initialFeature,
}: OfferingToolProps) {
  const [, setBrandParam] = useQueryState(
    OFFERING_BRAND_QUERY_KEY,
    parseAsString.withOptions({ history: "replace" })
  );
  const [, setFeatureParam] = useQueryState(
    OFFERING_FEATURE_QUERY_KEY,
    parseAsString.withOptions({ history: "replace" })
  );
  const [brand, setBrand] = useState(initialBrand ?? "");
  const [feature, setFeature] = useState(initialFeature ?? "");
  const [status, setStatus] = useState<OfferingScanStatus>("idle");
  const [result, setResult] = useState<OfferingScanResult | null>(null);
  const requestIdRef = useRef(0);

  const runCheck = async (nextBrand: string, nextFeature: string) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const isLatest = () => requestIdRef.current === requestId;
    const parsed = offeringScanRequestSchema.safeParse({
      brand: nextBrand,
      feature: nextFeature,
    });
    if (!parsed.success) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    const response = await fetch("/api/offering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    }).catch(() => null);
    if (!isLatest()) {
      return;
    }
    if (!response) {
      setStatus("error");
      return;
    }
    if (response.status === 422 || response.status === 400) {
      setStatus("invalid");
      return;
    }
    if (response.status === 429) {
      setStatus("rate-limited");
      return;
    }
    if (response.status === 503) {
      setStatus("unavailable");
      return;
    }
    const payload = offeringScanResultSchema.safeParse(
      await response.json().catch(() => null)
    );
    if (!isLatest()) {
      return;
    }
    if (!(response.ok && payload.success)) {
      setStatus("error");
      return;
    }
    setResult(payload.data);
    setStatus("done");
    setBrandParam(payload.data.brand);
    setFeatureParam(payload.data.feature);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runCheck(brand, feature);
  };

  const handleSample = (sampleBrand: string, sampleFeature: string) => {
    setBrand(sampleBrand);
    setFeature(sampleFeature);
    runCheck(sampleBrand, sampleFeature);
  };

  const isChecking = status === "checking";
  const message = OFFERING_STATUS_MESSAGES[status];

  return (
    <div className="flex flex-col gap-5">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              className="font-sans text-sm/4.5 font-medium text-[#1E1E1E] dark:text-white"
              htmlFor="offering-brand-input"
            >
              Product or brand
            </Label>
            <Input
              aria-invalid={status === "invalid"}
              autoComplete="off"
              className="h-11 rounded-xl border-[#E4E4E4] bg-transparent px-3.5 py-3 font-sans text-[0.9375rem]/5 shadow-none placeholder:text-[#1E1E1E66] dark:border-white/12 dark:placeholder:text-white/40"
              id="offering-brand-input"
              name="brand"
              onChange={(event) => {
                setBrand(event.target.value);
                if (status === "checking") {
                  requestIdRef.current += 1;
                  setStatus("idle");
                }
              }}
              placeholder={OFFERING_BRAND_PLACEHOLDER}
              spellCheck={false}
              value={brand}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="font-sans text-sm/4.5 font-medium text-[#1E1E1E] dark:text-white"
              htmlFor="offering-feature-input"
            >
              Feature to check
            </Label>
            <Input
              autoComplete="off"
              className="h-11 rounded-xl border-[#E4E4E4] bg-transparent px-3.5 py-3 font-sans text-[0.9375rem]/5 shadow-none placeholder:text-[#1E1E1E66] dark:border-white/12 dark:placeholder:text-white/40"
              id="offering-feature-input"
              name="feature"
              onChange={(event) => setFeature(event.target.value)}
              placeholder={OFFERING_FEATURE_PLACEHOLDER}
              spellCheck={false}
              value={feature}
            />
          </div>
        </div>
        <CtaButton
          className="font-display h-auto w-full rounded-[2.5625rem] px-6 py-3 text-[1.125rem] leading-[1.14] font-medium tracking-[-0.015em] sm:w-auto"
          disabled={isChecking}
          type="submit"
        >
          <span className="grid place-items-center">
            <span
              aria-hidden={isChecking}
              className={
                isChecking ? "invisible [grid-area:1/1]" : "[grid-area:1/1]"
              }
            >
              Check ChatGPT
            </span>
            {isChecking ? (
              <HugeiconsIcon
                className="size-5 animate-spin [grid-area:1/1]"
                icon={Loading03Icon}
              />
            ) : null}
          </span>
        </CtaButton>
      </form>

      <ul className="flex flex-col gap-0.5">
        {samples.map((sample) => (
          <li key={`${sample.brand}-${sample.feature}`}>
            <button
              aria-label={`Check whether ChatGPT knows ${sample.brand} ${sample.feature}`}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-left font-sans text-[0.9375rem]/5 text-[#1E1E1E99] transition-colors hover:bg-[#1E1E1E08] hover:text-[#1E1E1E] disabled:opacity-60 dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white"
              disabled={isChecking}
              onClick={() => handleSample(sample.brand, sample.feature)}
              type="button"
            >
              <span
                aria-hidden="true"
                className="w-3.5 shrink-0 text-[#1E1E1E66] dark:text-white/35"
              >
                ↳
              </span>
              {/* biome-ignore lint/performance/noImgElement: sample logo is a per-brand URL, not a Next Image host */}
              <img
                alt=""
                className="size-4 shrink-0 rounded-sm"
                height={16}
                src={sampleLogoSrc(sample)}
                width={16}
              />
              <span className="min-w-0 truncate">
                {sample.brand} · {sample.feature}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <LazyMotion features={domAnimation}>
        <AnimatedHeight>
          <AnimatePresence initial={false} mode="wait">
            {message ? (
              <OfferingNotice key={status} message={message} status={status} />
            ) : null}
            {!message && result && status === "done" ? (
              <OfferingResultCard
                key={`${result.brand}-${result.feature ?? ""}`}
                result={result}
              />
            ) : null}
          </AnimatePresence>
        </AnimatedHeight>
      </LazyMotion>
    </div>
  );
}

function sampleLogoSrc(sample: OfferingSample) {
  return sample.logoSrc ?? getFaviconUrl(sample.domain);
}

function noticeIcon(status: OfferingScanStatus) {
  if (status === "checking") {
    return Loading03Icon;
  }
  if (status === "rate-limited") {
    return Clock01Icon;
  }
  return Alert02Icon;
}

function OfferingNotice({
  message,
  status,
}: {
  message: string;
  status: OfferingScanStatus;
}) {
  const reduceMotion = useReducedMotion();
  const icon = noticeIcon(status);
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: OFFERING_MOTION.enter },
        exit: { opacity: 0, transition: OFFERING_MOTION.exit },
      };

  return (
    <m.div
      aria-live="polite"
      className="flex items-center gap-3 rounded-2xl border border-[#1E1E1E14] bg-white px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]"
      role="status"
      {...motionProps}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F7F5FB] text-[#1E1E1E] dark:bg-white/[0.06] dark:text-white">
        <HugeiconsIcon
          className={`size-4.5 ${status === "checking" ? "animate-spin" : ""}`}
          icon={icon}
        />
      </span>
      <p className="font-sans text-[0.9375rem]/6 font-medium text-[#1E1E1E] dark:text-white">
        {message}
      </p>
    </m.div>
  );
}
