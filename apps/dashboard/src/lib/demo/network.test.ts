import { afterEach, describe, expect, mock, test } from "bun:test";

import { installDemoNetworkBoundary } from "@/lib/demo/network";

const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (previousWindow) {
    Object.defineProperty(globalThis, "window", previousWindow);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
});

describe("demo fetch boundary", () => {
  test("serves only synthetic session data and blocks live APIs and writes", async () => {
    const liveFetch = mock(async () => new Response("navigation"));
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        fetch: liveFetch,
        location: { origin: "https://app.usenotra.com" },
      },
    });
    const restore = installDemoNetworkBoundary();
    const session = await window.fetch("https://app.usenotra.com/api/session");
    expect((await session.json()).user.id).toBe("public-demo-user");
    expect(liveFetch).not.toHaveBeenCalled();
    for (const [url, method] of [
      ["https://app.usenotra.com/rpc", "POST"],
      ["https://app.usenotra.com/api/session", "POST"],
      ["https://app.usenotra.com/demo/geo", "POST"],
      ["https://app.usenotra.com/api/organizations/real-org", "GET"],
      ["https://example.com/demo/geo", "GET"],
    ]) {
      await expect(window.fetch(url ?? "", { method })).rejects.toThrow(
        "read only"
      );
    }
    expect(liveFetch).not.toHaveBeenCalled();
    await window.fetch("https://app.usenotra.com/demo/content?_rsc=example");
    expect(liveFetch).toHaveBeenCalledTimes(1);
    restore();
    expect(window.fetch).toBe(liveFetch);
  });
});
