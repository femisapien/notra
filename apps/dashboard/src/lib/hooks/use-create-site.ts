import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SiteCreateInput } from "@/types/sites";
import { toErrorMessage } from "@/utils/error-message";

/** Creates a site, then opens it. */
export function useCreateSite(organizationSlug: string) {
  const t = useTranslations("sites.new");
  const router = useRouter();
  const invalidateSites = useInvalidateSites();
  return useMutation({
    mutationFn: (input: SiteCreateInput) =>
      dashboardOrpc.sites.create.call(input),
    onSuccess: async (result) => {
      toast.success(
        result.deploymentQueued ? t("createdDeploying") : t("created")
      );
      await invalidateSites();
      router.push(`/${organizationSlug}/sites/${result.site.id}`);
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("createFailed")));
    },
  });
}
