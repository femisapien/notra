"use client";

import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/layout/page-heading";
import { SiteCreateForm } from "@/components/sites/site-create-form";
import { SitesPageShell } from "@/components/sites/sites-page-shell";
import { SitesUnavailableState } from "@/components/sites/sites-unavailable-state";
import { useSitesOrganizationId, useSitesStatus } from "@/lib/hooks/use-sites";
import type { SitesPageClientProps } from "@/types/sites";

import { NewSitePageSkeleton } from "./skeleton";

export default function PageClient({ organizationSlug }: SitesPageClientProps) {
  const t = useTranslations("sites.new");
  const organizationId = useSitesOrganizationId(organizationSlug);
  const statusQuery = useSitesStatus(organizationId);

  if (!statusQuery.data) {
    return <NewSitePageSkeleton />;
  }

  return (
    <SitesPageShell>
      <PageHeading description={t("description")} title={t("title")} />
      {statusQuery.data.configured ? (
        <SiteCreateForm
          hostingDomain={statusQuery.data.hostingDomain}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />
      ) : (
        <SitesUnavailableState />
      )}
    </SitesPageShell>
  );
}
