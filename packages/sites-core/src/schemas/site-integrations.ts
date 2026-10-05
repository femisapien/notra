import { SITE_CSP_MAX_ALLOWED_ORIGINS } from "@notra/sites-core/constants/security";
import { z } from "zod";

// Every value here ends up in a <script> attribute, inline script or CSP
// header, so each one is matched against the vendor's exact id format.
const HOST = String.raw`(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}`;
const PORT = String.raw`(?::\d{1,5})?`;
const HOSTNAME = new RegExp(`^${HOST}$`);
const HTTPS_BASE_URL = new RegExp(
  String.raw`^https:\/\/${HOST}${PORT}(?:\/[A-Za-z0-9._~-]+)*$`
);
const CSP_ORIGIN = new RegExp(
  String.raw`^(?:https|wss):\/\/(?:\*\.)?${HOST}${PORT}$`
);

const databuddySchema = z.strictObject({
  clientId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{8,64}$/, "Copy the Client ID from Databuddy"),
});

const plausibleSchema = z.strictObject({
  /** The site's domain as added in Plausible, e.g. `acme.com`. */
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HOSTNAME, "Use the domain as added in Plausible, e.g. acme.com"),
});

const posthogSchema = z.strictObject({
  apiKey: z
    .string()
    .trim()
    .regex(/^phc_[A-Za-z0-9]{20,64}$/, "Use the project API key (phc_…)"),
  /** `https://us.i.posthog.com`, `https://eu.i.posthog.com` or a reverse proxy. */
  apiHost: z
    .string()
    .trim()
    .overwrite((value) => value.replace(/\/+$/, ""))
    .regex(HTTPS_BASE_URL, "Use an https:// URL without query or hash")
    .optional(),
});

const ga4Schema = z.strictObject({
  measurementId: z
    .string()
    .trim()
    .regex(/^G-[A-Z0-9]{4,16}$/, "Use the measurement ID (G-…)"),
});

/** Analytics presets; unknown keys are rejected so a typo never silently disables tracking. */
export const siteIntegrationsSchema = z
  .strictObject({
    databuddy: databuddySchema.optional(),
    plausible: plausibleSchema.optional(),
    posthog: posthogSchema.optional(),
    ga4: ga4Schema.optional(),
  })
  .default({});

export const siteSecuritySchema = z
  .strictObject({
    /** Send a Content-Security-Policy with every page. */
    contentSecurityPolicy: z.boolean().default(true),
    /**
     * Extra origins custom scripts and components may load scripts from and
     * connect to. `wss://` origins are only allowed for connections.
     */
    allowedOrigins: z
      .array(
        z
          .string()
          .trim()
          .toLowerCase()
          .regex(
            CSP_ORIGIN,
            "Use an origin like https://cdn.example.com (no path), optionally https://*.example.com"
          )
      )
      .max(SITE_CSP_MAX_ALLOWED_ORIGINS)
      .default([]),
  })
  .default({ contentSecurityPolicy: true, allowedOrigins: [] });
