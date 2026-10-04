import {
  DATABUDDY_CONNECT_ORIGIN,
  DATABUDDY_SCRIPT_URL,
  FATHOM_ORIGIN,
  FATHOM_SCRIPT_URL,
  GOOGLE_ANALYTICS_CONNECT_ORIGINS,
  GOOGLE_TAG_ORIGIN,
  PLAUSIBLE_SCRIPT_URL,
  POSTHOG_CSP_ORIGIN,
  POSTHOG_DEFAULT_API_HOST,
  POSTHOG_LOADER,
  UMAMI_CLOUD_CONNECT_ORIGINS,
  UMAMI_CLOUD_SCRIPT_URL,
} from "@notra/sites-core/constants/integrations";
import type {
  SiteCspSources,
  SiteHeadScript,
  SiteIntegrations,
} from "@notra/sites-core/types/site-integrations";

/**
 * A value as a JavaScript literal that is safe inside an inline <script>:
 * JSON-encoded, with `<` and the JS line separators escaped so it can never
 * close the element or break the string.
 */
export function inlineScriptLiteral(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

/** The `<head>` scripts for every configured integration, in a fixed order. */
export function integrationHeadScripts(
  integrations: SiteIntegrations
): SiteHeadScript[] {
  const scripts: SiteHeadScript[] = [];
  const { databuddy, plausible, posthog, ga4, gtm, umami, fathom } =
    integrations;

  if (databuddy) {
    const attributes: Record<string, string | true> = {
      "data-client-id": databuddy.clientId,
      crossorigin: "anonymous",
      async: true,
    };
    if (databuddy.trackWebVitals) {
      attributes["data-track-web-vitals"] = true;
    }
    if (databuddy.trackErrors) {
      attributes["data-track-errors"] = true;
    }
    scripts.push({ kind: "external", src: DATABUDDY_SCRIPT_URL, attributes });
  }
  if (plausible) {
    scripts.push({
      kind: "external",
      src: plausible.scriptUrl ?? PLAUSIBLE_SCRIPT_URL,
      attributes: { "data-domain": plausible.domain, defer: true },
    });
  }
  if (posthog) {
    const options = { api_host: posthog.apiHost ?? POSTHOG_DEFAULT_API_HOST };
    scripts.push({
      kind: "inline",
      code: `${POSTHOG_LOADER}posthog.init(${inlineScriptLiteral(posthog.apiKey)},${inlineScriptLiteral(options)});`,
    });
  }
  if (ga4) {
    const id = encodeURIComponent(ga4.measurementId);
    scripts.push(
      {
        kind: "external",
        src: `${GOOGLE_TAG_ORIGIN}/gtag/js?id=${id}`,
        attributes: { async: true },
      },
      {
        kind: "inline",
        code: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config",${inlineScriptLiteral(ga4.measurementId)});`,
      }
    );
  }
  if (gtm) {
    // Google's container snippet without the nonce lookup; the CSP allows it by hash.
    scripts.push({
      kind: "inline",
      code: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";j.async=true;j.src="${GOOGLE_TAG_ORIGIN}/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);})(window,document,"script","dataLayer",${inlineScriptLiteral(gtm.tagId)});`,
    });
  }
  if (umami) {
    scripts.push({
      kind: "external",
      src: umami.scriptUrl ?? UMAMI_CLOUD_SCRIPT_URL,
      attributes: { "data-website-id": umami.websiteId, defer: true },
    });
  }
  if (fathom) {
    scripts.push({
      kind: "external",
      src: FATHOM_SCRIPT_URL,
      attributes: { "data-site": fathom.siteId, defer: true },
    });
  }
  return scripts;
}

/** The origins the configured integrations load scripts from and send events to. */
export function integrationCspSources(
  integrations: SiteIntegrations
): SiteCspSources {
  const scriptSrc: string[] = [];
  const connectSrc: string[] = [];
  const { databuddy, plausible, posthog, ga4, gtm, umami, fathom } =
    integrations;

  if (databuddy) {
    scriptSrc.push(new URL(DATABUDDY_SCRIPT_URL).origin);
    connectSrc.push(DATABUDDY_CONNECT_ORIGIN);
  }
  if (plausible) {
    // The classic script posts to `/api/event` on its own origin.
    const origin = new URL(plausible.scriptUrl ?? PLAUSIBLE_SCRIPT_URL).origin;
    scriptSrc.push(origin);
    connectSrc.push(origin);
  }
  if (posthog) {
    scriptSrc.push(POSTHOG_CSP_ORIGIN);
    connectSrc.push(POSTHOG_CSP_ORIGIN);
    if (posthog.apiHost) {
      // A reverse proxy serves array.js and takes events on its own origin.
      const origin = new URL(posthog.apiHost).origin;
      scriptSrc.push(origin);
      connectSrc.push(origin);
    }
  }
  if (ga4 || gtm) {
    scriptSrc.push(GOOGLE_TAG_ORIGIN);
    connectSrc.push(...GOOGLE_ANALYTICS_CONNECT_ORIGINS);
  }
  if (umami) {
    const origin = new URL(umami.scriptUrl ?? UMAMI_CLOUD_SCRIPT_URL).origin;
    scriptSrc.push(origin);
    // Self-hosted Umami sends events to the script's origin.
    connectSrc.push(
      ...(umami.scriptUrl ? [origin] : UMAMI_CLOUD_CONNECT_ORIGINS)
    );
  }
  if (fathom) {
    scriptSrc.push(FATHOM_ORIGIN);
    connectSrc.push(FATHOM_ORIGIN);
  }
  return { scriptSrc, connectSrc };
}
