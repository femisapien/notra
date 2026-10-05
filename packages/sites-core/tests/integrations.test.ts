import { describe, expect, test } from "bun:test";
import { Script } from "node:vm";

import { siteConfigSchema } from "../src/schemas/site-config";
import { buildSiteContentSecurityPolicy } from "../src/utils/content-security-policy";
import { sortCustomScriptPaths } from "../src/utils/custom-scripts";
import {
  inlineScriptLiteral,
  integrationCspSources,
  integrationHeadScripts,
} from "../src/utils/integrations";

const parse = (extra: Record<string, unknown>) =>
  siteConfigSchema.safeParse({ name: "Acme", ...extra });

const issuePaths = (extra: Record<string, unknown>) => {
  const result = parse(extra);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
};

describe("integrations schema", () => {
  test("accepts every preset in its documented shape", () => {
    const result = parse({
      integrations: {
        databuddy: { clientId: "3ed1fce1-5a56", trackWebVitals: true },
        plausible: { domain: "Acme.com" },
        posthog: {
          apiKey: "phc_abcdefghijklmnopqrstuvwxyz0123",
          apiHost: "https://acme.com/ingest/",
        },
        ga4: { measurementId: "G-ABC123XYZ9" },
        gtm: { tagId: "GTM-ABCD123" },
        umami: { websiteId: "94db1cb1-74f4-4a40-ad6c-962362670409" },
        fathom: { siteId: "ABCDEFG" },
      },
    });
    expect(result.success).toBe(true);
    expect(result.data?.integrations.plausible?.domain).toBe("acme.com");
    expect(result.data?.integrations.posthog?.apiHost).toBe(
      "https://acme.com/ingest"
    );
    expect(result.data?.security).toEqual({
      contentSecurityPolicy: true,
      allowedOrigins: [],
    });
  });

  test("rejects ids that could break out of HTML or JS, and unknown keys", () => {
    expect(
      issuePaths({
        integrations: {
          ga4: { measurementId: 'G-1234"><script>alert(1)</script>' },
          gtm: { tagId: "GTM-AB');alert(1);//" },
          databuddy: { clientId: "abc def ghi" },
          plausible: { domain: "acme.com", scriptUrl: "http://evil.com/x.js" },
          umami: { websiteId: "not-a-uuid" },
          posthog: { apiKey: "phc_short" },
          fathom: { siteId: "abc" },
          typo: { id: "x" },
        },
      }).sort()
    ).toEqual(
      [
        "integrations",
        "integrations.databuddy.clientId",
        "integrations.fathom.siteId",
        "integrations.ga4.measurementId",
        "integrations.gtm.tagId",
        "integrations.plausible.scriptUrl",
        "integrations.posthog.apiKey",
        "integrations.umami.websiteId",
      ].sort()
    );
    expect(
      issuePaths({ integrations: { ga4: { measurementId: "G-ABCD", x: 1 } } })
    ).toEqual(["integrations.ga4"]);
  });

  test("allowed origins are bare https/wss origins", () => {
    expect(
      issuePaths({
        security: {
          allowedOrigins: [
            "https://cdn.example.com",
            "https://*.example.com",
            "wss://ws.example.com:8443",
            "http://cdn.example.com",
            "https://cdn.example.com/path",
            "*",
            "https://example.com; script-src *",
          ],
        },
      })
    ).toEqual([
      "security.allowedOrigins.3",
      "security.allowedOrigins.4",
      "security.allowedOrigins.5",
      "security.allowedOrigins.6",
    ]);
  });
});

const MIXPANEL_TOKEN = "0123456789abcdef0123456789abcdef";
const AMPLITUDE_KEY = "fedcba9876543210fedcba9876543210";
const SEGMENT_KEY = "AbCdEf0123456789XyZ0123456789abc";
const CRISP_ID = "6a2b3c4d-1e2f-4a5b-8c9d-0e1f2a3b4c5d";

/** The new presets, parsed, so defaults are applied as in a real build. */
const parsedIntegrations = (integrations: Record<string, unknown>) => {
  const result = parse({ integrations });
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data.integrations;
};

