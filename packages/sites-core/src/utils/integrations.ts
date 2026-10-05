import {
  AMPLITUDE_CSP_ORIGIN,
  AMPLITUDE_LOADER,
  CLARITY_CONNECT_ORIGINS,
  CLARITY_CSP_ORIGIN,
  CRISP_CONNECT_ORIGINS,
  CRISP_SCRIPT_ORIGIN,
  CRISP_SCRIPT_URL,
  CRISP_WORKER_SOURCES,
  DATABUDDY_CONNECT_ORIGIN,
  DATABUDDY_SCRIPT_URL,
  FATHOM_ORIGIN,
  FATHOM_SCRIPT_URL,
  GOOGLE_ANALYTICS_CONNECT_ORIGINS,
  GOOGLE_TAG_ORIGIN,
  HOTJAR_CONNECT_ORIGINS,
  HOTJAR_DEFAULT_VERSION,
  HOTJAR_SCRIPT_ORIGIN,
  INTERCOM_API_BASES,
  INTERCOM_CONNECT_ORIGINS,
  INTERCOM_LOADER,
  INTERCOM_SCRIPT_ORIGINS,
  MIXPANEL_API_HOSTS,
  MIXPANEL_CDN_ORIGIN,
  MIXPANEL_LIB_URL_OVERRIDE,
  MIXPANEL_LOADER,
  PLAUSIBLE_SCRIPT_URL,
  POSTHOG_CSP_ORIGIN,
  POSTHOG_DEFAULT_API_HOST,
  POSTHOG_LOADER,
  SEGMENT_API_ORIGIN,
  SEGMENT_CDN_ORIGIN,
  SEGMENT_LOADER_PREFIX,
  SEGMENT_SNIPPET_VERSION,
  UMAMI_CLOUD_CONNECT_ORIGINS,
  UMAMI_CLOUD_SCRIPT_URL,
  DATABUDDY_TRACKING_ATTRIBUTES,
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

/** Segment's snippet: the shared stub, then the write key, `load` and the first page call. */
function segmentSnippet(writeKey: string): string {
  const key = inlineScriptLiteral(writeKey);
  return `${SEGMENT_LOADER_PREFIX}analytics._writeKey=${key};analytics.SNIPPET_VERSION=${inlineScriptLiteral(SEGMENT_SNIPPET_VERSION)};analytics.load(${key});analytics.page();}}();`;
}

/** The `<head>` scripts for every configured integration, in a fixed order. */
export function integrationHeadScripts(
  integrations: SiteIntegrations
): SiteHeadScript[] {
  const scripts: SiteHeadScript[] = [];
  const { databuddy, plausible, posthog, ga4, gtm, umami, fathom } =
    integrations;
  const { mixpanel, amplitude, segment, hotjar, clarity, intercom, crisp } =
    integrations;

  if (databuddy) {
    const attributes: Record<string, string | true> = {
      "data-client-id": databuddy.clientId,
      crossorigin: "anonymous",
      async: true,
    };
    for (const [option, attribute] of DATABUDDY_TRACKING_ATTRIBUTES) {
      if (databuddy[option]) {
        attributes[attribute] = true;
      }
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
  if (mixpanel) {
    // Mixpanel's quickstart init: autocapture plus page views, sent to the project's region.
    const options = {
      api_host: MIXPANEL_API_HOSTS[mixpanel.region],
      autocapture: true,
      track_pageview: true,
    };
    scripts.push({
      kind: "inline",
      code: `${MIXPANEL_LIB_URL_OVERRIDE}${MIXPANEL_LOADER}mixpanel.init(${inlineScriptLiteral(mixpanel.projectToken)},${inlineScriptLiteral(options)});`,
    });
  }
  if (amplitude) {
    const options = { serverZone: amplitude.serverZone.toUpperCase() };
    scripts.push({
      kind: "inline",
      code: `${AMPLITUDE_LOADER}amplitude.init(${inlineScriptLiteral(amplitude.apiKey)},${inlineScriptLiteral(options)});`,
    });
  }
  if (segment) {
    scripts.push({ kind: "inline", code: segmentSnippet(segment.writeKey) });
  }
  if (hotjar) {
    const settings = {
      hjid: hotjar.siteId,
      hjsv: hotjar.version ?? HOTJAR_DEFAULT_VERSION,
    };
    // Hotjar's tracking code with the settings object passed in as a literal.
    scripts.push({
      kind: "inline",
      code: `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings=${inlineScriptLiteral(settings)};a=o.getElementsByTagName("head")[0];r=o.createElement("script");r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,"https://static.hotjar.com/c/hotjar-",".js?sv=");`,
    });
  }
  if (clarity) {
    scripts.push({
      kind: "inline",
      code: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${inlineScriptLiteral(clarity.projectId)});`,
    });
  }
  if (intercom) {
    const settings = {
      api_base: INTERCOM_API_BASES[intercom.region],
      app_id: intercom.appId,
    };
    // The loader reads APP_ID; the official snippet declares it the same way.
    scripts.push({
      kind: "inline",
      code: `var APP_ID=${inlineScriptLiteral(intercom.appId)};window.intercomSettings=${inlineScriptLiteral(settings)};${INTERCOM_LOADER}`,
    });
  }
  if (crisp) {
    scripts.push({
      kind: "inline",
      code: `window.$crisp=[];window.CRISP_WEBSITE_ID=${inlineScriptLiteral(crisp.websiteId)};(function(){var d=document;var s=d.createElement("script");s.src=${inlineScriptLiteral(CRISP_SCRIPT_URL)};s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
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
  const workerSrc: string[] = [];
  const { databuddy, plausible, posthog, ga4, gtm, umami, fathom } =
    integrations;
  const { mixpanel, amplitude, segment, hotjar, clarity, intercom, crisp } =
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
  if (mixpanel) {
    scriptSrc.push(MIXPANEL_CDN_ORIGIN);
    connectSrc.push(MIXPANEL_API_HOSTS[mixpanel.region]);
  }
  if (amplitude) {
    scriptSrc.push(AMPLITUDE_CSP_ORIGIN);
    connectSrc.push(AMPLITUDE_CSP_ORIGIN);
  }
  if (segment) {
    scriptSrc.push(SEGMENT_CDN_ORIGIN);
    // Analytics.js fetches its settings from the CDN and sends events to the API.
    connectSrc.push(SEGMENT_CDN_ORIGIN, SEGMENT_API_ORIGIN);
  }
  if (hotjar) {
    scriptSrc.push(HOTJAR_SCRIPT_ORIGIN);
    connectSrc.push(...HOTJAR_CONNECT_ORIGINS);
  }
  if (clarity) {
    scriptSrc.push(CLARITY_CSP_ORIGIN);
    connectSrc.push(...CLARITY_CONNECT_ORIGINS);
  }
  if (intercom) {
    scriptSrc.push(...INTERCOM_SCRIPT_ORIGINS);
    connectSrc.push(...INTERCOM_CONNECT_ORIGINS);
  }
  if (crisp) {
    scriptSrc.push(CRISP_SCRIPT_ORIGIN);
    connectSrc.push(...CRISP_CONNECT_ORIGINS);
    workerSrc.push(...CRISP_WORKER_SOURCES);
  }
  return { scriptSrc, connectSrc, workerSrc };
}
