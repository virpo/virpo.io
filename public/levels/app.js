/* levels: the 100, always shown with a result. On arrival that's a real person's (the showcase); after the check it's
   yours, read from the link (#base64url JSON from check.md); opened from a card's link (?u=id) it is that card. */
(() => {
const D = JSON.parse(document.getElementById("data").textContent);
const L = D.levels, T = D.tiers, ICON = D.icons || {}, ART = D.art || {}, SHOW = D.showcase || [];
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tierOf = n => T[Math.min(9, Math.max(0, Math.ceil(n / 10) - 1))];
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const track = (e, p) => { try { window.posthog?.capture("levels_" + e, p); } catch {} };
const SITE = D.site, PROMPT = D.prompt;
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const OG = new URLSearchParams(location.search).get("og");
const TOUCH = matchMedia("(hover: none) and (pointer: coarse)").matches;   /* a phone or tablet: the check runs on a computer */
const day = at => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/* ---------- results */
/* results carry the version of the list they were judged against. An older result is read by level id: each answer moves
   to wherever that level is now, a level that absorbed others counts the best answer among them, and a level that didn't
   exist yet is "?". A level that was dropped just drops out. */
const V = 4;
const PAST = (() => {
  const at = new Map(L.map(l => [l.id, l.n])), where = id => at.get(id) || at.get(D.past.absorbed[id]) || 0;
  return Object.fromEntries(Object.entries(D.past.versions).map(([v, order]) => { const to = order.map(where); return [v, {
    n: n => to[n - 1] || 0,
    s: s => L.map(l => { const own = to.flatMap((n, i) => n === l.n ? [s[i]] : []); return "ysn?".split("").find(c => own.includes(c)) || "?"; }).join(""),
  }]; }));
})();
function norm(p) {
  if (!p || typeof p.s !== "string" || !/^[yns?]{100}$/.test(p.s)) return null;
  if (p.v != null && p.v !== V) {
    const m = PAST[p.v];
    if (!m) return null;
    p = { ...p, s: m.s(p.s), was: { v: p.v, s: p.s }, p: (Array.isArray(p.p) ? p.p : []).map(x => [m.n(+x?.[0]), x?.[1]]),
      e: Object.fromEntries(Object.entries(p.e && typeof p.e === "object" ? p.e : {}).map(([k, v]) => [m.n(+k), v]).filter(([k]) => k)) };
  }
  return {
    s: p.s, was: p.was, name: String(p.name ?? "").slice(0, 32), pi: !!p.pi,
    a: (Array.isArray(p.a) ? p.a : []).slice(0, 6).map(x => String(x).slice(0, 40)),
    p: (Array.isArray(p.p) ? p.p : []).slice(0, 3).map(x => [Math.round(+x?.[0]) || 0, String(x?.[1] ?? "").slice(0, 160)]).filter(x => x[0] >= 1 && x[0] <= 100),
    e: Object.fromEntries(Object.entries(p.e && typeof p.e === "object" ? p.e : {}).slice(0, 40).map(([k, v]) => [String(+k), String(v).slice(0, 60)])),
    f: (Array.isArray(p.f) ? p.f : []).slice(0, 3).map(x => String(x).slice(0, 100)).filter(Boolean),   /* what the agent noticed: yours only, never published */
  };
}
function decode(h) {
  h = h.replace(/^#/, "");
  if (h.length < 40) return null;
  try {
    const b = atob(h.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((h.length + 3) % 4));
    return norm(JSON.parse(new TextDecoder().decode(Uint8Array.from(b, c => c.charCodeAt(0)))));
  } catch { return null; }
}
/* MODE: show (a showcase person, on arrival) · mine (your result, from the link) · pub (a published card)
   · chat (the prompt landed in a chat app that can't look at the computer, which sends people to #chat) */
let MODE = "show", SUBJ = null, WHO = null, OV = {}, SHARE_URL = null, LAST = store.get("levels-last");
/* CARD: the published card this page was opened for · FROM: the last card someone else sent you, kept in this browser so
   it can sit next to your own result · EX: Grug, the example caveman, on day 1 and day 400 */
let CARD = null, FROM = norm(store.get("levels-from"));
const EX = (D.examples || []).map(x => ({ name: x.name, r: norm(x.result) }));
const okey = () => "levels-ov-" + SUBJ.s;
/* y: their agent found it · self: ticked by hand · q: unsure · n */
const stateOf = (r, ov) => n => { const o = ov?.[n], a = r.s[n - 1];
  return o === "self" ? "self" : o === "no" ? "n" : a === "y" ? "y" : a === "s" ? "self" : a === "?" ? "q" : "n"; };
const st = n => SUBJ ? stateOf(SUBJ, MODE === "mine" ? OV : null)(n) : null;
const done = n => ["y", "self"].includes(st(n));
const levelOf = r => [...r.s].filter(c => c === "y" || c === "s").length;   /* as their agent and they answered, before any change here */
const canWait = () => MODE === "show" || MODE === "pub";   /* the page offers the check: nobody's own result is open */
const level = () => L.filter(l => done(l.n)).length;
const selfCount = () => L.filter(l => st(l.n) === "self").length;
const whose = () => MODE === "mine" ? "Your" : (WHO?.first || SUBJ.name.split(" ")[0] || "Their") + "'s";

/* ---------- small pieces */
const icon = n => ICON[L[n - 1].id] ? `<img src="${ICON[L[n - 1].id]}" alt="" width="34" height="34" loading="lazy">` : `<span>${n}</span>`;
const promptFor = l => [
  `Help me pick up level ${l.n} of the 100 at ${SITE}: "${l.title}". ${l.line}`,
  l.learn || "First show me one moment from my recent sessions, or from this project, where this would already have saved me time, so I see why it matters for me. Then set up the smallest version of it and show it working on something real of mine, not a toy example.",
  l.try ? `Worth a look: ${l.try.map(x => x.name).join(", ")}.` : "",
  "Ask before you install anything or change global settings. Finish with one thing about it most people don't know.",
].filter(Boolean).join(" ");
const tryHTML = (l, short) => !l.try ? "" : `<p class="try-t"><b>Try</b>${l.try.map(x => `<a href="${esc(x.url)}" rel="noopener" target="_blank">${esc(x.name)}</a>${x.note && !short ? ` <span>${esc(x.note)}</span>` : ""}`).join(" · ")}</p>`;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2600); }
async function copy(text) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }
const quote = (f, vs) => !f ? "" : `<blockquote class="quote${vs ? " vs" : ""}">${vs ? `<div class="vs-k">Pros disagree</div>` : ""}
  <p>${f.paraphrase || f.title || f.skill || f.repo || f.file ? esc(f.q) : "“" + esc(f.q) + "”"}</p>
  <cite>${f.x ? `<a href="https://x.com/${esc(f.x)}" rel="noopener" target="_blank">${esc(f.name)}</a>` : esc(f.name)}${f.paraphrase ? ", paraphrased" : ""} · <a href="${esc(f.url)}" rel="noopener" target="_blank">source</a></cite></blockquote>`;

