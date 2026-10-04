import { SITE_CSP_MAX_ALLOWED_ORIGINS } from "@notra/sites-core/constants/security";
import { z } from "zod";

// Every value here ends up in a <script> attribute, inline script or CSP
// header, so each one is matched against the vendor's exact id format.
const HOST = String.raw`(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}`;
const PORT = String.raw`(?::\d{1,5})?`;
const HOSTNAME = new RegExp(`^${HOST}$`);
const HTTPS_SCRIPT_URL = new RegExp(
  String.raw`^https:\/\/${HOST}${PORT}\/[A-Za-z0-9._~\/-]*\.js$`
);
const HTTPS_BASE_URL = new RegExp(
  String.raw`^https:\/\/${HOST}${PORT}(?:\/[A-Za-z0-9._~-]+)*$`
);
const CSP_ORIGIN = new RegExp(
  String.raw`^(?:https|wss):\/\/(?:\*\.)?${HOST}${PORT}$`
);

const scriptUrl = z
  .string()
  .trim()
  .regex(HTTPS_SCRIPT_URL, "Use an https:// URL to a .js file");

const databuddySchema = z.strictObject({
  clientId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{8,64}$/, "Copy the Client ID from Databuddy"),
  trackWebVitals: z.boolean().default(false),
  trackErrors: z.boolean().default(false),
});

const plausibleSchema = z.strictObject({
  /** The site's domain as added in Plausible, e.g. `acme.com`. */
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HOSTNAME, "Use the domain as added in Plausible, e.g. acme.com"),
  /** Self-hosted Plausible, a proxy, or a script extension (`script.outbound-links.js`). */
  scriptUrl: scriptUrl.optional(),
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

const gtmSchema = z.strictObject({
  tagId: z
    .string()
    .trim()
    .regex(/^GTM-[A-Z0-9]{4,12}$/, "Use the container ID (GTM-…)"),
});

const umamiSchema = z.strictObject({
  websiteId: z
    .string()
    .trim()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Use the website ID from Umami"
    ),
  /** Self-hosted Umami; defaults to Umami Cloud. */
  scriptUrl: scriptUrl.optional(),
});

const fathomSchema = z.strictObject({
  siteId: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{4,16}$/, "Use the site ID from Fathom"),
});

/** Analytics presets; unknown keys are rejected so a typo never silently disables tracking. */
export const siteIntegrationsSchema = z
  .strictObject({
    databuddy: databuddySchema.optional(),
    plausible: plausibleSchema.optional(),
    posthog: posthogSchema.optional(),
    ga4: ga4Schema.optional(),
    gtm: gtmSchema.optional(),
    umami: umamiSchema.optional(),
    fathom: fathomSchema.optional(),
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
