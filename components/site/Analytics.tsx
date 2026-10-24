// PostHog for the whole site, set up the same way as /levels (same project and proxy): no cookies
// (persistence in memory), no autocapture or recordings, page views only, and URLs stripped of
// their query and #fragment. Events are sent with track(); posts send "prompt_copied".

const STUB = "!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(\".\");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement(\"script\")).type=\"text/javascript\",p.crossOrigin=\"anonymous\",p.async=!0,p.src=s.api_host.replace(\".i.posthog.com\",\"-assets.i.posthog.com\")+\"/static/array.js\",(r=t.getElementsByTagName(\"script\")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a=\"posthog\",u.people=u.people||[],u.toString=function(t){var e=\"posthog\";return\"posthog\"!==a&&(e+=\".\"+a),t||(e+=\" (stub)\"),e},u.people.toString=function(){return u.toString(1)+\".people (stub)\"},o=\"init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset identify alias people.set people.set_once set_config\".split(\" \"),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);";

const INIT = `posthog.init("phc_uWroweFWw8Dv3dKRJ95SyDMLi25okMytsdwMX8jiYBLY", {
  api_host: "https://levels-virpo.netlify.app/ingest", ui_host: "https://eu.posthog.com",
  persistence: "memory", person_profiles: "identified_only", capture_pageview: "history_change", autocapture: false,
  disable_capture_url_hashes: true, get_current_url: () => location.origin + location.pathname,
  before_send: (event) => {
    const scrub = (v) => typeof v === "string" && /^https?:\\/\\//i.test(v) ? (() => { try { const u = new URL(v); return u.origin + u.pathname; } catch (_) { return ""; } })()
      : Array.isArray(v) ? v.map(scrub) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)])) : v;
    event.properties = scrub(event.properties);
    return event;
  },
  disable_session_recording: true, disable_surveys: true, capture_dead_clicks: false, capture_heatmaps: false, capture_performance: false,
});`;

export function Analytics() {
  return <script dangerouslySetInnerHTML={{ __html: `${STUB}\n${INIT}` }} />;
}

type PostHog = { capture: (event: string, properties?: Record<string, unknown>) => void };

/** Send one event to PostHog, if it loaded. */
export function track(event: string, properties?: Record<string, unknown>) {
  (window as unknown as { posthog?: PostHog }).posthog?.capture(event, properties);
}
