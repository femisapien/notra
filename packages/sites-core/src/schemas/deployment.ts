import { SITE_CSP_MAX_LENGTH } from "@notra/sites-core/constants/security";
import {
  SITE_AREAS,
  SITE_PREVIEW_PASSWORD_ALGORITHM,
  SITE_PREVIEW_VISIBILITIES,
  SITE_STATUSES,
} from "@notra/sites-core/constants/sites";
import { z } from "zod";

export const siteAreaSchema = z.enum(SITE_AREAS);

/** Normalized mount per area, e.g. `{ blog: "/blog", changelog: "/changelog" }`. */
export const siteMountsSchema = z
  .object({
    blog: z.string().optional(),
    changelog: z.string().optional(),
  })
  .refine((mounts) => Boolean(mounts.blog ?? mounts.changelog), {
    message: "At least one area needs a mount",
  });

/** The build inputs that decide URLs. Equal hashes mean a deployment can be rolled back to. */
export const siteBuildTargetSchema = z.object({
  publicOrigin: z.url(),
  mounts: siteMountsSchema,
  /** Previews and direct alias visits must never be indexed. */
  noindex: z.boolean(),
  /** "Powered by Notra" badge. Deployments from before the setting had it on. */
  branding: z.boolean().default(true),
});

export const siteManifestFileSchema = z.object({
  /** Absolute URL path, e.g. `/blog/hello/index.html`. */
  path: z.string().startsWith("/"),
  size: z.number().int().nonnegative(),
  sha256: z.string().length(64),
  contentType: z.string(),
});

export const siteRedirectRuleSchema = z.object({
  source: z.string().startsWith("/"),
  destination: z.string(),
  status: z.union([
    z.literal(301),
    z.literal(302),
    z.literal(307),
    z.literal(308),
  ]),
});

/** A whole Content-Security-Policy header value: printable ASCII only, so it can never split the header. */
export const siteContentSecurityPolicySchema = z
  .string()
  .min(1)
  .max(SITE_CSP_MAX_LENGTH)
  .regex(/^[\u0020-\u007E]+$/);

export const siteManifestSchema = z.object({
  version: z.literal(1),
  siteId: z.string(),
  deploymentId: z.string(),
  commitSha: z.string(),
  toolchainVersion: z.string(),
  target: siteBuildTargetSchema,
  configHash: z.string(),
  createdAt: z.string(),
  totalBytes: z.number().int().nonnegative(),
  files: z.array(siteManifestFileSchema),
  redirects: z.array(siteRedirectRuleSchema),
  /** Sent with every HTML page of the deployment. Absent on older deployments and when the site turned it off. */
  contentSecurityPolicy: siteContentSecurityPolicySchema.optional(),
});

export const siteServingPointerSchema = z.object({
  deploymentId: z.string(),
  /** Production ordering: a pointer only moves to a higher generation. */
  generation: z.number().int().nonnegative(),
  activatedAt: z.string(),
});

export const sitePreviewPointerSchema = z.object({
  deploymentId: z.string(),
  visibility: z.enum(SITE_PREVIEW_VISIBILITIES),
  sequence: z.number().int().nonnegative(),
  activatedAt: z.string(),
  expiresAt: z.string().nullable(),
});

/**
 * Salted PBKDF2 hash of the preview password; the plain password is never stored.
 * `version` changes on every set, so sessions from an older password stop working.
 */
export const sitePreviewPasswordSchema = z.object({
  algorithm: z.literal(SITE_PREVIEW_PASSWORD_ALGORITHM),
  iterations: z.number().int().positive(),
  /** base64url */
  salt: z.string().min(1),
  /** base64url */
  hash: z.string().min(1),
  version: z.string().min(1),
  updatedAt: z.string(),
});

/** `sites/{siteId}/state.json`, the only object the worker trusts for what to serve. */
export const siteServingStateSchema = z.object({
  version: z.literal(1),
  siteId: z.string(),
  slug: z.string(),
  status: z.enum(SITE_STATUSES),
  production: siteServingPointerSchema.nullable(),
  previews: z.record(z.string(), sitePreviewPointerSchema),
  /** previewKey → generation of its removal. Builds older than that can never bring the preview back. */
  removedPreviews: z
    .record(z.string(), z.number().int().nonnegative())
    .default({}),
  /** Lets visitors into protected previews with a password, next to Notra login. */
  previewPassword: sitePreviewPasswordSchema.nullable().default(null),
  /** Signed token the worker reports AI traffic with. Null when tracking is unavailable. */
  trafficToken: z.string().nullable().default(null),
  /**
   * userId → when their preview sessions (sign-out, access lost) and share
   * links (access lost) were revoked, in ms. Tokens issued at or before that
   * stop working. Entries are pruned once every token they cover has expired.
   */
  revokedSessions: z
    .record(
      z.string(),
      z.object({
        sessions: z.number().int().nonnegative().optional(),
        shareLinks: z.number().int().nonnegative().optional(),
      })
    )
    .default({}),
  updatedAt: z.string(),
});

export const siteHostRecordSchema = z.object({
  version: z.literal(1),
  siteId: z.string(),
  kind: z.enum(["alias", "custom"]),
});