/* ---------- cards */
const CAMERA = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 5.2c0-.6.5-1.1 1.1-1.1h1.6l1-1.4h3.6l1 1.4h1.6c.6 0 1.1.5 1.1 1.1v6.6c0 .6-.5 1.1-1.1 1.1H3.6c-.6 0-1.1-.5-1.1-1.1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="8" cy="8.4" r="2.3" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
function card(o) {
  return `<div class="tcard ${o.cls || ""}" style="--tc:var(--t${o.tier.n})"><div class="tc-in">
    <div class="tc-top"><div class="tc-lvl">${o.top}${o.small ? `<small>${o.small}</small>` : ""}</div><div class="tc-era">Tier ${o.tier.n}<b>${esc(o.tier.era)}</b></div></div>
    <div class="tc-art${o.photo ? " photo" : ""}${o.add ? " can-add" : ""}"${o.add ? " data-photo" : ""}>${o.img ? `<img src="${o.img}" alt="" style="object-position:${o.pos || "50% 50%"}">` : ""}${o.pi ? `<span class="tc-pi" title="Says please">π</span>` : ""}<div class="tc-name">${esc(o.name)}</div>${o.add ? `<button class="tc-add" type="button" data-photo>${CAMERA}<span>${o.add === "add" ? "Add your photo" : "Change photo"}</span></button>` : ""}</div>
    <div class="tc-body"><div class="tc-grid">${o.cells.map((c, i) => `<i data-n="${i + 1}" class="${c}"></i>`).join("")}</div>
    <div class="tc-lines">${o.lines.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div></div>
    <div class="tc-foot"><span>${esc(o.foot)}</span><b>levels</b></div></div><i class="hcard sheen"></i><i class="hcard glare"></i></div>`;
}
/* anyone's card. o: { st: their state per level, r: their result (picks, agents, π), name, photo, foot, add: the photo button } */
function resultCard(o, cls, blank) {
  const is = n => ["y", "self"].includes(o.st(n)), lv = L.filter(l => is(l.n)).length, t = tierOf(Math.max(1, lv));
  const best = [...L].reverse().find(l => o.st(l.n) === "y" && l.how !== "self") || [...L].reverse().find(l => is(l.n));
  const nx = o.r.p.find(p => !is(p[0]))?.[0] || L.find(l => !is(l.n))?.n;
  return card({ cls, tier: t, top: blank ? 0 : lv, small: "/100", img: o.photo || ART[t.n], photo: !!o.photo, pos: o.photo ? "50% 30%" : "50% 50%", name: o.name || t.name, pi: o.r.pi, add: o.add,
    cells: L.map(l => blank ? "" : o.st(l.n) === "y" ? "y" : o.st(l.n) === "self" ? "self" : ""),
    lines: [best && ["Best", `${best.n}. ${best.title}`], nx && ["Next", `${nx}. ${L[nx - 1].title}`], o.r.a.length && ["Uses", o.r.a.join(", ")]].filter(Boolean), foot: o.foot });
}
const cardName = () => ($("#card-name").value || "").trim();
function subjectCard(cls, blank) {
  const lv = level(), sc = selfCount(), add = MODE === "mine" && cls === "front" ? (WHO?.photo ? "change" : "add") : undefined;
  return resultCard({ st, r: SUBJ, photo: WHO?.photo, add, name: MODE === "mine" ? cardName() : SUBJ.name,
    foot: MODE === "chat" ? "a chat tab can't check" : sc ? `${lv - sc} found · ${sc} ticked` : `v${D.version} · checked locally` }, cls, blank);
}
const otherCard = (r, name, foot, cls) => resultCard({ st: stateOf(r), r, name, foot }, cls);
function fanHTML(blank) {
  /* on arrival, a real card between Grug on day 1 and on day 400, for scale; anyone's own result stands alone */
  if (MODE !== "show") return subjectCard("front", blank);
  const [noob, pro] = EX, ex = "an example, not a check";
  return otherCard(noob.r, noob.name, ex, "back-l") + otherCard(pro.r, pro.name, ex, "back-r") + subjectCard("front", blank);
}

/* the front card fills in, square by square, then the ticker walks through what the agent found */
let tickTimer = null, fillTimer = null;
function renderFan() {
  clearTimeout(fillTimer); clearInterval(tickTimer);
  const fan = $("#fan");
  if (calm || OG) { fan.innerHTML = fanHTML(false); return startTicker(); }
  fan.innerHTML = fanHTML(true);
  const cells = [...fan.querySelectorAll(".front .tc-grid i")], num = fan.querySelector(".front .tc-lvl");
  const order = L.filter(l => done(l.n)).map(l => [l.n, st(l.n) === "self" ? "self" : "y"]);
  let i = 0;
  const step = () => {
    const [n, c] = order[i]; cells[n - 1].className = c; i++;
    num.firstChild.textContent = i;
    if (i < order.length) fillTimer = setTimeout(step, 18); else setTimeout(startTicker, 500);
  };
  fillTimer = setTimeout(() => order.length ? step() : startTicker(), 350);
}
function startTicker() {
  const tk = $("#ticker"), ev = Object.entries(SUBJ.e).map(([n, v]) => [+n, v]).filter(([n]) => done(n)).sort((a, b) => a[0] - b[0]);
  const items = ev.length ? ev : L.filter(l => done(l.n)).map(l => [l.n, ""]);
  if (!items.length) { tk.textContent = ""; return; }
  let k = 0;
  const show = () => {
    const [n, v] = items[k % items.length], l = L[n - 1];
    $$("#fan .front .tc-grid i.hl").forEach(i => i.classList.remove("hl"));
    $(`#fan .front .tc-grid i[data-n="${n}"]`)?.classList.add("hl");
    tk.innerHTML = `<span class="n">${n}</span><b>${esc(l.title)}</b>${v ? `<span class="ev">${MODE === "mine" ? "Your" : whose()} agent found: ${esc(v)}</span>` : ""}`;
    tk.classList.remove("fade"); k++;
  };
  show();
  if (!calm && !OG) tickTimer = setInterval(() => { tk.classList.add("fade"); setTimeout(show, 260); }, 2800);
}

