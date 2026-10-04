"use client";

import { File02Icon, Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";

import { SITE_REPOSITORY_LAYOUT } from "@/constants/sites";

/** The files and folders a site's repository is expected to have. */
export function SiteRepositoryLayout() {
  const tLayout = useTranslations("sites.layout");
  return (
    <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:pt-1.5">
      {SITE_REPOSITORY_LAYOUT.map((entry) => (
        <li className="flex min-w-0 items-start gap-2.5" key={entry.key}>
          <HugeiconsIcon
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 shrink-0"
            icon={entry.path.includes("/") ? Folder01Icon : File02Icon}
            size={15}
          />
          <span className="min-w-0">
            <span className="block font-mono text-xs">{entry.path}</span>
            <span className="text-muted-foreground block text-xs">
              {tLayout(entry.key)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
