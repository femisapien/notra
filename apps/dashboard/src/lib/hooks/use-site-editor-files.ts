import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";

import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  UseCreateSiteFileParams,
  UseRebaseSiteDraftsParams,
  UseValidateSiteDraftsParams,
} from "@/types/hooks/sites";
import type { SiteEditorNewFile } from "@/types/site-editor";
import type { SiteScope } from "@/types/sites";
import { toErrorMessage } from "@/utils/error-message";
import { listSiteEditorFiles } from "@/utils/site-editor";

/** The editor's file list and drafts, plus the two ways the page keeps them current. */
export function useSiteEditorFiles({ organizationId, siteId }: SiteScope) {
  const queryClient = useQueryClient();
  const filesOptions = dashboardOrpc.sites.editor.files.queryOptions({
    input: { organizationId, siteId },
    refetchOnWindowFocus: false,
  });
  const filesQuery = useQuery(filesOptions);
  const data = filesQuery.data ?? null;
  const treeFiles = useMemo(
    () => listSiteEditorFiles(data?.files ?? [], data?.drafts ?? []),
    [data]
  );
  const editablePaths = new Set(
    treeFiles.filter((file) => file.editable).map((file) => file.path)
  );
  const sourcePaths = new Set((data?.files ?? []).map((file) => file.path));

  // Not all of `sites`: open files must not refetch (and hit GitHub) on every autosave.
  const refreshDrafts = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: filesOptions.queryKey }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.sites.get.key(),
      }),
    ]);
  };

  // Autosaves update the file list in place; refetching it would ask GitHub on every save.
  const applyDraftChange = (path: string, updatedAt: Date | null) => {
    queryClient.setQueryData(filesOptions.queryKey, (current) => {
      if (!current) {
        return current;
      }
      const others = current.drafts.filter((draft) => draft.path !== path);
      if (updatedAt === null) {
        return { ...current, drafts: others };
      }
      const existing = current.drafts.find((draft) => draft.path === path);
      const source = current.files.find((file) => file.path === path);
      return {
        ...current,
        drafts: [
          ...others,
          {
            path,
            deleted: false,
            baseBlobSha: existing?.baseBlobSha ?? source?.sha ?? null,
            updatedAt,
          },
        ],
      };
    });
    void queryClient.invalidateQueries({
      queryKey: dashboardOrpc.sites.get.key(),
    });
  };

  return {
    filesQuery,
    data,
    drafts: data?.drafts ?? [],
    treeFiles,
    editablePaths,
    sourcePaths,
    baseCommitSha: data?.commitSha ?? null,
    refreshDrafts,
    applyDraftChange,
  };
}

/** Moves conflicting drafts onto the files as they are on GitHub now. */
export function useRebaseSiteDrafts({
  organizationId,
  siteId,
  onRebased,
}: UseRebaseSiteDraftsParams) {
  const t = useTranslations("sites.editor");
  const queryClient = useQueryClient();
  return useMutation({
    // Each draft is its own row, so they rebase independently.
    mutationFn: async (paths: string[]) => {
      await Promise.all(
        paths.map((path) =>
          dashboardOrpc.sites.editor.rebaseDraft.call({
            organizationId,
            siteId,
            path,
          })
        )
      );
    },
    onSuccess: async () => {
      onRebased();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.sites.editor.files.queryKey({
            input: { organizationId, siteId },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.sites.get.key(),
        }),
      ]);
      toast.success(t("conflict.rebased"));
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("conflict.rebaseFailed")));
    },
  });
}

/** Checks the site as it would build with every draft applied. */
export function useValidateSiteDrafts({
  organizationId,
  siteId,
  onValidated,
}: UseValidateSiteDraftsParams) {
  const t = useTranslations("sites.editor");
  return useMutation({
    mutationFn: () =>
      dashboardOrpc.sites.editor.validate.call({ organizationId, siteId }),
    onSuccess: (result) => onValidated(result.diagnostics),
    onError: (error) => {
      toast.error(toErrorMessage(error, t("validateFailed")));
    },
  });
}

/** Creates a new file as a draft, then opens it. */
export function useCreateSiteFile({
  organizationId,
  siteId,
  baseCommitSha,
  refreshDrafts,
  onSaved,
  onCreated,
}: UseCreateSiteFileParams) {
  const t = useTranslations("sites.editor");
  return useMutation({
    mutationFn: (file: SiteEditorNewFile) =>
      dashboardOrpc.sites.editor.saveDraft.call({
        organizationId,
        siteId,
        path: file.path,
        content: file.content,
        baseBlobSha: null,
        baseCommitSha,
      }),
    onSuccess: async (result) => {
      onSaved();
      await refreshDrafts();
      onCreated(result.path);
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("createFailed")));
    },
  });
}
