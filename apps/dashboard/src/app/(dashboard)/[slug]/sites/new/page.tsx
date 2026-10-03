import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import type { SitesRoutePageProps } from "@/types/sites";

import PageClient from "./page-client";
import { NewSitePageSkeleton } from "./skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sites.new");
  return { title: t("title") };
}

async function PageContent({ params }: SitesRoutePageProps) {
  const { slug } = await params;
  return <PageClient organizationSlug={slug} />;
}

export default function Page({ params }: SitesRoutePageProps) {
  return (
    <Suspense fallback={<NewSitePageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
