import { SiteLayout } from "@/components/sites/site-layout";
import type { SiteRouteLayoutProps } from "@/types/sites";

export default async function Layout({
  children,
  params,
}: SiteRouteLayoutProps) {
  const { slug, siteId } = await params;
  return (
    <SiteLayout organizationSlug={slug} siteId={siteId}>
      {children}
    </SiteLayout>
  );
}
