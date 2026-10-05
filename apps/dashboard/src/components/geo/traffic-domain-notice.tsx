"use client";

import { Globe02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useTranslations } from "use-intl";

import { useGeoIngestDomains } from "@/lib/hooks/use-geo-ingest-domains";
import type { GeoSetupButtonProps } from "@/types/geo";

export function TrafficDomainNotice({ organizationId }: GeoSetupButtonProps) {
  const t = useTranslations("geo.pages.traffic.domains");
  const { domains, mutation } = useGeoIngestDomains(organizationId);
  const domain = domains[0];
  if (!domain) {
    return null;
  }
  return (
    <section
      aria-label={t("title")}
      className="border-shell-border bg-shell rounded-2xl border"
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="border-border bg-card text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-xl border">
            <HugeiconsIcon aria-hidden="true" icon={Globe02Icon} size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2">
              <h2 className="text-sm font-medium">{t("title")}</h2>
              {domains.length > 1 ? (
                <span className="text-muted-foreground text-xs">
                  {t("remaining", { count: domains.length - 1 })}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs leading-5">
              {t.rich("description", {
                domain,
                host: (chunks) => (
                  <span className="text-foreground font-medium break-all">
                    {chunks}
                  </span>
                ),
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            aria-label={t("ignoreLabel", { domain })}
            disabled={mutation.isPending}
            loading={
              mutation.isPending && mutation.variables?.action === "ignore"
            }
            onClick={() => mutation.mutate({ domain, action: "ignore" })}
            size="sm"
            title={t("ignoreHint")}
            variant="ghost"
          >
            {t("ignore")}
          </Button>
          <Button
            aria-label={t("addLabel", { domain })}
            disabled={mutation.isPending}
            loading={mutation.isPending && mutation.variables?.action === "add"}
            onClick={() => mutation.mutate({ domain, action: "add" })}
            size="sm"
            title={t("addHint")}
          >
            <HugeiconsIcon
              aria-hidden="true"
              data-icon="inline-start"
              icon={PlusSignIcon}
              size={14}
            />
            {t("add")}
          </Button>
        </div>
      </div>
    </section>
  );
}
