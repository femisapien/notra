import { beforeEach, describe, expect, mock, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IntlProvider } from "use-intl";

import de from "../messages/de.json";
import en from "../messages/en.json";
import type { SiteCreateStarterProps } from "../src/types/components/sites";

if (!process.env.NOTRA_EXISTING_CONFIG_WORKER) {
  test("explicit existing-config choices and starter source readiness", () => {
    const result = spawnSync(
      process.execPath,
      ["test", fileURLToPath(import.meta.url)],
      {
        cwd: fileURLToPath(new URL("../../..", import.meta.url)),
        env: { ...process.env, NOTRA_EXISTING_CONFIG_WORKER: "1" },
        timeout: 30_000,
      }
    );
    expect(result.status, result.stderr?.toString()).toBe(0);
  });
} else {
  let status = {
    isReady: true,
    data: { hasConfig: false, pullRequestUrl: null as string | null },
  };
  const choose = mock((_value: string) => {});
  const mutate = mock(() => {});
  const buttons: {
    onClick?: () => void;
    children?: ReactNode;
    "aria-label"?: string;
    variant?: string;
    size?: string;
  }[] = [];
  mock.module("../src/lib/hooks/use-site-starter", () => ({
    useSiteStarterStatus: () => status,
    useCreateSiteStarter: () => ({ isPending: false, mutate }),
  }));
  mock.module("../src/components/button", () => ({
    Button: (props: (typeof buttons)[number]) => {
      buttons.push(props);
      return (
        <button
          type="button"
          aria-label={props["aria-label"]}
          onClick={props.onClick}
        >
          {props.children}
        </button>
      );
    },
  }));
  const { SiteCreateStarter } =
    await import("../src/components/sites/site-create-starter");
  const props: SiteCreateStarterProps = {
    organizationId: "organization",
    repositoryId: "repository",
    branch: "main",
    rootDirectory: "",
    pullRequestUrl: null,
    onPullRequestOpened: () => {},
    configDirectories: [],
    suggestionsReady: true,
    onRootDirectoryChange: choose,
  };
  beforeEach(() => {
    status = {
      isReady: true,
      data: { hasConfig: false, pullRequestUrl: null },
    };
    choose.mockClear();
    mutate.mockClear();
    buttons.length = 0;
  });
  describe.each([
    ["en", en],
    ["de", de],
  ] as const)("%s config choices", (locale, messages) => {
    const render = (overrides: Partial<SiteCreateStarterProps> = {}) =>
      renderToStaticMarkup(
        <IntlProvider locale={locale} messages={messages} timeZone="UTC">
          <SiteCreateStarter {...props} {...overrides} />
        </IntlProvider>
      );
    test("root or nested selected config hides the starter even with a local PR", () => {
      status.data.hasConfig = true;
      expect(
        render({
          configDirectories: ["", "hosted-site"],
          pullRequestUrl: "https://github.example/old/pull/1",
        })
      ).toBe("");
      expect(render({ rootDirectory: "hosted-site" })).toBe("");
    });
    test("a sole nested config is an explicit choice, not a silent root change", () => {
      const html = render({ configDirectories: ["hosted-site"] });
      expect(html.match(/role="status"/g)).toHaveLength(1);
      expect(html).not.toContain(messages.sites.new.starter.missingTitle);
      expect(html).not.toContain(
        messages.sites.new.starter.existingDescription
      );
      expect(html).toContain(messages.sites.new.starter.existingTitle);
      expect(html).toContain("hosted-site/blog.json");
      expect(html).not.toContain(messages.sites.new.starter.createAt);
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.children).toBe(messages.sites.new.starter.useFolder);
      expect(buttons[0]?.["aria-label"]).toBe(
        messages.sites.new.starter.useExisting.replace(
          "{path}",
          "hosted-site/blog.json"
        )
      );
      expect(buttons[0]?.variant).toBe("outline");
      expect(buttons[0]?.size).toBe("sm");
      expect(html).toContain("<code");
      expect(choose).not.toHaveBeenCalled();
      buttons[0]?.onClick?.();
      expect(choose).toHaveBeenCalledWith("hosted-site");
      expect(mutate).not.toHaveBeenCalled();
    });
    test("multiple configs stay explicit and choosing root uses an empty root", () => {
      const html = render({
        rootDirectory: "new-site",
        configDirectories: ["", "hosted-site", "second", "hosted-site"],
      });
      expect(html.match(/role="status"/g)).toHaveLength(1);
      expect(html).toContain("hosted-site/blog.json");
      expect(html).toContain("second/blog.json");
      expect(buttons).toHaveLength(3);
      expect(html).not.toContain(messages.sites.new.starter.createAt);
      for (const [index, path] of [
        "blog.json",
        "hosted-site/blog.json",
        "second/blog.json",
      ].entries()) {
        expect(buttons[index]?.["aria-label"]).toBe(
          messages.sites.new.starter.useExisting.replace("{path}", path)
        );
        expect(buttons[index]?.children).toBe(
          messages.sites.new.starter.useFolder
        );
      }
      expect(choose).not.toHaveBeenCalled();
      buttons[0]?.onClick?.();
      expect(choose).toHaveBeenCalledWith("");
      buttons[2]?.onClick?.();
      expect(choose).toHaveBeenCalledWith("second");
      expect(mutate).not.toHaveBeenCalled();
    });
    test("no configs keeps intentional starter creation at the selected location", () => {
      const html = render({ rootDirectory: " /new-site/ " });
      expect(html.match(/role="status"/g)).toHaveLength(1);
      expect(html).not.toContain(messages.sites.new.starter.existingTitle);
      expect(html).toContain("new-site/blog.json");
      expect(html).toContain("main");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.children).toBe(messages.sites.new.starter.createAt);
      expect(buttons[0]?.variant).toBe("outline");
      buttons[0]?.onClick?.();
      expect(mutate).toHaveBeenCalledWith(
        {
          organizationId: props.organizationId,
          repositoryId: props.repositoryId,
          branch: "main",
          rootDirectory: " /new-site/ ",
        },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
    test("discovery keeps only folder choices, even when a current-source PR exists", () => {
      const html = render({
        configDirectories: ["hosted-site", "second"],
        pullRequestUrl: "https://github.example/current/pull/1",
      });
      expect(html.match(/role="status"/g)).toHaveLength(1);
      expect(html).toContain(messages.sites.new.starter.existingTitle);
      expect(html).toContain("hosted-site/blog.json");
      expect(html).toContain("second/blog.json");
      expect(html).not.toContain(
        'href="https://github.example/current/pull/1"'
      );
      expect(html).not.toContain(messages.sites.new.starter.createAt);
      expect(html).not.toContain(messages.sites.new.starter.opened);
      expect(buttons).toHaveLength(2);
      expect(mutate).not.toHaveBeenCalled();
    });
    test("without discovered alternatives, the current-source PR remains accessible", () => {
      status.data.pullRequestUrl = "https://github.example/current/pull/2";
      const html = render({ rootDirectory: "new-site", branch: "preview" });
      expect(html.match(/role="status"/g)).toHaveLength(1);
      expect(html).toContain("new-site/blog.json");
      expect(html).toContain("preview");
      expect(html).toContain('href="https://github.example/current/pull/2"');
      expect(html).toContain(messages.sites.new.starter.view);
      expect(buttons).toHaveLength(0);
      expect(mutate).not.toHaveBeenCalled();
    });
    test("unknown suggestions or current status hide choices, create action and stale PR links", () => {
      expect(
        render({
          suggestionsReady: false,
          configDirectories: ["hosted-site"],
          pullRequestUrl: "https://github.example/old/pull/1",
        })
      ).toBe("");
      status.isReady = false;
      expect(
        render({
          configDirectories: ["hosted-site"],
          pullRequestUrl: "https://github.example/old/pull/1",
        })
      ).toBe("");
      expect(buttons).toHaveLength(0);
    });
  });
}
