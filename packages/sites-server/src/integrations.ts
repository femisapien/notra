import { SITE_CONFIG_FILENAME } from "@notra/sites-core/constants/sites";
import { siteIntegrationsSchema } from "@notra/sites-core/schemas/site-integrations";

import {
  discardSiteDraft,
  listSiteDrafts,
  readSiteSourceFile,
  saveSiteDraft,
} from "./editor";
import { SiteInputError } from "./sites";
import type {
  SaveSiteIntegrationsInput,
  SiteIntegrationsState,
} from "./types/integrations";
import type { Site } from "./types/sites";

/**
 * Integrations live in the repository's notra.json like every other setting.
 * The Integrations tab edits that file's `integrations` block as an editor
 * draft, so a change goes live through the same publish (commit or pull
 * request) as any other edit, and the repository stays the source of truth.
 */

async function currentConfig(site: Site) {
  const [file, drafts] = await Promise.all([
    readSiteSourceFile(site, SITE_CONFIG_FILENAME),
    listSiteDrafts(site.id),
  ]);
  const draft = drafts.find((entry) => entry.path === SITE_CONFIG_FILENAME);
  const content = draft && !draft.deleted ? draft.content : file?.content;
  return { file, draft, content };
}

function parseConfig(content: string | undefined): Record<string, unknown> {
  if (!content?.trim()) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Handled below: the tab can't safely rewrite a file it can't read.
  }
  throw new SiteInputError(
    `${SITE_CONFIG_FILENAME} isn't valid JSON. Fix it in the editor first.`
  );
}

export async function readSiteIntegrations(
  site: Site
): Promise<SiteIntegrationsState> {
  const { content, draft } = await currentConfig(site);
  let integrations: Record<string, unknown> = {};
  let invalid = false;
  try {
    const value = parseConfig(content).integrations;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      integrations = value as Record<string, unknown>;
    }
  } catch {
    invalid = true;
  }
  return { integrations, hasDraft: Boolean(draft), invalid };
}

/**
 * Replaces one provider's settings (or removes them with `settings: null`)
 * and keeps everything else in notra.json as it is. Saving the published
 * version back drops the draft instead of leaving an empty change behind.
 */
export async function saveSiteIntegration(
  site: Site,
  input: SaveSiteIntegrationsInput
): Promise<SiteIntegrationsState> {
  const { file, draft, content } = await currentConfig(site);
  const config = parseConfig(content);
  const current =
    config.integrations &&
    typeof config.integrations === "object" &&
    !Array.isArray(config.integrations)
      ? { ...(config.integrations as Record<string, unknown>) }
      : {};
  if (input.settings) {
    current[input.provider] = input.settings;
  } else {
    delete current[input.provider];
  }
  const parsed = siteIntegrationsSchema.safeParse(current);
  if (!parsed.success) {
    throw new SiteInputError(
      parsed.error.issues[0]?.message ?? "Check the integration settings"
    );
  }
  if (Object.keys(current).length > 0) {
    config.integrations = current;
  } else {
    delete config.integrations;
  }
  const next = `${JSON.stringify(config, null, 2)}\n`;
  if (file && next === file.content) {
    await discardSiteDraft(site.id, SITE_CONFIG_FILENAME);
    return { integrations: current, hasDraft: false, invalid: false };
  }
  await saveSiteDraft(site, {
    path: SITE_CONFIG_FILENAME,
    content: next,
    baseBlobSha: draft ? draft.baseBlobSha : (file?.sha ?? null),
    baseCommitSha: draft?.baseCommitSha ?? null,
    userId: input.userId,
  });
  return { integrations: current, hasDraft: true, invalid: false };
}
