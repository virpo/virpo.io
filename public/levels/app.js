/* levels: the 100, always shown with a result. On arrival that's a real person's (the showcase); after the check it's
   yours, read from the link (#base64url JSON from check.md); on /u/ it is someone's published card. */
(() => {
const D = JSON.parse(document.getElementById("data").textContent);
const L = D.levels, T = D.tiers, ICON = D.icons || {}, ART = D.art || {}, SHOW = D.showcase || [];
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tierOf = n => T[Math.min(9, Math.max(0, Math.ceil(n / 10) - 1))];
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const track = (e, p) => { try { window.posthog?.capture("levels_" + e, p); } catch {} };
const SITE = D.site, PROMPT = `Read ${D.site}/check.md and do what it says.`;
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const OG = new URLSearchParams(location.search).get("og");

/* ---------- results */
function norm(p) {
  if (!p || typeof p.s !== "string" || !/^[yns?]{100}$/.test(p.s)) return null;
  return {
    s: p.s, name: String(p.name ?? "").slice(0, 32), pi: !!p.pi,
    a: (Array.isArray(p.a) ? p.a : []).slice(0, 6).map(x => String(x).slice(0, 40)),
    p: (Array.isArray(p.p) ? p.p : []).slice(0, 3).map(x => [Math.round(+x?.[0]) || 0, String(x?.[1] ?? "").slice(0, 160)]).filter(x => x[0] >= 1 && x[0] <= 100),
    e: Object.fromEntries(Object.entries(p.e && typeof p.e === "object" ? p.e : {}).slice(0, 40).map(([k, v]) => [String(+k), String(v).slice(0, 60)])),
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
const okey = () => "levels-ov-" + SUBJ.s;
const st = n => {   /* y: their agent found it · self: ticked by hand · q: unsure · n */
  if (!SUBJ) return null;
  const o = MODE === "mine" ? OV[n] : null, a = SUBJ.s[n - 1];
  if (o === "self") return "self";
  if (o === "no") return "n";
  return a === "y" ? "y" : a === "s" ? "self" : a === "?" ? "q" : "n";
};
const done = n => ["y", "self"].includes(st(n));
const level = () => L.filter(l => done(l.n)).length;
const selfCount = () => L.filter(l => st(l.n) === "self").length;
const whose = () => MODE === "mine" ? "Your" : (WHO?.first || SUBJ.name.split(" ")[0] || "Their") + "'s";

/* ---------- small pieces */
const icon = n => ICON[n] ? `<img src="${ICON[n]}" alt="" width="34" height="34" loading="lazy">` : `<span>${n}</span>`;
const promptFor = l => `Help me reach level ${l.n} of ${SITE}: "${l.title}". ${l.line} Look at how I work here, suggest the smallest setup that would do it, then do it with me and show me it working.`;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2600); }
async function copy(text) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }
const quote = (f, vs) => !f ? "" : `<blockquote class="quote${vs ? " vs" : ""}">${vs ? `<div class="vs-k">Pros disagree</div>` : ""}
  <p>${f.paraphrase || f.title || f.skill || f.repo || f.file ? esc(f.q) : "“" + esc(f.q) + "”"}</p>
  <cite>${f.x ? `<a href="https://x.com/${esc(f.x)}" rel="noopener" target="_blank">${esc(f.name)}</a>` : esc(f.name)}${f.paraphrase ? ", paraphrased" : ""} · <a href="${esc(f.url)}" rel="noopener" target="_blank">source</a></cite></blockquote>`;

/* ---------- cards */
function card(o) {
  return `<div class="tcard ${o.cls || ""}" style="--tc:var(--t${o.tier.n})"><div class="tc-in">
    <div class="tc-top"><div class="tc-lvl">${o.top}${o.small ? `<small>${o.small}</small>` : ""}</div><div class="tc-era">Tier ${o.tier.n}<b>${esc(o.tier.era)}</b></div></div>
    <div class="tc-art${o.photo ? " photo" : ""}">${o.img ? `<img src="${o.img}" alt="" style="object-position:${o.pos || "50% 50%"}">` : ""}${o.pi ? `<span class="tc-pi" title="Says please">π</span>` : ""}<div class="tc-name">${esc(o.name)}</div></div>
    <div class="tc-body"><div class="tc-grid">${o.cells.map((c, i) => `<i data-n="${i + 1}" class="${c}"></i>`).join("")}</div>
    <div class="tc-lines">${o.lines.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div></div>
    <div class="tc-foot"><span>${esc(o.foot)}</span><b>levels</b></div></div><i class="hcard sheen"></i><i class="hcard glare"></i></div>`;
}
function subjectCard(cls, blank) {
  const lv = level(), t = tierOf(Math.max(1, lv)), best = [...L].reverse().find(l => st(l.n) === "y" && l.how !== "self") || [...L].reverse().find(l => done(l.n));
  const nx = SUBJ.p.find(p => !done(p[0]))?.[0] || L.find(l => !done(l.n))?.n, sc = selfCount();
  const name = MODE === "mine" ? ($("#card-name").value || "").trim() || t.name : SUBJ.name || t.name;
  return card({ cls, tier: t, top: blank ? 0 : lv, small: "/100", img: WHO?.photo || ART[t.n], photo: !!WHO?.photo, pos: WHO?.photo ? "50% 30%" : "50% 50%", name, pi: SUBJ.pi,
    cells: L.map(l => blank ? "" : st(l.n) === "y" ? "y" : st(l.n) === "self" ? "self" : ""),
    lines: [best && ["Best", `${best.n}. ${best.title}`], nx && ["Next", `${nx}. ${L[nx - 1].title}`], SUBJ.a.length && ["Uses", SUBJ.a.join(", ")]].filter(Boolean),
    foot: MODE === "chat" ? "a chat tab can't check" : sc ? `${lv - sc} found · ${sc} ticked` : `v${D.version} · checked locally` });
}
const tierCard = (n, cls) => { const t = T[n - 1];
  return card({ cls, tier: t, top: `${n * 10 - 9}–${n * 10}`, img: ART[n], name: t.name,
    cells: L.map(l => Math.ceil(l.n / 10) === n ? "y" : ""), lines: [["Tier", t.line]], foot: `Levels ${n * 10 - 9} to ${n * 10}` }); };
function fanHTML(blank) {
  /* on arrival: the first and last tier around a real card; for a result: the tiers either side of it */
  const t = tierOf(Math.max(1, level())).n;
  let [a, b] = MODE === "show" ? [1, 10] : [t - 1, t + 1];
  if (a < 1) [a, b] = [t + 1, t + 2];
  if (b > 10) [a, b] = [t - 2, t - 1];
  return tierCard(a, "back-l") + tierCard(b, "back-r") + subjectCard("front", blank);
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
let FILTER = "all", STATS = null;
const pct = n => STATS ? Math.round(100 * (STATS.found[n - 1] + STATS.ticked[n - 1]) / STATS.n) : null;
function rowHTML(l) {
  const s = st(l.n), ev = SUBJ?.e?.[l.n], mine = MODE === "mine";
  const badge = !mine ? "" : s === "y" ? `<span class="state y">found</span>` : s === "self" ? `<span class="state self">ticked</span>`
    : s === "q" ? `<span class="state q">unsure</span>` : `<span class="state n">not yet</span>`;
  const act = !mine ? "" : s === "y" ? `<button class="key mini" type="button" data-act="no">That's wrong</button>`
    : s === "self" ? `<button class="key mini" type="button" data-act="undo">Undo</button>`
    : `<button class="key mini" type="button" data-act="self">I do this</button>`;
  return `<div class="row${s ? " is-" + s : ""}" id="level-${l.n}" data-n="${l.n}">
    <button class="row-b" type="button" aria-expanded="false" aria-controls="d${l.n}">
      <span class="ico">${icon(l.n)}</span><span class="num">${l.n}</span>
      <span class="row-t"><b>${esc(l.title)}</b><span>${esc(l.line)}</span></span>
      <span class="row-m">${badge}${!mine && l.from?.x ? `<span class="who">@${esc(l.from.x)}</span>` : ""}${STATS ? `<span title="of ${STATS.n} people who added theirs">${pct(l.n)}%</span>` : ""}<span class="chev" aria-hidden="true">›</span></span>
    </button>
    <div class="row-d" id="d${l.n}" hidden>
      <p class="how-t"><b>How it's checked</b>${esc(l.check)}${l.how === "self" && l.check !== "Only you know." ? " Usually only you can tell, so you tick it." : ""}</p>
      ${ev && done(l.n) ? `<p class="evidence">${whose()} agent found: <b>${esc(ev)}</b></p>` : ""}
      ${quote(l.from)}${quote(l.vs, true)}
      <div class="row-acts"><button class="key mini" type="button" data-act="learn">Copy a prompt to learn this</button>${act}</div>
    </div></div>`;
}
function renderList() {
  const show = l => FILTER === "all" ? true : FILTER === "y" ? done(l.n) : !done(l.n);
  $("#tiers").classList.toggle("lit", !!SUBJ);
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
  $$("#filters button")[1].textContent = MODE === "mine" ? "Yours" : "Lit";
}
function openRow(n, scroll) {
  let r = $("#level-" + n);
  if (!r) { FILTER = "all"; syncFilters(); renderList(); r = $("#level-" + n); }
  r.dataset.open = ""; r.querySelector(".row-b").setAttribute("aria-expanded", "true"); r.querySelector(".row-d").hidden = false;
  if (scroll) r.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
}
$("#tiers").addEventListener("click", async e => {
  const row = e.target.closest(".row"); if (!row) return;
  const n = +row.dataset.n, act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "learn") { toast(await copy(promptFor(L[n - 1])) ? "Prompt copied. Paste it into your agent." : "Couldn't copy here."); track("learn_copy", { n }); return; }
  if (act) {
    if (act === "self") OV[n] = "self"; else if (act === "no") OV[n] = "no"; else delete OV[n];
    store.set(okey(), OV); track("override", { n, act }); renderAll(false); openRow(n); return;
  }
  if (e.target.closest(".row-b")) {
    const d = row.querySelector(".row-d"), open = d.hidden;
    d.hidden = !open; row.querySelector(".row-b").setAttribute("aria-expanded", String(open));
    if (open) { row.dataset.open = ""; track("row_open", { n }); } else delete row.dataset.open;
  }
});
function syncFilters() { $$("#filters button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === FILTER))); }
$("#filters").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; FILTER = b.dataset.f; syncFilters(); renderList(); });

/* ---------- hero copy for a result */
function renderCopy() {
  $("#copy-home").hidden = MODE !== "show"; $("#copy-result").hidden = MODE === "show";
  $("#next").hidden = MODE === "show";
  $("#mine").hidden = !(MODE === "show" && LAST);
  if (LAST) { $("#mine").href = "#" + LAST.hash; $("#mine").textContent = `Your level: ${LAST.lv}`; }
  if (MODE === "show") return;
  $("#install").hidden = MODE !== "chat";
  if (MODE === "chat") {
    $("#res-kicker").textContent = "Level 0 · you're in a chat tab";
    $("#res-title").textContent = "Level 0. Everyone starts here.";
    $("#res-line").textContent = "Your chat assistant read the check, but it can't look at your computer, so it can't run it. That's the whole difference between a chat and an agent: an agent works in your folders, runs things, and shows you what it did. It's less scary than it sounds. It asks before it does anything you haven't allowed.";
    $$("#share, #share-note, #res-foot, #keep").forEach(el => el.hidden = true);
    $("#getyours").hidden = false; $("#getyours-h").textContent = "Try an agent in ten minutes";
    $("#getyours-p").textContent = "Install one of these, open a folder you care about, and paste the same line. It will find your real level.";
    $("#picks-h").textContent = "Where you'd start";
  } else { $("#getyours-h").textContent = "Get yours"; $("#picks-h").textContent = "Learn next"; }
  if (MODE === "chat") return renderPicks();
  const lv = level(), t = tierOf(Math.max(1, lv)), sc = selfCount(), unsure = L.filter(l => st(l.n) === "q").length;
  $("#res-kicker").textContent = MODE === "pub" ? `${SUBJ.name ? SUBJ.name + "'s card" : "A card"} · published by them` : "Your result · from the link, nothing uploaded";
  $("#res-title").textContent = `Level ${lv}. ${t.era}.`;
  $("#res-line").textContent = MODE === "pub"
    ? `Their own agent found ${lv - sc} of the 100 on their machine${sc ? `, and they ticked ${sc} more` : ""}. ${t.line}`
    : `Your agent found ${lv - sc} of the 100${sc ? `, and you ticked ${sc}` : ""}. ${unsure ? `It couldn't see ${unsure} from your machine; open them below and tick the ones you do.` : t.line}`;
  $$("#share, #share-note, #res-foot").forEach(el => el.hidden = MODE === "pub");
  $("#keep").hidden = MODE !== "mine"; $("#getyours").hidden = MODE !== "pub";
  renderPicks();
}
function renderPicks() {
  const picks = SUBJ.p.length ? SUBJ.p : L.filter(l => !done(l.n)).slice(0, 3).map(l => [l.n, ""]);   /* picks */
  $("#picks").innerHTML = picks.map(([n, why]) => { const l = L[n - 1];
    return `<div class="pick"><span class="ico">${icon(n)}</span><div><h3><span class="n">${n}</span>${esc(l.title)}</h3>
      <p>${why ? `<span class="why">${esc(why)}</span> ` : ""}${esc(l.line)}</p>
      <div class="pick-acts"><button class="key mini" type="button" data-learn="${n}">Copy a prompt for your agent</button><button class="linkish mono" type="button" data-goto="${n}">How it's checked</button></div></div></div>`; }).join("");
}
$("#picks").addEventListener("click", async e => {
  const a = e.target.closest("[data-learn]"), g = e.target.closest("[data-goto]");
  if (a) { toast(await copy(promptFor(L[a.dataset.learn - 1])) ? "Prompt copied. Paste it into your agent." : "Couldn't copy here."); track("pick_copy", { n: +a.dataset.learn }); }
  if (g) openRow(+g.dataset.goto, true);
});
$("#card-name").addEventListener("input", () => { store.set("levels-name", $("#card-name").value); SHARE_URL = null; renderFan(); });

/* ---------- the share image (1200x630), drawn here so it matches the page exactly */
function ogHTML(kind) {
  const lv = level(), t = tierOf(Math.max(1, lv));
  const left = kind === "site"
    ? `<div class="og-copy"><div class="og-brand">levels <span>by @virpo</span></div><h2 class="og-h">What level are you with agents?</h2><p class="og-sub">100 levels. <b>One prompt.</b> Checked on your own machine.</p></div>`
    : `<div class="og-copy"><div class="og-brand">levels <span>by @virpo</span></div><p class="og-big">${lv}<small>/100</small></p><p class="og-sub"><b>${esc(t.era)}</b> · ${esc(t.name.toLowerCase())}<br>checked by ${MODE === "mine" ? "my" : "their"} own agent</p></div>`;
  return `${left}<div class="og-cards">${fanHTML(false)}</div><div class="og-url">${SITE}</div>`;
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
async function ogImage(type) {
  const el = $("#og"); el.innerHTML = ogHTML("result");
  await Promise.all([...el.querySelectorAll("img")].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  if (!window.htmlToImage) throw new Error("renderer not loaded");
  await document.fonts.ready;
  const o = { width: 1200, height: 630, pixelRatio: type === "jpeg" ? 1 : 2, backgroundColor: "#0E0D0A", fontEmbedCSS: await embedFonts() };
  return type === "jpeg" ? htmlToImage.toJpeg(el, { ...o, quality: .9 }) : htmlToImage.toBlob(el, o);
}

/* ---------- share */
const squares = () => `levels ${level()}/100\n` + [...Array(10)].map((_, r) => L.slice(r * 10, r * 10 + 10).map(l => done(l.n) ? "🟨" : "⬛").join("")).join("\n") + `\n${SITE}`;
$("#share-copy").addEventListener("click", async () => { toast(await copy(squares()) ? "Squares copied" : "Couldn't copy here."); track("share_squares"); });
$("#share-x").addEventListener("click", async () => {
  const lv = level(), t = tierOf(Math.max(1, lv));
  let copied = false;
  if (!SHARE_URL) { try { const b = await ogImage("png"); await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); copied = true; } catch {} }
  const text = `Level ${lv} of 100 at working with agents. ${t.era}.\n\nChecked by my own agent: ${SHARE_URL || "https://www." + SITE}`;
  toast(SHARE_URL ? "Opening X" : copied ? "Image copied. Paste it into the post." : "Opening X");
  track("share_x", { lv, linked: !!SHARE_URL, copied });
  window.open("https://x.com/intent/post?text=" + encodeURIComponent(text), "_blank", "noopener");
});
$("#share-png").addEventListener("click", async () => {
  try { const b = await ogImage("png"), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `levels-${level()}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); track("share_png"); }
  catch { toast("Couldn't draw the image here"); }
});
const answers = () => ({ s: L.map(l => ({ y: "y", self: "s", q: "?", n: "n" })[st(l.n)]).join(""), a: SUBJ.a, pi: SUBJ.pi ? 1 : 0 });
async function post(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
$("#share-link").addEventListener("click", async () => {
  const note = $("#share-note");
  if (SHARE_URL) { toast(await copy(SHARE_URL) ? "Link copied" : SHARE_URL); return; }
  note.textContent = "Making your card page…";
  try {
    const r = await post(D.api + "/api/card", { ...answers(), name: ($("#card-name").value || "").trim(), image: await ogImage("jpeg") });
    SHARE_URL = r.url;
    note.innerHTML = `Your card: <a href="${esc(r.url)}">${esc(r.url.replace(/^https?:\/\/(www\.)?/, ""))}</a>. Links to it show the card. Only the answers and name are stored.`;
    toast(await copy(r.url) ? "Link copied" : "Link ready"); track("card_published");
  } catch { note.textContent = "Couldn't make the link right now. Nothing was saved."; }
});
$("#pub-anon").addEventListener("click", async () => {
  try { await post(D.api + "/api/count", answers()); $("#pub-note").textContent = "Added. No name, no link: the 100 answers and the date."; $("#pub-anon").disabled = true; track("count_added"); }
  catch { $("#pub-note").textContent = "Couldn't add it right now. Nothing was saved."; }
});
$("#mail").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#mail-email").value.trim();
  try { await post(D.api + "/api/notify", { email, level: SUBJ && MODE === "mine" ? String(level()) : "" });
    $("#mail-note").textContent = "Done. One email when 20 new levels are in. Nothing else."; $("#mail").querySelector("button").disabled = true; track("mail_joined"); }
  catch { $("#mail-note").textContent = "Couldn't save that right now. Try again in a minute."; }
});

/* ---------- the one action: copy the line */
$$("[data-prompt]").forEach(el => el.textContent = PROMPT);
function waitForAgent(copied = true) {
  $("#wait").hidden = false; $("#wait").classList.remove("got");
  $("#wait-h").textContent = copied ? "Copied. Now paste it into your agent." : "Copy the line above, then paste it into your agent.";
  $("#wait-p").textContent = "Claude Code, Codex or Cursor. It looks around your machine for a few minutes, then opens your card. Everything stays on your computer; nothing reaches us unless you choose to save your card.";
}
$$("[data-cta]").forEach(b => b.addEventListener("click", async () => {
  const ok = await copy(PROMPT), from = b.dataset.from;
  track("cta_copy", { from, ok });
  if (!ok && MODE === "show") { if (from === "bar") scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }); waitForAgent(false); return; }
  if (!ok) { toast("Copy this line into your agent: " + PROMPT); return; }
  if (from === "bar") { $("#pop").hidden = false; clearTimeout(b.t); b.t = setTimeout(() => ($("#pop").hidden = true), 6000); }
  if (MODE === "show") waitForAgent(); else if (from !== "bar") toast("Copied. Paste it into your agent.");
}));
/* open it in the agent directly where the agent supports a prompt link (Claude Code, Cursor); always copy as well,
   because a link to an app that isn't installed does nothing */
const OPEN = { claudecode: "claude-cli://open?q=" + encodeURIComponent(PROMPT), cursor: "cursor://anysphere.cursor-deeplink/prompt?text=" + encodeURIComponent(PROMPT) };
$$(".agent").forEach(a => {
  a.querySelector("i").innerHTML = D.agents?.[a.dataset.agent] || "";
  if (OPEN[a.dataset.agent]) a.href = OPEN[a.dataset.agent];
  a.addEventListener("click", async e => {
    const ok = await copy(PROMPT), name = a.dataset.name;
    track("agent_open", { agent: a.dataset.agent, ok });
    if (!OPEN[a.dataset.agent]) e.preventDefault();
    waitForAgent(ok);
    $("#wait-h").textContent = OPEN[a.dataset.agent] ? `Opening ${name}…` : ok ? `Copied. Paste it into ${name}.` : `Copy the line above into ${name}.`;
    if (OPEN[a.dataset.agent]) $("#wait-p").textContent = `It opens with the line typed in; press Enter. Nothing happened? It's on your clipboard too: paste it into ${name}. Everything stays on your computer; nothing reaches us unless you choose to save your card.`;
  });
});
/* the agent opens the result in a new tab; that tab tells this one, which offers to show it here */
const chan = "BroadcastChannel" in window ? new BroadcastChannel("levels") : null;
function arrived(hash, lv) {
  if (MODE !== "show" || $("#wait").hidden) return;
  $("#wait").classList.add("got");
  $("#wait-h").textContent = `Your agent is back: level ${lv}.`;
  $("#wait-p").innerHTML = `It opened in another tab. <button class="key acc mini" type="button" id="show-here">Show it here</button>`;
  $("#show-here").onclick = () => { location.hash = hash; };
}
chan && (chan.onmessage = e => e.data?.hash && arrived(e.data.hash, e.data.lv));
addEventListener("storage", e => { if (e.key === "levels-last" && e.newValue) { try { const v = JSON.parse(e.newValue); arrived(v.hash, v.lv); } catch {} } });
document.addEventListener("click", e => { if (!e.target.closest("#pop, #bar-cta")) $("#pop").hidden = true; });
const bar = $("#bar");
addEventListener("scroll", () => bar.classList.toggle("scrolled", scrollY > 8), { passive: true });
new IntersectionObserver(([en]) => bar.classList.toggle("show-cta", MODE !== "mine" && !en.isIntersecting), { rootMargin: "-60px 0px 0px 0px" }).observe($("#cta"));

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
function boot() {
  const h = location.hash, pre = document.documentElement.dataset.card, mine = decode(h), pub = pre ? decode("#" + pre) : null;
  SHARE_URL = null;
  if (mine) { MODE = "mine"; SUBJ = mine; WHO = null; OV = store.get(okey()) || {}; $("#card-name").value = store.get("levels-name") || ""; }
  else if (h === "#chat") { MODE = "chat"; SUBJ = norm({ s: "n".repeat(100), name: "Chat tab", p: [[1, "This is the whole step: ten minutes, then paste the same line into it."], [5, "Easiest first win: show it the thing that's broken."], [10, "Try it on a chore first, not code."]] }); WHO = null; }
  else if (pub) { MODE = "pub"; SUBJ = pub; WHO = null; }
  else { const p = SHOW[0]; MODE = "show"; SUBJ = norm(p.result); SUBJ.name = p.name; WHO = { first: p.name.split(" ")[0], photo: p.photo }; }
  bar.classList.toggle("show-cta", MODE === "pub");
  renderAll();
  if (OG === "site") { document.body.classList.add("og-only"); $("#og").innerHTML = ogHTML("site"); return; }
  if (mine) {
    track("result_open", { lv: level() }); scrollTo(0, 0);
    LAST = { hash: h.slice(1), lv: level(), at: Date.now() }; store.set("levels-last", LAST);
    chan?.postMessage({ hash: LAST.hash, lv: LAST.lv });
  }
  if (MODE === "chat") track("chat_landed");
  const m = /^#level-(\d{1,3})$/.exec(h); if (m && +m[1] >= 1 && +m[1] <= 100) openRow(+m[1], true);
}
window.levelsShareImage = () => ogImage("jpeg");   /* the exact image a share link uses, for checking it */
$("#forget").addEventListener("click", () => {
  try { localStorage.removeItem("levels-last"); localStorage.removeItem(okey()); localStorage.removeItem("levels-name"); } catch {}
  LAST = null; history.pushState(null, "", location.pathname); boot(); scrollTo(0, 0); toast("Forgotten. It only ever lived in this browser.");
});
addEventListener("hashchange", boot);
boot();
fetch(D.api + "/api/stats").then(r => r.ok ? r.json() : null).then(t => { if (t?.n >= 50) { STATS = t; renderList(); } }).catch(() => {});
})();