const inlineCode = (integrations: Record<string, unknown>) => {
  const [script] = integrationHeadScripts(parsedIntegrations(integrations));
  if (script?.kind !== "inline") {
    throw new Error("Expected one inline script");
  }
  return script.code;
};

describe("product analytics and chat presets", () => {
  test("accept the documented shapes and apply defaults", () => {
    const integrations = parsedIntegrations({
      mixpanel: { projectToken: MIXPANEL_TOKEN },
      amplitude: { apiKey: AMPLITUDE_KEY, serverZone: "eu" },
      segment: { writeKey: SEGMENT_KEY },
      hotjar: { siteId: "1234567" },
      clarity: { projectId: "rdeztc00ot" },
      intercom: { appId: "abc12345", region: "eu" },
      crisp: { websiteId: CRISP_ID },
    });
    expect(integrations.mixpanel?.region).toBe("us");
    expect(integrations.amplitude?.serverZone).toBe("eu");
    expect(integrations.hotjar).toEqual({ siteId: 1_234_567 });
    expect(integrations.intercom?.region).toBe("eu");
    expect(
      parsedIntegrations({ hotjar: { siteId: 42, version: "7" } })
    ).toEqual({ hotjar: { siteId: 42, version: 7 } });
  });

  test("reject ids outside each vendor's format", () => {
    expect(
      issuePaths({
        integrations: {
          mixpanel: { projectToken: "not-a-token", region: "de" },
          amplitude: {
            apiKey: `${AMPLITUDE_KEY}");alert(1);//`,
            serverZone: "EU",
          },
          segment: { writeKey: "key with spaces" },
          hotjar: { siteId: "12ab", version: "6;alert(1)" },
          clarity: { projectId: "</script>" },
          intercom: { appId: "x", region: "us-east" },
          crisp: { websiteId: "not-a-uuid" },
        },
      }).sort()
    ).toEqual(
      [
        "integrations.amplitude.apiKey",
        "integrations.amplitude.serverZone",
        "integrations.clarity.projectId",
        "integrations.crisp.websiteId",
        "integrations.hotjar.siteId",
        "integrations.hotjar.version",
        "integrations.intercom.appId",
        "integrations.intercom.region",
        "integrations.mixpanel.projectToken",
        "integrations.mixpanel.region",
        "integrations.segment.writeKey",
      ].sort()
    );
  });

  test("every inline loader is valid JavaScript", () => {
    const scripts = integrationHeadScripts(
      parsedIntegrations({
        posthog: { apiKey: "phc_abcdefghijklmnopqrstuvwxyz0123" },
        gtm: { tagId: "GTM-ABCD123" },
        mixpanel: { projectToken: MIXPANEL_TOKEN },
        amplitude: { apiKey: AMPLITUDE_KEY },
        segment: { writeKey: SEGMENT_KEY },
        hotjar: { siteId: 1_234_567 },
        clarity: { projectId: "rdeztc00ot" },
        intercom: { appId: "abc12345" },
        crisp: { websiteId: CRISP_ID },
      })
    );
    expect(scripts).toHaveLength(9);
    for (const script of scripts) {
      if (script.kind === "inline") {
        // Compiles the code without running it.
        expect(() => new Script(script.code)).not.toThrow();
      }
    }
  });

  test("mixpanel: loader, token and regional api_host", () => {
    const code = inlineCode({
      mixpanel: { projectToken: MIXPANEL_TOKEN, region: "eu" },
    });
    expect(code).toContain("//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js");
    expect(
      code.endsWith(
        `mixpanel.init("${MIXPANEL_TOKEN}",{"api_host":"https://api-eu.mixpanel.com","autocapture":true,"track_pageview":true});`
      )
    ).toBe(true);
  });

  test("amplitude: pinned script loader and server zone", () => {
    const code = inlineCode({
      amplitude: { apiKey: AMPLITUDE_KEY, serverZone: "eu" },
    });
    expect(code).toContain(
      'a.src="https://cdn.amplitude.com/libs/analytics-browser-2.47.2-min.js.gz"'
    );
    expect(code).toContain('a.integrity="sha384-');
    expect(
      code.endsWith(`amplitude.init("${AMPLITUDE_KEY}",{"serverZone":"EU"});`)
    ).toBe(true);
  });

  test("segment: write key, load and the first page call", () => {
    const code = inlineCode({ segment: { writeKey: SEGMENT_KEY } });
    expect(code).toContain(
      '"https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js"'
    );
    expect(
      code.endsWith(
        `analytics._writeKey="${SEGMENT_KEY}";analytics.SNIPPET_VERSION="5.2.1";analytics.load("${SEGMENT_KEY}");analytics.page();}}();`
      )
    ).toBe(true);
  });

  test("hotjar: numeric settings and the default version", () => {
    const code = inlineCode({ hotjar: { siteId: "1234567" } });
    expect(code).toContain('h._hjSettings={"hjid":1234567,"hjsv":6};');
    expect(code).toContain('"https://static.hotjar.com/c/hotjar-",".js?sv="');
  });

  test("clarity: project id as the loader's last argument", () => {
    expect(inlineCode({ clarity: { projectId: "rdeztc00ot" } })).toContain(
      '"https://www.clarity.ms/tag/"+i;'
    );
    expect(inlineCode({ clarity: { projectId: "rdeztc00ot" } })).toContain(
      '(window,document,"clarity","script","rdeztc00ot");'
    );
  });

  test("intercom: settings with the regional api_base before the loader", () => {
    const code = inlineCode({ intercom: { appId: "abc12345", region: "au" } });
    expect(
      code.startsWith(
        'var APP_ID="abc12345";window.intercomSettings={"api_base":"https://api-iam.au.intercom.io","app_id":"abc12345"};(function(){'
      )
    ).toBe(true);
    expect(code).toContain("'https://widget.intercom.io/widget/' + APP_ID");
  });

  test("crisp: website id and l.js", () => {
    expect(inlineCode({ crisp: { websiteId: CRISP_ID } })).toBe(
      `window.$crisp=[];window.CRISP_WEBSITE_ID="${CRISP_ID}";(function(){var d=document;var s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`
    );
  });

  test("CSP origins per vendor", () => {
    const sources = (integrations: Record<string, unknown>) =>
      integrationCspSources(parsedIntegrations(integrations));
    expect(
      sources({ mixpanel: { projectToken: MIXPANEL_TOKEN, region: "in" } })
    ).toEqual({
      scriptSrc: ["https://cdn.mxpnl.com"],
      connectSrc: ["https://api-in.mixpanel.com"],
      workerSrc: [],
    });
    expect(sources({ amplitude: { apiKey: AMPLITUDE_KEY } })).toEqual({
      scriptSrc: ["https://*.amplitude.com"],
      connectSrc: ["https://*.amplitude.com"],
      workerSrc: [],
    });
    expect(sources({ segment: { writeKey: SEGMENT_KEY } })).toEqual({
      scriptSrc: ["https://cdn.segment.com"],
      connectSrc: ["https://cdn.segment.com", "https://api.segment.io"],
      workerSrc: [],
    });
    expect(sources({ hotjar: { siteId: 1 } })).toEqual({
      scriptSrc: ["https://*.hotjar.com"],
      connectSrc: [
        "https://*.hotjar.com",
        "https://*.hotjar.io",
        "wss://*.hotjar.com",
      ],
      workerSrc: [],
    });
    expect(sources({ clarity: { projectId: "rdeztc00ot" } })).toEqual({
      scriptSrc: ["https://*.clarity.ms"],
      connectSrc: ["https://*.clarity.ms", "https://c.bing.com"],
      workerSrc: [],
    });
    const intercom = sources({ intercom: { appId: "abc12345" } });
    expect(intercom.scriptSrc).toEqual([
      "https://app.intercom.io",
      "https://widget.intercom.io",
      "https://js.intercomcdn.com",
    ]);
    expect(intercom.connectSrc).toContain("https://api-iam.intercom.io");
    expect(intercom.connectSrc).toContain(
      "wss://nexus-websocket-a.intercom.io"
    );
    expect(intercom.connectSrc).toContain("wss://*.intercom-messenger.com");
    expect(sources({ crisp: { websiteId: CRISP_ID } })).toEqual({
      scriptSrc: ["https://*.crisp.chat"],
      connectSrc: [
        "https://*.crisp.chat",
        "wss://*.relay.crisp.chat",
        "wss://*.relay.rescue.crisp.chat",
      ],
      workerSrc: ["blob:", "https://*.crisp.chat"],
    });
  });
});

