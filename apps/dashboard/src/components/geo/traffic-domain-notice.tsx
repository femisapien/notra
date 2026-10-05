"use client";

import { Button } from "@notra/ui/components/ui/button";
import { useTranslations } from "use-intl";

import { useGeoIngestDomains } from "@/lib/hooks/use-geo-ingest-domains";
import type { GeoSetupButtonProps } from "@/types/geo";

export function TrafficDomainNotice({ organizationId }: GeoSetupButtonProps) {
  const t = useTranslations("geo.pages.traffic.domains");
  const { domains, mutation } = useGeoIngestDomains(organizationId);
  if (domains.length === 0) {
    return null;
  }
  return (
    <section
      aria-label={t("title")}
      className="bg-muted/30 rounded-xl border px-4 py-3"
    >
      <p className="text-sm font-medium">{t("title")}</p>
      <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      <ul className="mt-3 space-y-2">
        {domains.map((domain) => (
          <li
            className="flex flex-wrap items-center justify-between gap-2"
            key={domain}
          >
            <span className="min-w-0 font-mono text-sm break-all">
              {domain}
            </span>
            <div className="flex items-center gap-2">
              <Button
                aria-label={t("ignoreLabel", { domain })}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ domain, action: "ignore" })}
                size="sm"
                variant="ghost"
              >
                {t("ignore")}
              </Button>
              <Button
                aria-label={t("addLabel", { domain })}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ domain, action: "add" })}
                size="sm"
                variant="outline"
              >
                {t("add")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
