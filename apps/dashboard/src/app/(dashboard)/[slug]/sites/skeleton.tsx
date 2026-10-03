"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useTranslations } from "next-intl";

import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { PageHeading } from "@/components/layout/page-heading";
import { SitesPageShell } from "@/components/sites/sites-page-shell";
import { SITES_PAGE_SKELETON_ROWS } from "@/constants/sites";

export function SitesPageSkeleton() {
  const t = useTranslations("sites");
  return (
    <SitesPageShell>
      <PageHeading description={t("description")} title={t("title")}>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </PageHeading>
      <GeoTableSkeleton rows={SITES_PAGE_SKELETON_ROWS} />
    </SitesPageShell>
  );
}
