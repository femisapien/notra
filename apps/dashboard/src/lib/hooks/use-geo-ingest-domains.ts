"use client";

import { GEO_TRAFFIC_LIVE_INTERVAL_MS } from "@notra/geo-core/constants/geo";
import type {
  GeoIngestDomainActionInput,
  GeoIngestDomainsResponse,
} from "@notra/geo-core/types/ingest-domains";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "use-intl";

import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import { toErrorMessage } from "@/utils/error-message";

export function useGeoIngestDomains(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const t = useTranslations("geo.pages.traffic.domains");
  const queryClient = useQueryClient();
  const input = { organizationId, projectId };
  const query = useQuery({
    ...dashboardOrpc.geo.ingestDomains.queryOptions({ input }),
    enabled: !!organizationId,
    refetchInterval: GEO_TRAFFIC_LIVE_INTERVAL_MS,
    refetchIntervalInBackground: false,
    meta: { errorMessage: t("loadFailed") },
  });
  const mutation = useMutation({
    mutationFn: (
      action: Pick<GeoIngestDomainActionInput, "domain" | "action">
    ) => dashboardOrpc.geo.ingestDomainAction.call({ ...input, ...action }),
    onMutate: () => input,
    onSuccess: async (_, action, scope) => {
      if (!scope) {
        return;
      }
      queryClient.setQueryData(
        dashboardOrpc.geo.ingestDomains.queryKey({ input: scope }),
        (data: GeoIngestDomainsResponse | undefined) =>
          data
            ? {
                domains: data.domains.filter(
                  (domain) => domain !== action.domain
                ),
              }
            : data
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.geo.ingestDomains.queryKey({ input: scope }),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.geo.settings.queryKey({ input: scope }),
        }),
      ]);
    },
    onError: (error) => toast.error(toErrorMessage(error, t("actionFailed"))),
  });
  return { domains: query.data?.domains ?? [], mutation };
}
