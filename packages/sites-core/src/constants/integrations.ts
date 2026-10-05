export const SITE_INTEGRATION_NAMES = [
  "databuddy",
  "plausible",
  "posthog",
  "ga4",
  "gtm",
  "umami",
  "fathom",
  "mixpanel",
  "amplitude",
  "segment",
  "hotjar",
  "clarity",
  "intercom",
  "crisp",
] as const;

export const DATABUDDY_SCRIPT_URL = "https://cdn.databuddy.cc/databuddy.js";
export const DATABUDDY_CONNECT_ORIGIN = "https://basket.databuddy.cc";
/** notra.json option → the script tag's data attribute (databuddy.cc/docs/sdk/configuration). */
export const DATABUDDY_TRACKING_ATTRIBUTES = [
  ["trackWebVitals", "data-track-web-vitals"],
  ["trackErrors", "data-track-errors"],
  ["trackPerformance", "data-track-performance"],
  ["trackOutgoingLinks", "data-track-outgoing-links"],
  ["trackInteractions", "data-track-interactions"],
  ["trackAttributes", "data-track-attributes"],
] as const;

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

export const MIXPANEL_REGIONS = ["us", "eu", "in"] as const;
/** Mixpanel's data residency hosts (docs.mixpanel.com/docs/tracking-methods/sdks/javascript). */
export const MIXPANEL_API_HOSTS = {
  us: "https://api.mixpanel.com",
  eu: "https://api-eu.mixpanel.com",
  in: "https://api-in.mixpanel.com",
} as const;
/** mixpanel-2-latest.min.js and the async modules (recorder, targeting) load from here. */
export const MIXPANEL_CDN_ORIGIN = "https://cdn.mxpnl.com";
/**
 * The snippet's documented override: without it, a page served over http
 * loads the library over http, which the https-only CSP then blocks.
 */
export const MIXPANEL_LIB_URL_OVERRIDE =
  'var MIXPANEL_CUSTOM_LIB_URL="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";';
/** Mixpanel's official HTML snippet: queues calls and loads mixpanel-2-latest.min.js. */
export const MIXPANEL_LOADER =
  '(function (f, b) { if (!b.__SV) { var e, g, i, h; window.mixpanel = b; b._i = []; b.init = function (e, f, c) { function g(a, d) { var b = d.split("."); 2 == b.length && ((a = a[b[0]]), (d = b[1])); a[d] = function () { a.push([d].concat(Array.prototype.slice.call(arguments, 0))); }; } var a = b; "undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel"); a.people = a.people || []; a.toString = function (a) { var d = "mixpanel"; "mixpanel" !== c && (d += "." + c); a || (d += " (stub)"); return d; }; a.people.toString = function () { return a.toString(1) + ".people (stub)"; }; i = "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split( " "); for (h = 0; h < i.length; h++) g(a, i[h]); var j = "set set_once union unset remove delete".split(" "); a.get_group = function () { function b(c) { d[c] = function () { call2_args = arguments; call2 = [c].concat(Array.prototype.slice.call(call2_args, 0)); a.push([e, call2]); }; } for ( var d = {}, e = ["get_group"].concat( Array.prototype.slice.call(arguments, 0)), c = 0; c < j.length; c++) b(j[c]); return d; }; b._i.push([e, f, c]); }; b.__SV = 1.2; e = f.createElement("script"); e.type = "text/javascript"; e.async = !0; e.src = "undefined" !== typeof MIXPANEL_CUSTOM_LIB_URL ? MIXPANEL_CUSTOM_LIB_URL : "file:" === f.location.protocol && "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//) ? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js" : "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"; g = f.getElementsByTagName("script")[0]; g.parentNode.insertBefore(e, g); } })(document, window.mixpanel || []);';

export const AMPLITUDE_SERVER_ZONES = ["us", "eu"] as const;
/**
 * Amplitude's CSP guide asks for the wildcard in script-src and connect-src:
 * the CDN, the US (api2.amplitude.com) and EU (api.eu.amplitude.com) intake
 * and the remote config host are all subdomains.
 */
export const AMPLITUDE_CSP_ORIGIN = "https://*.amplitude.com";
/**
 * Amplitude's script loader for Browser SDK 2 (amplitude.com/docs/sdks/analytics/browser/browser-sdk-2),
 * pinned to a version with subresource integrity like the official snippet.
 */
export const AMPLITUDE_LOADER =
  '!function(){"use strict";!function(e,t){var r=e.amplitude||{_q:[],_iq:{}};if(r.invoked)e.console&&console.error&&console.error("Amplitude snippet has been loaded.");else{var n=function(e,t){e.prototype[t]=function(){return this._q.push({name:t,args:Array.prototype.slice.call(arguments,0)}),this}},s=function(e,t,r){return function(n){e._q.push({name:t,args:Array.prototype.slice.call(r,0),resolve:n})}},o=function(e,t,r){e[t]=function(){if(r)return{promise:new Promise(s(e,t,Array.prototype.slice.call(arguments)))};!function(e,t,r){e._q.push({name:t,args:Array.prototype.slice.call(r,0)})}(e,t,Array.prototype.slice.call(arguments))}},i=function(e){for(var t=0;t<v.length;t++)o(e,v[t],!1);for(var r=0;r<g.length;r++)o(e,g[r],!0)};r.invoked=!0;var a=t.createElement("script");a.type="text/javascript",a.integrity="sha384-RTQybE5H4H6uCtC3gXx2Y7xeDTADZHEZf8qf6y0WeZbtGGVNpYEailMtUOgAA93+",a.crossOrigin="anonymous",a.async=!0,a.src="https://cdn.amplitude.com/libs/analytics-browser-2.47.2-min.js.gz",a.onload=function(){e.amplitude.runQueuedFunctions||console.log("[Amplitude] Error: could not load SDK")};var c=t.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c);for(var u=function(){return this._q=[],this},p=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove","getUserProperties"],l=0;l<p.length;l++)n(u,p[l]);r.Identify=u;for(var d=function(){return this._q=[],this},f=["getEventProperties","setProductId","setQuantity","setPrice","setRevenue","setRevenueType","setReceipt","setReceiptSig","setCurrency","setEventProperties"],y=0;y<f.length;y++)n(d,f[y]);r.Revenue=d;var v=["getDeviceId","setDeviceId","getSessionId","setSessionId","getUserId","setUserId","setOptOut","setTransport","reset","extendSession"],g=["init","add","remove","track","logEvent","identify","groupIdentify","setGroup","revenue","flush"];i(r),r.createInstance=function(e){return r._iq[e]={_q:[]},i(r._iq[e]),r._iq[e]},e.amplitude=r}}(window,document)}();';

