import {
  SITE_CHROME_FILES,
  SITE_SLOT_NAMES,
  SITE_SLOTS_DIR,
} from "@notra/sites-core/constants/site-layout";
import { SITE_CONFIG_FILENAME } from "@notra/sites-core/constants/sites";
import { siteConfigSchema } from "@notra/sites-core/schemas/site-config";
import {
  siteBlogSchema,
  siteChangelogSchema,
} from "@notra/sites-core/schemas/site-layout";
import type { SiteDiagnostic } from "@notra/sites-core/types/build";
import type { SiteConfig } from "@notra/sites-core/types/site-config";
import { isCustomScriptPath } from "@notra/sites-core/utils/custom-scripts";
import { Parser } from "acorn";

import {
  ENTRY_FILE,
  ENTRY_SLUG,
  MDX_FILE,
  SCRIPT_FILE,
  TEXT_SOURCE_FILE,
} from "./constants/validate";
import { parseEntryFrontmatter } from "./frontmatter";
import { analyzeJsxSnippet } from "./jsx";
import { analyzeMdxFile } from "./mdx";
import type { SiteEntry } from "./types/entries";
import type { MdxAnalysis } from "./types/mdx";
import type {
  EntryCandidate,
  ParsedSiteConfig,
  SiteValidationInput,
  SiteValidationResult,
  SubstitutedSources,
} from "./types/validate";
import {
  featuredSlugWarnings,
  unknownConfigKeyWarnings,
} from "./utils/config-checks";
import { hasErrors } from "./utils/diagnostics";
import { acornSyntaxError } from "./utils/errors";
import { importCycleDiagnostics } from "./utils/import-cycles";
import { blockedMarkdownHtml } from "./utils/markdown-html";
import { offsetToLineColumn } from "./utils/paths";
import { substituteSettingText, substituteVariables } from "./utils/variables";

export function isTextSourceFile(path: string): boolean {
  return TEXT_SOURCE_FILE.test(path);
}

function entryCandidate(path: string): EntryCandidate | null {
  const match = ENTRY_FILE.exec(path);
  if (!match) {
    return null;
  }
  const [, area, rest, format] = match;
  if (!(area && rest && format)) {
    return null;
  }
  if (rest.split("/").some((segment) => segment.startsWith("_"))) {
    return null;
  }
  const slug = rest.endsWith("/index") ? rest.slice(0, -"/index".length) : rest;
  return {
    area: area as SiteEntry["area"],
    slug,
    format: format as SiteEntry["format"],
  };
}

/** Files whose body gets notra.json `variables`: entries, the chrome and slots. */
function takesVariables(path: string): boolean {
  return (
    entryCandidate(path) !== null ||
    (SITE_CHROME_FILES as readonly string[]).includes(path) ||
    (path.startsWith(`${SITE_SLOTS_DIR}/`) && MDX_FILE.test(path))
  );
}

/**
 * `slots/` holds exactly one MDX file per place the theme renders; anything
 * else there is a typo the customer would otherwise never notice.
 */
function validateSlotFile(path: string): SiteDiagnostic[] {
  if (!path.startsWith(`${SITE_SLOTS_DIR}/`)) {
    return [];
  }
  const name = path.slice(SITE_SLOTS_DIR.length + 1);
  const slotName = name.replace(/\.mdx$/, "");
  if (
    name.endsWith(".mdx") &&
    (SITE_SLOT_NAMES as readonly string[]).includes(slotName)
  ) {
    return [];
  }
  return [
    {
      severity: "error",
      file: path,
      code: "slot_unknown",
      message: `Unknown slot "${name}". Files in ${SITE_SLOTS_DIR}/ must be one of: ${SITE_SLOT_NAMES.map((slot) => `${slot}.mdx`).join(", ")}`,
    },
  ];
}

