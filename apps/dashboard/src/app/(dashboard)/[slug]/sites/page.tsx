import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import type { SitesRoutePageProps } from "@/types/sites";

import PageClient from "./page-client";
import { SitesPageSkeleton } from "./skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sites");
  return { title: t("title") };
}

async function PageContent({ params }: SitesRoutePageProps) {
  const { slug } = await params;
  return <PageClient organizationSlug={slug} />;
}

export default function Page({ params }: SitesRoutePageProps) {
  return (
    <Suspense fallback={<SitesPageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