/* ---------- the list */
/* FILTER: all · y (lit) · todo (not lit). A filter keeps the rows it showed when chosen, so ticking one in the "to check"
   view leaves it in place, ticked and undoable, instead of pulling it out from under the pointer */
let FILTER = "all", SHOWN = null, STATS = null;
const todoCount = () => L.filter(l => !done(l.n)).length;
const pct = n => STATS ? Math.round(100 * (STATS.found[n - 1] + STATS.ticked[n - 1]) / STATS.n) : null;
function rowHTML(l) {
  const s = st(l.n), ev = SUBJ?.e?.[l.n], mine = MODE === "mine";
  const badge = !mine ? "" : s === "y" ? `<span class="state y">found</span>` : s === "self" ? `<span class="state self">ticked</span>`
    : s === "q" ? `<span class="state q">unsure</span>` : `<span class="state n">not yet</span>`;
  /* the quick answer sits on the row itself; correcting what the agent found lives inside it */
  const quick = !mine ? "" : s === "self" ? `<button class="key mini" type="button" data-act="undo">Undo</button>`
    : s === "y" ? "" : `<button class="key mini" type="button" data-act="self">I do this</button>`;
  const act = !mine ? "" : s === "y" ? `<button class="key mini" type="button" data-act="no">That's wrong</button>`
    : OV[l.n] === "no" ? `<button class="key mini" type="button" data-act="undo">It was right</button>` : "";
  return `<div class="row${s ? " is-" + s : ""}${mine ? " has-q" : ""}" id="level-${l.n}" data-n="${l.n}">
    <button class="row-b" type="button" aria-expanded="false" aria-controls="d${l.n}">
      <span class="ico">${icon(l.n)}</span><span class="num">${l.n}</span>
      <span class="row-t"><b>${esc(l.title)}</b><span>${esc(l.line)}</span></span>
      <span class="row-m">${badge}${!mine && l.from?.x ? `<span class="who">@${esc(l.from.x)}</span>` : ""}${STATS ? `<span title="of ${STATS.n} people who added theirs">${pct(l.n)}%</span>` : ""}<span class="chev" aria-hidden="true">›</span></span>
    </button>${mine ? `<div class="row-q">${quick}</div>` : ""}
    <div class="row-d" id="d${l.n}" hidden>
      <p class="how-t"><b>How it's checked</b>${esc(l.check)}${l.how === "self" && l.check !== "Only you know." ? " Usually only you can tell, so you tick it." : ""}</p>
      ${tryHTML(l)}
      ${ev && done(l.n) ? `<p class="evidence">${whose()} agent found: <b>${esc(ev)}</b></p>` : ""}
      ${quote(l.from)}${quote(l.vs, true)}
      <div class="row-acts"><button class="key mini" type="button" data-act="learn">Copy a prompt to learn this</button>${act}</div>
    </div></div>`;
}
function setFilter(f) {
  FILTER = f; SHOWN = f === "all" ? null : new Set(L.filter(l => f === "y" ? done(l.n) : !done(l.n)).map(l => l.n));
  syncFilters(); renderList();
}
function renderList() {
  const show = l => !SHOWN || SHOWN.has(l.n);
  $("#tiers").classList.toggle("lit", !!SUBJ); $("#tiers").classList.toggle("reviewing", MODE === "mine" && FILTER === "todo");
  $("#tiers").innerHTML = T.map(t => {
    const ls = L.filter(l => Math.ceil(l.n / 10) === t.n), have = ls.filter(l => done(l.n)).length;
    const rows = ls.filter(show).map(l => rowHTML(l) + (l.n === 3 && D.pi && FILTER === "all" ? `<div class="pi"><span class="num">π</span><span><b>${esc(D.pi.title)}</b> ${esc(D.pi.line)}</span></div>` : "")).join("");
    if (!rows) return "";
    return `<section class="tier" id="tier-${t.n}" style="--tc:var(--t${t.n})"><div class="tier-h">
      <div class="tier-art">${ART[t.n] ? `<img src="${ART[t.n]}" alt="The caveman at tier ${t.n}, ${esc(t.era)}" loading="lazy">` : ""}</div>
      <div><div class="tier-k">Levels ${t.n * 10 - 9}–${t.n * 10} · ${esc(t.era)}</div><h3>${esc(t.name)}</h3><p>${esc(t.line)}</p></div>
      ${SUBJ ? `<div class="tier-count"><b>${have}</b>/10</div>` : ""}</div>${rows}</section>`;
  }).join("");
  $("#list-sub").textContent = MODE === "mine" ? "Lit up: yours. Open any level for how it's checked, what your agent found, and a prompt to learn it."
    : `Lit up: what ${whose()} agent found on their machine. Yours will light up differently.`;
  filterLabels();
}
function filterLabels() {
  const [, lit, todo] = $$("#filters button");
  lit.textContent = MODE === "mine" ? "Yours" : "Lit"; todo.textContent = MODE === "mine" ? `To check · ${todoCount()}` : "Not yet";
}
function openRow(n, scroll) {
  let r = $("#level-" + n);
  if (!r) { setFilter("all"); r = $("#level-" + n); }
  r.dataset.open = ""; r.querySelector(".row-b").setAttribute("aria-expanded", "true"); r.querySelector(".row-d").hidden = false;
  if (scroll) r.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
}
$("#tiers").addEventListener("click", async e => {
  const row = e.target.closest(".row"); if (!row) return;
  const n = +row.dataset.n, act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "learn") { toast(await copy(promptFor(L[n - 1])) ? "Prompt copied. Paste it into your agent." : "Couldn't copy here."); track("learn_copy", { n }); return; }
  if (act) {
    OV = store.get(okey()) || {};   /* start from what's saved: another tab of this result may have ticked since */
    if (act === "self") OV[n] = "self"; else if (act === "no") OV[n] = "no"; else delete OV[n];
    store.set(okey(), OV); track("override", { n, act }); cardChanged(); refreshRow(n); return;
  }
  if (e.target.closest(".row-b")) {
    const d = row.querySelector(".row-d"), open = d.hidden;
    d.hidden = !open; row.querySelector(".row-b").setAttribute("aria-expanded", String(open));
    if (open) { row.dataset.open = ""; track("row_open", { n }); } else delete row.dataset.open;
  }
});
/* one answer changed: that row, its tier's count, the card and the level, all in place */
function refreshRow(n) {
  const r = $("#level-" + n), open = r.hasAttribute("data-open"), t = Math.ceil(n / 10);
  r.outerHTML = rowHTML(L[n - 1]);
  if (open) openRow(n);
  const c = $(`#tier-${t} .tier-count b`); if (c) c.textContent = L.filter(l => Math.ceil(l.n / 10) === t && done(l.n)).length;
  filterLabels(); renderCopy(); $("#fan").innerHTML = fanHTML(false); keepLast();
}
/* "Your level" elsewhere on the page follows the ticks on this result */
function keepLast() {
  if (MODE !== "mine" || LAST?.hash !== location.hash.slice(1)) return;
  LAST.lv = level(); store.set("levels-last", LAST); $("#live").textContent = `Level ${LAST.lv}`;
}
function syncFilters() { $$("#filters button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === FILTER))); }
$("#filters").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setFilter(b.dataset.f); });

