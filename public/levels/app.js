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
/* links out (sources, GitHub, X): which site and which part of the page, never the address itself, which can carry
   a name. Autocapture stays off because it would record the text of what's clicked, and that includes what an agent noticed */
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]"); if (!a || a.id === "card-url") return;
  let u; try { u = new URL(a.href, location.href); } catch { return; }
  if (u.host !== location.host) track("link_out", { to: u.host, from: a.closest("[id]")?.id || "" });
});
const SITE = D.site, PROMPT = D.prompt;
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
let MODE = "show", SUBJ = null, WHO = null, OV = {}, LAST = store.get("levels-last");
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
function subjectCard(cls, blank, as) {   /* as: { name, photo } to draw it as it goes out, not as it is here */
  const lv = level(), sc = selfCount(), add = MODE === "mine" && cls === "front" ? (WHO?.photo ? "change" : "add") : undefined;
  return resultCard({ st, r: SUBJ, photo: as ? as.photo : WHO?.photo, add, name: as ? as.name : MODE === "mine" ? cardName() : SUBJ.name,
    foot: MODE === "chat" ? "a chat tab can't check" : sc ? `${lv - sc} found · ${sc} ticked` : "checked locally" }, cls, blank);
}
const otherCard = (r, name, foot, cls) => resultCard({ st: stateOf(r), r, name, foot }, cls);
function fanHTML(blank) {
  /* on arrival, a real card between Grug on day 1 and on day 400, for scale; anyone's own result stands alone */
  if (MODE !== "show") return subjectCard("front", blank);
  const [noob, pro] = EX, ex = "an example, not a check";
  return otherCard(noob.r, noob.name, ex, "back-l") + otherCard(pro.r, pro.name, ex, "back-r") + subjectCard("front", blank);
}

/* the front card fills in, square by square, and on a result the map lights up with it, then the ticker walks through
   what the agent found */
let tickTimer = null, fillTimer = null;
function renderFan() {
  clearTimeout(fillTimer); clearInterval(tickTimer);
  const fan = $("#fan");
  if (calm || OG) { fan.innerHTML = fanHTML(false); return startTicker(); }
  fan.innerHTML = fanHTML(true);
  const cells = [...fan.querySelectorAll(".front .tc-grid i")], num = fan.querySelector(".front .tc-lvl");
  const big = MODE === "show" ? null : $("#res-num"), tiles = lights() ? new Map($$("#board .tile").map(t => [+t.dataset.n, t])) : null;
  const order = L.filter(l => done(l.n)).map(l => [l.n, st(l.n) === "self" ? "self" : "y"]);
  if (tiles) order.forEach(([n]) => tiles.get(n).className = "tile off");
  if (big) big.textContent = 0;
  let i = 0;
  const step = () => {
    const [n, c] = order[i]; cells[n - 1].className = c; i++;
    if (tiles) tiles.get(n).className = tileCls(n) + " just";
    num.firstChild.textContent = i; if (big) big.textContent = i;
    if (i < order.length) fillTimer = setTimeout(step, 16); else setTimeout(startTicker, 500);
  };
  fillTimer = setTimeout(() => order.length ? step() : startTicker(), 350);
}
function startTicker() {
  const tk = $("#ticker"), ev = Object.entries(SUBJ.e).map(([n, v]) => [+n, v]).filter(([n]) => done(n)).sort((a, b) => a[0] - b[0]);
  const items = ev.length ? ev : L.filter(l => done(l.n)).map(l => [l.n, ""]);
  if (!items.length || MODE === "mine") { tk.textContent = ""; return; }   /* on your own result, the map below does this */
  let k = 0;
  const show = () => {
    const [n, v] = items[k % items.length], l = L[n - 1];
    $$("#fan .front .tc-grid i.hl").forEach(i => i.classList.remove("hl"));
    $(`#fan .front .tc-grid i[data-n="${n}"]`)?.classList.add("hl");
    tk.innerHTML = `<span class="n">${n}</span><b>${esc(l.title)}</b>${v ? `<span class="ev">${whose()} agent found: ${esc(v)}</span>` : ""}`;
    tk.classList.remove("fade"); k++;
  };
  show();
  if (!calm && !OG) tickTimer = setInterval(() => { tk.classList.add("fade"); setTimeout(show, 260); }, 2800);
}

/* ---------- the map: ten eras of ten, each row led by its caveman. On a result the keys you have are lit and the rest
   are sunk, waiting; on arrival it's the catalogue, every key up. Click one (or walk it with the arrow keys) and the
   inspector beside it says what it is */
