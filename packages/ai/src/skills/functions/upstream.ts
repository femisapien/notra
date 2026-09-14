import { db } from "@notra/db/drizzle";
import { skills, systemSkillVersions } from "@notra/db/schema";
import { aliasedTable, and, eq } from "drizzle-orm";

import {
  SkillDuplicateError,
  SkillNotFoundError,
  SkillNotSystemError,
  SkillUpgradeInputError,
  SystemSkillVersionMissingError,
} from "../errors";
import {
  findClosestSystemSkillVersion,
  getLatestSystemSkill,
  getOldestSystemSkill,
  getSystemSkillVersionById,
  listLatestSystemSkills,
  listOldestSystemSkills,
} from "../registry";
import type {
  DeriveSkillUpstreamStatusInput,
  SkillLookup,
  SkillRegistryDatabase,
  SkillUpstreamBase,
  SkillUpstreamContext,
  SkillUpstreamDetail,
  SkillUpstreamStatus,
  SystemSkillVersion,
  UpdateSkillContentInput,
  UpdateSkillContentResult,
  UpgradeSkillInput,
  UpgradeSkillResult,
} from "../types";

const baseVersions = aliasedTable(systemSkillVersions, "base_version");

interface JoinedBaseColumns {
  baseVersion: number | null;
  baseDescription: string | null;
  baseContent: string | null;
}

function resolveDatabase(ctx: SkillUpstreamContext): SkillRegistryDatabase {
  return ctx.database ?? db;
}

function skillLookupWhere(ctx: SkillUpstreamContext, lookup: SkillLookup) {
  return and(
    eq(skills.organizationId, ctx.organizationId),
    "id" in lookup ? eq(skills.id, lookup.id) : eq(skills.name, lookup.name)
  );
}

function describeSkillLookup(lookup: SkillLookup): string {
  return "id" in lookup ? lookup.id : lookup.name;
}

/**
 * The registry name an org copy follows. Its base version carries it, so a
 * renamed copy keeps receiving updates. Only a row the backfill has not pinned
 * yet falls back to its own name; renames always pin a base first.
 */
function resolveSystemName(row: {
  name: string;
  baseName: string | null;
}): string {
  return row.baseName ?? row.name;
}

/**
 * The four states of section 2 of the plan, derived rather than stored.
 *
 * `base` is the version the org copy was forked from. When an `is_system` row
 * still has `system_skill_version_id = NULL` (a backfill that has not caught up
 * yet), callers pass the LOWEST published version of that name instead, which
 * makes the copy read as `modified` and lets the user resolve it by hand.
 */
export function deriveSkillUpstreamStatus({
  skill,
  base,
  latest,
}: DeriveSkillUpstreamStatusInput): SkillUpstreamStatus {
  return {
    systemName: latest.name,
    baseVersion: base.version,
    latestVersion: latest.version,
    isModified:
      skill.content !== base.content || skill.description !== base.description,
    updateAvailable: latest.version > base.version,
    changelog: latest.changelog,
  };
}

/**
 * Base and latest version of one org copy, with full content for the diff and
 * merge UIs. `null` for custom skills, unknown skills, and system skills whose
 * registry name has never been published.
 */
export async function getSkillUpstream(
  ctx: SkillUpstreamContext,
  lookup: SkillLookup
): Promise<SkillUpstreamDetail | null> {
  const database = resolveDatabase(ctx);

  const [skill] = await database
    .select({
      name: skills.name,
      description: skills.description,
      content: skills.content,
      isSystem: skills.isSystem,
      systemSkillVersionId: skills.systemSkillVersionId,
      baseName: baseVersions.name,
    })
    .from(skills)
    .leftJoin(baseVersions, eq(skills.systemSkillVersionId, baseVersions.id))
    .where(skillLookupWhere(ctx, lookup))
    .limit(1);

  if (!skill?.isSystem) {
    return null;
  }

  const systemName = resolveSystemName(skill);
  const latest = await getLatestSystemSkill(database, systemName);
  if (!latest) {
    return null;
  }

  const base = skill.systemSkillVersionId
    ? await getSystemSkillVersionById(database, skill.systemSkillVersionId)
    : await getOldestSystemSkill(database, systemName);
  const resolvedBase = base ?? latest;

  return {
    ...deriveSkillUpstreamStatus({ skill, base: resolvedBase, latest }),
    base: resolvedBase,
    latest,
  };
}

/**
 * Upstream status of every system skill in the organization, keyed by skill
 * id so a renamed copy still finds its status. Custom skills are absent from
 * the map; callers serialize them as `upstream: null`.
 *
 * Three queries at most, never one per skill: the org rows joined to their base
 * version, the latest version per name, and — only when a row has no base yet —
 * the oldest version per name.
 */
