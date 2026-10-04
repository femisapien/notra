import { SITE_ASSETS_DIR } from "@notra/sites-core/constants/sites";
import type { SiteConfig } from "@notra/sites-core/types/site-config";
import type { SiteHeadScript } from "@notra/sites-core/types/site-integrations";
import { integrationHeadScripts } from "@notra/sites-core/utils/integrations";
import { joinMountPath } from "@notra/sites-core/utils/mounts";

/**
 * Everything the theme renders as `<script>` in `<head>` for one area:
 * analytics integrations first, then the customer's own scripts with `defer`
 * so they run in order once the page is parsed.
 */
export function siteHeadScripts(
  config: SiteConfig,
  mount: string,
  customScripts: readonly string[]
): SiteHeadScript[] {
  return [
    ...integrationHeadScripts(config.integrations),
    ...customScripts.map((fileName): SiteHeadScript => ({
      kind: "external",
      src: joinMountPath(mount, `${SITE_ASSETS_DIR}/${fileName}`),
      attributes: { defer: true },
    })),
  ];
}
