import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SiteAnalyticsPage } from "@/components/sites/pages/site-analytics-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sites.detail.tabs");
  return { title: t("analytics") };
}

export default function Page() {
  return <SiteAnalyticsPage />;
}
