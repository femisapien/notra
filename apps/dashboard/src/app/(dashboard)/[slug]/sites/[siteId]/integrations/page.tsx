import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SiteIntegrationsPage } from "@/components/sites/pages/site-integrations-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sites.detail.tabs");
  return { title: t("integrations") };
}

export default function Page() {
  return <SiteIntegrationsPage />;
}