/* ---------- hero copy for a result */
function renderCopy() {
  $("#copy-home").hidden = MODE !== "show"; $("#copy-result").hidden = MODE === "show"; $("#live").hidden = MODE !== "mine";
  $("#go").hidden = !canWait(); $("#getyours").hidden = MODE !== "chat";
  $("#next").hidden = MODE !== "mine" && MODE !== "chat";
  $("#mine").hidden = !(canWait() && LAST);
  if (LAST) { $("#mine").href = "#" + LAST.hash; $("#mine").textContent = `Your level: ${LAST.lv}`; }
  if (MODE === "show") return;
  if (MODE === "chat") {
    $("#res-kicker").textContent = "Level 0 · you're in a chat tab";
    $("#res-title").textContent = "Level 0. Everyone starts here.";
    $("#res-line").textContent = "Your chat assistant read the check, but it can't look at your computer, so it can't run it. That's the whole difference between a chat and an agent: an agent works in your folders, runs things, and shows you what it did. It's less scary than it sounds. It asks before it does anything you haven't allowed.";
    $$("#share, #share-note, #res-foot, #keep").forEach(el => el.hidden = true);
    $("#picks-h").textContent = "Where you'd start";
    return renderPicks();
  }
  $("#picks-h").textContent = "Learn next";
  const lv = level(), t = tierOf(Math.max(1, lv)), sc = selfCount(), unsure = L.filter(l => st(l.n) === "q").length;
  /* a second run in this browser: how it moved since the one before */
  const prev = MODE === "mine" && LAST?.prev, moved = prev && levelOf(SUBJ) - prev.lv;
  const since = !prev ? "" : moved > 0 ? ` · up ${moved} since ${day(prev.at)}` : moved < 0 ? ` · down ${-moved} since ${day(prev.at)}` : ` · same as on ${day(prev.at)}`;
  const from = MODE === "mine" && FROM && FROM.s !== SUBJ.s ? ` ${FROM.name ? FROM.name + ", whose card sent you here, is" : "The card that sent you here is"} level ${levelOf(FROM)}.` : "";
  $("#res-kicker").textContent = MODE === "pub" ? `${SUBJ.name ? SUBJ.name + "'s card" : "A card"} · published by them` : "Your result · from the link, nothing uploaded" + since;
  $("#res-title").textContent = `Level ${lv}. ${t.era}.`;
  $("#res-line").textContent = MODE === "pub"
    ? `Their own agent found ${lv - sc} of the 100 on their machine${sc ? `, and they ticked ${sc} more` : ""}. ${t.line}`
    : `Your agent found ${lv - sc} of the 100${sc ? `, and you ticked ${sc}` : ""}. ${unsure ? `It couldn't see ${unsure} from your machine.` : t.line}${from}`;
  $("#noticed").hidden = !(MODE === "mine" && SUBJ.f.length);
  $("#noticed").innerHTML = MODE === "mine" ? SUBJ.f.map(x => `<li>${esc(x)}</li>`).join("") : "";
  $$("#share, #share-note, #res-foot").forEach(el => el.hidden = MODE === "pub");
  $("#keep").hidden = MODE !== "mine";
  /* before sharing, the ones it didn't find are worth a look: the agent can't see everything from a machine */
  const todo = MODE === "mine" ? todoCount() : 0, looked = todo && store.get("levels-rv-" + SUBJ.s);
  $("#review").hidden = !todo;
  $("#review-b").textContent = looked ? `Back to the ${todo} to check` : `Check the ${todo} it didn't find`;
  $("#review-b").classList.toggle("acc", !looked); $("#share-x").classList.toggle("acc", !todo || !!looked);
  $("#live").textContent = `Level ${lv}`;
  renderPicks();
}
function renderPicks() {
  const picks = SUBJ.p.length ? SUBJ.p : L.filter(l => !done(l.n)).slice(0, 3).map(l => [l.n, ""]);   /* picks */
  $("#picks").innerHTML = picks.map(([n, why]) => { const l = L[n - 1];
    return `<div class="pick"><span class="ico">${icon(n)}</span><div><h3><span class="n">${n}</span>${esc(l.title)}</h3>
      <p>${why ? `<span class="why">${esc(why)}</span> ` : ""}${esc(l.line)}</p>${tryHTML(l, true)}
      <div class="pick-acts"><button class="key mini" type="button" data-learn="${n}">Copy a prompt for your agent</button><button class="linkish mono" type="button" data-goto="${n}">How it's checked</button></div></div></div>`; }).join("");
}
$("#picks").addEventListener("click", async e => {
  const a = e.target.closest("[data-learn]"), g = e.target.closest("[data-goto]");
  if (a) { toast(await copy(promptFor(L[a.dataset.learn - 1])) ? "Prompt copied. Paste it into your agent." : "Couldn't copy here."); track("pick_copy", { n: +a.dataset.learn }); }
  if (g) openRow(+g.dataset.goto, true);
});
$("#review-b").addEventListener("click", () => {
  store.set("levels-rv-" + SUBJ.s, 1); track("review_start", { todo: todoCount() });
  setFilter("todo"); renderCopy();
  $("#list").scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
});
/* a card link shows the card as it was when made; change the card and the next share makes a new one */
const NOTE = $("#share-note").textContent;
const cardChanged = () => { if (SHARE_URL) { SHARE_URL = null; $("#share-note").textContent = NOTE; } };
$("#card-name").addEventListener("input", () => { store.set("levels-name", $("#card-name").value); cardChanged(); renderFan(); });
/* your photo on your card: cut to the card's picture here, kept in this browser, and sent only inside a card you share */
let PHOTO = store.get("levels-photo");
function setPhoto(p) {
  PHOTO = p; try { p ? localStorage.setItem("levels-photo", JSON.stringify(p)) : localStorage.removeItem("levels-photo"); } catch {}
  WHO = PHOTO ? { photo: PHOTO } : null; $("#photo-rm").hidden = !PHOTO; cardChanged(); renderAll(false);
}
async function cutPhoto(file) {
  const img = new Image(), url = URL.createObjectURL(file);
  try {
    img.src = url; await img.decode();
    const W = 632, H = 408, k = Math.max(W / img.naturalWidth, H / img.naturalHeight), c = document.createElement("canvas");
    c.width = W; c.height = H;
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    c.getContext("2d").drawImage(img, (W - w) / 2, (H - h) * 0.3, w, h);   /* faces sit high in most photos */
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}
$("#fan").addEventListener("click", e => { if (e.target.closest("[data-photo]")) $("#photo-in").click(); });
$("#photo-in").addEventListener("change", async e => {
  const f = e.target.files?.[0]; e.target.value = "";
  if (!f) return;
  try { setPhoto(await cutPhoto(f)); track("photo_added"); toast("On your card. It stays in this browser unless you share the card."); }
  catch { toast("Couldn't read that image. Try a JPEG or PNG."); }
});
$("#photo-rm").addEventListener("click", () => { setPhoto(null); toast("Photo removed"); });

/* ---------- the share images, drawn here from the real card: a card taped to paper, its level ringed in red pen
   site: the link preview for the page (1200x630) · wide: a card link's preview (1200x630) · square: Save image (1200x1200) */
const TAPE = `<i class="tape"></i>`;
const RING = `<svg class="ring" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M122 9C64 1 9 20 11 52s62 44 112 40 74-26 68-52S142 3 84 11" vector-effect="non-scaling-stroke"/></svg>`;
const ME = `<div class="me"><span>me</span><svg viewBox="0 0 80 60" aria-hidden="true"><path d="M6 8c22 2 44 12 58 38M64 46l-14-3M64 46l2-14"/></svg></div>`;
function ogHTML(kind) {
  const ask = `<div class="og-copy"><div class="og-brand">levels <span>by @virpo</span></div><h2 class="og-h">What level are you with agents?</h2>
    <p class="og-sub">100 levels. Your own agent checks which you do, on your own machine.</p></div><div class="og-url">${SITE}</div>`;
  if (kind === "site") return `${ask}<div class="og-cards">${fanHTML(false).replace('<div class="tcard front', TAPE + '<div class="tcard front')}</div>`;
  const digits = String(level()).length;
  const mine = `<div class="og-card" style="--d:${digits}">${TAPE}${subjectCard("solo")}${RING}${ME}</div>`;
  return kind === "square" ? `${mine}<div class="og-foot mono">what level are you with agents? <b>${SITE}</b></div>` : `${mine}${ask}`;
}
/* html-to-image can't read the Google Fonts stylesheet across origins, so the faces the card uses (Latin only) are
   fetched once and handed to it inline; without them the image falls back to system fonts */
let fontCSS = null;
const embedFonts = () => fontCSS ??= (async () => {
  const href = document.querySelector('link[href*="fonts.googleapis.com/css2"]')?.href;
  if (!href) return "";
  const css = await (await fetch(href)).text();
  const latin = css.split("/* ").filter(b => b.startsWith("latin */")).map(b => b.slice(9)).join("\n");
  const urls = [...new Set(latin.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || [])];
  const data = await Promise.all(urls.map(async u => {
    const buf = new Uint8Array(await (await fetch(u)).arrayBuffer());
    let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return [u, `data:font/woff2;base64,${btoa(bin)}`];
  }));
  return data.reduce((c, [u, d]) => c.split(u).join(d), latin);
})().catch(() => (fontCSS = null, ""));
async function ogImage(kind) {   /* wide: a JPEG data URL for the card link · square: a PNG blob to keep */
  const el = $("#og"); el.className = "og " + kind; el.innerHTML = ogHTML(kind);
  await Promise.all([...el.querySelectorAll("img")].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  if (!window.htmlToImage) throw new Error("renderer not loaded");
  await document.fonts.ready;
  const o = { width: 1200, height: kind === "square" ? 1200 : 630, backgroundColor: "#EFE8DA", fontEmbedCSS: await embedFonts() };
  return kind === "square" ? htmlToImage.toBlob(el, { ...o, pixelRatio: 1.5 }) : htmlToImage.toJpeg(el, { ...o, pixelRatio: 1, quality: .9 });
}

/* ---------- share */
const squares = () => `My AI level is ${level()}/100\n\n` + [...Array(10)].map((_, r) => L.slice(r * 10, r * 10 + 10).map(l => done(l.n) ? "🟨" : "⬛").join("")).join("\n") + `\n\nfrom ${SITE}`;
$("#share-copy").addEventListener("click", async () => { toast(await copy(squares()) ? "Squares copied" : "Couldn't copy here."); track("share_squares"); });
const lower = s => /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
function postText() {
  const nx = SUBJ.p.find(p => !done(p[0]))?.[0] || L.find(l => !done(l.n))?.n;
  return `I'm level ${level()} of 100 with agents.${nx ? `\nNext up: ${lower(L[nx - 1].title)}.` : ""}`;
}
/* the image goes to the clipboard, ready to paste into a post. The item is handed over inside the click, with the image
   still drawing, which is what Safari needs; where images can't go on the clipboard, it downloads instead */
$("#share-png").addEventListener("click", async () => {
  const drawing = ogImage("square");
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": drawing })]);
    toast("Image copied. Paste it into your post."); track("share_png", { how: "clipboard" });
  } catch {
    try { const b = await drawing, a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `levels-${level()}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast("Saved the image"); track("share_png", { how: "download" }); }
    catch { toast("Couldn't draw the image here"); }
  }
});
const answers = () => ({ v: V, s: L.map(l => ({ y: "y", self: "s", q: "?", n: "n" })[st(l.n)]).join(""), a: SUBJ.a, pi: SUBJ.pi ? 1 : 0 });
async function post(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
/* sharing is a public page for the card, made once, on the first press of Post or Copy a link; its preview is the card */
async function cardLink() {
  if (SHARE_URL) return SHARE_URL;
  $("#share-note").textContent = "Making your card page…";
  const r = await post(D.api + "/api/card", { ...answers(), name: cardName(), image: await ogImage("wide"), ...(PHOTO ? { photo: PHOTO } : {}) });
  SHARE_URL = r.url; store.set("levels-own", r.id); track("card_published");
  $("#share-note").innerHTML = `Your card: <a href="${esc(r.url)}">${esc(r.url.replace(/^https?:\/\//, ""))}</a>. Links to it show the card. Only the answers and the name are stored.`;
  return SHARE_URL;
}
$("#share-x").addEventListener("click", async () => {
  const w = window.open("", "_blank");   /* opened inside the click, so it isn't blocked; pointed at X once the link exists */
  let url = `https://${SITE}/`;
  try { url = await cardLink(); } catch { $("#share-note").textContent = "Couldn't make your card page right now, so the post links to the list instead."; }
  const x = "https://x.com/intent/post?text=" + encodeURIComponent(`${postText()}\n\n${url}`);
  track("share_x", { lv: level(), linked: url !== `https://${SITE}/` });
  if (w) { w.opener = null; w.location.href = x; } else location.href = x;
});
$("#share-link").addEventListener("click", async () => {
  try { const url = await cardLink(); toast(await copy(url) ? "Link copied" : url); }
  catch { $("#share-note").textContent = "Couldn't make the link right now. Nothing was saved."; }
});
/* opting in pays back at once: where this level stands among everyone who added theirs */
function standing(t, lv) {
  if (!t?.n || t.n < 20) return `You're one of the first ${t?.n || 1}. Come back in a few days to see where you stand.`;
  const below = t.levels.slice(0, lv).reduce((a, b) => a + b, 0);
  return `You're above ${Math.round(100 * below / t.n)}% of the ${t.n} people who added theirs.`;
}
$("#pub-anon").addEventListener("click", async () => {
  try {
    await post(D.api + "/api/count", answers()); $("#pub-anon").disabled = true; track("count_added");
    const t = await fetch(D.api + "/api/stats", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null);
    $("#pub-note").textContent = `Added: the 100 answers and the date, no name, no link. ${standing(t, levelOf({ s: answers().s }))}`;
  } catch { $("#pub-note").textContent = "Couldn't add it right now. Nothing was saved."; }
});
$("#mail").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#mail-email").value.trim();
  try { await post(D.api + "/api/notify", { email, level: SUBJ && MODE === "mine" ? String(level()) : "" });
    $("#mail-note").textContent = "Done. You'll hear from me when 20 new levels are in. Nothing else."; $("#mail").querySelector("button").disabled = true; track("mail_joined"); }
  catch { $("#mail-note").textContent = "Couldn't save that right now. Try again in a minute."; }
});

/* ---------- the one action: copy the line. The yellow key then turns into the wait, with a clock, until the agent is back */
$$("[data-prompt]").forEach(el => el.textContent = PROMPT);
const bar = $("#bar"), STAYS = "Nothing leaves your computer unless you choose to save your card.";
let waitClock = null;
function waitForAgent(h, p) {
  const box = $("#cta-box"), w = $("#wait");
  if (!box.classList.contains("waiting")) {   /* grow out of the key's own size */
    w.style.setProperty("--kw", $("#cta").offsetWidth + "px"); w.style.setProperty("--kh", $("#cta").offsetHeight + "px");
    const at = Date.now(), tick = () => { const s = Math.floor((Date.now() - at) / 1000); $("#wait-t").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
    tick(); clearInterval(waitClock); waitClock = setInterval(tick, 1000);
  }
  box.classList.add("waiting"); w.classList.remove("got"); bar.classList.add("waiting");
  $("#bar-cta .bar-cta-t").textContent = "Waiting for your agent";
  $("#wait-h").textContent = h; $("#wait-p").textContent = p;
}
function stopWaiting() {
  clearInterval(waitClock); $("#cta-box").classList.remove("waiting"); bar.classList.remove("waiting");
  $("#bar-cta .bar-cta-t").textContent = "See your level";
}
const waiting = () => $("#cta-box").classList.contains("waiting");
const pasteIt = ok => waitForAgent(ok ? "Copied. Now paste it into your agent." : "Copy the line below, then paste it into your agent.",
  `Claude Code, Codex or Cursor, any session. It tells you what the script does, then asks before running it. In a few minutes your card opens in your browser. ${STAYS}`);
/* on a phone there is no agent to paste into: send the line to the computer instead (AirDrop, Messages, a note to self) */
async function sendToComputer() {
  const ok = await copy(PROMPT);
  try { await navigator.share({ text: PROMPT, url: `https://${SITE}/` }); } catch {}
  track("cta_send", { ok });
  waitForAgent("Now open it on your computer.", `The check runs where you code. Paste the line into Claude Code, Codex or Cursor there${ok ? "; it's on this clipboard too" : ""}. ${STAYS}`);
  $("#wait").classList.add("got");
}
$$("[data-cta]").forEach(b => b.addEventListener("click", async () => {
  const from = b.dataset.from;
  if (TOUCH && canWait()) { if (from === "bar") scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }); return sendToComputer(); }
  const ok = await copy(PROMPT);
  track("cta_copy", { from, ok });
  if (!canWait()) return toast(ok ? "Copied. Paste it into your agent." : "Copy this line into your agent: " + PROMPT);
  if (from === "bar") {
    if (ok) { $("#pop").hidden = false; clearTimeout(b.t); b.t = setTimeout(() => ($("#pop").hidden = true), 6000); }
    else scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  }
  pasteIt(ok);
}));
$("#wait-again").addEventListener("click", async () => { toast(await copy(PROMPT) ? "Copied again" : "Copy the line below"); });
if (TOUCH) { $("#cta .cta-t").textContent = "Send it to my computer"; $("#assure").firstChild.textContent = "It runs on your computer, not your phone: send yourself the line, then paste it into Claude Code, Codex or Cursor there. Nothing is shared with us unless you want it to be. "; }
/* Cursor's prompt link fills the chat of the Cursor you already have open, so it opens there; always copy as well,
   because a link to an app that isn't installed does nothing. Claude Code's link starts a new terminal session that
   asks for folder trust first, which is worse than pasting into the session you already have, so it only copies */
const OPEN = { cursor: "cursor://anysphere.cursor-deeplink/prompt?text=" + encodeURIComponent(PROMPT) };
$$(".agent").forEach(a => {
  a.querySelector("i").innerHTML = D.agents?.[a.dataset.agent] || "";
  if (OPEN[a.dataset.agent]) a.href = OPEN[a.dataset.agent];
  a.addEventListener("click", async e => {
    const ok = await copy(PROMPT), name = a.dataset.name;
    track("agent_open", { agent: a.dataset.agent, ok });
    if (!OPEN[a.dataset.agent]) e.preventDefault();
    if (OPEN[a.dataset.agent]) waitForAgent(`Opening ${name}…`, `It opens with the line typed in; press Enter. Nothing opened? It's on your clipboard too: paste it into ${name}. ${STAYS}`);
    else waitForAgent(ok ? `Copied. Paste it into ${name}.` : `Copy the line below into ${name}.`, `Any session, any folder. It tells you what the script does, then asks before running it. In a few minutes your card opens in your browser. ${STAYS}`);
  });
});
/* the agent opens the result in a new tab; that tab tells this one, which offers to show it here */
const chan = "BroadcastChannel" in window ? new BroadcastChannel("levels") : null;
function arrived(hash, lv) {
  if (!canWait() || !waiting()) return;
  clearInterval(waitClock);
  $("#wait").classList.add("got");
  $("#wait-h").textContent = `Your agent is back: level ${lv}.`;
  $("#wait-p").innerHTML = `It opened in another tab. <button class="key ink mini" type="button" id="show-here">Show it here</button>`;
  $("#show-here").onclick = () => { location.hash = hash; };
}
chan && (chan.onmessage = e => e.data?.hash && arrived(e.data.hash, e.data.lv));
/* other tabs: a new result or a new level (arrived), or ticks on the result open here (redrawn from what's saved) */
addEventListener("storage", e => {
  if (e.key === "levels-last" && e.newValue) { try { LAST = JSON.parse(e.newValue); arrived(LAST.hash, LAST.lv); if (canWait()) renderCopy(); } catch {} }
  if (MODE === "mine" && e.key === okey()) { OV = store.get(okey()) || {}; cardChanged(); renderAll(false); }
});
document.addEventListener("click", e => { if (!e.target.closest("#pop, #bar-cta")) $("#pop").hidden = true; });
addEventListener("scroll", () => bar.classList.toggle("scrolled", scrollY > 8), { passive: true });
new IntersectionObserver(([en]) => bar.classList.toggle("show-cta", MODE !== "mine" && !en.isIntersecting), { rootMargin: "-60px 0px 0px 0px" }).observe($("#cta-box"));

/* ---------- the fan: hover a back card and it comes forward; the cards tilt and catch the light under the pointer */
const fanEl = $("#fan"), tilt = new WeakMap();
function tick(c) {
  const s = tilt.get(c); let moving = false;
  for (const k of ["rx", "ry", "px", "py", "ho"]) { const d = s.t[k] - s.v[k]; s.v[k] += d * 0.14; if (Math.abs(d) > 0.01) moving = true; }
  c.style.setProperty("--rx", s.v.rx.toFixed(2) + "deg"); c.style.setProperty("--ry", s.v.ry.toFixed(2) + "deg");
  c.style.setProperty("--px", s.v.px.toFixed(1) + "%"); c.style.setProperty("--py", s.v.py.toFixed(1) + "%"); c.style.setProperty("--ho", s.v.ho.toFixed(3));
  s.raf = moving ? requestAnimationFrame(() => tick(c)) : 0;
}
const aim = (c, t) => { if (!tilt.has(c)) tilt.set(c, { v: { rx: 0, ry: 0, px: 50, py: 50, ho: 0 }, t: {}, raf: 0 }); const s = tilt.get(c); s.t = t; if (!s.raf) s.raf = requestAnimationFrame(() => tick(c)); };
fanEl.addEventListener("pointermove", e => {
  const c = e.target.closest(".tcard"); if (!c || calm || e.pointerType === "touch") return;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  aim(c, { rx: (0.5 - y) * 11, ry: (x - 0.5) * 13, px: x * 100, py: y * 100, ho: 1 });
}, { passive: true });
fanEl.addEventListener("pointerover", e => {
  const c = e.target.closest(".tcard"); if (!c) return;
  fanEl.classList.toggle("raise-l", c.classList.contains("back-l")); fanEl.classList.toggle("raise-r", c.classList.contains("back-r"));
});
fanEl.addEventListener("pointerout", e => {
  const c = e.target.closest(".tcard"); if (!c || c.contains(e.relatedTarget)) return;
  aim(c, { rx: 0, ry: 0, px: 50, py: 50, ho: 0 });
  if (!fanEl.contains(e.relatedTarget)) fanEl.classList.remove("raise-l", "raise-r");
});

/* ---------- theme, static bits */
const THEMES = ["system", "light", "dark"];
function applyTheme(t) {
  if (t === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.dataset.theme = t;
  $("#theme").setAttribute("aria-label", "Theme: " + t);
}
$("#theme").addEventListener("click", () => { const t = THEMES[(THEMES.indexOf(store.get("prq-theme") || "system") + 1) % 3]; store.set("prq-theme", t); applyTheme(t); });
applyTheme(store.get("prq-theme") || "system");
$("#fossil-grid").innerHTML = D.fossils.map(f => `<div class="fossil ${f.status}"><span class="tag">${f.status} · ${esc(f.era)}</span><b>${esc(f.title)}</b><p>${esc(f.line)}</p></div>`).join("");
$("[data-l0-title]").textContent = D.level0.title + ".";
$("[data-l0-line]").textContent = D.level0.line;
$$("[data-version]").forEach(el => el.textContent = `v${D.version} · updated ${fmtDate(D.updated)}`);
if (D.repo) { $("#gh").hidden = false; $("#gh").href = D.repo; }
try { window.posthog?.register?.({ site: location.host }); } catch {}
$("[data-home]").addEventListener("click", e => { e.preventDefault(); history.pushState(null, "", location.pathname); boot(); scrollTo(0, 0); });

/* ---------- boot */
function renderAll(fan = true) { renderCopy(); renderList(); if (fan) renderFan(); else $("#fan").innerHTML = fanHTML(false); }
const cardId = () => { const u = new URLSearchParams(location.search).get("u"); return /^[a-z2-9]{6}$/.test(u || "") ? u : null; };
function boot() {
  const h = location.hash, mine = decode(h), pub = CARD && CARD.id === cardId() ? CARD : null;
  SHARE_URL = null; $("#share-note").textContent = NOTE;
  if (mine) {
    MODE = "mine"; SUBJ = mine; WHO = PHOTO ? { photo: PHOTO } : null;
    if (mine.was && !store.get(okey())) {   /* ticks made on this result under an earlier list follow their levels */
      const ov = store.get("levels-ov-" + mine.was.s), m = PAST[mine.was.v];
      if (ov) store.set(okey(), Object.fromEntries(Object.entries(ov).map(([n, v]) => [m.n(+n), v]).filter(([n]) => n)));
    }
    OV = store.get(okey()) || {}; $("#card-name").value = store.get("levels-name") || "";
    $("#photo-rm").hidden = !PHOTO;
    FROM = norm(store.get("levels-from"));
    /* remember it, and the run before it, so a later run can say how far you moved */
    const hash = h.slice(1), prev = !LAST ? null : LAST.hash === hash ? LAST.prev : { lv: LAST.base ?? LAST.lv, at: LAST.at };
    LAST = { hash, lv: level(), base: levelOf(mine), at: LAST?.hash === hash ? LAST.at : Date.now(), prev }; store.set("levels-last", LAST);
  }
  else if (h === "#chat") { MODE = "chat"; SUBJ = norm({ s: "n".repeat(100), name: "Chat tab", p: [[1, "This is the whole step: ten minutes, then paste the same line into it."], [5, "Easiest first win: show it the thing that's broken."], [10, "Try it on a chore first, not code."]] }); WHO = null; }
  else if (pub) {
    MODE = "pub"; SUBJ = pub; WHO = pub.photo ? { photo: pub.photo } : null;
    if (pub.id !== store.get("levels-own")) store.set("levels-from", { v: V, s: pub.s, a: pub.a, pi: pub.pi ? 1 : 0, name: pub.name });
  }
  else { const p = SHOW[0]; MODE = "show"; SUBJ = norm(p.result); SUBJ.name = p.name; WHO = { first: p.name.split(" ")[0], photo: p.photo }; }
  if (!canWait()) stopWaiting();
  FILTER = "all"; SHOWN = null; syncFilters();
  renderAll();
  if (OG === "site") { document.body.classList.add("og-only"); $("#og").className = "og site"; $("#og").innerHTML = ogHTML("site"); return; }
  if (mine) { track("result_open", { lv: level() }); scrollTo(0, 0); chan?.postMessage({ hash: LAST.hash, lv: LAST.lv }); }
  if (MODE === "chat") track("chat_landed");
  const m = /^#level-(\d{1,3})$/.exec(h); if (m && +m[1] >= 1 && +m[1] <= 100) openRow(+m[1], true);
}
window.levelsShareImage = kind => ogImage(kind || "wide");   /* the exact images sharing makes, for checking them */
$("#forget").addEventListener("click", () => {
  try { for (const k of ["levels-last", okey(), "levels-name", "levels-from", "levels-own", "levels-photo"]) localStorage.removeItem(k); } catch {}
  LAST = null; FROM = null; PHOTO = null; history.pushState(null, "", location.pathname); boot(); scrollTo(0, 0); toast("Forgotten. It only ever lived in this browser.");
});
addEventListener("hashchange", boot);
/* opened from a card's link: fetch the card first, so the page doesn't flash someone else's on the way */
if (cardId()) {
  document.body.classList.add("pending");
  fetch(`${D.api}/api/card/${cardId()}`).then(r => r.ok ? r.json() : null).catch(() => null).then(c => {
    CARD = norm(c); if (CARD) Object.assign(CARD, { id: cardId(), photo: /^https:\/\//.test(c.photo || "") ? c.photo : null }); else toast("Couldn't open that card. It may have been taken down.");
    document.body.classList.remove("pending"); boot();
  });
} else boot();
fetch(D.api + "/api/stats").then(r => r.ok ? r.json() : null).then(t => { if (t?.n >= 50) { STATS = t; renderList(); } }).catch(() => {});
})();