let STATS = null, SEL = null;   /* SEL: what the inspector shows, { n } a level or { t } an era */
const lights = () => MODE === "mine" || MODE === "pub";
const picked = () => MODE === "mine" ? SUBJ.p.map(p => p[0]).filter(n => !done(n)) : [];
const todoCount = () => L.filter(l => !done(l.n)).length;
const pct = n => STATS ? Math.round(100 * (STATS.found[n - 1] + STATS.ticked[n - 1]) / STATS.n) : null;
const stateWord = n => ({ y: "found", self: "ticked", q: "couldn't see", n: "not yet" })[st(n)];
function tileCls(n) {
  if (!lights()) return "tile";
  const s = st(n);
  return "tile " + (s === "y" ? "on" : s === "self" ? "on self" : s === "q" ? "off q" : "off") + (picked().includes(n) ? " picked" : "");
}
const tierLevels = t => L.slice(t * 10 - 10, t * 10);
function renderBoard() {
  const b = $("#board");
  b.classList.toggle("lights", lights());
  b.innerHTML = T.map(t => {
    const have = tierLevels(t.n).filter(l => done(l.n)).length;
    return `<div class="b-row"><button type="button" class="emb${lights() && have === 10 ? " full" : ""}" data-tier="${t.n}" data-tip="${esc(t.era)}"
      style="--tc:var(--t${t.n});--p:${lights() ? have * 10 : 100}%" aria-label="Levels ${t.n * 10 - 9} to ${t.n * 10}: ${esc(t.era)}, ${esc(t.name)}${lights() ? `, ${have} of 10` : ""}">${ART[t.n] ? `<img src="${ART[t.n]}" alt="" loading="lazy">` : ""}</button>${tierLevels(t.n).map(l =>
      `<button type="button" class="${tileCls(l.n)}" data-n="${l.n}" data-tip="${l.n}. ${esc(l.title)}" aria-label="${l.n}. ${esc(l.title)}${lights() ? ", " + stateWord(l.n) : ""}">${icon(l.n)}</button>`).join("")}</div>`;
  }).join("");
  markSel();
}
function markSel() {
  $$("#board .sel").forEach(el => el.classList.remove("sel"));
  if (SEL) $(SEL.t ? `#board [data-tier="${SEL.t}"]` : `#board [data-n="${SEL.n}"]`)?.classList.add("sel");
}
/* what the result says about one level: found (and how), ticked, couldn't see, or not yet */
function stateHTML(l) {
  if (!lights()) return "";
  const s = st(l.n), ev = SUBJ.e[l.n], who = whose();
  return s === "y" ? `<p class="insp-st on mono">${ev ? `${who} agent found: <b>${esc(ev)}</b>` : `${who} agent found it`}</p>`
    : s === "self" ? `<p class="insp-st on mono">${MODE === "mine" ? "You ticked this one" : "Ticked by them"}</p>`
    : s === "q" ? `<p class="insp-st mono">${who} agent couldn't see this from ${MODE === "mine" ? "your" : "their"} machine</p>`
    : `<p class="insp-st mono">Not yet</p>`;
}
const detailHTML = (l, ev) => `<p class="how-t"><b>How it's checked</b>${esc(l.check)}${l.how === "self" && l.check !== "Only you know." ? " Usually only you can tell, so you tick it." : ""}</p>
  ${tryHTML(l)}${ev && SUBJ?.e?.[l.n] && done(l.n) ? `<p class="evidence">${whose()} agent found: <b>${esc(SUBJ.e[l.n])}</b></p>` : ""}${quote(l.from)}${quote(l.vs, true)}`;
