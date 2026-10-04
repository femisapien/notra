export const SITE_NAME_MODERATION_FEATURE = "site_name_moderation";

/** Creating a site waits for this; Jev answers in ~300 ms. */
export const SITE_NAME_MODERATION_TIMEOUT_MS = 3000;

/** Measured on hand-labelled names: clean names stay ≤ 0.10, offensive ones ≥ 0.87. */
export const SITE_NAME_OFFENSIVE_THRESHOLD = 0.7;

/** Clean names reach 0.36, phishing-style ones ≥ 0.95; a wrong block costs a real customer. */
export const SITE_NAME_IMPERSONATION_THRESHOLD = 0.8;
