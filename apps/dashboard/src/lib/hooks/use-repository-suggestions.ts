import { useQuery } from "@tanstack/react-query";

import { SITE_REPOSITORY_SUGGESTIONS_STALE_MS } from "@/constants/sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { RepositorySuggestionsScope } from "@/types/sites";

/**
 * Branches and notra.json folders from GitHub. The folders follow `branch`
 * once it names a real branch, so typing never refetches on each keystroke.
 */
export function useRepositorySuggestions(scope: RepositorySuggestionsScope) {
  const { organizationId, branch } = scope;
  const repositoryId = "repositoryId" in scope ? scope.repositoryId : null;
  const siteId = "siteId" in scope ? scope.siteId : null;

  const base = useRepositorySuggestionsQuery(
    organizationId,
    repositoryId,
    siteId,
    undefined
  );
  const knownBranch =
    branch && base.data?.branches.includes(branch) ? branch : undefined;
  const onBranch = useRepositorySuggestionsQuery(
    organizationId,
    repositoryId,
    siteId,
    knownBranch && knownBranch !== base.data?.defaultBranch
      ? knownBranch
      : undefined,
    Boolean(knownBranch && knownBranch !== base.data?.defaultBranch)
  );
  const directories = (onBranch.data ?? base.data)?.configDirectories ?? [];
  return {
    branches: base.data?.branches ?? [],
    defaultBranch: base.data?.defaultBranch ?? null,
    configDirectories: directories,
    isLoading: base.isPending && Boolean(repositoryId ?? siteId),
  };
}

function useRepositorySuggestionsQuery(
  organizationId: string,
  repositoryId: string | null,
  siteId: string | null,
  ref: string | undefined,
  enabled = true
) {
  const siteQuery = useQuery({
    ...dashboardOrpc.sites.siteRepositorySuggestions.queryOptions({
      input: { organizationId, siteId: siteId ?? "site_", ref },
    }),
    enabled: enabled && Boolean(siteId),
    staleTime: SITE_REPOSITORY_SUGGESTIONS_STALE_MS,
    retry: false,
  });
  const repositoryQuery = useQuery({
    ...dashboardOrpc.sites.repositorySuggestions.queryOptions({
      input: { organizationId, repositoryId: repositoryId ?? "", ref },
    }),
    enabled: enabled && Boolean(repositoryId),
    staleTime: SITE_REPOSITORY_SUGGESTIONS_STALE_MS,
    retry: false,
  });
  return siteId ? siteQuery : repositoryQuery;
}