/* on your own result, every level can be corrected: tick what the agent missed, untick what it got wrong */
function fixHTML(l) {
  if (MODE !== "mine") return "";
  const s = st(l.n);
  return s === "self" ? `<button class="key mini" type="button" data-act="undo">Undo my tick</button>`
    : s === "y" ? `<button class="key mini" type="button" data-act="no">That's wrong</button>`
    : OV[l.n] === "no" ? `<button class="key mini" type="button" data-act="undo">It was right</button>`
    : `<button class="key mini acc" type="button" data-act="self">I do this</button>`;
}
const LEARN = `<button class="key mini" type="button" data-act="learn">Copy a prompt to learn this</button>`;
function renderInsp() {
  const el = $("#insp");
  if (!SEL) { el.innerHTML = ""; return; }
  if (SEL.t) {
    const t = T[SEL.t - 1], have = tierLevels(t.n).filter(l => done(l.n)).length;
    el.innerHTML = `<div class="insp-art" style="--tc:var(--t${t.n})">${ART[t.n] ? `<img src="${ART[t.n]}" alt="The caveman at tier ${t.n}, ${esc(t.era)}">` : ""}</div>
      <p class="insp-k mono">Levels ${t.n * 10 - 9}–${t.n * 10} · ${esc(t.era)}</p><h3>${esc(t.name)}</h3><p class="insp-line">${esc(t.line)}</p>
      ${lights() ? `<p class="insp-st${have === 10 ? " on" : ""} mono">${have === 10 ? "All ten. Era cleared." : `${have} of 10`}</p>` : ""}`;
  } else {
    const l = L[SEL.n - 1];
    el.innerHTML = `<div class="insp-top"><span class="${tileCls(l.n)} big">${icon(l.n)}</span><div><p class="insp-k mono">Level ${l.n} · ${esc(tierOf(l.n).era)}</p><h3>${esc(l.title)}</h3></div></div>
      <p class="insp-line">${esc(l.line)}</p>${stateHTML(l)}${detailHTML(l, false)}<div class="acts" data-n="${l.n}">${fixHTML(l)}${LEARN}</div>`;
  }
  markSel();
}
const boardEl = $("#board");
boardEl.addEventListener("click", e => {
  const el = e.target.closest("[data-n], [data-tier]"); if (!el) return;
  SEL = el.dataset.tier ? { t: +el.dataset.tier } : { n: +el.dataset.n };
  renderInsp(); track("map_open", SEL);
  if (matchMedia("(max-width: 980px)").matches && e.detail) $("#insp").scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "nearest" });
});
/* the arrow keys walk the map, eleven keys to a row, and the inspector follows */
boardEl.addEventListener("keydown", e => {
  const k = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -11, ArrowDown: 11 }[e.key]; if (!k) return;
  const all = $$("#board button"), j = all.indexOf(document.activeElement) + k;
  if (j < 0 || j >= all.length || all.indexOf(document.activeElement) < 0) return;
  e.preventDefault(); all[j].focus(); all[j].click();
});

/* ---------- the lists. On arrival (and under someone else's card) it's all 100 in order, to read. On your result it's
   only what's left to unlock, the three picks first, with what you have folded away below */