/** analytics.js loads from the CDN; events go to api.segment.io (Segment's Analytics.js FAQ on CSP). */
export const SEGMENT_CDN_ORIGIN = "https://cdn.segment.com";
export const SEGMENT_API_ORIGIN = "https://api.segment.io";
/**
 * Segment's official Analytics.js 2.0 snippet (5.2.1) up to the write key;
 * `segmentSnippet` appends the key, `load` and the first `page` call.
 */
export const SEGMENT_LOADER_PREFIX =
  '!function(){var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel=\'canonical\']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};';
export const SEGMENT_SNIPPET_VERSION = "5.2.1";

/** Hotjar's tracking code version (`hjsv`) when notra.json doesn't set one. */
export const HOTJAR_DEFAULT_VERSION = 6;
/** Hotjar's CSP guide: scripts from static./script.hotjar.com, data over https and wss. */
export const HOTJAR_SCRIPT_ORIGIN = "https://*.hotjar.com";
export const HOTJAR_CONNECT_ORIGINS = [
  "https://*.hotjar.com",
  "https://*.hotjar.io",
  "wss://*.hotjar.com",
] as const;

/** Clarity load-balances between a–z.clarity.ms and www.clarity.ms (learn.microsoft.com/clarity, CSP). */
export const CLARITY_CSP_ORIGIN = "https://*.clarity.ms";
export const CLARITY_CONNECT_ORIGINS = [
  "https://*.clarity.ms",
  "https://c.bing.com",
] as const;

export const INTERCOM_REGIONS = ["us", "eu", "au"] as const;
/** `api_base` per workspace hosting region (developers.intercom.com, installation). */
export const INTERCOM_API_BASES = {
  us: "https://api-iam.intercom.io",
  eu: "https://api-iam.eu.intercom.io",
  au: "https://api-iam.au.intercom.io",
} as const;
/** Intercom's CSP article, source allowlisting: script-src. */
export const INTERCOM_SCRIPT_ORIGINS = [
  "https://app.intercom.io",
  "https://widget.intercom.io",
  "https://js.intercomcdn.com",
] as const;
/**
 * Intercom's CSP article, connect-src, for every region: the Messenger picks
 * its realtime host at runtime, so the list isn't narrowed per region.
 */
export const INTERCOM_CONNECT_ORIGINS = [
  "https://via.intercom.io",
  "https://api.intercom.io",
  "https://api.au.intercom.io",
  "https://api.eu.intercom.io",
  "https://api-iam.intercom.io",
  "https://api-iam.eu.intercom.io",
  "https://api-iam.au.intercom.io",
  "https://api-ping.intercom.io",
  "https://*.intercom-messenger.com",
  "wss://*.intercom-messenger.com",
  "https://nexus-websocket-a.intercom.io",
  "wss://nexus-websocket-a.intercom.io",
  "https://nexus-websocket-b.intercom.io",
  "wss://nexus-websocket-b.intercom.io",
  "https://nexus-europe-websocket.intercom.io",
  "wss://nexus-europe-websocket.intercom.io",
  "https://nexus-australia-websocket.intercom.io",
  "wss://nexus-australia-websocket.intercom.io",
  "https://uploads.intercomcdn.com",
  "https://uploads.intercomcdn.eu",
  "https://uploads.au.intercomcdn.com",
  "https://uploads.eu.intercomcdn.com",
  "https://uploads.intercomusercontent.com",
] as const;
/** Intercom's official Messenger loader; reads `window.intercomSettings` set just before it. */
export const INTERCOM_LOADER =
  "(function(){var w=window;var ic=w.Intercom;if(typeof ic===\"function\"){ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/' + APP_ID;var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();";

export const CRISP_SCRIPT_URL = "https://client.crisp.chat/l.js";
/** Crisp's CSP example (docs.crisp.chat, Crisp domain names). */
export const CRISP_SCRIPT_ORIGIN = "https://*.crisp.chat";
export const CRISP_CONNECT_ORIGINS = [
  "https://*.crisp.chat",
  "wss://*.relay.crisp.chat",
  "wss://*.relay.rescue.crisp.chat",
] as const;
/**
 * The chatbox fetches short-lived Web Workers from crisp.chat and runs them
 * from blob: URLs. Without a worker-src they fall back to script-src, which
 * has no blob:.
 */
export const CRISP_WORKER_SOURCES = ["blob:", "https://*.crisp.chat"] as const;