export async function listSkillUpstreamStatuses(
  ctx: SkillUpstreamContext
): Promise<Map<string, SkillUpstreamStatus>> {
  const database = resolveDatabase(ctx);

  const [rows, latestVersions] = await Promise.all([
    database
      .select({
        id: skills.id,
        name: skills.name,
        description: skills.description,
        content: skills.content,
        systemSkillVersionId: skills.systemSkillVersionId,
        baseName: baseVersions.name,
        baseVersion: baseVersions.version,
        baseDescription: baseVersions.description,
        baseContent: baseVersions.content,
      })
      .from(skills)
      .leftJoin(baseVersions, eq(skills.systemSkillVersionId, baseVersions.id))
      .where(
        and(
          eq(skills.organizationId, ctx.organizationId),
          eq(skills.isSystem, true)
        )
      ),
    listLatestSystemSkills(database),
  ]);

  const latestByName = new Map(
    latestVersions.map((version) => [version.name, version])
  );
  const needsFallbackBase = rows.some((row) => row.baseVersion === null);
  const oldestByName = needsFallbackBase
    ? new Map(
        (await listOldestSystemSkills(database)).map((version) => [
          version.name,
          version,
        ])
      )
    : new Map<string, SystemSkillVersion>();

  const statuses = new Map<string, SkillUpstreamStatus>();

  for (const row of rows) {
    const systemName = resolveSystemName(row);
    const latest = latestByName.get(systemName);
    if (!latest) {
      continue;
    }

    statuses.set(
      row.id,
      deriveSkillUpstreamStatus({
        skill: row,
        base: resolveJoinedBase(row, oldestByName.get(systemName) ?? latest),
        latest,
      })
    );
  }

  return statuses;
}

/**
 * The joined base columns are nullable together: a row whose backfill has not
 * run yet falls back to the oldest published version of its name.
 */
function resolveJoinedBase(
  row: JoinedBaseColumns,
  fallback: SkillUpstreamBase
): SkillUpstreamBase {
  if (
    row.baseVersion === null ||
    row.baseDescription === null ||
    row.baseContent === null
  ) {
    return fallback;
  }

  return {
    version: row.baseVersion,
    description: row.baseDescription,
    content: row.baseContent,
  };
}

/**
 * The single write path for skill text, shared by the dashboard router, the
 * public API and the agent tool. Omitted fields keep their current value.
 *
 * System skills can be renamed: their link to the registry is the base
 * version, not the name. A copy without a base yet gets one pinned before the
 * rename, the same way the backfill would, so it never loses its upstream.
 */
export async function updateSkillContent(
  ctx: SkillUpstreamContext,
  lookup: SkillLookup,
  input: UpdateSkillContentInput
): Promise<UpdateSkillContentResult> {
  const database = resolveDatabase(ctx);

  const [existing] = await database
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      content: skills.content,
      isSystem: skills.isSystem,
      systemSkillVersionId: skills.systemSkillVersionId,
    })
    .from(skills)
    .where(skillLookupWhere(ctx, lookup))
    .limit(1);

  if (!existing) {
    throw new SkillNotFoundError(describeSkillLookup(lookup));
  }

  const nextName = input.name ?? existing.name;
  const isRename = nextName !== existing.name;

  if (isRename) {
    const [conflict] = await database
      .select({ id: skills.id })
      .from(skills)
      .where(
        and(
          eq(skills.organizationId, ctx.organizationId),
          eq(skills.name, nextName)
        )
      )
      .limit(1);

    if (conflict) {
      throw new SkillDuplicateError(nextName);
    }
  }

  const pinnedBase =
    isRename && existing.isSystem && !existing.systemSkillVersionId
      ? await findClosestSystemSkillVersion(database, existing)
      : null;

  await database
    .update(skills)
    .set({
      name: nextName,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.content === undefined ? {} : { content: input.content }),
      ...(pinnedBase ? { systemSkillVersionId: pinnedBase.id } : {}),
    })
    .where(eq(skills.id, existing.id));

  return { id: existing.id, name: nextName };
}

function buildUpgradeValues(
  name: string,
  input: UpgradeSkillInput,
  latest: SystemSkillVersion
): { content?: string; description?: string } {
  if (input.strategy === "discard") {
    return { content: latest.content, description: latest.description };
  }

  // `keep` re-bases the fork without touching the text: the user consciously
  // stays on their version and the "update available" badge disappears.
  if (input.strategy === "keep") {
    return {};
  }

  if (!input.content?.trim()) {
    throw new SkillUpgradeInputError(
      name,
      'The "merge" strategy requires the merged content'
    );
  }

  return {
    content: input.content,
    description: input.description ?? latest.description,
  };
}

/**
 * Lifts an org copy of a system skill onto the latest published version of the
 * registry name it follows. See `SKILL_UPGRADE_STRATEGIES` for what each
 * strategy does with the text; all three set the base to the latest version.
 */
export async function upgradeSkill(
  ctx: SkillUpstreamContext,
  lookup: SkillLookup,
  input: UpgradeSkillInput
): Promise<UpgradeSkillResult> {
  const database = resolveDatabase(ctx);

  const [existing] = await database
    .select({
      id: skills.id,
      name: skills.name,
      isSystem: skills.isSystem,
      baseName: baseVersions.name,
    })
    .from(skills)
    .leftJoin(baseVersions, eq(skills.systemSkillVersionId, baseVersions.id))
    .where(skillLookupWhere(ctx, lookup))
    .limit(1);

  if (!existing) {
    throw new SkillNotFoundError(describeSkillLookup(lookup));
  }

  if (!existing.isSystem) {
    throw new SkillNotSystemError(existing.name);
  }

  const latest = await getLatestSystemSkill(
    database,
    resolveSystemName(existing)
  );
  if (!latest) {
    throw new SystemSkillVersionMissingError(existing.name);
  }

  await database
    .update(skills)
    .set({
      ...buildUpgradeValues(existing.name, input, latest),
      systemSkillVersionId: latest.id,
    })
    .where(eq(skills.id, existing.id));

  return { name: existing.name, version: latest.version };
}