let TODO = null;   /* the levels the unlock list holds, fixed when it opens, so ticking one leaves it in place, ticked and undoable */
function rowHTML(l, kind) {   /* kind: list · todo (yours, not lit) · have (yours, lit) */
  const s = st(l.n), pick = kind === "todo" && SUBJ.p.find(p => p[0] === l.n && TODO.has(p[0]));
  const tag = kind === "list" ? "" : s === "self" ? `<span class="tag on mono">ticked</span>` : kind === "have" && !done(l.n) ? `<span class="tag mono">not yours</span>`
    : pick ? `<span class="tag start mono">Start here</span>` : s === "q" ? `<span class="tag mono">couldn't see</span>` : "";
  const sub = kind === "have" && s === "y" && SUBJ.e[l.n] ? `<span class="ev mono">${esc(SUBJ.e[l.n])}</span>` : `<span>${esc(l.line)}</span>`;
  const meta = kind === "list" ? `${l.from?.x ? `<span class="who">@${esc(l.from.x)}</span>` : ""}${STATS ? `<span title="of ${STATS.n} people who added theirs">${pct(l.n)}%</span>` : ""}` : "";
  return `<div class="row k-${kind} is-${s || "x"}" id="level-${l.n}" data-n="${l.n}" data-kind="${kind}">
    <button class="row-b" type="button" aria-expanded="false" aria-controls="d${l.n}">
      <span class="num">${l.n}</span><span class="${kind === "have" ? tileCls(l.n) : "tile"}">${icon(l.n)}</span>
      <span class="row-t">${tag}<b>${esc(l.title)}</b>${sub}${pick?.[1] ? `<span class="why">${esc(pick[1])}</span>` : ""}</span>
      <span class="row-m">${meta}<span class="chev" aria-hidden="true">›</span></span>
    </button>${kind === "todo" ? `<div class="row-q">${fixHTML(l).replace("Undo my tick", "Undo")}<button class="key mini" type="button" data-act="learn">Learn it</button></div>` : ""}
    <div class="row-d" id="d${l.n}" hidden>${detailHTML(l, kind !== "list")}${kind === "todo" ? "" : `<div class="acts">${fixHTML(l)}${LEARN}</div>`}</div></div>`;
}
function renderLists() {
  $("#list").hidden = MODE === "mine"; $("#unlock").hidden = MODE !== "mine";
  if (MODE === "mine") {
    TODO ??= new Set(L.filter(l => !done(l.n)).map(l => l.n));
    const first = SUBJ.p.map(p => p[0]).filter(n => TODO.has(n)), rest = [...TODO].filter(n => !first.includes(n)).sort((a, b) => a - b);
    $("#unlock-list").innerHTML = TODO.size ? [...first, ...rest].map(n => rowHTML(L[n - 1], "todo")).join("")
      : `<p class="all-done">Nothing left to unlock. Know a trick that belongs here? Tell <a href="https://x.com/virpo">@virpo</a>.</p>`;
    $("#have-list").innerHTML = L.filter(l => !TODO.has(l.n)).map(l => rowHTML(l, "have")).join("");
    return unlockCounts();
  }
  $("#tiers").innerHTML = T.map(t => `<section class="tier" id="tier-${t.n}" style="--tc:var(--t${t.n})"><div class="tier-h">
      <div class="tier-art">${ART[t.n] ? `<img src="${ART[t.n]}" alt="The caveman at tier ${t.n}, ${esc(t.era)}" loading="lazy">` : ""}</div>
      <div><div class="tier-k">Levels ${t.n * 10 - 9}–${t.n * 10} · ${esc(t.era)}</div><h3>${esc(t.name)}</h3><p>${esc(t.line)}</p></div></div>
      ${tierLevels(t.n).map(l => rowHTML(l, "list") + (l.n === 3 && D.pi ? `<div class="pi"><span class="num">π</span><span><b>${esc(D.pi.title)}</b> ${esc(D.pi.line)}</span></div>` : "")).join("")}</section>`).join("");
}
function unlockCounts() {
  const left = todoCount(), have = L.filter(l => !TODO.has(l.n) && done(l.n)).length;
  $("#unlock-n").textContent = left || "";
  $("#unlock-sub").textContent = left ? "Your agent didn't find these. Already do one? Tick it and your level goes up." : "";
  $("#have-t").textContent = `The ${have} you have`;
}
function openRow(n, scroll) {
  const r = $("#level-" + n); if (!r) return;
  if (r.closest("#have")) $("#have").open = true;
  r.dataset.open = ""; r.querySelector(".row-b").setAttribute("aria-expanded", "true"); r.querySelector(".row-d").hidden = false;
  if (scroll) r.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
}
document.addEventListener("click", async e => {
  const rb = e.target.closest(".row-b");
  if (rb) {
    const row = rb.closest(".row"), d = row.querySelector(".row-d"), open = d.hidden;
    d.hidden = !open; rb.setAttribute("aria-expanded", String(open));
    if (open) { row.dataset.open = ""; track("row_open", { n: +row.dataset.n }); } else delete row.dataset.open;
    return;
  }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const n = +b.closest("[data-n]").dataset.n, act = b.dataset.act, from = b.closest("#insp") ? "#insp" : `#level-${n} .row-q`;
  if (act === "learn") { toast(await copy(promptFor(L[n - 1])) ? "Prompt copied. Paste it into your agent." : "Couldn't copy here."); track("learn_copy", { n }); return; }
  OV = store.get(okey()) || {};   /* start from what's saved: another tab of this result may have ticked since */
  if (act === "self") OV[n] = "self"; else if (act === "no") OV[n] = "no"; else delete OV[n];
  store.set(okey(), OV); track("override", { n, act }); changed(n);
  $(`${from} [data-act]:not([data-act="learn"])`)?.focus();
});
/* one answer changed: its row, the map, the inspector, the counts, the card and the level, all in place */
function changed(n) {
  const r = $("#level-" + n);
  if (r) { const open = r.hasAttribute("data-open"); r.outerHTML = rowHTML(L[n - 1], r.dataset.kind); if (open) openRow(n); }
  renderBoard(); $(`#board .tile[data-n="${n}"]`)?.classList.add("just"); renderInsp(); unlockCounts(); renderCopy();
  $("#fan").innerHTML = fanHTML(false); keepLast(); syncSoon();
}
/* "Your level" elsewhere on the page follows the ticks on this result */
function keepLast() {
  if (MODE !== "mine" || LAST?.hash !== location.hash.slice(1)) return;
  LAST.lv = level(); store.set("levels-last", LAST); $("#live").textContent = `Level ${LAST.lv}`;
}

