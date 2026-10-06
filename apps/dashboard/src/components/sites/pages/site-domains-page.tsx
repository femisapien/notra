"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageHeading } from "@notra/ui/components/shared/page-heading";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";

import { Button } from "@/components/button";
import { SiteConfirmDialog } from "@/components/sites/site-confirm-dialog";
import { useSite } from "@/components/sites/site-context";
import { SiteDomainAddDialog } from "@/components/sites/site-domain-add-dialog";
import { SiteDomainsTable } from "@/components/sites/site-domains-table";
import { SITE_DOMAIN_CONNECT_PARAM } from "@/constants/sites";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { usePathname, useSearchParams } from "@/lib/navigation";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SiteDomainRemoveDialogProps } from "@/types/components/sites";
import type { SiteDomain } from "@/types/sites";
import { toErrorMessage } from "@/utils/error-message";
import { parseSiteDomainConnectOutcome } from "@/utils/site-domains";
import { displayUrl } from "@/utils/site-links";

/** Toasts the result of a Domain Connect round trip once, then drops the query parameter. */
function useDomainConnectOutcomeToast() {
  const t = useTranslations("sites.domainsPage.connectResult");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const handled = useRef(false);
  const outcome = parseSiteDomainConnectOutcome(
    searchParams.get(SITE_DOMAIN_CONNECT_PARAM)
  );

  useEffect(() => {
    if (!outcome || handled.current) {
      return;
    }
    handled.current = true;
    if (outcome === "success") {
      toast.success(t("success"), { description: t("successDescription") });
    } else if (outcome === "cancelled") {
      toast.message(t("cancelled"), { description: t("cancelledDescription") });
    } else {
      toast.error(t("error"), { description: t("errorDescription") });
    }
    // Only the address bar changes: Next.js syncs useSearchParams with the
    // History API, so there is no navigation and no refetch.
    const next = new URLSearchParams(searchParams.toString());
    next.delete(SITE_DOMAIN_CONNECT_PARAM);
    const query = next.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname
    );
  }, [outcome, pathname, searchParams, t]);
}

function RemoveDomainDialog({
  organizationId,
  siteId,
  domain,
  aliasOrigin,
  onOpenChange,
}: SiteDomainRemoveDialogProps) {
  const t = useTranslations("sites.domainsPage");
  const invalidateSites = useInvalidateSites();

  const removeMutation = useMutation({
    mutationFn: (domainId: string) =>
      dashboardOrpc.sites.domains.remove.call({
        organizationId,
        siteId,
        domainId,
      }),
    onSuccess: async () => {
      toast.success(t("removed"));
      onOpenChange(false);
      await invalidateSites();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("removeFailed")));
    },
  });

  return (
    <SiteConfirmDialog
      confirmLabel={t("removeConfirm")}
      description={
        domain?.isPrimary
          ? t("removePrimaryDescription", {
              hostname: domain.hostname,
              alias: displayUrl(aliasOrigin),
            })
          : t("removeDescription", { hostname: domain?.hostname ?? "" })
      }
      destructive
      onConfirm={() => {
        if (domain) {
          removeMutation.mutate(domain.id);
        }
      }}
      onOpenChange={onOpenChange}
      open={domain !== null}
      pending={removeMutation.isPending}
      title={t("removeTitle")}
    />
  );
}

export function SiteDomainsPage() {
  const { organizationId, siteId, detail } = useSite();
  const t = useTranslations("sites.domainsPage");
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<SiteDomain | null>(null);
  const { site, domains } = detail;
  useDomainConnectOutcomeToast();

  return (
    <div className="space-y-6">
      <PageHeading description={t("description")} title={t("title")}>
        <Button onClick={() => setAddOpen(true)}>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          {t("addDomain")}
        </Button>
      </PageHeading>

      <SiteDomainsTable
        aliasOrigin={site.aliasOrigin}
        domains={domains}
        mounts={site.mounts}
        onRemove={setRemoveTarget}
        organizationId={organizationId}
        siteId={siteId}
      />

      <SiteDomainAddDialog
        mounts={site.mounts}
        onOpenChange={setAddOpen}
        open={addOpen}
        organizationId={organizationId}
        siteId={siteId}
      />
      <RemoveDomainDialog
        aliasOrigin={site.aliasOrigin}
        domain={removeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
          }
        }}
        organizationId={organizationId}
        siteId={siteId}
      />
    </div>
  );
}
