import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  DashboardSquare01Icon,
  DashedLineCircleIcon,
  FileEditIcon,
  AnalyticsUpIcon,
  GitPullRequestIcon,
  Globe02Icon,
  Loading03Icon,
  MinusSignCircleIcon,
  RefreshIcon,
  Rocket01Icon,
  Settings01Icon,
  Upload04Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

import type {
  SiteDeploymentFilters,
  SiteDeploymentKind,
  SiteDeploymentStatus,
  SiteDeploymentStepKey,
  SiteDeploymentStepState,
  SiteDeploymentTrigger,
  SiteDomainChipStatus,
  SiteSectionConfig,
} from "@/types/sites";

export const SITES_NAV_LINK = "/sites";

/** Polling while a build is queued or running, so status changes show up quickly. */
export const SITE_ACTIVE_POLL_INTERVAL_MS = 2000;
export const SITE_IDLE_POLL_INTERVAL_MS = 15_000;

export const SITE_DEPLOYMENT_IN_PROGRESS_STATUSES: ReadonlySet<SiteDeploymentStatus> =
  new Set(["queued", "building", "uploading"]);

export const SITE_DETAIL_TABS = [
  "overview",
  "deployments",
  "previews",
  "domains",
  "editor",
  "integrations",
  "settings",
] as const;

/** A site's pages, in sidebar order; each is its own route below /sites/[siteId]. */
export const SITE_SECTIONS: readonly SiteSectionConfig[] = [
  { section: "overview", path: "", icon: DashboardSquare01Icon },
  { section: "deployments", path: "/deployments", icon: Rocket01Icon },
  { section: "previews", path: "/previews", icon: ViewIcon },
  { section: "domains", path: "/domains", icon: Globe02Icon },
  { section: "editor", path: "/editor", icon: FileEditIcon },
  { section: "integrations", path: "/integrations", icon: AnalyticsUpIcon },
  { section: "settings", path: "/settings", icon: Settings01Icon },
];

export const SITE_RECENT_DEPLOYMENTS_LIMIT = 5;
export const SITE_OVERVIEW_PREVIEWS_LIMIT = 5;
/** Content-sized site tables: this only sizes the empty state, which holds an icon, copy and a button. */
export const SITE_TABLE_EMPTY_HEIGHT = 340;
export const SITE_TABLE_COMPACT_EMPTY_HEIGHT = 300;
export const SITE_LIST_TABLE_ROW_HEIGHT = 60;
/** Property lists (deployment details) use the compact house row. */
export const SITE_PROPERTY_ROW_HEIGHT = 36;
export const SITE_SHORT_SHA_LENGTH = 7;
export const SITE_SHARE_LINK_DAYS = 7;

export const SITE_DEFAULT_BLOG_PATH = "/blog";
export const SITE_DEFAULT_CHANGELOG_PATH = "/changelog";

/** Autosave delay after the last keystroke in the editor. */
export const SITE_EDITOR_AUTOSAVE_MS = 1200;
export const SITE_CONFIG_FILENAME = "notra.json";
export const SITE_NEW_FILE_FOLDERS = ["blog", "changelog"] as const;
export const SITE_NEW_FILE_EXTENSION = ".mdx";
export const SITE_NEW_FILE_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** Only text sources are editable in the dashboard; images and fonts stay in the repo. */
export const SITE_EDITABLE_FILE_PATTERN = /\.(?:mdx?|jsx?|json|css)$/i;

export const SITE_PROXY_RECIPES = [
  "vercel",
  "next",
  "netlify",
  "tanstack",
  "cloudflare",
  "nginx",
] as const;

/** Domain Connect discovery hits DNS and the provider; the answer rarely changes while the page is open. */
export const SITE_DOMAIN_CONNECT_STALE_MS = 10 * 60 * 1000;
/** Query parameter the Domain Connect callback appends when it sends the browser back. */
export const SITE_DOMAIN_CONNECT_PARAM = "domainConnect";
export const SITE_DOMAIN_CONNECT_OUTCOMES = [
  "success",
  "cancelled",
  "error",
] as const;
/** How long a copy button shows "Copied". */
export const SITE_COPY_FEEDBACK_MS = 1500;

/** Status dot per domain state; `pending` reads differently for DNS and proxy domains. */
export const SITE_DOMAIN_STATUS_DOTS: Record<SiteDomainChipStatus, string> = {
  active: "bg-success",
  dnsRequired: "bg-warning",
  proxyRequired: "bg-warning",
  verifying: "bg-warning motion-safe:animate-pulse",
  failed: "bg-destructive",
};

/** What started a deployment, as the icon next to who started it. */
export const SITE_TRIGGER_ICONS: Record<SiteDeploymentTrigger, IconSvgElement> =
  {
    push: Upload04Icon,
    pull_request: GitPullRequestIcon,
    manual: Rocket01Icon,
    redeploy: RefreshIcon,
    config: Settings01Icon,
  };

/** One status language everywhere: building amber, ready green, failed red, the rest grey. */
export const SITE_STATUS_DOT_STYLES: Record<SiteDeploymentStatus, string> = {
  queued: "bg-muted-foreground/50",
  building: "bg-warning motion-safe:animate-pulse",
  uploading: "bg-warning motion-safe:animate-pulse",
  ready: "bg-success",
  failed: "bg-destructive",
  superseded: "bg-muted-foreground/40",
  canceled: "bg-muted-foreground/40",
  expired: "bg-muted-foreground/40",
};