/* ---------- the hero. Your own result takes over the top of the page in yellow: it's yours, and it should look it */
function renderCopy() {
  document.body.dataset.mode = MODE;
  $("#copy-home").hidden = MODE !== "show"; $("#copy-result").hidden = MODE === "show"; $("#live").hidden = MODE !== "mine";
  $("#go").hidden = !canWait(); $("#next").hidden = MODE !== "chat";
  $("#yours").hidden = MODE !== "mine"; $("#ticker").hidden = MODE === "mine" || MODE === "chat";
  $("#mine").hidden = !(canWait() && LAST);
  if (LAST) { $("#mine").href = "#" + LAST.hash; $("#mine").textContent = `Your level: ${LAST.lv}`; }
  const lv = level(), t = tierOf(Math.max(1, lv)), sc = selfCount(), unsure = L.filter(l => st(l.n) === "q").length;
  $("#map-title").textContent = MODE === "mine" ? "Your map" : MODE === "pub" ? `${whose()} map` : "The 100";
  $("#map-sub").textContent = MODE === "mine" ? (lv === 100 ? "Every key lit." : `${lv} lit, ${100 - lv} to unlock.`)
    : MODE === "pub" ? `${lv} lit. Yours will light up differently.` : "Ten eras, from first contact to writing your own agent.";
  if (MODE === "show") return;
  $("#res-num").textContent = MODE === "chat" ? 0 : lv;
  if (MODE === "chat") {
    $("#res-kicker").textContent = "You're in a chat tab";
    $("#res-era").textContent = "Everyone starts here.";
    $("#res-line").textContent = "A chat can't look at your computer, so it can't run the check. That's the whole difference: an agent works in your folders, runs things, and shows you what it did. It asks before anything you haven't allowed.";
    $$("#noticed, #res-rank").forEach(el => el.hidden = true);
    return renderPicks();
  }
  /* a second run in this browser: how it moved since the one before */
  const prev = MODE === "mine" && LAST?.prev, moved = prev && levelOf(SUBJ) - prev.lv;
  const since = !prev ? "" : moved > 0 ? ` · up ${moved} since ${day(prev.at)}` : moved < 0 ? ` · down ${-moved} since ${day(prev.at)}` : ` · same as on ${day(prev.at)}`;
  const from = MODE === "mine" && FROM && FROM.s !== SUBJ.s ? ` ${FROM.name ? FROM.name + ", whose card sent you here, is" : "The card that sent you here is"} level ${levelOf(FROM)}.` : "";
  $("#res-kicker").textContent = MODE === "pub" ? (SUBJ.name ? `${SUBJ.name}'s card` : "Someone's card") : "Your level" + since;
  $("#res-era").textContent = `${t.era}. ${t.name}.`;
  $("#res-line").textContent = MODE === "pub"
    ? `Their agent found ${lv - sc} on their machine${sc ? `, and they ticked ${sc}` : ""}.`
    : `Your agent found ${lv - sc}${sc ? `, you ticked ${sc}` : ""}.${unsure ? ` It couldn't see ${unsure} from here.` : ""}${from}`;
  $("#noticed").hidden = !(MODE === "mine" && SUBJ.f.length);
  $("#noticed-list").innerHTML = MODE === "mine" ? SUBJ.f.map(x => `<li>${esc(x)}</li>`).join("") : "";
  renderRank();
  $("#live").textContent = `Level ${lv}`;
}
function renderPicks() {   /* level 0, in a chat tab: where they'd start once they have an agent */
  $("#picks").innerHTML = SUBJ.p.map(([n, why]) => { const l = L[n - 1];
    return `<div class="pick" data-n="${n}"><span class="tile">${icon(n)}</span><div><h3><span class="n">${n}</span>${esc(l.title)}</h3>
      <p>${why ? `<span class="why">${esc(why)}</span> ` : ""}${esc(l.line)}</p>${tryHTML(l, true)}</div></div>`; }).join("");
}
$("#card-name").addEventListener("input", () => { store.set("levels-name", $("#card-name").value); $("#fan").innerHTML = fanHTML(false); syncSoon(); });
/* your photo on your card: cut to the card's picture here, kept in this browser, and sent only with a card you share */
let PHOTO = store.get("levels-photo");
function setPhoto(p) {
  PHOTO = p; try { p ? localStorage.setItem("levels-photo", JSON.stringify(p)) : localStorage.removeItem("levels-photo"); } catch {}
  WHO = PHOTO ? { photo: PHOTO } : null; renderAll(false); syncSoon();
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
$("#stage").addEventListener("click", e => { if (e.target.closest("[data-photo]")) $("#photo-in").click(); });
/* under your card: your face and your name on it, the two things that make it yours */
function renderTools() { $("#photo-b").innerHTML = CAMERA + `<span>${PHOTO ? "Change photo" : "Add your photo"}</span>`; $("#photo-rm").hidden = !PHOTO; }
$("#photo-in").addEventListener("change", async e => {
  const f = e.target.files?.[0]; e.target.value = "";
  if (!f) return;
  try { setPhoto(await cutPhoto(f)); track("photo_added"); toast(OWN?.shared ? "On your card, and at its link." : "On your card. It goes online only when you share."); }
  catch { toast("Couldn't read that image. Try a JPEG or PNG."); }
});
$("#photo-rm").addEventListener("click", () => { setPhoto(null); toast("Photo removed"); });

/* ---------- the share images, drawn here from the real card: a card taped to paper, its level ringed in red pen
   site: the link preview for the page (1200x630) · wide: a card link's preview (1200x630) · square: Save image (1200x1200) */
const TAPE = `<i class="tape"></i>`;
const RING = `<svg class="ring" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M122 9C64 1 9 20 11 52s62 44 112 40 74-26 68-52S142 3 84 11" vector-effect="non-scaling-stroke"/></svg>`;
const ME = `<div class="me"><span>me</span><svg viewBox="0 0 80 60" aria-hidden="true"><path d="M6 8c22 2 44 12 58 38M64 46l-14-3M64 46l2-14"/></svg></div>`;
function ogHTML(kind, as) {
  const ask = `<div class="og-copy"><div class="og-brand">levels <span>by @virpo</span></div><h2 class="og-h">What level are you with agents?</h2>
    <p class="og-sub">100 levels. Your own agent checks which you do, on your own machine.</p></div><div class="og-url">${SITE}</div>`;
  if (kind === "site") return `${ask}<div class="og-cards">${fanHTML(false).replace('<div class="tcard front', TAPE + '<div class="tcard front')}</div>`;
  const digits = String(level()).length;
  const mine = `<div class="og-card" style="--d:${digits}">${TAPE}${subjectCard("solo", false, as)}${RING}${ME}</div>`;
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
/* wide: a JPEG data URL for the card link · square: a PNG blob to keep. One at a time: they share the offscreen element */
let drawing = Promise.resolve();
const ogImage = (kind, as) => (drawing = drawing.catch(() => {}).then(() => drawOg(kind, as)));
async function drawOg(kind, as) {
  const el = $("#og"); el.className = "og " + kind; el.innerHTML = ogHTML(kind, as);
  await Promise.all([...el.querySelectorAll("img")].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  if (!window.htmlToImage) throw new Error("renderer not loaded");
  await document.fonts.ready;
  const o = { width: 1200, height: kind === "square" ? 1200 : 630, backgroundColor: kind === "site" ? "#EFE8DA" : "#FFD400", fontEmbedCSS: await embedFonts() };
  return kind === "square" ? htmlToImage.toBlob(el, { ...o, pixelRatio: 1.5 }) : htmlToImage.toJpeg(el, { ...o, pixelRatio: 1, quality: .9 });
}

/* ---------- your card, kept. It's saved anonymously as soon as your result opens: the answers and the agents, which give
   it a link and count it in the stats. The name and the photo join it the first time you share, and from then on the
   link follows the card. The key that lets this browser change or delete it is kept here, per result */
const ckey = () => "levels-card-" + SUBJ.s;
let OWN = null, making = null, syncing = null, syncTimer = null;   /* OWN: { id, key, url, shared, sent, no: its place in line } */
const answers = () => ({ v: V, s: L.map(l => ({ y: "y", self: "s", q: "?", n: "n" })[st(l.n)]).join(""), a: SUBJ.a, pi: SUBJ.pi ? 1 : 0 });
const goesOut = () => OWN?.shared ? { name: cardName(), photo: PHOTO } : { name: "", photo: null };
const sig = () => { const g = goesOut(); return [answers().s, g.name, g.photo ? g.photo.length + g.photo.slice(-32) : ""].join("|"); };
async function api(method, path, body) {
  const r = await fetch(D.api + path, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(OWN?.key ? { "x-card-key": OWN.key } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw Object.assign(new Error(r.status), { status: r.status });
  return r.status === 204 ? null : r.json();
}
function keepOwn() { store.set(ckey(), OWN); store.set("levels-own", OWN.id); renderLink(); }
/* the card for the result open here: the one this browser made for it, or a new one */
function ensureCard() {
  if (MODE !== "mine") return Promise.reject(new Error("not yours"));
  if (OWN) return Promise.resolve(OWN);
  return making ??= api("POST", "/api/card", answers()).then(r => {
    OWN = { id: r.id, key: r.key, url: r.url, shared: false, sent: answers().s + "||", no: r.stats?.n }; keepOwn(); track("card_saved");
    if (r.stats) { RANK = r.stats; renderRank(); }
    return OWN;
  }).finally(() => { making = null; });
}
/* bring the card at the link up to date with the one on screen, image included; one at a time, each sends what's
   on screen when it starts */
async function syncCard(retry = true) {
  await ensureCard();
  while (syncing) await syncing.catch(() => {});
  if (OWN.sent === sig() && OWN.img) return OWN;
  const want = sig(), g = goesOut(), was = OWN;
  syncing = (async () => {
    const r = await api("PUT", `/api/card/${was.id}`, { ...answers(), name: g.name, photo: g.photo, image: await ogImage("wide", g) });
    Object.assign(was, { url: r.url, sent: want, img: true }); if (OWN === was) keepOwn();
    if (r.stats) { RANK = r.stats; renderRank(); }
  })();
  try { await syncing; syncing = null; }
  catch (e) {
    syncing = null;
    if (!retry || ![403, 404].includes(e.status)) throw e;
    store.set(ckey(), null); OWN = null;   /* gone from the server: a new card, shared if this one was */
    await ensureCard(); if (was.shared) { OWN.shared = true; keepOwn(); }
    return syncCard(false);
  }
  return OWN;
}
function syncSoon() {
  if (MODE !== "mine") return;
  clearTimeout(syncTimer); syncTimer = setTimeout(() => syncCard().catch(() => {}), 1800);
}
function renderLink() {
  const a = $("#card-url"), ok = MODE === "mine" && OWN;
  a.textContent = ok ? OWN.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "saving your card…"; a.href = ok ? OWN.url : "#";
  $("#share-link").disabled = !ok;
  $("#share-note").textContent = !ok ? "" : OWN.shared ? "Anyone with the link sees this card." : "Saved anonymously. Your name and photo go up when you share.";
}
/* sharing: the card at the link becomes the one on screen, name and photo included */
async function shareCard() {
  await ensureCard();
  if (!OWN.shared) { OWN.shared = true; keepOwn(); }
  await syncCard();
  return OWN.url;
}
/* the map as squares, a row per era, the way it posts */
const squares = () => [...Array(10)].map((_, r) => L.slice(r * 10, r * 10 + 10).map(l => done(l.n) ? "🟨" : "⬛").join("")).join("\n");
$("#share-x").addEventListener("click", async () => {
  const w = window.open("", "_blank");   /* opened inside the click, so it isn't blocked; pointed at X once the card is up */
  let url = `https://${SITE}/`;
  try { url = await shareCard(); } catch { $("#share-note").textContent = "Couldn't update your card right now, so the post links to the list."; }
  const x = "https://x.com/intent/post?text=" + encodeURIComponent(`I'm level ${level()} of 100 with agents.\n\n${squares()}\n\n${url}`);
  track("share_x", { lv: level(), linked: url !== `https://${SITE}/` });
  if (w) { w.opener = null; w.location.href = x; } else location.href = x;
});
$("#share-link").addEventListener("click", async () => {
  try { const url = await shareCard(); toast(await copy(url) ? "Link copied. It opens this card." : url); track("share_link"); }
  catch { toast("Couldn't update your card right now. Try again in a minute."); }
});
/* copying the link by hand counts as sharing too */
$("#card-url").addEventListener("copy", () => { shareCard().catch(() => {}); });
$("#card-url").addEventListener("click", e => { if (!OWN) e.preventDefault(); else shareCard().catch(() => {}); });
/* the card as an image, for anywhere: handed to the clipboard inside the click, with the image still drawing, which is
   what Safari needs; where images can't go on the clipboard, it downloads instead */
$("#share-png").addEventListener("click", async () => {
  const img = ogImage("square");
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": img })]);
    toast("Card copied. Paste it anywhere."); track("share_png", { how: "clipboard" });
  } catch {
    try { const b = await img, a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `levels-${level()}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast("Saved the card"); track("share_png", { how: "download" }); }
    catch { toast("Couldn't draw the card here"); }
  }
});
/* where this level stands among every card saved so far; while there are only a few, your place in line instead */
let RANK = null;
function renderRank() {
  const el = $("#res-rank"), t = RANK, early = t?.n < 50;
  el.hidden = MODE !== "mine" || !t?.n || (early && !OWN?.no);
  if (el.hidden) return;
  const lv = level(), below = t.levels.slice(0, lv).reduce((a, b) => a + b, 0);
  el.textContent = early ? `You're #${OWN.no} to check.` : `Higher than ${Math.round(100 * below / t.n)}% of the ${t.n.toLocaleString("en")} who checked.`;
}
async function arrive() {
  OWN = store.get(ckey()); renderLink();
  try { await ensureCard(); } catch { $("#card-url").textContent = "couldn't save your card right now"; return; }
  if (!RANK) { RANK = await fetch(D.api + "/api/stats").then(r => r.ok ? r.json() : null).catch(() => null); renderRank(); }   /* a card saved before: the shared totals */
  setTimeout(() => syncCard().catch(() => {}), calm ? 0 : 3200);   /* the link's preview image, once the card has filled in */
}
async function post(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
$("#mail").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#mail-email").value.trim();
  try { await post(D.api + "/api/notify", { email, level: SUBJ && MODE === "mine" ? String(level()) : "" });
    $("#mail-note").textContent = "Done. You'll hear from me when 20 new levels are in. Nothing else."; $("#mail").querySelector("button").disabled = true; track("mail_joined"); }
  catch { $("#mail-note").textContent = "Couldn't save that right now. Try again in a minute."; }
});

/* ---------- the one action: copy the line. The yellow key then turns into the wait, with a clock, until the agent is back */
$$("[data-prompt]").forEach(el => el.textContent = PROMPT);
const bar = $("#bar"), STAYS = "The script only reads, and sends nothing.";
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
  `Any session. It runs on its own and opens your card here in a few minutes. ${STAYS}`);
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
if (TOUCH) $("#cta .cta-t").textContent = "Send it to my computer";
/* where it works: badges, not buttons. The one action is the yellow key */
$$(".agent").forEach(a => a.querySelector("i").innerHTML = D.agents?.[a.dataset.agent] || "");
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
  if (MODE === "mine" && e.key === okey()) { OV = store.get(okey()) || {}; renderAll(false); }
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
/* the system's theme until the button is pressed; then the opposite of what's showing, kept as the choice
   (the head applies a kept choice before the page paints) */
const darkNow = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const labelTheme = () => $("#theme").setAttribute("aria-label", darkNow() ? "Switch to light" : "Switch to dark");
$("#theme").addEventListener("click", () => {
  const t = darkNow() ? "light" : "dark";
  document.documentElement.dataset.theme = t; store.set("levels-theme", t); labelTheme(); track("theme", { t });
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", labelTheme);
labelTheme();
$("#fossil-grid").innerHTML = D.fossils.map(f => `<div class="fossil ${f.status}"><span class="stamp">${f.status} ${esc(f.era)}</span><b>${esc(f.title)}</b><p>${esc(f.line)}</p></div>`).join("");
$("[data-l0-title]").textContent = D.level0.title + ".";
$("[data-l0-line]").textContent = D.level0.line;
if (D.repo) {
  $("#gh").hidden = false; $("#gh").href = D.repo;
  $("#suggest-a").href = D.repo + "/issues/new?template=suggest-a-level.yml"; $("#suggest").hidden = false;
  $("#issues-a").href = D.repo + "/issues"; $("#tell-gh").hidden = false; $("#tell-x").hidden = true;
}
try { window.posthog?.register?.({ site: location.host }); } catch {}
$("[data-home]").addEventListener("click", e => { e.preventDefault(); history.pushState(null, "", location.pathname); boot(); scrollTo(0, 0); });

/* ---------- boot */
function renderAll(fan = true) { renderCopy(); renderBoard(); renderInsp(); renderLists(); renderTools(); if (fan) renderFan(); else $("#fan").innerHTML = fanHTML(false); }
const cardId = () => { const u = new URLSearchParams(location.search).get("u"); return /^[a-z2-9]{6}$/.test(u || "") ? u : null; };
function boot() {
  const h = location.hash, mine = decode(h), pub = CARD && CARD.id === cardId() ? CARD : null;
  clearTimeout(syncTimer); OWN = null; RANK = null;
  if (mine) {
    MODE = "mine"; SUBJ = mine; WHO = PHOTO ? { photo: PHOTO } : null;
    if (mine.was && !store.get(okey())) {   /* ticks made on this result under an earlier list follow their levels */
      const ov = store.get("levels-ov-" + mine.was.s), m = PAST[mine.was.v];
      if (ov) store.set(okey(), Object.fromEntries(Object.entries(ov).map(([n, v]) => [m.n(+n), v]).filter(([n]) => n)));
    }
    OV = store.get(okey()) || {}; $("#card-name").value = store.get("levels-name") || "";
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
  /* the inspector opens on where to go next: your first pick, their best, or the first key */
  const deep = +(/^#level-(\d{1,3})$/.exec(h)?.[1] || 0);
  TODO = null;
  SEL = { n: deep >= 1 && deep <= 100 ? deep : MODE === "mine" ? picked()[0] || L.find(l => !done(l.n))?.n || 100
    : MODE === "pub" ? [...L].reverse().find(l => st(l.n) === "y")?.n || 1 : 1 };
  renderAll();
  if (OG === "site") { document.body.classList.add("og-only"); $("#og").className = "og site"; $("#og").innerHTML = ogHTML("site"); return; }
  if (mine) { track("result_open", { lv: level() }); scrollTo(0, 0); chan?.postMessage({ hash: LAST.hash, lv: LAST.lv }); arrive(); }
  if (MODE === "chat") track("chat_landed");
  if (deep >= 1 && deep <= 100) openRow(deep, true);
}
window.levelsShareImage = kind => ogImage(kind || "wide");   /* the exact images sharing makes, for checking them */
/* delete my card: from the server first, then everything this browser kept about it */
$("#forget").addEventListener("click", async () => {
  try { if (OWN) await api("DELETE", `/api/card/${OWN.id}`); }
  catch (e) { if (e.status !== 404) return toast("Couldn't reach the server, so nothing was deleted. Try again in a minute."); }
  try { for (const k of ["levels-last", okey(), ckey(), "levels-name", "levels-from", "levels-own", "levels-photo"]) localStorage.removeItem(k); } catch {}
  OWN = null; LAST = null; FROM = null; PHOTO = null; history.pushState(null, "", location.pathname); boot(); scrollTo(0, 0); toast("Deleted, here and on the server.");
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
fetch(D.api + "/api/stats").then(r => r.ok ? r.json() : null).then(t => { if (t?.n >= 50) { STATS = t; renderLists(); } }).catch(() => {});
})();
