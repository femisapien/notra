import { beforeEach, expect, mock, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";

import type { SiteStarterInput } from "../src/types/sites";

if (!process.env.NOTRA_STARTER_STATUS_WORKER) {
  test("starter status checks the immediate source before enabling actions", () => {
    const result = spawnSync(
      process.execPath,
      ["test", fileURLToPath(import.meta.url)],
      {
        cwd: fileURLToPath(new URL("../../..", import.meta.url)),
        env: { ...process.env, NOTRA_STARTER_STATUS_WORKER: "1" },
        timeout: 30_000,
      }
    );
    expect(result.status, result.stderr?.toString()).toBe(0);
  });
} else {
  let debounced: string[] = [];
  let queryState = {
    isSuccess: true,
    isFetching: false,
    isPlaceholderData: false,
  };
  let options: { enabled: boolean; input: SiteStarterInput } | undefined;
  mock.module("@tanstack/react-pacer", () => ({
    useDebouncedValue: (value: string) => [
      debounced.length ? debounced.shift() : value,
    ],
  }));
  mock.module("@tanstack/react-query", () => ({
    useQuery: (input: typeof options) => {
      options = input;
      return queryState;
    },
    useMutation: () => ({}),
    useQueryClient: () => ({}),
  }));
  mock.module("../src/lib/orpc/query", () => ({
    dashboardOrpc: {
      sites: {
        starterStatus: {
          queryOptions: ({ input }: { input: SiteStarterInput }) => ({ input }),
        },
      },
    },
  }));
  const { useSiteStarterStatus } =
    await import("../src/lib/hooks/use-site-starter");
  const { siteStarterScopeKey } =
    await import("../src/utils/site-starter-scope");
  const scope = {
    organizationId: "organization",
    repositoryId: "repository",
    branch: "main",
    rootDirectory: "",
  };
  const Probe = ({ input }: { input: SiteStarterInput }) => {
    return <span>{String(useSiteStarterStatus(input).isReady)}</span>;
  };
  const ready = (input = scope) =>
    renderToStaticMarkup(<Probe input={input} />).includes("true");
  beforeEach(() => {
    debounced = [];
    queryState = {
      isSuccess: true,
      isFetching: false,
      isPlaceholderData: false,
    };
    options = undefined;
  });

  test("matching normalized inputs are ready", () => {
    debounced = ["main", "hosted-site"];
    expect(
      ready({ ...scope, branch: " main ", rootDirectory: " /hosted-site/ " })
    ).toBe(true);
    expect(options?.input).toEqual({ ...scope, rootDirectory: "hosted-site" });
  });
  test("root and branch debounce hide cached results and disable old-scope queries", () => {
    debounced = ["main", ""];
    expect(ready({ ...scope, rootDirectory: "hosted-site" })).toBe(false);
    expect(options?.enabled).toBe(false);
    debounced = ["main", ""];
    expect(ready({ ...scope, branch: "other" })).toBe(false);
    expect(options?.enabled).toBe(false);
  });
  test("repository changes are included in query input and scope identity", () => {
    expect(ready({ ...scope, repositoryId: "other" })).toBe(true);
    expect(options?.input.repositoryId).toBe("other");
    expect(siteStarterScopeKey(scope)).not.toBe(
      siteStarterScopeKey({ ...scope, repositoryId: "other" })
    );
  });
  test("refetch, errors, unknown status and placeholder results are not ready", () => {
    for (const state of [
      { isSuccess: true, isFetching: true, isPlaceholderData: false },
      { isSuccess: false, isFetching: false, isPlaceholderData: false },
      { isSuccess: true, isFetching: false, isPlaceholderData: true },
    ]) {
      queryState = state;
      expect(ready()).toBe(false);
    }
  });
}