describe("head scripts", () => {
  test("inline values are JSON-encoded and cannot close the script", () => {
    expect(inlineScriptLiteral("</script><script>alert(1)")).toBe(
      '"\\u003c/script>\\u003cscript>alert(1)"'
    );
    expect(inlineScriptLiteral("a\u2028b")).toBe('"a\\u2028b"');
  });

  test("renders the vendor snippets", () => {
    const scripts = integrationHeadScripts({
      databuddy: {
        clientId: "client_123",
        trackWebVitals: false,
        trackErrors: true,
        trackPerformance: false,
        trackOutgoingLinks: false,
        trackInteractions: false,
        trackAttributes: false,
      },
      ga4: { measurementId: "G-ABC123" },
    });
    expect(scripts).toEqual([
      {
        kind: "external",
        src: "https://cdn.databuddy.cc/databuddy.js",
        attributes: {
          "data-client-id": "client_123",
          crossorigin: "anonymous",
          async: true,
          "data-track-errors": true,
        },
      },
      {
        kind: "external",
        src: "https://www.googletagmanager.com/gtag/js?id=G-ABC123",
        attributes: { async: true },
      },
      {
        kind: "inline",
        code: 'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-ABC123");',
      },
    ]);
  });

  test("custom scripts: script.js first, then scripts/ by path", () => {
    expect(
      sortCustomScriptPaths([
        "scripts/b.js",
        "snippets/a.js",
        "scripts/A.js",
        "script.js",
        "scripts/nested/c.js",
        "scripts/readme.txt",
      ])
    ).toEqual([
      "script.js",
      "scripts/A.js",
      "scripts/b.js",
      "scripts/nested/c.js",
    ]);
  });
});

