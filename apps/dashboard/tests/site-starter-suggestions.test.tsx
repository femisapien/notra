import { beforeEach, expect, mock, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";

if (!process.env.NOTRA_STARTER_SUGGESTIONS_WORKER) {
  test("existing config suggestions do not leak from the default branch", () => {
    const result = spawnSync(
      process.execPath,
      ["test", fileURLToPath(import.meta.url)],
      {
        cwd: fileURLToPath(new URL("../../..", import.meta.url)),
        env: { ...process.env, NOTRA_STARTER_SUGGESTIONS_WORKER: "1" },
        timeout: 30_000,
      }
    );
    expect(result.status, result.stderr?.toString()).toBe(0);
  });
} else {
  const defaultData = {
    defaultBranch: "main",
    branches: ["main", "other"],
    configDirectories: ["default-site"],
    contentCounts: {},
  };
  let branchData = { ...defaultData, configDirectories: ["other-site"] };
  let branchReady = true;
  let fetching = false;
  let seenRef: string | undefined;
  mock.module("@tanstack/react-query", () => ({
    useQuery: ({ input }: { input: { ref?: string } }) => {
      if (input.ref) {
        seenRef = input.ref;
      }
      return input.ref
        ? {
            data: branchReady ? branchData : undefined,
            isSuccess: branchReady,
            isFetching: fetching,
            isPlaceholderData: false,
            isPending: !branchReady,
          }
        : {
            data: defaultData,
            isSuccess: true,
            isFetching: false,
            isPlaceholderData: false,
            isPending: false,
          };
    },
  }));
  mock.module("../src/lib/orpc/query", () => ({
    dashboardOrpc: {
      sites: {
        repositorySuggestions: {
          queryOptions: ({ input }: { input: unknown }) => ({ input }),
        },
        siteRepositorySuggestions: {
          queryOptions: ({ input }: { input: unknown }) => ({ input }),
        },
      },
    },
  }));
  const { useRepositorySuggestions } =
    await import("../src/lib/hooks/use-repository-suggestions");
  const Probe = ({ branch }: { branch: string }) => (
    <span>
      {JSON.stringify(
        useRepositorySuggestions({
          organizationId: "organization",
          repositoryId: "repository",
          branch,
        })
      )}
    </span>
  );
  const render = (branch: string) =>
    renderToStaticMarkup(<Probe branch={branch} />);
  beforeEach(() => {
    branchReady = true;
    fetching = false;
    seenRef = undefined;
    branchData = { ...defaultData, configDirectories: ["other-site"] };
  });
  test("default branch reuses the base scan", () => {
    expect(render("main")).toContain("default-site");
    expect(seenRef).toBeUndefined();
  });
  test("selected branch reads its own scan with no default fallback", () => {
    expect(render(" other ")).toContain("other-site");
    expect(seenRef).toBe("other");
    branchReady = false;
    const html = render("other");
    expect(html).not.toContain("default-site");
    expect(html).not.toContain("other-site");
    expect(html).toContain("&quot;isReady&quot;:false");
  });
  test("refetch and custom branches remain scoped and cannot imply no existing configs", () => {
    fetching = true;
    expect(render("custom")).not.toContain("default-site");
    expect(seenRef).toBe("custom");
    expect(render("custom")).toContain("&quot;isReady&quot;:false");
  });
}
