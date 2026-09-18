import type { OfferingSample, OfferingScanStatus } from "@/types/offering";
import { SITE_URL } from "@/utils/urls";

const OFFERING_PATH = "/offering";

export const OFFERING_URL = `${SITE_URL}${OFFERING_PATH}`;

export const OFFERING_MARKDOWN_URL = `${OFFERING_URL}.md`;

export const OFFERING_API_URL = `${SITE_URL}/api${OFFERING_PATH}`;

export const OFFERING_TITLE = "Does AI know your feature?";

export const OFFERING_DESCRIPTION =
  "Check whether GPT-5.6 with native search names your product feature when a buyer asks what you offer, and see which sites it cited instead. Free, no sign-up.";

export const OFFERING_HERO_SUBTITLE =
  "Enter a product and the feature you want ChatGPT to know. We ask GPT-5.6 with native search what the product offers, then tell you whether that feature showed up, and which sites it cited.";

export const OFFERING_STATUS_MESSAGES: Partial<
  Record<OfferingScanStatus, string>
> = {
  checking: "Asking GPT-5.6 with native search. This can take a few seconds.",
  invalid: "Enter a product or brand, at least two characters.",
  "rate-limited": "Too many scans in a row. Try again in a bit.",
  unavailable: "This scan is not available right now. Try again later.",
  error: "Something went wrong. Try again.",
};

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const OFFERING_MOTION = {
  enter: { duration: 0.4, ease: MOTION_EASE, delay: 0.08 },
  exit: { duration: 0.28, ease: MOTION_EASE },
} as const;

export const OFFERING_BRAND_PLACEHOLDER = "Notra";

export const OFFERING_FEATURE_PLACEHOLDER = "Agent readiness";

export const OFFERING_BRAND_QUERY_KEY = "brand";

export const OFFERING_FEATURE_QUERY_KEY = "feature";

export const OFFERING_ENGINE_LABEL = "GPT-5.6";

export const OFFERING_ENGINE_ID = "openai/gpt-5.6-sol";

export const OFFERING_DIRECT_MODEL_ID = "gpt-5.6-sol";

export const OFFERING_RATE_LIMIT = {
  requests: 8,
  window: "1h",
} as const;

export const OFFERING_CACHE_TTL_SECONDS = 60 * 60 * 12;

export const OFFERING_SCAN_TIMEOUT_MS = 45_000;

export const OFFERING_MAX_OUTPUT_TOKENS = 2048;

export const OFFERING_MAX_STEPS = 4;

export const OFFERING_CITATION_BAR_COLOR = "#8B5CF6";

export const OFFERING_SIGNUP_SOURCE = "offering-tool";

export const OFFERING_SAMPLES: readonly OfferingSample[] = [
  {
    brand: "Notra",
    feature: "Agent readiness",
    domain: "usenotra.com",
    logoSrc: "/notra-mark.svg",
  },
  { brand: "Resend", feature: "Inbound emails", domain: "resend.com" },
  { brand: "Linear", feature: "Customer requests", domain: "linear.app" },
];

export const OFFERING_DEMO_DELAY = "400 millis";
