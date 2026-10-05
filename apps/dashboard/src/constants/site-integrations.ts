import {
  AMPLITUDE_SERVER_ZONES,
  INTERCOM_REGIONS,
  MIXPANEL_REGIONS,
} from "@notra/sites-core/constants/integrations";
import { Databuddy } from "@notra/ui/components/ui/svgs/databuddy";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { GoogleAnalytics } from "@notra/ui/components/ui/svgs/googleAnalytics";
import { Plausible } from "@notra/ui/components/ui/svgs/plausible";
import { PostHog } from "@notra/ui/components/ui/svgs/posthog";

import type { SiteIntegrationProvider } from "@/types/site-integrations";

/**
 * The analytics and chat presets notra.json supports, in the order the Integrations tab
 * shows them. Field keys are notra.json keys; labels and hints live in the
 * `sites.integrationsPage` messages. The first field is the one the card shows.
 */
export const SITE_INTEGRATION_PROVIDERS: readonly SiteIntegrationProvider[] = [
  {
    id: "databuddy",
    name: "Databuddy",
    logo: Databuddy,
    docsUrl: "https://www.databuddy.cc/docs",
    fields: [
      { key: "clientId", kind: "text", placeholder: "3ed1fce1-5a56-…" },
      { key: "trackWebVitals", kind: "switch" },
      { key: "trackErrors", kind: "switch" },
      { key: "trackPerformance", kind: "switch" },
      { key: "trackOutgoingLinks", kind: "switch" },
      { key: "trackInteractions", kind: "switch" },
      { key: "trackAttributes", kind: "switch" },
    ],
  },
  {
    id: "plausible",
    name: "Plausible",
    logo: Plausible,
    docsUrl: "https://plausible.io/docs",
    fields: [
      { key: "domain", kind: "text", placeholder: "acme.com" },
      {
        key: "scriptUrl",
        kind: "text",
        placeholder: "https://plausible.io/js/script.js",
        optional: true,
      },
    ],
  },
  {
    id: "posthog",
    name: "PostHog",
    logo: PostHog,
    docsUrl: "https://posthog.com/docs",
    fields: [
      { key: "apiKey", kind: "text", placeholder: "phc_…" },
      {
        key: "apiHost",
        kind: "text",
        placeholder: "https://us.i.posthog.com",
        optional: true,
      },
    ],
  },
  {
    id: "ga4",
    name: "Google Analytics",
    logo: GoogleAnalytics,
    docsUrl: "https://support.google.com/analytics/answer/9539598",
    fields: [
      { key: "measurementId", kind: "text", placeholder: "G-XXXXXXXXXX" },
    ],
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    logo: Google,
    docsUrl: "https://support.google.com/tagmanager/answer/6103696",
    fields: [{ key: "tagId", kind: "text", placeholder: "GTM-XXXXXXX" }],
  },
  {
    id: "umami",
    name: "Umami",
    logo: null,
    docsUrl: "https://umami.is/docs",
    fields: [
      {
        key: "websiteId",
        kind: "text",
        placeholder: "94db1cb1-74f4-4a40-ad6c-962362670409",
      },
      {
        key: "scriptUrl",
        kind: "text",
        placeholder: "https://cloud.umami.is/script.js",
        optional: true,
      },
    ],
  },
  {
    id: "fathom",
    name: "Fathom",
    logo: null,
    docsUrl: "https://usefathom.com/docs",
    fields: [{ key: "siteId", kind: "text", placeholder: "ABCDEFGH" }],
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    logo: null,
    docsUrl: "https://docs.mixpanel.com/docs/tracking-methods/sdks/javascript",
    fields: [
      {
        key: "projectToken",
        kind: "text",
        placeholder: "0123456789abcdef0123456789abcdef",
      },
      { key: "region", kind: "select", options: MIXPANEL_REGIONS },
    ],
  },
  {
    id: "amplitude",
    name: "Amplitude",
    logo: null,
    docsUrl: "https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2",
    fields: [
      {
        key: "apiKey",
        kind: "text",
        placeholder: "0123456789abcdef0123456789abcdef",
      },
      { key: "serverZone", kind: "select", options: AMPLITUDE_SERVER_ZONES },
    ],
  },
  {
    id: "segment",
    name: "Segment",
    logo: null,
    docsUrl:
      "https://www.twilio.com/docs/segment/connections/sources/catalog/libraries/website/javascript/quickstart",
    fields: [{ key: "writeKey", kind: "text", placeholder: "AbC123…" }],
  },
  {
    id: "hotjar",
    name: "Hotjar",
    logo: null,
    docsUrl:
      "https://help.hotjar.com/hc/en-us/articles/36819972345105-How-to-Install-Your-Hotjar-Tracking-Code",
    fields: [
      { key: "siteId", kind: "text", placeholder: "1234567" },
      { key: "version", kind: "text", placeholder: "6", optional: true },
    ],
  },
  {
    id: "clarity",
    name: "Microsoft Clarity",
    logo: null,
    docsUrl:
      "https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup",
    fields: [{ key: "projectId", kind: "text", placeholder: "abcd1234ef" }],
  },
  {
    id: "intercom",
    name: "Intercom",
    logo: null,
    docsUrl:
      "https://developers.intercom.com/installing-intercom/web/installation",
    fields: [
      { key: "appId", kind: "text", placeholder: "abc12345" },
      { key: "region", kind: "select", options: INTERCOM_REGIONS },
    ],
  },
  {
    id: "crisp",
    name: "Crisp",
    logo: null,
    docsUrl: "https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/",
    fields: [
      {
        key: "websiteId",
        kind: "text",
        placeholder: "6a2b3c4d-1e2f-4a5b-8c9d-0e1f2a3b4c5d",
      },
    ],
  },
];
