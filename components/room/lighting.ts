// One lighting choice for the whole Pocket Room: the landing diorama and the little
// room in a post's margin both follow it, so they always feel like the same world.
// Framework-free so the inline boot script, server components and the client share it.

export type LightingName = "day" | "dusk" | "night";
export type LightingChoice = "auto" | LightingName;

export const LIGHTING_KEY = "virpo-room-lighting";
export const LIGHTING_NAMES: readonly LightingName[] = ["day", "dusk", "night"];
const STYLE_ID = "room-lighting";

/** Tokyo hour → lighting. Day 6–16, dusk 16–19 and 5–6, night otherwise. */
export function lightingForHour(hour: number): LightingName {
  if (hour >= 6 && hour < 16) return "day";
  if ((hour >= 16 && hour < 19) || hour === 5) return "dusk";
  return "night";
}

/** CSS that shows only the matching still layer (see `data-room-still` / `data-time`). */
export function stillCss(name: LightingName) {
  return `[data-room-still]>[data-time]{display:none!important}[data-room-still]>[data-time="${name}"]{display:block!important}`;
}

/**
 * Inline script run before the room paints: resolves `?time=`, the saved choice or the
 * Tokyo clock, remembers it on `window.__roomLighting`, and injects the still CSS so
 * the right still shows from the first frame (no day flash at night).
 */
export const LIGHTING_BOOT_SCRIPT = `(function(){try{var n=["day","dusk","night"],c=null;try{c=localStorage.getItem("${LIGHTING_KEY}")}catch(e){}var q=new URLSearchParams(location.search).get("time");if(n.indexOf(q)>=0)c=q;if(n.indexOf(c)<0){var h=+new Intl.DateTimeFormat("en-GB",{hour:"2-digit",hourCycle:"h23",timeZone:"Asia/Tokyo"}).format(new Date());c=h>=6&&h<16?"day":(h>=16&&h<19)||h===5?"dusk":"night"}window.__roomLighting=c;var s=document.getElementById("${STYLE_ID}")||document.createElement("style");s.id="${STYLE_ID}";s.textContent='[data-room-still]>[data-time]{display:none!important}[data-room-still]>[data-time="'+c+'"]{display:block!important}';document.head.appendChild(s)}catch(e){}})();`;

/** Switch the still layers after boot (the lighting switch on the landing). */
export function applyStillLighting(name: LightingName) {
  if (typeof document === "undefined") return;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = stillCss(name);
  (window as unknown as { __roomLighting?: LightingName }).__roomLighting = name;
}

export function readSavedChoice(): LightingChoice | null {
  try {
    const saved = window.localStorage.getItem(LIGHTING_KEY) as LightingChoice | null;
    if (saved && ["auto", "day", "dusk", "night"].includes(saved)) return saved;
  } catch {
    /* storage blocked */
  }
  return null;
}

export function saveChoice(choice: LightingChoice) {
  try {
    window.localStorage.setItem(LIGHTING_KEY, choice);
  } catch {
    /* ignore */
  }
}

/** What the page is showing right now (boot script result, or day on the server). */
export function currentLighting(): LightingName {
  if (typeof window === "undefined") return "day";
  const value = (window as unknown as { __roomLighting?: LightingName }).__roomLighting;
  return value && LIGHTING_NAMES.includes(value) ? value : "day";
}
