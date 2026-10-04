"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/button";
import type { SiteCreateBarProps } from "@/types/components/sites";

/** Sticky footer of the new-site form: what happens next, cancel, create. */
export function SiteCreateBar({
  organizationSlug,
  productionBranch,
  canSubmit,
  isCreating,
}: SiteCreateBarProps) {
  const t = useTranslations("sites.new");
  const tCommon = useTranslations("common");
  return (
    <div className="bg-background/90 sticky bottom-4 z-10 mx-auto flex w-fit items-center gap-1 rounded-xl border p-1 pl-3 shadow-lg backdrop-blur">
      <p className="text-muted-foreground mr-2 text-sm whitespace-nowrap">
        {productionBranch
          ? t("barHint", { branch: productionBranch })
          : t("barHintNoRepository")}
      </p>
      <Link
        className={buttonVariants({ size: "sm", variant: "ghost" })}
        href={`/${organizationSlug}/sites`}
      >
        {tCommon("actions.cancel")}
      </Link>
      <Button
        disabled={!canSubmit}
        loading={isCreating}
        size="sm"
        type="submit"
      >
        {t("create")}
      </Button>
    </div>
  );
}