/** Text settings that may use `{{ name }}`, by path in notra.json. */
function substituteSettingVariables(config: SiteConfig): {
  config: SiteConfig;
  diagnostics: SiteDiagnostic[];
} {
  const diagnostics: SiteDiagnostic[] = [];
  const fill = (text: string | undefined, setting: string) => {
    if (text === undefined || !text.includes("{{")) {
      return text;
    }
    const result = substituteSettingText(text, config.variables);
    for (const name of result.unknown) {
      diagnostics.push({
        severity: "warning",
        file: SITE_CONFIG_FILENAME,
        code: "variable_unknown",
        message: `${setting}: unknown variable {{ ${name} }}. Add "${name}" to variables. It is shown as written.`,
      });
    }
    return result.text;
  };
  return {
    config: {
      ...config,
      description: fill(config.description, "description"),
      banner: config.banner
        ? {
            ...config.banner,
            content:
              fill(config.banner.content, "banner.content") ??
              config.banner.content,
          }
        : undefined,
      blog: config.blog
        ? {
            ...config.blog,
            title: fill(config.blog.title, "blog.title"),
            description: fill(config.blog.description, "blog.description"),
          }
        : undefined,
      changelog: config.changelog
        ? {
            ...config.changelog,
            title: fill(config.changelog.title, "changelog.title"),
            description: fill(
              config.changelog.description,
              "changelog.description"
            ),
          }
        : undefined,
    },
    diagnostics,
  };
}

function configError(code: string, message: string): SiteDiagnostic {
  return { severity: "error", file: SITE_CONFIG_FILENAME, code, message };
}

/**
 * Parses notra.json. Absent areas get their defaults here, once, so the theme
 * (which runs in the build sandbox without the schema package) never parses.
 */
function parseSiteConfig(raw: string | null | undefined): ParsedSiteConfig {
  if (raw === undefined || raw === null) {
    return {
      config: null,
      diagnostics: [
        configError(
          "config_missing",
          `Add a ${SITE_CONFIG_FILENAME} at the site root, e.g. { "name": "Acme" }`
        ),
      ],
    };
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    return {
      config: null,
      diagnostics: [
        configError(
          "config_json",
          `${SITE_CONFIG_FILENAME} is not valid JSON: ${(error as Error).message}`
        ),
      ],
    };
  }
  const diagnostics = unknownConfigKeyWarnings(json);
  const parsed = siteConfigSchema.safeParse(json);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      diagnostics.push(
        configError(
          "config_invalid",
          `${issue.path.join(".") || "config"}: ${issue.message}`
        )
      );
    }
    return { config: null, diagnostics };
  }
  const settings = substituteSettingVariables(parsed.data);
  diagnostics.push(...settings.diagnostics);
  return {
    config: {
      ...settings.config,
      blog: settings.config.blog ?? siteBlogSchema.parse({}),
      changelog: settings.config.changelog ?? siteChangelogSchema.parse({}),
    },
    diagnostics,
  };
}

/** Replaces `{{ name }}` in every file that takes variables; unknown names become warnings. */
function applyVariables(
  files: ReadonlyMap<string, string | null>,
  variables: Readonly<Record<string, string>>
): SubstitutedSources {
  const sources = new Map(files);
  const diagnostics: SiteDiagnostic[] = [];
  for (const [path, content] of files) {
    if (content === null || !takesVariables(path) || !content.includes("{{")) {
      continue;
    }
    const substitution = substituteVariables(content, variables);
    sources.set(path, substitution.text);
    for (const unknown of substitution.unknown) {
      diagnostics.push({
        severity: "warning",
        file: path,
        ...offsetToLineColumn(content, unknown.offset),
        code: "variable_unknown",
        message: `Unknown variable {{ ${unknown.name} }}: add "${unknown.name}" to variables in ${SITE_CONFIG_FILENAME}. It is shown as written.`,
      });
    }
  }
  return { sources, diagnostics };
}

/**
 * `script.js` / `scripts/*.js` run in the browser as classic deferred scripts.
 * Only parsed here, so a syntax error shows up in the build instead of the console.
 */
function validateCustomScript(path: string, source: string): SiteDiagnostic[] {
  try {
    Parser.parse(source, { ecmaVersion: "latest", sourceType: "script" });
    return [];
  } catch (error) {
    const syntax = acornSyntaxError(error);
    return [
      {
        severity: "error",
        file: path,
        ...offsetToLineColumn(source, syntax.offset),
        code: "script_syntax",
        message: `Syntax error: ${syntax.message}. Custom scripts are plain browser JavaScript, not modules.`,
      },
    ];
  }
}

/**
 * Validates a whole site without executing any of its code and produces the
 * transformed sources the Astro build consumes. Safe to run in the control
 * plane (dashboard editor, webhook pre-check) and inside the build sandbox.
 */