/** Same row height as the feedback table: a title line and a detail line. */
export const SITE_DEPLOYMENT_ROW_HEIGHT = 48;

/** Environment pills, tinted like the feedback kind pills. */
export const SITE_ENVIRONMENT_PILL_CLASS =
  "inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border px-2 text-xs font-medium";

export const SITE_ENVIRONMENT_PILL_TONE: Record<SiteDeploymentKind, string> = {
  production: "border-success/25 bg-success/10 text-foreground",
  preview: "border-info/25 bg-info/10 text-foreground",
};

export const SITE_ENVIRONMENT_ICONS: Record<
  SiteDeploymentKind,
  IconSvgElement
> = {
  production: Rocket01Icon,
  preview: GitPullRequestIcon,
};

/** Branches and folders change rarely while a form is open. */
export const SITE_REPOSITORY_SUGGESTIONS_STALE_MS = 60_000;

/** Enough history for the deployments page; the API caps the list at 100. */
export const SITE_DEPLOYMENTS_PAGE_LIMIT = 100;

export const SITE_DEPLOYMENT_ENVIRONMENT_FILTERS = [
  "all",
  "production",
  "preview",
] as const;

export const SITE_DEPLOYMENT_STATUS_FILTERS = [
  "all",
  "ready",
  "building",
  "queued",
  "failed",
  "canceled",
  "superseded",
  "expired",
] as const;

/** Distance from the bottom (px) within which the build log keeps following new output. */
export const SITE_BUILD_LOG_FOLLOW_THRESHOLD = 32;

/** Owner and admin may change a site's settings, domains and lifecycle. */
export const SITE_ADMIN_ROLES: ReadonlySet<string> = new Set([
  "owner",
  "admin",
]);

/** GitHub App events only Sites consumes; `pull_request` goes to both Sites and mentions. */
export const SITES_ONLY_GITHUB_EVENTS: ReadonlySet<string> = new Set([
  "push",
  "check_run",
]);

/** Preview keys the preview-access route accepts: `pr-…` for pull requests, `br-…` for branches. */
export const SITE_PREVIEW_KEY_PATTERN = /^(?:pr|br)-[a-z0-9-]{1,40}$/;

/** Rows in the sites list skeleton. */
export const SITES_PAGE_SKELETON_ROWS = 3;

/** Rendered width of the page inside the preview thumbnail; the frame scales it down to fit. */
export const SITE_PREVIEW_VIEWPORT_WIDTH = 1280;
export const SITE_PREVIEW_VIEWPORT_HEIGHT = 800;

export const SITE_OVERVIEW_LINK_CLASS =
  "text-foreground decoration-foreground/25 hover:decoration-foreground min-w-0 truncate underline underline-offset-4 transition-colors duration-150";

/** Grid shared by every build log row so offsets, markers and text line up. */
export const SITE_BUILD_LOG_ROW_GRID =
  "grid grid-cols-[2rem_0.875rem_minmax(0,1fr)] gap-x-2 px-2 sm:grid-cols-[2.5rem_0.875rem_minmax(0,1fr)] sm:gap-x-2.5 sm:px-3";

/** Code frames shorter than this stay inline. */
export const SITE_BUILD_LOG_FRAME_FOLD_MIN = 3;
/** Noise runs longer than this keep their first lines and fold the rest. */
export const SITE_BUILD_LOG_NOISE_FOLD_MIN = 6;
export const SITE_BUILD_LOG_NOISE_KEEP = 2;

export const SITE_DEPLOYMENT_STEP_KEYS: readonly SiteDeploymentStepKey[] = [
  "queued",
  "building",
  "uploading",
  "ready",
];

export const SITE_DEPLOYMENT_STEP_ICONS: Record<
  SiteDeploymentStepState,
  IconSvgElement
> = {
  pending: DashedLineCircleIcon,
  active: Loading03Icon,
  done: CheckmarkCircle02Icon,
  failed: CancelCircleIcon,
  skipped: MinusSignCircleIcon,
};

/** Status color lives on the icon only: amber running, green done, red failed. */
export const SITE_DEPLOYMENT_STEP_ICON_STYLES: Record<
  SiteDeploymentStepState,
  string
> = {
  pending: "text-muted-foreground/50",
  active: "text-warning motion-safe:animate-spin",
  done: "text-success",
  failed: "text-destructive",
  skipped: "text-muted-foreground/50",
};

export const SITE_DEPLOYMENT_STEP_PANEL_CLASS =
  "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none";

export const SITE_DEPLOYMENT_NO_FILTERS: SiteDeploymentFilters = {
  environment: "all",
  status: "all",
};

export const SITE_DOMAIN_URL_SCHEME_PATTERN = /^https?:\/\//i;

export const SITE_CLOUDFLARE_PROVIDER_PATTERN = /cloudflare/i;
export const SITE_VERCEL_PROVIDER_PATTERN = /vercel/i;

/** Sites cleaned up in parallel by the daily cleanup cron. */
export const SITES_CLEANUP_CONCURRENCY = 4;
