export const SITE_INTEGRATION_NAMES = [
  "databuddy",
  "plausible",
  "posthog",
  "ga4",
  "gtm",
  "umami",
  "fathom",
] as const;

export const DATABUDDY_SCRIPT_URL = "https://cdn.databuddy.cc/databuddy.js";
export const DATABUDDY_CONNECT_ORIGIN = "https://basket.databuddy.cc";

/** Plausible's classic `data-domain` script; events go to `/api/event` on the script's origin. */
export const PLAUSIBLE_SCRIPT_URL = "https://plausible.io/js/script.js";

export const POSTHOG_DEFAULT_API_HOST = "https://us.i.posthog.com";
/** PostHog asks for the wildcard: ingestion and asset hosts move between regions. */
export const POSTHOG_CSP_ORIGIN = "https://*.posthog.com";
/**
 * PostHog's official snippet stub: queues calls and loads `array.js` from the
 * assets host of `api_host` (or `{api_host}/static/array.js` behind a proxy).
 */
export const POSTHOG_LOADER =
  '!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);';

/** gtag.js (GA4) and gtm.js both load from here. */
export const GOOGLE_TAG_ORIGIN = "https://www.googletagmanager.com";
/** Google's CSP guide for GA4: hits go to regional google-analytics.com / analytics.google.com hosts. */
export const GOOGLE_ANALYTICS_CONNECT_ORIGINS = [
  "https://*.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
] as const;

export const UMAMI_CLOUD_SCRIPT_URL = "https://cloud.umami.is/script.js";
/** Umami Cloud sends events to gateway hosts that have changed before (gateway.umami.is, api-gateway.umami.dev). */
export const UMAMI_CLOUD_CONNECT_ORIGINS = [
  "https://*.umami.is",
  "https://*.umami.dev",
] as const;

export const FATHOM_SCRIPT_URL = "https://cdn.usefathom.com/script.js";
export const FATHOM_ORIGIN = "https://cdn.usefathom.com";
