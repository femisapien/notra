import { siteIntegrationsSchema } from "@notra/sites-core/schemas/site-integrations";

import type {
  SiteIntegrationProvider,
  SiteIntegrationValues,
} from "@/types/site-integrations";

/** The provider's block from notra.json, or null when it isn't set up. */
export function siteIntegrationSettings(
  integrations: Record<string, unknown> | undefined,
  provider: SiteIntegrationProvider
): Record<string, unknown> | null {
  const value = integrations?.[provider.id];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Form values for a provider: its saved settings, blanks for the rest. */
export function siteIntegrationFormValues(
  provider: SiteIntegrationProvider,
  settings: Record<string, unknown> | null
): SiteIntegrationValues {
  const values: SiteIntegrationValues = {};
  for (const field of provider.fields) {
    const value = settings?.[field.key];
    if (field.kind === "switch") {
      values[field.key] = value === true;
    } else if (typeof value === "string") {
      values[field.key] = value;
    } else if (typeof value === "number") {
      // Hand-written notra.json may hold numeric ids (Hotjar).
      values[field.key] = String(value);
    } else {
      values[field.key] = field.options?.[0] ?? "";
    }
  }
  return values;
}

/**
 * What goes into notra.json: trimmed text, blank optional fields,
 * switched-off options and default selections left out so the file only
 * holds what was chosen.
 */
export function siteIntegrationSettingsFromValues(
  provider: SiteIntegrationProvider,
  values: SiteIntegrationValues
): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  for (const field of provider.fields) {
    const value = values[field.key];
    if (field.kind === "switch") {
      if (value === true) {
        settings[field.key] = true;
      }
    } else if (field.kind === "select") {
      if (typeof value === "string" && value !== field.options?.[0]) {
        settings[field.key] = value;
      }
    } else if (typeof value === "string" && value.trim()) {
      settings[field.key] = value.trim();
    }
  }
  return settings;
}

/** Per-field messages from the same schema the build uses; empty when valid. */
export function siteIntegrationFieldErrors(
  provider: SiteIntegrationProvider,
  settings: Record<string, unknown>
): Record<string, string> {
  const result = siteIntegrationsSchema.safeParse({ [provider.id]: settings });
  const errors: Record<string, string> = {};
  if (result.success) {
    return errors;
  }
  for (const issue of result.error.issues) {
    const key = issue.path[1];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
