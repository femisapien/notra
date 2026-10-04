"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cloudflare } from "@notra/ui/components/ui/svgs/cloudflare";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/button";
import { SiteCopyButton } from "@/components/sites/site-copy-button";
import { SITE_CLOUDFLARE_PROVIDER_PATTERN } from "@/constants/sites";
import { useSiteDomainConnect } from "@/lib/hooks/use-site-domain-connect";
import type {
  SiteDnsConnectRowProps,
  SiteDnsRecordValueProps,
  SiteDnsRecordsTableProps,
  SiteDnsSetupProps,
} from "@/types/components/sites";

function RecordValue({ value, label }: SiteDnsRecordValueProps) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="min-w-0 truncate font-mono text-xs" title={value}>
        {value}
      </span>
      <SiteCopyButton label={label} value={value} />
    </span>
  );
}

/**
 * Type | Name | Value with a copy button per value. It lives inside the
 * domains table, so it is a plain grid rather than another framed table.
 */
export function SiteDnsRecordsTable({ records }: SiteDnsRecordsTableProps) {
  const t = useTranslations("sites.domainsPage.dns");
  if (records.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("noRecords")}</p>;
  }
  return (
    <table className="w-full table-fixed text-sm">
      <colgroup>
        <col className="w-18" />
        <col className="w-[43%]" />
        <col />
      </colgroup>
      <thead>
        <tr className="text-muted-foreground text-left text-xs">
          <th className="pr-4 pb-1.5 font-normal">{t("type")}</th>
          <th className="pr-4 pb-1.5 font-normal">{t("name")}</th>
          <th className="pb-1.5 font-normal">{t("value")}</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr
            className="border-border/60 border-t"
            key={`${record.type}:${record.name}:${record.value}`}
          >
            <td className="py-1.5 pr-4 font-mono text-xs font-medium">
              {record.type}
            </td>
            <td className="min-w-0 py-1.5 pr-4">
              <RecordValue label={t("name")} value={record.name} />
            </td>
            <td className="min-w-0 py-1.5">
              <RecordValue label={t("value")} value={record.value} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConnectRow({ providerName, applyUrl }: SiteDnsConnectRowProps) {
  const t = useTranslations("sites.domainsPage.dns");
  const [navigating, setNavigating] = useState(false);
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{t("connectTitle")}</p>
        <p className="text-muted-foreground text-sm text-pretty">
          {t("connectDescription", { provider: providerName })}
        </p>
      </div>
      <Button
        className="w-full shrink-0 sm:w-auto"
        loading={navigating}
        onClick={() => {
          setNavigating(true);
          window.location.assign(applyUrl);
        }}
        size="sm"
      >
        {SITE_CLOUDFLARE_PROVIDER_PATTERN.test(providerName) ? (
          <Cloudflare aria-hidden="true" data-icon="inline-start" />
        ) : null}
        {t("connect", { provider: providerName })}
        <HugeiconsIcon
          data-icon="inline-end"
          icon={ArrowUpRight01Icon}
          strokeWidth={1.5}
        />
      </Button>
    </div>
  );
}

/** Mintlify-style DNS configuration: one-click setup when the provider supports it, else the records. */
export function SiteDnsSetup({
  organizationId,
  siteId,
  domain,
}: SiteDnsSetupProps) {
  const t = useTranslations("sites.domainsPage.dns");
  const connect = useSiteDomainConnect({ organizationId, siteId, domain });
  const result = connect.data;
  const ready = result?.status === "ready" ? result : null;
  const knownProvider =
    result && result.status !== "unavailable" ? result.providerName : undefined;
  const showCloudflareHint =
    !knownProvider || SITE_CLOUDFLARE_PROVIDER_PATTERN.test(knownProvider);

  return (
    <div className="space-y-5">
      {ready ? (
        <ConnectRow
          applyUrl={ready.applyUrl}
          providerName={ready.providerName}
        />
      ) : null}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {ready ? t("manualTitle") : t("calloutTitle")}
          </p>
          <p className="text-muted-foreground text-sm text-pretty">
            {t("calloutDescription")}
            {showCloudflareHint ? ` ${t("cloudflareHint")}` : null}
          </p>
        </div>
        <SiteDnsRecordsTable records={domain.records} />
      </div>
    </div>
  );
}