export function validateSite(input: SiteValidationInput): SiteValidationResult {
  const outputs = new Map<string, string>();
  // Custom scripts are page-level JavaScript, not snippets: MDX cannot import them.
  const paths = new Set(
    [...input.files.keys()].filter((path) => !isCustomScriptPath(path))
  );

  const { config, diagnostics } = parseSiteConfig(
    input.files.get(SITE_CONFIG_FILENAME)
  );

  // Without a valid config there are no variables; leave `{{ }}` alone instead of warning about each.
  const { sources, diagnostics: variableDiagnostics } = config
    ? applyVariables(input.files, config.variables)
    : { sources: new Map(input.files), diagnostics: [] };
  diagnostics.push(...variableDiagnostics);
  for (const path of input.files.keys()) {
    diagnostics.push(...validateSlotFile(path));
  }

  const componentExports = new Map<string, readonly string[]>();
  for (const [path, content] of input.files) {
    if (!SCRIPT_FILE.test(path) || content === null) {
      continue;
    }
    if (isCustomScriptPath(path)) {
      diagnostics.push(...validateCustomScript(path, content));
      continue;
    }
    const analysis = analyzeJsxSnippet(path, content);
    diagnostics.push(...analysis.diagnostics);
    componentExports.set(path, analysis.exportedNames);
    if (analysis.output !== null) {
      outputs.set(path, analysis.output);
    }
  }

  const mdxPaths = [...input.files.keys()].filter((path) =>
    MDX_FILE.test(path)
  );
  const analyses = new Map<string, MdxAnalysis>();
  // Header, footer and slots are not entries: like snippets, `{post.title}` reads the
  // props the theme renders them with (`post`, `entry`, `site`, `area`).
  const analyze = (path: string, isEntry: boolean) => {
    analyses.set(
      path,
      analyzeMdxFile(path, sources.get(path) ?? "", {
        files: paths,
        componentExports,
        isEntry,
      })
    );
  };
  for (const path of mdxPaths) {
    analyze(path, entryCandidate(path) !== null);
  }

  // A file another file imports is a snippet, even when it sits in blog/.
  const importedPaths = new Set(
    [...analyses.values()].flatMap((analysis) => analysis.imports)
  );
  for (const path of mdxPaths) {
    if (importedPaths.has(path) && entryCandidate(path) !== null) {
      analyze(path, false);
    }
  }

  diagnostics.push(
    ...importCycleDiagnostics(
      mdxPaths,
      (path) => analyses.get(path)?.imports ?? []
    )
  );

  for (const [path, analysis] of analyses) {
    diagnostics.push(...analysis.diagnostics);
    if (analysis.output !== null) {
      outputs.set(path, analysis.output);
    }
    if (analysis.inlineModule) {
      outputs.set(analysis.inlineModule.path, analysis.inlineModule.source);
    }
  }

  const entries: SiteEntry[] = [];
  const seenSlugs = new Map<string, string>();
  // The dashboard validates drafts without downloading unchanged posts (content null).
  let unreadEntries = 0;
  for (const [path, content] of input.files) {
    const candidate = entryCandidate(path);
    if (!candidate || importedPaths.has(path)) {
      continue;
    }
    if (content === null) {
      unreadEntries += 1;
      continue;
    }
    if (!ENTRY_SLUG.test(candidate.slug)) {
      diagnostics.push({
        severity: "error",
        file: path,
        code: "slug_invalid",
        message: `The URL "${candidate.slug}" comes from the file name; use lowercase letters, digits and dashes`,
      });
      continue;
    }
    const key = `${candidate.area}:${candidate.slug}`;
    const existing = seenSlugs.get(key);
    if (existing) {
      diagnostics.push({
        severity: "error",
        file: path,
        code: "slug_duplicate",
        message: `Same URL as ${existing}`,
      });
      continue;
    }
    seenSlugs.set(key, path);
    diagnostics.push(
      ...parseEntryFrontmatter(path, candidate.area, content).diagnostics
    );
    if (candidate.format === "md") {
      diagnostics.push(...blockedMarkdownHtml(path, content));
      // Plain Markdown is not transformed, but still gets its variables.
      const substituted = sources.get(path);
      if (typeof substituted === "string" && substituted !== content) {
        outputs.set(path, substituted);
      }
    }
    entries.push({
      area: candidate.area,
      slug: candidate.slug,
      path,
      format: candidate.format,
    });
  }

  if (config) {
    if (entries.length === 0 && unreadEntries === 0) {
      diagnostics.push({
        severity: "warning",
        file: null,
        code: "no_entries",
        message: "No posts yet. Add .mdx files to blog/ or changelog/.",
      });
    }
    diagnostics.push(...featuredSlugWarnings(config, entries));
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return {
    diagnostics,
    config,
    entries,
    outputs,
    ok: !hasErrors(diagnostics),
  };
}