describe("content security policy", () => {
  test("self, deduplicated hashes, preset hosts and allowed origins", () => {
    const policy = buildSiteContentSecurityPolicy({
      integrations: {
        plausible: { domain: "acme.com" },
        posthog: { apiKey: "phc_x", apiHost: "https://acme.com/ingest" },
      },
      security: {
        contentSecurityPolicy: true,
        allowedOrigins: ["https://widget.example.com", "wss://ws.example.com"],
      },
      scriptHashes: ["bbb=", "aaa=", "bbb="],
    });
    expect(policy).toBe(
      [
        "script-src 'self' 'sha256-aaa=' 'sha256-bbb=' https://*.posthog.com https://acme.com https://plausible.io https://widget.example.com",
        "connect-src 'self' https://*.posthog.com https://acme.com https://plausible.io https://widget.example.com wss://ws.example.com",
        "object-src 'none'",
        "base-uri 'self'",
      ].join("; ")
    );
  });

  test("worker-src only when a widget needs blob: workers, extending the script origins", () => {
    const security = {
      contentSecurityPolicy: true,
      allowedOrigins: ["https://widget.example.com", "wss://ws.example.com"],
    };
    expect(
      buildSiteContentSecurityPolicy({
        integrations: { fathom: { siteId: "ABCDEFG" } },
        security,
        scriptHashes: [],
      })
    ).not.toContain("worker-src");
    expect(
      buildSiteContentSecurityPolicy({
        integrations: parsedIntegrations({ crisp: { websiteId: CRISP_ID } }),
        security,
        scriptHashes: ["aaa="],
      })
    ).toBe(
      [
        "script-src 'self' 'sha256-aaa=' https://*.crisp.chat https://widget.example.com",
        "connect-src 'self' https://*.crisp.chat https://widget.example.com wss://*.relay.crisp.chat wss://*.relay.rescue.crisp.chat wss://ws.example.com",
        "worker-src 'self' blob: https://*.crisp.chat https://widget.example.com",
        "object-src 'none'",
        "base-uri 'self'",
      ].join("; ")
    );
  });

  test("turned off in notra.json", () => {
    expect(
      buildSiteContentSecurityPolicy({
        integrations: {},
        security: { contentSecurityPolicy: false, allowedOrigins: [] },
        scriptHashes: ["aaa="],
      })
    ).toBeNull();
  });
});
