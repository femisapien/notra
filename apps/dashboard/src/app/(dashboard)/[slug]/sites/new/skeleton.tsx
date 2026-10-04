"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/layout/page-heading";
import { SitesPageShell } from "@/components/sites/sites-page-shell";

export function NewSitePageSkeleton() {
  const t = useTranslations("sites.new");
  return (
    <SitesPageShell>
      <PageHeading description={t("description")} title={t("title")} />
      <div className="space-y-6">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </SitesPageShell>
  );
}
