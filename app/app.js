import * as C from "./calc.js";

/* ---------- Format und Hilfen ---------- */
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const eur0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const pctf = new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 1 });
const money = (v) => (Number.isFinite(v) ? eur.format(v) : "–");
const money0 = (v) => (Number.isFinite(v) ? eur0.format(v) : "–");
const eur4 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 4, maximumFractionDigits: 4 });
const unitMoney = (v) => (Number.isFinite(v) ? (Math.abs(v) < 0.1 ? eur4.format(v) : eur.format(v)) : "–");
const pct = (v) => (Number.isFinite(v) ? pctf.format(v) : "–");
const pieces = (v) => (v === null || !Number.isFinite(v) ? "–" : `${int.format(v)} Stk.`);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const toNum = (v) => { const n = Number(String(v).trim().replace(/\./g, (m, i, s) => (s.includes(",") ? "" : m)).replace(",", ".")); return Number.isFinite(n) ? n : null; };
const fmtIn = (v) => (v === "" || v === null || v === undefined ? "" : Number(v).toLocaleString("de-DE", { maximumFractionDigits: 6, useGrouping: false }));
const tone = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "");
const marginTone = (m) => (m >= 0.4 ? "good" : m >= 0.2 ? "mid" : "bad");
const byId = (list, id) => list.find((entry) => entry.id === id);
const store = {
  get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* privat oder voll */ } },
};

const ICONS = {
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 7h7M8.5 12h1M12 12h0M15.5 12h0M8.5 16h1M12 16h0M15.5 16h0"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  shirt: '<path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3c-.6 1.8-2.2 3-4 3S8.6 4.8 8 3z"/>',
  truck: '<path d="M2 6h12v10H2zM14 10h4l4 4v2h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  building: '<path d="M3 21V8l9-5 9 5v13M9 21v-6h6v6M3 21h18"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12L22 7H6.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z"/>',
  save: '<path d="M5 3h11l3 3v15H5zM8 3v6h8M8 21v-7h8v7"/>',
  doc: '<path d="M6 2.5h8l4 4v15H6zM14 2.5v4h4M9 12h6M9 16h6"/>',
};
const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const PAGES = [
  { id: "dashboard", label: "Übersicht", icon: "chart", group: "Auswerten" },
  { id: "quote", label: "Angebotsrechner", icon: "calc" },
  { id: "offers", label: "Angebote", icon: "doc" },
  { id: "products", label: "Produkte", icon: "tag", group: "Pflegen" },
  { id: "textiles", label: "Textilien", icon: "shirt" },
  { id: "suppliers", label: "Lieferanten", icon: "truck" },
  { id: "materials", label: "Material & Druck", icon: "drop" },
  { id: "fixed", label: "Fixkosten", icon: "building" },
  { id: "channels", label: "Marktplätze", icon: "cart" },
  { id: "settings", label: "Einstellungen", icon: "gear", group: "System" },
];
const ROLE_LABEL = { film: "Folie je Druck", powder: "Pulver je Druck", inkCmyk: "Tinte CMYK", inkWhite: "Tinte Weiß", bag: "Versandtasche", label: "Versandetikett", shipping: "Versand je Sendung" };
const COLORS = ["#0a84ff", "#34c759", "#ff9f0a", "#bf5af2", "#ff375f", "#64d2ff", "#ffd60a", "#ac8e68"];

/* ---------- Zustand ---------- */
let data = null;
const ui = store.get("kalk.ui", {});
ui.page ||= "dashboard";
ui.play ||= {};
ui.quote ||= { productId: "", quantity: 50, prints: "", supplierId: "", ownTextilePrice: "", shippingIncluded: true, parcelCost: "", piecesPerParcel: 20, setupCost: 0, includeOverhead: false, overheadVolume: 1000, mode: "markup", markup: 1, targetUnitNet: "", discount: 0, customer: "" };
ui.quote.discountAuto ??= true;
ui.targetMargin ??= 0.4;
ui.examplePrice ??= 19.95;
const LIVE = {};

function normalize(d) {
  for (const key of ["suppliers", "textiles", "materials", "staff", "fixedCosts", "scenarios", "channels", "products", "offers"]) d[key] ||= [];
  // Absender für Angebote: jede Firma trägt ihre Daten und ihr Logo unter Einstellungen ein.
  d.company = {
    name: "", street: "", zip: "", city: "", country: "Deutschland", phone: "", email: "", website: "", manager: "", register: "",
    vatId: "", taxNumber: "", bankName: "", iban: "", bic: "", logo: "", validDays: 30,
    intro: "Hallo,\n\nvielen Dank für deine Anfrage. Gerne bieten wir dir folgende Artikel an:",
    closing: "Wir freuen uns auf deinen Auftrag. Bei Fragen melde dich jederzeit.\n\nViele Grüße",
    ...d.company,
  };
  for (const offer of d.offers) for (const position of (offer.positions ||= [])) position.id ||= uid("pos");
  // B2B-Staffel: Rabatt auf den Grundpreis je Mindestmenge, Einrichtung bis zu einer Menge.
  d.b2b ||= { tiers: [[25, 0.05], [50, 0.1], [100, 0.15], [250, 0.2]].map(([minQty, discount]) => ({ minQty, discount })), setupFee: 25, setupFreeFrom: 50 };
  for (const tier of (d.b2b.tiers ||= [])) tier.id ||= uid("bt");
  d.printUsage ||= { cmykMl: 0, whiteMl: 0, powderG: 0, filmSheets: 1 };
  d.settings = { vatLiable: true, vatRate: 0.19, daysPerMonth: 30, roundTo: 10, profitTarget: 0, ...d.settings };
  for (const textile of d.textiles) for (const offer of (textile.offers ||= [])) offer.id ||= uid("o");
  for (const channel of d.channels) {
    for (const tier of (channel.tiers ||= [])) tier.id ||= uid("t");
    for (const plan of (channel.plans ||= [])) plan.id ||= uid("pl");
  }
  d.flags ||= {};
  // Einmalig: jedes Textil ohne Produkt wird verkaufbares Produkt (Verkaufspreis wird nachgetragen).
  if (!d.flags.productsFromTextiles) {
    for (const textile of d.textiles) {
      if (!d.products.some((p) => p.textileId === textile.id)) d.products.push(productFromTextile(d, textile));
    }
    d.flags.productsFromTextiles = true;
    migrated = true;
  }
  for (const product of d.products) product.planChannelId ||= d.settings.dashboardChannelId || d.channels[0]?.id || "";
  if (!byId(d.scenarios, d.settings.scenarioId)) d.settings.scenarioId = d.scenarios[0]?.id || "";
  return d;
}
let migrated = false;
function productFromTextile(d, textile) {
  return {
    id: uid("p"), name: textile.name, category: textile.category || "", priceGross: "", textileId: textile.id,
    supplierId: "", ownTextilePrice: "", procurement: 0, prints: 1, inkFactor: 1, powderFactor: 1, filmFactor: 1,
    scrapRate: 0, cleaning: 0, shippingOverride: "", packagingExtra: 0, returnsReserve: 0, adPerSale: 0,
    adShareOfPrice: 0, otherVariable: 0, plannedMonthly: 0, planChannelId: d.settings.dashboardChannelId || d.channels[0]?.id || "", notes: "",
  };
}
const hasPrice = (product) => Number(product.priceGross) > 0;
/** Produkte nach Kategorie in der Reihenfolge der Textil-Kategorien gruppiert. */
function productGroups(list = data.products) {
  const order = [...new Set([...data.textiles.map((t) => t.category || ""), ...list.map((p) => p.category || "")])];
  const groups = new Map(order.map((c) => [c, []]));
  for (const p of list) groups.get(p.category || "").push(p);
  return [...groups].filter(([, items]) => items.length).map(([category, items]) => [category || "Ohne Kategorie", items]);
}

/* ---------- Speichern ---------- */
let saveTimer = null, saving = false, dirty = false, rev = null;
async function reloadFromServer(message) {
  const response = await fetch("/api/data");
  rev = response.headers.get("X-Rev");
  data = normalize(await response.json());
  dirty = false;
  render();
  setStatus("", "Alle Änderungen gespeichert");
  if (message) toast(message);
}
// Zurück im Fenster: Stand von außen (z. B. zweites Fenster oder Import) übernehmen.
async function checkRemote() {
  if (dirty || saving || rev === null) return;
  try {
    const remote = (await (await fetch("/api/rev")).json()).rev;
    if (remote !== rev) await reloadFromServer("Neuer Stand geladen");
  } catch { /* Server aus: Status zeigt es beim nächsten Speichern */ }
}
window.addEventListener("focus", checkRemote);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkRemote(); });
function setStatus(state, text) {
  document.getElementById("save-status").innerHTML = `<span class="dot ${state}"></span><span>${esc(text)}</span>`;
}
function scheduleSave() {
  dirty = true;
  setStatus("saving", "Wird gespeichert …");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 450);
}
async function flush() {
  if (saving || !dirty) return;
  saving = true; dirty = false;
  try {
    const response = await fetch("/api/data", { method: "PUT", headers: { "Content-Type": "application/json", "X-Base-Rev": rev ?? "" }, body: JSON.stringify(data) });
    if (response.status === 409) {
      saving = false;
      await reloadFromServer("Daten wurden woanders geändert – aktueller Stand geladen");
      return;
    }
    if (!response.ok) throw new Error(String(response.status));
    rev = (await response.json()).rev ?? rev;
    setStatus("", "Alle Änderungen gespeichert");
  } catch {
    dirty = true;
    setStatus("error", "Nicht gespeichert – Server läuft nicht");
  } finally {
    saving = false;
    if (dirty) { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 3000); }
  }
}
window.addEventListener("beforeunload", () => {
  if (dirty) fetch("/api/data", { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json", "X-Base-Rev": rev ?? "" }, body: JSON.stringify(data) });
});
setInterval(() => fetch("/api/ping").catch(() => {}), 60_000);

/* ---------- Pfade für Eingaben ---------- */
// "products.p-1.priceGross": Arrays werden über die id adressiert. "@" adressiert UI-Zustand.
function resolve(path) {
  const parts = path.split(".");
  let node = parts[0] === "@" ? ui : data;
  if (parts[0] === "@") parts.shift();
  for (let i = 0; i < parts.length - 1; i += 1) {
    node = Array.isArray(node) ? byId(node, parts[i]) : (node[parts[i]] ??= {});
    if (!node) return null;
  }
  return { node, key: parts[parts.length - 1], ui: path.startsWith("@") };
}
function readPath(path) { const r = resolve(path); return r ? r.node[r.key] : undefined; }
function writeFromInput(el) {
  const target = resolve(el.dataset.path);
  if (!target) return;
  const kind = el.dataset.kind || "text";
  let value;
  if (el.type === "checkbox") value = el.checked;
  else if (kind === "num" || kind === "int") value = toNum(el.value) ?? 0;
  else if (kind === "opt") value = el.value.trim() === "" ? "" : toNum(el.value) ?? "";
  else if (kind === "pct") value = (toNum(el.value) ?? 0) / 100;
  else if (kind === "optpct") value = el.value.trim() === "" ? "" : (toNum(el.value) ?? 0) / 100;
  else value = el.value;
  if (kind === "int" && typeof value === "number") value = Math.round(value);
  target.node[target.key] = value;
  if (target.ui) store.set("kalk.ui", ui); else scheduleSave();
  // Andere Bedienelemente auf denselben Wert ziehen (Slider ↔ Zahlenfeld).
  for (const other of document.querySelectorAll(`[data-path="${CSS.escape(el.dataset.path)}"]`)) {
    if (other === el) continue;
    if (other.type === "range") { other.value = rangeValue(value, other.dataset.kind); paintRange(other); }
    else if (other.type !== "checkbox") other.value = displayValue(value, other.dataset.kind);
  }
  if (el.type === "range") paintRange(el);
}
const displayValue = (value, kind) => (kind === "pct" || kind === "optpct" ? (value === "" ? "" : fmtIn(Math.round(value * 10000) / 100)) : fmtIn(value));
function paintRange(el) {
  const min = Number(el.min) || 0, max = Number(el.max) || 100;
  el.style.setProperty("--p", `${Math.max(0, Math.min(100, ((Number(el.value) - min) / (max - min)) * 100))}%`);
}

/* ---------- Bausteine ---------- */
const num = (path, value, opts = {}) => `<div class="unit-wrap" style="--u:${(opts.unit || "").length}"><input type="text" inputmode="decimal" class="n" data-path="${esc(path)}" data-kind="${opts.kind || "num"}" value="${esc(displayValue(value, opts.kind))}" placeholder="${esc(opts.placeholder ?? "")}" aria-label="${esc(opts.label || "")}" ${opts.rerender ? "data-rerender" : ""}>${opts.unit ? `<span class="unit">${esc(opts.unit)}</span>` : ""}</div>`;
const text = (path, value, opts = {}) => `<input type="${opts.type || "text"}" data-path="${esc(path)}" value="${esc(value)}" placeholder="${esc(opts.placeholder || "")}" aria-label="${esc(opts.label || "")}" ${opts.list ? `list="${opts.list}"` : ""} ${opts.rerender ? "data-rerender" : ""}>`;
const area = (path, value, placeholder = "") => `<textarea data-path="${esc(path)}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
const select = (path, value, options, opts = {}) => `<select data-path="${esc(path)}" ${opts.rerender !== false ? "data-rerender" : ""} aria-label="${esc(opts.label || "")}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value ?? "") ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
const toggle = (path, checked, label = "", opts = {}) => `<label class="switch" title="${esc(label)}"><input type="checkbox" data-path="${esc(path)}" ${checked ? "checked" : ""} ${opts.rerender ? "data-rerender" : ""} aria-label="${esc(label)}"><span></span></label>`;
// Regler arbeiten mit Punkt-Dezimalzahlen; Prozentwerte laufen als 0–100 statt 0–1.
const rangeValue = (value, kind) => String((Number(value) || 0) * (kind === "pct" || kind === "optpct" ? 100 : 1));
const range = (path, value, min, max, step, opts = {}) => {
  const f = opts.kind === "pct" || opts.kind === "optpct" ? 100 : 1;
  return `<input type="range" data-path="${esc(path)}" data-kind="${opts.kind || "num"}" min="${min * f}" max="${max * f}" step="${step * f}" value="${rangeValue(value, opts.kind)}" aria-label="${esc(opts.label || "")}">`;
};
const field = (label, control, hint = "") => `<div class="field"><div class="label">${esc(label)}${hint ? `<span class="hint">${esc(hint)}</span>` : ""}</div><div>${control}</div></div>`;
function seg(path, value, options, opts = {}) {
  const name = `seg-${path.replace(/[^a-z0-9]/gi, "")}`;
  const index = Math.max(0, options.findIndex(([v]) => String(v) === String(value)));
  return `<div class="seg" role="radiogroup" aria-label="${esc(opts.label || "")}" style="--n:${options.length};--i:${index}">
    <span class="thumb" style="width:calc((100% - 4px) / var(--n));transform:translateX(calc(var(--i) * 100%))"></span>
    ${options.map(([v, l], i) => `<input type="radio" id="${name}-${i}" name="${name}" value="${esc(v)}" data-path="${esc(path)}" data-kind="${opts.kind || "text"}" data-seg-index="${i}" ${opts.rerender ? "data-rerender" : ""} ${i === index ? "checked" : ""}><label for="${name}-${i}">${esc(l)}</label>`).join("")}
  </div>`;
}
/** Aufklappbereich für selten gebrauchte Felder; offen/zu merkt sich je Schlüssel. */
const disclosure = (key, title, body, aside = "") => `<details class="disclosure" data-open-key="${esc(key)}" ${ui.open?.[key] ? "open" : ""}>
  <summary><span>${esc(title)}</span><span class="disclosure-aside">${aside}</span>${icon("chev", "disclosure-chev")}</summary>
  <div class="disclosure-body">${body}</div>
</details>`;
const live = (name, fn, tag = "div", attrs = "") => { LIVE[name] = fn; return `<${tag} data-live="${name}" ${attrs}></${tag}>`; };
const btn = (label, action, opts = {}) => `<button type="button" class="btn ${opts.cls || ""}" data-action="${action}" ${Object.entries(opts.data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")} ${opts.title ? `title="${esc(opts.title)}" aria-label="${esc(opts.title)}"` : ""}>${opts.icon ? icon(opts.icon) : ""}${label ? esc(label) : ""}</button>`;
const kpi = (label, value, foot = "", cls = "") => `<div class="card kpi"><div class="kpi-label">${esc(label)}</div><div class="kpi-value ${cls}">${value}</div>${foot ? `<div class="kpi-foot">${foot}</div>` : ""}</div>`;
const pageHead = (title, sub = "", actions = "") => `<header class="page-head"><div><h1 class="page-title">${esc(title)}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ""}</div><div class="head-actions">${actions}</div></header>`;
const scenarioName = () => C.activeScenario(data)?.name || "ohne Standort";
const channelsActive = () => data.channels.filter((entry) => entry.active !== false);
const channelOptions = () => channelsActive().map((entry) => [entry.id, entry.name]);
const supplierName = (id) => byId(data.suppliers, id)?.name || "Unbekannt";
const vatNote = () => (data.settings.vatLiable ? "netto, USt-pflichtig" : "brutto, ohne Vorsteuerabzug");

/* ---------- Seiten ---------- */
const PAGE_RENDER = {};

PAGE_RENDER.dashboard = () => {
  const scenarioSeg = data.scenarios.length > 1 ? seg("settings.scenarioId", data.settings.scenarioId, data.scenarios.map((s) => [s.id, s.name]), { label: "Standort" }) : "";
  return `${pageHead("Übersicht", `Monatsplan · ${esc(scenarioName())} · Kosten ${vatNote()}`, scenarioSeg)}
  ${live("dashKpis", dashKpis, "div", 'class="grid cols-4"')}
  <div class="card" style="margin-top:16px">
    <h2 class="card-title">Planspiel</h2>
    <div class="play-row play-head"><div>Produkt</div><div>Preis brutto</div><div>Kanal</div><div>Stück / Monat</div><div style="text-align:right">Gewinn</div></div>
    ${data.products.some(hasPrice) ? data.products.filter(hasPrice).map(playRow).join("") : `<div class="empty">Noch kein Produkt mit Verkaufspreis. ${btn("Produkte öffnen", "go", { cls: "primary small", data: { page: "products" } })}</div>`}
    ${data.products.some((p) => !hasPrice(p)) ? `<div class="play-row" style="grid-template-columns:1fr auto"><div class="note">Ohne Verkaufspreis: ${data.products.filter((p) => !hasPrice(p)).map((p) => esc(p.name)).join(", ")}</div>${btn("Preise eintragen", "go", { cls: "small", data: { page: "products" } })}</div>` : ""}
  </div>
  <div class="grid cols-2" style="margin-top:16px">
    <div class="card">${live("dashCoverage", dashCoverage)}</div>
    <div class="card chart">${live("dashChart", dashChart)}</div>
  </div>
  <div class="card" style="margin-top:16px">
    <h2 class="card-title">Gewinn je Stück nach Kanal</h2>
    ${live("dashMatrix", dashMatrix, "div", 'class="table-wrap"')}
  </div>`;
};

function playProduct(product) {
  const override = ui.play[product.id]?.price;
  return override === undefined || override === "" ? product : { ...product, priceGross: override };
}
function playRow(product) {
  const base = Number(product.priceGross) || 20;
  const current = playProduct(product).priceGross;
  ui.play[product.id] ||= {};
  if (ui.play[product.id].price === undefined) ui.play[product.id].price = product.priceGross;
  const maxQty = Math.max(2000, Math.ceil((Number(product.plannedMonthly) || 0) * 1.5 / 100) * 100);
  return `<div class="play-row">
    <div><div class="row-title">${esc(product.name || "Ohne Namen")}</div><div class="row-sub">${esc(byId(data.textiles, product.textileId)?.name || "eigener Textilpreis")}</div></div>
    <div class="slider-num">${range(`@.play.${product.id}.price`, current, Math.max(1, Math.floor(base * 0.5)), Math.ceil(base * 2), 0.05, { label: `Preis ${product.name}` })}${num(`@.play.${product.id}.price`, current, { unit: "€", label: `Preis ${product.name}` })}</div>
    <div>${select(`products.${product.id}.planChannelId`, product.planChannelId, channelOptions(), { rerender: false, label: `Kanal ${product.name}` })}</div>
    <div class="slider-num">${range(`products.${product.id}.plannedMonthly`, product.plannedMonthly, 0, maxQty, 10, { kind: "int", label: `Menge ${product.name}` })}${num(`products.${product.id}.plannedMonthly`, product.plannedMonthly, { kind: "int", label: `Menge ${product.name}` })}</div>
    ${live(`play-${product.id}`, () => playResult(product), "div", 'style="text-align:right"')}
  </div>`;
}
function playResult(product) {
  const channel = byId(data.channels, product.planChannelId) || channelsActive()[0];
  const result = C.channelResult(data, playProduct(product), channel);
  const changed = Number(ui.play[product.id]?.price) !== Number(product.priceGross);
  const quantity = Number(product.plannedMonthly) || 0;
  if (result.costs.problems.length) return `<span class="badge mid">${esc(result.costs.problems[0])}</span>`;
  return `<div class="num ${tone(result.contribution)}" style="font-weight:600">${money(result.contribution)} <span class="faint">/ Stk.</span></div>
    <div class="num faint">${money0(result.contribution * quantity)} / Monat</div>
    <div class="inline" style="justify-content:flex-end;margin-top:4px"><span class="badge ${marginTone(result.margin)}">${pct(result.margin)}</span>${changed ? btn("Preis übernehmen", "applyPlayPrice", { cls: "small", data: { id: product.id } }) : ""}</div>`;
}
function planMix() {
  return data.products.filter(hasPrice).map((product) => ({
    product: playProduct(product),
    channel: byId(data.channels, product.planChannelId) || channelsActive()[0],
    quantity: Number(product.plannedMonthly) || 0,
  })).filter((entry) => entry.channel);
}
function dashKpis() {
  const fixed = C.fixedCosts(data);
  const mix = C.portfolio(data, planMix(), fixed);
  const avg = mix.pieces ? mix.contribution / mix.pieces : null;
  const bePieces = avg && avg > 0 ? Math.ceil(fixed.toCover / avg) : null;
  const share = bePieces && mix.pieces ? mix.pieces / bePieces : null;
  return [
    kpi("Fixkosten / Monat", money0(fixed.total), `Personal ${money0(fixed.staff)} · Standort ${money0(fixed.location)}`),
    kpi("Plan-Absatz", pieces(mix.pieces), `Umsatz brutto ${money0(mix.revenue)}`),
    kpi("Deckungsbeitrag", money0(mix.contribution), avg ? `Ø ${money(avg)} je Stück` : "Mengen im Planspiel eintragen"),
    kpi("Monatsergebnis", money0(mix.result), bePieces ? `Break-even bei ${pieces(bePieces)}${share ? ` · Plan deckt ${pct(share)}` : ""}` : "vor Unternehmenssteuern", tone(mix.result)),
  ].join("");
}
function dashCoverage() {
  const fixed = C.fixedCosts(data);
  const mix = C.portfolio(data, planMix(), fixed);
  const scale = Math.max(fixed.toCover, mix.contribution, 1);
  const parts = mix.rows.filter((row) => row.contribution > 0);
  const gap = fixed.toCover - mix.contribution;
  return `<h2 class="card-title">Deckung der Fixkosten <small>${money0(fixed.toCover)} zu decken</small></h2>
    <div class="stackbar" role="img" aria-label="Deckungsbeiträge im Verhältnis zu den Fixkosten">${parts.map((row, i) => `<i style="width:${(row.contribution / scale) * 100}%;background:${COLORS[i % COLORS.length]}"></i>`).join("")}</div>
    <div style="position:relative;height:16px"><span style="position:absolute;left:calc(${(fixed.toCover / scale) * 100}% - 1px);top:0;width:2px;height:12px;background:var(--text)"></span></div>
    <div class="legend">${parts.map((row, i) => `<span><i style="background:${COLORS[i % COLORS.length]}"></i>${esc(row.product.name)} ${money0(row.contribution)}</span>`).join("") || '<span class="faint">Noch keine Planmengen.</span>'}</div>
    <p class="kpi-value ${gap > 0 ? "neg" : "pos"}" style="font-size:22px;margin:16px 0 2px">${gap > 0 ? `${money0(gap)} fehlen` : `${money0(-gap)} über den Fixkosten`}</p>
    ${gap > 0 && mix.pieces ? `<p class="note" style="margin:0">Noch ${pieces(Math.ceil(gap / (mix.contribution / mix.pieces)))} bei gleichem Mix</p>` : ""}`;
}
function dashChart() {
  const fixed = C.fixedCosts(data);
  const mix = planMix();
  const total = mix.reduce((s, e) => s + e.quantity, 0);
  const weights = total ? mix.map((e) => e.quantity / total) : mix.map(() => 1 / Math.max(1, mix.length));
  const avg = mix.reduce((s, e, i) => s + weights[i] * C.channelResult(data, e.product, e.channel, { fixed }).contribution, 0);
  if (!mix.length || !(avg > 0)) return `<h2 class="card-title">Ergebnis nach Absatz</h2><div class="empty">Mit diesem Mix werden die Fixkosten nicht gedeckt.</div>`;
  const be = fixed.total / avg;
  const maxX = Math.max(be * 2, total * 1.3, 100);
  const W = 520, H = 220, L = 54, B = 26, T = 12;
  const minY = -fixed.total, maxY = maxX * avg - fixed.total;
  const x = (v) => L + (v / maxX) * (W - L - 8);
  const y = (v) => T + (1 - (v - minY) / (maxY - minY)) * (H - T - B);
  const ticks = [minY, 0, maxY / 2, maxY].filter((v, i, a) => a.indexOf(v) === i);
  return `<h2 class="card-title">Ergebnis nach Absatz <small>Ø ${money(avg)} je Stück</small></h2>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monatsergebnis nach Stückzahl, Break-even bei ${int.format(Math.ceil(be))} Stück">
    ${ticks.map((v) => `<line class="axis" x1="${L}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${money0(v)}</text>`).join("")}
    <line class="zero" x1="${L}" x2="${W - 8}" y1="${y(0)}" y2="${y(0)}"/>
    <path class="area" d="M${x(be)} ${y(0)} L${x(maxX)} ${y(maxY)} L${x(maxX)} ${y(0)} Z"/>
    <path class="line" d="M${x(0)} ${y(minY)} L${x(maxX)} ${y(maxY)}"/>
    <circle class="be" cx="${x(be)}" cy="${y(0)}" r="6"/>
    <text x="${x(be)}" y="${y(0) + 20}" text-anchor="middle" style="fill:var(--green);font-weight:600">${int.format(Math.ceil(be))} Stk.</text>
    ${total ? `<circle class="marker" cx="${x(total)}" cy="${y(total * avg - fixed.total)}" r="6"/><text x="${x(total)}" y="${y(total * avg - fixed.total) - 12}" text-anchor="middle" style="fill:var(--accent);font-weight:600">Plan</text>` : ""}
    <text x="${W - 8}" y="${H - 6}" text-anchor="end">${int.format(maxX)} Stk.</text><text x="${L}" y="${H - 6}">0</text>
  </svg>`;
}
function dashMatrix() {
  const channels = channelsActive();
  const fixed = C.fixedCosts(data);
  if (!data.products.some(hasPrice)) return `<div class="empty">Noch kein Produkt mit Verkaufspreis.</div>`;
  return `<table><thead><tr><th>Produkt</th><th class="n">Preis</th>${channels.map((c) => `<th class="n">${esc(c.name)}</th>`).join("")}</tr></thead><tbody>
  ${data.products.filter(hasPrice).map((product) => `<tr><td><strong>${esc(product.name)}</strong></td><td class="n">${money(Number(playProduct(product).priceGross))}</td>${channels.map((channel) => {
    const r = C.channelResult(data, playProduct(product), channel, { fixed });
    if (r.costs.problems.length) return `<td class="n faint">–</td>`;
    const cls = r.margin >= 0.4 ? "cell-good" : r.margin >= 0.2 ? "cell-mid" : "cell-bad";
    const active = product.planChannelId === channel.id ? 'style="box-shadow:inset 0 0 0 2px var(--accent)"' : "";
    return `<td class="n ${cls}" ${active}><button type="button" class="chip" style="background:transparent;padding:0" data-action="setPlanChannel" data-id="${product.id}" data-channel="${channel.id}" title="Break-even ${pieces(r.breakEvenMonthly)} / Monat">${money(r.contribution)}<br><span class="faint">${pct(r.margin)}</span></button></td>`;
  }).join("")}</tr>`).join("")}</tbody></table>`;
}

/* ----- Angebotsrechner ----- */
/** Angebot für ein Produkt oder direkt für ein Textil ohne Produkt ("t:<id>"). */
function quoteProduct(id) {
  if (String(id).startsWith("t:")) {
    const textile = byId(data.textiles, id.slice(2));
    return textile ? { ...productFromTextile(data, textile), id } : null;
  }
  return byId(data.products, id) || null;
}
function quoteProductSelect(value) {
  const loose = data.textiles.filter((t) => !data.products.some((p) => p.textileId === t.id));
  const option = (v, label) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(label)}</option>`;
  return `<select data-path="@.quote.productId" data-rerender aria-label="Produkt">
    ${productGroups().map(([category, items]) => `<optgroup label="${esc(category)}">${items.map((p) => option(p.id, p.name)).join("")}</optgroup>`).join("")}
    ${loose.length ? `<optgroup label="Nur Textil">${loose.map((t) => option(`t:${t.id}`, t.name)).join("")}</optgroup>` : ""}
  </select>`;
}
PAGE_RENDER.quote = () => {
  const q = ui.quote;
  if (q.discountAuto) q.discount = C.tierDiscount(data.b2b.tiers, q.quantity);
  if (!quoteProduct(q.productId)) q.productId = data.products[0]?.id || (data.textiles[0] ? `t:${data.textiles[0].id}` : "");
  const product = quoteProduct(q.productId);
  const textile = product && byId(data.textiles, product.textileId);
  const offers = textile?.offers || [];
  if (q.supplierId && !offers.some((o) => o.supplierId === q.supplierId)) q.supplierId = "";
  const defaultParcel = C.materialUnitCost(C.materialByRole(data, "shipping"), { ...data.settings, vatLiable: true });
  const costOptions = `<div class="fields">
      ${field("Drucke je Stück", num("@.quote.prints", q.prints, { kind: "opt", placeholder: fmtIn(product?.prints ?? 1), label: "Drucke je Stück" }))}
      ${field("Lieferant", select("@.quote.supplierId", q.supplierId, [["", `Standard · ${textile ? supplierName(C.textileOffer(data, textile.id)?.supplierId) : "–"}`], ...offers.filter((o) => o.price !== "").map((o) => [o.supplierId, `${supplierName(o.supplierId)} · ${money(C.offerCost(o, data.settings))}`])], { rerender: false }))}
      ${field("Eigener Textilpreis", num("@.quote.ownTextilePrice", q.ownTextilePrice, { kind: "opt", unit: "€", placeholder: "wie Lieferant", label: "Eigener Textilpreis netto" }))}
      ${field("Versand einrechnen", toggle("@.quote.shippingIncluded", q.shippingIncluded !== false, "Versand einrechnen"))}
      ${field("Paketpreis netto", num("@.quote.parcelCost", q.parcelCost, { kind: "opt", unit: "€", placeholder: fmtIn(Math.round((defaultParcel || 0) * 100) / 100), label: "Paketpreis netto" }))}
      ${field("Stück je Paket", num("@.quote.piecesPerParcel", q.piecesPerParcel, { kind: "int", label: "Stück je Paket" }))}
      ${field("Einrichtung / Grafik", num("@.quote.setupCost", q.setupCost, { unit: "€", label: "Einrichtung" }), "einmalig je Auftrag")}
      ${field("Fixkostenanteil", `<div class="inline">${toggle("@.quote.includeOverhead", q.includeOverhead, "Fixkostenanteil einrechnen")}<span class="faint" style="font-size:12px">auf</span>${num("@.quote.overheadVolume", q.overheadVolume, { kind: "int", unit: "Stk./Mon.", label: "Stück pro Monat" })}</div>`)}
    </div>`;
  return `${pageHead("Angebotsrechner", "", `${btn("Kopieren", "copyQuote", { icon: "copy" })}${btn("Zum Angebot", "addToOffer", { icon: "plus", cls: "primary" })}`)}
  ${!product ? `<div class="card empty">Lege zuerst ein Produkt an. ${btn("Produkt anlegen", "newProduct", { cls: "primary small" })}</div>` : `
  <div class="split-wide">
    <div class="grid">
      <div class="card"><div class="fields">
        ${field("Produkt", quoteProductSelect(q.productId))}
        <div class="field"><div class="label">Menge</div><div class="stack">
          <div class="slider-num">${range("@.quote.quantity", q.quantity, 1, 1000, 1, { kind: "int", label: "Menge" })}${num("@.quote.quantity", q.quantity, { kind: "int", unit: "Stk.", label: "Menge" })}</div>
          <div class="chips">${[10, 25, 50, 100, 250, 500].map((n) => `<button type="button" class="chip" data-action="setQty" data-qty="${n}" aria-pressed="${Number(q.quantity) === n}">${n}</button>`).join("")}</div>
        </div></div>
        ${field("Kunde", text("@.quote.customer", q.customer, { placeholder: "optional" }))}
      </div></div>
      <div class="card">
        <h2 class="card-title">Dein Preis je Stück <small>netto</small></h2>
        <div class="price-input">${num("@.quote.price", q.price, { kind: "opt", unit: "€", placeholder: "Preis eintragen", label: "Angebotspreis je Stück netto" })}</div>
        ${live("quoteSuggest", quoteSuggest, "div", 'class="suggest"')}
        <div class="fields" style="margin-top:10px">
          <div class="field"><div class="label">Rabatt${live("quoteTierHint", quoteTierHint, "span", 'class="hint"')}</div><div class="slider-num">${range("@.quote.discount", q.discount, 0, 0.5, 0.005, { kind: "pct", label: "Rabatt" })}${num("@.quote.discount", q.discount, { kind: "pct", unit: "%", label: "Rabatt" })}</div></div>
        </div>
      </div>
      <div class="card">${disclosure("quote-costs", "Kosten anpassen", costOptions, "Druck, Lieferant, Versand, Einrichtung")}</div>
    </div>
    <div class="sticky grid">${live("quoteResult", quoteResult, "div", 'class="card"')}${live("offerLink", offerLink, "div", 'class="card"')}<div class="card">${disclosure("quote-tiers", "Staffel", live("quoteTiers", quoteTiers), "Preis je Menge")}</div></div>
  </div>`}`;
};
/** Offenes Angebot, in das der Rechner Positionen legt. */
function offerLink() {
  const o = byId(data.offers, ui.offerId);
  const t = o && C.offerTotals(o, data.settings);
  return `<div class="offer-link">
    <div class="row-main"><div class="kpi-label">Angebot</div>
      <div class="row-title">${o ? `${esc(o.number)} · ${esc(firstLine(o.customer) || "ohne Kunde")}` : "Noch keins offen"}</div>
      ${o ? `<div class="row-sub">${o.positions.length} ${o.positions.length === 1 ? "Position" : "Positionen"} · ${money(t.net)} netto</div>` : ""}
    </div>
    <div class="inline">${o ? btn("Neues", "newOffer", { cls: "small", data: { stay: "1" } }) + btn("Öffnen", "go", { cls: "small", data: { page: "offers" } }) : ""}${btn("Hinzufügen", "addToOffer", { cls: "small primary", icon: "plus" })}</div>
  </div>`;
}

/* ----- Angebote ----- */
const firstLine = (s) => String(s || "").split("\n").find((line) => line.trim())?.trim() || "";
const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
const isoDay = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const deDate = (iso) => (iso ? new Date(`${iso}T00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "–");
const offerLabel = (o) => `${o.number} · ${firstLine(o.customer) || "ohne Kunde"}`;
function createOffer(customer = "") {
  const year = new Date().getFullYear();
  const seq = data.settings.offerSeq?.year === year ? data.settings.offerSeq.n + 1 : 1;
  data.settings.offerSeq = { year, n: seq };
  const today = new Date();
  const valid = new Date(today); valid.setDate(valid.getDate() + (Number(data.company.validDays) || 30));
  const o = {
    id: uid("an"), number: `AN-${year}-${String(seq).padStart(3, "0")}`, date: isoDay(today), validUntil: isoDay(valid),
    customer, subject: "", intro: data.company.intro, closing: data.company.closing, positions: [], createdAt: today.toISOString(),
  };
  data.offers.push(o);
  ui.offerId = o.id;
  scheduleSave();
  return o;
}
PAGE_RENDER.offers = () => {
  if (!byId(data.offers, ui.offerId)) ui.offerId = data.offers[data.offers.length - 1]?.id || "";
  const o = byId(data.offers, ui.offerId);
  const picker = data.offers.length > 1 ? `<div class="offer-pick">${select("@.offerId", ui.offerId, data.offers.slice().reverse().map((x) => [x.id, offerLabel(x)]), { label: "Angebot wählen" })}</div>` : "";
  const head = pageHead("Angebote", "", `${picker}${btn("Neu", "newOffer", { icon: "plus" })}${o ? btn("Drucken / PDF", "printOffer", { icon: "print", cls: "primary" }) : ""}`);
  if (!o) return `${head}<div class="card empty">Noch kein Angebot.<div class="inline" style="justify-content:center;margin-top:14px">${btn("Aus dem Rechner", "go", { icon: "calc", data: { page: "quote" } })}${btn("Leeres Angebot", "newOffer", { cls: "primary", icon: "plus" })}</div></div>`;
  const path = `offers.${o.id}`;
  const rows = o.positions.map((pos) => {
    const p = `${path}.positions.${pos.id}`;
    return `<div class="pos-row">
      ${num(`${p}.qty`, pos.qty, { kind: "int", label: "Menge" })}
      <div class="pos-text">${text(`${p}.title`, pos.title, { placeholder: "Bezeichnung", label: "Bezeichnung" })}${text(`${p}.details`, pos.details, { placeholder: "Details, z. B. Farbe, Druck", label: "Details" })}</div>
      ${num(`${p}.unitNet`, pos.unitNet, { kind: "opt", unit: "€", label: "Einzelpreis netto" })}
      ${num(`${p}.discount`, pos.discount, { kind: "optpct", unit: "%", placeholder: "0", label: "Rabatt" })}
      ${live(`pos-${pos.id}`, () => offerLineSum(o, pos), "div", 'class="pos-sum"')}
      ${btn("", "deleteOfferPos", { cls: "icon-btn danger", icon: "trash", title: "Position entfernen", data: { id: pos.id } })}
    </div>`;
  }).join("");
  return `${head}
  <div class="offer-layout">
    <div class="grid">
      <div class="card">
        <h2 class="card-title"><span>${esc(o.number)}</span><span class="inline">${btn("", "duplicateOffer", { cls: "icon-btn", icon: "copy", title: "Duplizieren" })}${btn("", "deleteOffer", { cls: "icon-btn danger", icon: "trash", title: "Angebot löschen" })}</span></h2>
        <div class="fields">
          ${field("Kunde", area(`${path}.customer`, o.customer, "Name\nStraße\nPLZ Ort"))}
          ${field("Betreff", text(`${path}.subject`, o.subject, { placeholder: "z. B. Vereinsshirts Sommerfest", label: "Betreff" }))}
          ${field("Datum", `<div class="inline">${text(`${path}.date`, o.date, { type: "date", label: "Angebotsdatum" })}<span class="faint" style="font-size:12px">gültig bis</span>${text(`${path}.validUntil`, o.validUntil, { type: "date", label: "Gültig bis" })}</div>`)}
        </div>
      </div>
      <div class="card">
        <h2 class="card-title">Positionen <small>netto</small></h2>
        ${o.positions.length ? `<div class="pos-row pos-head"><span>Menge</span><span>Bezeichnung</span><span>Einzelpreis</span><span>Rabatt</span><span>Gesamt</span><span></span></div>${rows}` : `<p class="note">Noch keine Positionen.</p>`}
        <div class="inline" style="margin-top:12px">${btn("Aus dem Rechner", "go", { cls: "small", icon: "calc", data: { page: "quote" } })}${btn("Freie Position", "addOfferPos", { cls: "small", icon: "plus" })}</div>
      </div>
      ${live("offerSum", () => offerSum(o), "div", 'class="card"')}
      <div class="card">${disclosure("offer-texts", "Texte", `<div class="fields">${field("Einleitung", area(`${path}.intro`, o.intro))}${field("Schluss", area(`${path}.closing`, o.closing))}</div>`, "Anrede, Gruß")}</div>
    </div>
    <div class="sticky"><div class="paper-wrap" id="paper-wrap">${live("offerDoc", () => offerDoc(o), "div", 'class="paper"')}</div></div>
  </div>`;
};
function offerLineSum(o, pos) {
  const line = C.offerTotals({ positions: [pos] }, data.settings).lines[0];
  const cost = line.cost !== null && line.net > 0 ? `<div class="faint">Marge ${pct((line.net - line.cost) / line.net)}</div>` : "";
  return `${line.discount ? `<s class="faint">${money(line.regular)}</s>` : ""}<div>${money(line.net)}</div>${cost}`;
}
function offerSum(o) {
  const t = C.offerTotals(o, data.settings);
  const vat = data.settings.vatLiable;
  return `<div class="breakdown">
    ${t.hasDiscount ? `<div class="bd-row"><span>Regulär</span><span class="num">${money(t.regular)}</span></div><div class="bd-row"><span>Nachlass</span><span class="num pos">− ${money(t.saved)}</span></div>` : ""}
    <div class="bd-row"><span>Summe netto</span><span class="num">${money(t.net)}</span></div>
    ${vat ? `<div class="bd-row"><span>USt ${pct(Number(data.settings.vatRate))}</span><span class="num">${money(t.vat)}</span></div>` : ""}
    <div class="bd-row total"><span>Gesamt</span><span class="num">${money(t.gross)}</span></div>
  </div>
  ${t.cost > 0 ? `<div class="hero-sub" style="margin-top:12px">Nur für dich: Kosten ${money(t.cost)} · Gewinn <span class="${tone(t.profit)}">${money(t.profit)}</span> · Marge ${pct(t.margin)}${t.costedAll ? "" : " (ohne freie Positionen)"}</div>` : ""}`;
}
/** Angebot als A4-Seite (Aufbau einer üblichen deutschen Geschäftsrechnung); Vorschau und Druckvorlage. */
function offerDoc(o) {
  const c = data.company;
  const t = C.offerTotals(o, data.settings);
  const vat = data.settings.vatLiable;
  const disc = t.hasDiscount;
  const iban = String(c.iban || "").replace(/\s/g, "").replace(/(.{4})(?=.)/g, "$1 ");
  const join = (...parts) => parts.filter(Boolean).map(esc).join("<br>");
  const rows = o.positions.map((pos, i) => {
    const line = t.lines[i];
    return `<tr><td class="c">${i + 1}</td><td class="c">${int.format(line.quantity)}</td><td><b>${esc(pos.title)}</b>${pos.details ? `<div class="muted">${esc(pos.details)}</div>` : ""}</td><td class="r">${money(Number(pos.unitNet) || 0)}</td>${disc ? `<td class="r accent">${line.discount ? `−${pct(line.discount)}` : ""}</td>` : ""}<td class="r">${money(line.net)}</td></tr>`;
  }).join("");
  return `<div class="doc" style="--doc-accent:${esc(c.accent || "#0a7d6b")}">
  <table class="doc-flow"><thead><tr><td><div class="doc-top"></div></td></tr></thead><tbody><tr><td>
    <div class="doc-head">
      ${c.logo ? `<img class="doc-logo" src="${esc(c.logo)}" alt="${esc(c.name)}">` : `<div class="doc-logo doc-logo-text">${esc(c.name || "Deine Firma")}</div>`}
      <div class="doc-company">${join(c.name, c.street, `${c.zip} ${c.city}`.trim(), c.country)}</div>
      <div class="doc-sender">${esc([c.name, c.street, `${c.zip} ${c.city}`.trim()].filter(Boolean).join(" · "))}</div>
      <div class="doc-address">${o.customer ? nl2br(o.customer) : '<span class="muted">Kunde</span>'}</div>
      <div class="doc-info"><span>Angebotsdatum</span><span>${deDate(o.date)}</span><span>Gültig bis</span><span>${deDate(o.validUntil)}</span><span>Angebotsnr.</span><span>${esc(o.number)}</span></div>
    </div>
    <div class="doc-title"><h1>Angebot</h1><span>${esc(o.number)}</span></div>
    ${o.subject ? `<div class="doc-subject">${esc(o.subject)}</div>` : ""}
    ${o.intro ? `<p class="doc-text">${nl2br(o.intro)}</p>` : ""}
    <table class="doc-table"><thead><tr><th class="c">Pos.</th><th class="c">Menge</th><th>Bezeichnung</th><th class="r">Einzelpreis</th>${disc ? '<th class="r">Rabatt</th>' : ""}<th class="r">Gesamt</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${disc ? 6 : 5}" class="muted c">Noch keine Positionen</td></tr>`}</tbody></table>
    <div class="doc-totals">
      ${disc ? `<span>Summe regulär</span><span>${money(t.regular)}</span><span class="accent">Dein Nachlass</span><span class="accent">− ${money(t.saved)}</span>` : ""}
      <span>Summe netto</span><span>${money(t.net)}</span>
      ${vat ? `<span>zzgl. USt ${pct(Number(data.settings.vatRate))}</span><span>${money(t.vat)}</span>` : ""}
      <span class="grand">Gesamtbetrag</span><span class="grand">${money(t.gross)}</span>
    </div>
    <p class="doc-text muted">${vat ? `Alle Preise in Euro, netto zuzüglich ${pct(Number(data.settings.vatRate))} USt.` : "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."} Dieses Angebot gilt bis ${deDate(o.validUntil)}.</p>
    ${o.closing ? `<p class="doc-text">${nl2br(o.closing)}</p>` : ""}
  </td></tr></tbody><tfoot><tr><td><div class="doc-bottom"></div></td></tr></tfoot></table>
  <div class="doc-foot">
    <div>${join(c.name, c.street, `${c.zip} ${c.city}`.trim(), c.register, c.vatId && `USt-IdNr.: ${c.vatId}`, c.taxNumber && `Steuernummer: ${c.taxNumber}`)}</div>
    <div>${join(c.manager && `Geschäftsführer: ${c.manager}`, c.phone && `Tel. ${c.phone}`, c.email, c.website)}</div>
    <div>${join(c.bankName, iban && `IBAN: ${iban}`, c.bic && `BIC: ${c.bic}`)}</div>
  </div>
</div>`;
}
function fitPaper() {
  const wrap = document.getElementById("paper-wrap");
  if (wrap) wrap.style.setProperty("--z", String(wrap.clientWidth / 794));
}
window.addEventListener("resize", fitPaper);
function quoteInput(overrideQty, priceOverride) {
  const q = ui.quote;
  const product = quoteProduct(q.productId);
  const overrides = {};
  if (q.prints !== "" && q.prints !== undefined) overrides.prints = q.prints;
  if (q.supplierId) overrides.supplierId = q.supplierId;
  if (q.ownTextilePrice !== "" && q.ownTextilePrice !== undefined) overrides.ownTextilePrice = q.ownTextilePrice;
  const parcel = q.parcelCost === "" || q.parcelCost === undefined
    ? C.materialUnitCost(C.materialByRole(data, "shipping"), { ...data.settings, vatLiable: true }) ?? 0
    : q.parcelCost;
  const price = priceOverride ?? q.price;
  const quantity = overrideQty ?? q.quantity;
  return {
    product, overrides, quantity, piecesPerParcel: q.piecesPerParcel, parcelCost: parcel,
    shippingIncluded: q.shippingIncluded !== false, setupCost: q.setupCost, includeOverhead: q.includeOverhead,
    overheadVolume: q.overheadVolume, markup: 0, targetUnitNet: price === "" || price === undefined ? 0 : price, discount: q.discountAuto ? C.tierDiscount(data.b2b.tiers, quantity) : q.discount,
  };
}
/** Preis je Stück netto für eine Zielmarge nach Rabatt. */
const priceForQuoteMargin = (unitCost, margin, discount) => unitCost / (1 - margin) / (1 - (Number(discount) || 0));
function quoteSuggest() {
  const input = quoteInput();
  if (!input.product) return "";
  const r = C.quote(data, input);
  return [0.3, 0.4, 0.5].map((m) => {
    const price = Math.ceil(priceForQuoteMargin(r.unitCost, m, input.discount) * 100) / 100;
    return `<button type="button" class="chip" data-action="setQuotePrice" data-value="${price}">${pct(m)} Marge · ${money(price)}</button>`;
  }).join("");
}
function quoteResult() {
  const input = quoteInput();
  if (!input.product) return "";
  const r = C.quote(data, input);
  const vat = data.settings.vatLiable;
  const hasOffer = Number(ui.quote.price) > 0;
  const problems = r.costs.problems.filter((p) => p !== "Verkaufspreis fehlt");
  if (!hasOffer) {
    return `${problems.length ? `<div class="problem" style="margin-bottom:12px">${esc(problems.join(" · "))}</div>` : ""}
      <div class="kpi-label">Kosten je Stück</div>
      <div class="hero-num">${money(r.unitCost)}</div>
      <div class="hero-sub">${int.format(r.quantity)} Stück · ${money(r.totalCost)} gesamt</div>
      <p class="note" style="margin-top:16px">Trag deinen Preis ein oder wähle einen Vorschlag.</p>`;
  }
  return `${problems.length ? `<div class="problem" style="margin-bottom:12px">${esc(problems.join(" · "))}</div>` : ""}
    <div class="metric-hero">
      <div><div class="kpi-label">Gewinn</div><div class="hero-num ${tone(r.profit)}">${money0(r.profit)}</div></div>
      <div><div class="kpi-label">Marge</div><div class="hero-num ${tone(r.profit)}">${pct(r.margin)}</div></div>
    </div>
    <div class="hero-sub">${int.format(r.quantity)} × ${money(r.unitNet)}${r.discount ? ` (− ${pct(r.discount)})` : ""} = ${money(r.revenueNet)} netto${vat ? ` · ${money(r.revenueGross)} brutto` : ""}</div>
    <div class="breakdown" style="margin-top:16px">
      <div class="bd-row"><span>Kosten je Stück</span><span class="num">${money(r.unitCost)}</span></div>
      <div class="bd-row"><span>Gewinn je Stück</span><span class="num ${tone(r.unitNet - r.unitCost)}">${money(r.unitNet - r.unitCost)}</span></div>
      <div class="bd-row"><span>Rabatt möglich bis</span><span class="num ${r.discount > r.maxDiscount ? "neg" : ""}">${pct(r.maxDiscount)}</span></div>
    </div>
    ${disclosure("quote-breakdown", "Kosten im Auftrag", `<div class="breakdown">
      <div class="bd-row"><span>Produktion ${int.format(r.quantity)} × ${money(r.pieceCost)}</span><span class="num">${money(r.pieceCost * r.quantity)}</span></div>
      <div class="bd-row"><span>Versand ${r.parcels} ${r.parcels === 1 ? "Paket" : "Pakete"}</span><span class="num">${money(r.shippingTotal)}</span></div>
      ${r.setup ? `<div class="bd-row"><span>Einrichtung</span><span class="num">${money(r.setup)}</span></div>` : ""}
      ${r.overheadPiece ? `<div class="bd-row"><span>Fixkostenanteil</span><span class="num">${money(r.overheadPiece * r.quantity)}</span></div>` : ""}
      <div class="bd-row total"><span>Gesamtkosten</span><span class="num">${money(r.totalCost)}</span></div>
    </div>`, money(r.totalCost))}`;
}
function quoteTiers() {
  const base = quoteInput();
  if (!base.product) return "";
  const qtys = [...new Set([10, 25, 50, 100, 250, 500, Number(ui.quote.quantity)])].sort((a, b) => a - b);
  const hasOffer = Number(ui.quote.price) > 0;
  const setup = (n) => (Number(data.b2b.setupFee) > 0 && n < Number(data.b2b.setupFreeFrom) ? `<div class="faint">+ ${money(Number(data.b2b.setupFee))} Einr.</div>` : "");
  return `<div class="table-wrap"><table><thead><tr><th class="n">Menge</th><th class="n">Rabatt</th>${hasOffer ? '<th class="n">Preis/Stk.</th>' : '<th class="n">Kosten/Stk.</th>'}${hasOffer ? '<th class="n">Gewinn</th><th class="n">Marge</th>' : '<th class="n">Grundpreis bei 40 %</th>'}</tr></thead><tbody>
  ${qtys.map((n) => {
    const input = quoteInput(n); const r = C.quote(data, input); const current = n === Number(ui.quote.quantity);
    return `<tr ${current ? 'style="font-weight:700"' : ""}><td class="n">${int.format(n)}</td><td class="n">${input.discount ? `−${pct(input.discount)}` : "–"}</td>${hasOffer ? `<td class="n">${money(r.unitNet)}${setup(n)}</td>` : `<td class="n">${money(r.unitCost)}</td>`}${hasOffer ? `<td class="n ${tone(r.profit)}">${money(r.profit)}</td><td class="n">${pct(r.margin)}</td>` : `<td class="n">${money(priceForQuoteMargin(r.unitCost, 0.4, input.discount))}</td>`}</tr>`;
  }).join("")}
  </tbody></table></div>`;
}
/** Hinweis am Rabatt: aktive Staffelstufe oder Rückweg zur Staffel. */
function quoteTierHint() {
  const q = ui.quote;
  if (!q.discountAuto) return `<button type="button" class="link-btn" data-action="useTierDiscount">Staffel nutzen</button>`;
  const d = C.tierDiscount(data.b2b.tiers, q.quantity);
  const next = data.b2b.tiers.filter((t) => Number(t.minQty) > Number(q.quantity) && Number(t.discount) > d).sort((a, b) => a.minQty - b.minQty)[0];
  return `Staffel${d ? ` −${pct(d)}` : ""}${next ? ` · ab ${int.format(next.minQty)} Stk. −${pct(Number(next.discount))}` : ""}`;
}
/** Staffelrabatt in die Rabattfelder schreiben, ohne die Seite neu zu zeichnen. */
function syncTierDiscount() {
  const q = ui.quote;
  if (!q.discountAuto) return;
  q.discount = C.tierDiscount(data.b2b.tiers, q.quantity);
  for (const el of document.querySelectorAll('[data-path="@.quote.discount"]')) {
    if (el.type === "range") { el.value = rangeValue(q.discount, "pct"); paintRange(el); } else el.value = displayValue(q.discount, "pct");
  }
}

/* ----- Produkte ----- */
PAGE_RENDER.products = () => {
  if (!byId(data.products, ui.productId)) ui.productId = data.products[0]?.id || "";
  const p = byId(data.products, ui.productId);
  const categories = [...new Set([...data.products.map((x) => x.category), ...data.textiles.map((t) => t.category)].filter(Boolean))];
  const shippingDefault = fmtIn(Math.round((C.materialUnitCost(C.materialByRole(data, "shipping"), { ...data.settings, vatLiable: true }) || 0) * 100) / 100);
  const fine = p ? `<div class="fields">
      ${field("Eigener Textilpreis netto", num(`products.${p.id}.ownTextilePrice`, p.ownTextilePrice, { kind: "opt", unit: "€", placeholder: "wie Lieferant", label: "Eigener Textilpreis netto" }))}
      ${field("Bezugskosten je Stück", num(`products.${p.id}.procurement`, p.procurement, { unit: "€", label: "Bezugskosten je Stück" }))}
      ${field("Drucke je Artikel", num(`products.${p.id}.prints`, p.prints, { label: "Drucke" }))}
      ${field("Tinten-, Pulver-, Folienfaktor", `<div class="inline">${num(`products.${p.id}.inkFactor`, p.inkFactor, { label: "Tintenfaktor" })}${num(`products.${p.id}.powderFactor`, p.powderFactor, { label: "Pulverfaktor" })}${num(`products.${p.id}.filmFactor`, p.filmFactor, { label: "Folienfaktor" })}</div>`)}
      ${field("Ausschuss", num(`products.${p.id}.scrapRate`, p.scrapRate, { kind: "pct", unit: "%", label: "Ausschussquote" }))}
      ${field("Reinigung je Artikel", num(`products.${p.id}.cleaning`, p.cleaning, { unit: "€", label: "Reinigung" }))}
      ${field("Versand netto", num(`products.${p.id}.shippingOverride`, p.shippingOverride, { kind: "opt", unit: "€", placeholder: shippingDefault, label: "Versand netto" }))}
      ${field("Verpackung zusätzlich", num(`products.${p.id}.packagingExtra`, p.packagingExtra, { unit: "€", label: "Verpackung" }))}
      ${field("Retourenreserve", num(`products.${p.id}.returnsReserve`, p.returnsReserve, { unit: "€", label: "Retourenreserve" }))}
      ${field("Werbung je Verkauf", num(`products.${p.id}.adPerSale`, p.adPerSale, { unit: "€", label: "Werbung je Verkauf" }))}
      ${field("Werbung vom Preis", num(`products.${p.id}.adShareOfPrice`, p.adShareOfPrice, { kind: "pct", unit: "%", label: "Werbung vom Bruttopreis" }))}
      ${field("Sonstiges je Verkauf", num(`products.${p.id}.otherVariable`, p.otherVariable, { unit: "€", label: "Sonstiges" }))}
      ${field("Notiz", area(`products.${p.id}.notes`, p.notes))}
    </div>` : "";
  return `${pageHead("Produkte", "", btn("Neues Produkt", "newProduct", { cls: "primary", icon: "plus" }))}
  <datalist id="categories">${categories.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
  <div class="split">
    ${live("productList", productList, "div", 'class="list"')}
    ${!p ? `<div class="card empty">Noch keine Produkte.</div>` : `<div class="split-wide">
      <div class="card">
        <h2 class="card-title"><span>${esc(p.name || "Produkt")}</span><span class="inline">${btn("", "duplicateProduct", { cls: "icon-btn", icon: "copy", title: "Duplizieren" })}${btn("", "deleteProduct", { cls: "icon-btn danger", icon: "trash", title: "Produkt löschen" })}</span></h2>
        <div class="fields">
          ${field("Name", text(`products.${p.id}.name`, p.name, { label: "Name" }))}
          ${field("Kategorie", text(`products.${p.id}.category`, p.category, { list: "categories", label: "Kategorie" }))}
          ${field("Verkaufspreis brutto", num(`products.${p.id}.priceGross`, p.priceGross, { kind: "opt", unit: "€", placeholder: "noch offen", label: "Verkaufspreis brutto" }), "inkl. Versand")}
          ${field("Textil", select(`products.${p.id}.textileId`, p.textileId, [["", "– keins –"], ...data.textiles.map((t) => [t.id, t.name])]))}
          ${field("Lieferant", select(`products.${p.id}.supplierId`, p.supplierId, [["", "Standard aus Textil"], ...(byId(data.textiles, p.textileId)?.offers || []).filter((o) => o.price !== "").map((o) => [o.supplierId, `${supplierName(o.supplierId)} · ${money(C.offerCost(o, data.settings))}`])]))}
        </div>
        ${disclosure("product-fine", "Feineinstellungen", fine, "Druck, Versand, Reserven")}
      </div>
      <div class="sticky">${live("productCalc", () => productCalc(p), "div", 'class="card"')}</div>
    </div>`}
  </div>`;
};
function productList() {
  const channel = byId(data.channels, data.settings.dashboardChannelId) || channelsActive()[0];
  if (!data.products.length) return `<div class="empty">Noch keine Produkte.</div>`;
  return productGroups().map(([category, items]) => `<div class="row" style="min-height:30px;background:var(--surface-2)"><span class="faint" style="font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">${esc(category)}</span></div>
    ${items.map((p) => {
      const r = C.channelResult(data, p, channel);
      const cost = C.productCosts(data, { ...p, priceGross: 1 });
      const badge = !hasPrice(p) ? '<span class="badge mid">Preis fehlt</span>'
        : r.costs.problems.length ? '<span class="badge mid">prüfen</span>'
        : `<span class="badge ${marginTone(r.margin)}">${pct(r.margin)}</span>`;
      return `<button type="button" class="row" data-action="selectProduct" data-id="${p.id}" aria-current="${p.id === ui.productId}">
        <div class="row-main"><div class="row-title">${esc(p.name || "Ohne Namen")}</div><div class="row-sub">${hasPrice(p) ? money(Number(p.priceGross)) : "kein Verkaufspreis"} · Kosten ${money(cost.variable)}</div></div>
        <div class="row-end">${badge}</div>${icon("chev", "chev")}
      </button>`;
    }).join("")}`).join("");
}
function productCalc(p) {
  const costs = C.productCosts(data, { ...p, priceGross: hasPrice(p) ? p.priceGross : 1 });
  const fixed = C.fixedCosts(data);
  const main = byId(data.channels, data.settings.dashboardChannelId) || channelsActive()[0];
  const mainResult = hasPrice(p) ? C.channelResult(data, p, main, { fixed }) : null;
  const breakdown = `<div class="breakdown">
    ${[["Textil", costs.textile, costs.offer ? supplierName(costs.offer.supplierId) : ""], ["Druck (Tinte, Pulver, Folie)", costs.ink + costs.powder + costs.film], ["Bezug, Reinigung, Ausschuss", costs.production - costs.textile - costs.ink - costs.powder - costs.film], ["Versand, Tasche, Etikett", costs.shipping + costs.bag + costs.label], ["Verpackung, Reserven, Werbung", costs.packaging + costs.reserves]]
      .filter(([, v]) => Math.abs(v) > 0.0001).map(([l, v, hint]) => `<div class="bd-row"><span>${esc(l)} ${hint ? `<span class="faint">${esc(hint)}</span>` : ""}</span><span class="num">${money(v)}</span></div>`).join("")}
    <div class="bd-row total"><span>Kosten je Stück</span><span class="num">${money(costs.variable)}</span></div>
  </div>`;
  const margins = [0.3, 0.4, 0.5];
  const target = margins.includes(ui.targetMargin) ? ui.targetMargin : 0.4;
  return `${costs.problems.filter((x) => x !== "Verkaufspreis fehlt").length ? `<div class="problem" style="margin-bottom:12px">${esc(costs.problems.filter((x) => x !== "Verkaufspreis fehlt").join(" · "))}</div>` : ""}
  <div class="metric-hero">
    <div><div class="kpi-label">Kosten je Stück</div><div class="hero-num">${money(costs.variable)}</div></div>
    ${mainResult ? `<div><div class="kpi-label">Gewinn · ${esc(main.name)}</div><div class="hero-num ${tone(mainResult.contribution)}">${money(mainResult.contribution)}</div></div>` : `<div><div class="kpi-label">Verkaufspreis</div><div class="hero-num faint">offen</div></div>`}
  </div>
  ${mainResult ? `<div class="hero-sub">Marge ${pct(mainResult.margin)} · Break-even ${pieces(mainResult.breakEvenMonthly)} im Monat</div>` : ""}
  <div class="section-label inline" style="justify-content:space-between;margin-top:20px">Je Kanal <span class="chips">${margins.map((m) => `<button type="button" class="chip" data-action="setTargetMargin" data-value="${m}" aria-pressed="${target === m}">${pct(m)}</button>`).join("")}</span></div>
  <div class="table-wrap"><table><thead><tr><th>Kanal</th>${hasPrice(p) ? '<th class="n">Gewinn</th><th class="n">Marge</th>' : ""}<th class="n">Preis für ${pct(target)}</th></tr></thead><tbody>
  ${channelsActive().map((channel) => {
    const r = hasPrice(p) ? C.channelResult(data, p, channel, { fixed }) : null;
    const price = C.priceForMargin(data, { ...p, priceGross: p.priceGross || 1 }, channel, target);
    return `<tr><td>${esc(channel.name)}</td>${r ? `<td class="n ${tone(r.contribution)}">${money(r.contribution)}</td><td class="n"><span class="badge ${marginTone(r.margin)}">${pct(r.margin)}</span></td>` : ""}<td class="n">${price === null ? "–" : `<button type="button" class="chip" data-action="setProductPrice" data-value="${price}" title="Als Verkaufspreis übernehmen">${money(price)}</button>`}</td></tr>`;
  }).join("")}
  </tbody></table></div>
  ${disclosure("product-breakdown", "Kostenaufbau", breakdown, money(costs.variable))}`;
}
/* ----- Textilien ----- */
PAGE_RENDER.textiles = () => {
  if (!byId(data.textiles, ui.textileId)) ui.textileId = data.textiles[0]?.id || "";
  const t = byId(data.textiles, ui.textileId);
  const supplierOpts = [["", "– Lieferant wählen –"], ...data.suppliers.map((s) => [s.id, s.name])];
  return `${pageHead("Textilien", "Varianten mit Angeboten mehrerer Lieferanten", btn("Neues Textil", "newTextile", { cls: "primary", icon: "plus" }))}
  <div class="split">
    ${live("textileList", textileList, "div", 'class="list"')}
    ${!t ? `<div class="card empty">Noch keine Textilien.</div>` : `<div class="grid">
      <div class="card"><h2 class="card-title">Textil ${btn("", "deleteTextile", { cls: "icon-btn danger", icon: "trash", title: "Textil löschen" })}</h2>
        <div class="form-grid">
          <div class="stack"><label>Bezeichnung</label>${text(`textiles.${t.id}.name`, t.name)}</div>
          <div class="stack"><label>Kategorie</label>${text(`textiles.${t.id}.category`, t.category, { placeholder: "T-Shirt, Hoodie …" })}</div>
        </div>
      </div>
      <div class="card"><h2 class="card-title">Angebote ${btn("Angebot", "addOffer", { cls: "small", icon: "plus" })}</h2>
        <div class="offers">
        ${t.offers.map((o) => `<div class="offer">
          <label class="offer-pref"><input type="radio" name="pref-${t.id}" data-path="textiles.${t.id}.preferredSupplierId" value="${esc(o.supplierId)}" ${t.preferredSupplierId === o.supplierId && o.supplierId ? "checked" : ""} data-rerender> Standard</label>
          <div class="form-grid">
            <div class="stack"><label>Lieferant</label>${select(`textiles.${t.id}.offers.${o.id}.supplierId`, o.supplierId, supplierOpts)}</div>
            <div class="stack"><label>Preis je Stück</label>${num(`textiles.${t.id}.offers.${o.id}.price`, o.price, { kind: "opt", unit: "€", label: "Preis" })}</div>
            <div class="stack"><label>Preisbasis</label>${select(`textiles.${t.id}.offers.${o.id}.basis`, o.basis, [["netto", "netto"], ["brutto", "brutto"]], { rerender: false })}</div>
            <div class="stack"><label>Bezugskosten / Stk.</label>${num(`textiles.${t.id}.offers.${o.id}.procurement`, o.procurement, { unit: "€", label: "Bezugskosten" })}</div>
            <div class="stack"><label>ab Menge</label>${num(`textiles.${t.id}.offers.${o.id}.minQty`, o.minQty, { kind: "opt", unit: "Stk.", label: "Mindestmenge" })}</div>
            <div class="stack"><label>Notiz</label>${text(`textiles.${t.id}.offers.${o.id}.note`, o.note || "")}</div>
          </div>
          ${btn("", "deleteOffer", { cls: "icon-btn danger offer-del", icon: "trash", title: "Angebot entfernen", data: { id: o.id } })}
        </div>`).join("") || `<div class="empty">Noch kein Angebot.</div>`}
        </div>
        ${data.suppliers.length ? "" : `<p class="note">Lege zuerst einen Lieferanten an.</p>`}
      </div>
      ${live("textileCompare", () => textileCompare(t), "div", 'class="card"')}
    </div>`}
  </div>`;
};
function textileList() {
  if (!data.textiles.length) return `<div class="empty">Noch keine Textilien.</div>`;
  const groups = {};
  for (const t of data.textiles) (groups[t.category || "Ohne Kategorie"] ||= []).push(t);
  return Object.entries(groups).map(([group, items]) => `<div class="row" style="min-height:30px;background:var(--surface-2)"><span class="faint" style="font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">${esc(group)}</span></div>
    ${items.map((t) => { const offer = C.textileOffer(data, t.id); return `<button type="button" class="row" data-action="selectTextile" data-id="${t.id}" aria-current="${t.id === ui.textileId}">
      <div class="row-main"><div class="row-title">${esc(t.name || "Ohne Namen")}</div><div class="row-sub">${t.offers.length} ${t.offers.length === 1 ? "Angebot" : "Angebote"}${offer ? ` · ${esc(supplierName(offer.supplierId))}` : ""}</div></div>
      <div class="row-end num">${offer ? money(C.offerCost(offer, data.settings)) : `<span class="badge mid">kein Preis</span>`}</div>${icon("chev", "chev")}</button>`; }).join("")}`).join("");
}
function textileCompare(t) {
  const priced = t.offers.filter((o) => o.price !== "" && o.price !== null && o.price !== undefined);
  const chosen = C.textileOffer(data, t.id);
  const cheapest = priced.reduce((best, o) => (!best || C.offerCost(o, data.settings) < C.offerCost(best, data.settings) ? o : best), null);
  const used = data.products.filter((p) => p.textileId === t.id);
  return `<h2 class="card-title">Vergleich <small>Kosten je Stück, ${vatNote()}</small></h2>
    ${priced.length ? `<div class="list" style="box-shadow:none;background:var(--surface-2)">${priced.slice().sort((a, b) => C.offerCost(a, data.settings) - C.offerCost(b, data.settings)).map((o) => `<div class="row"><div class="row-main"><div class="row-title">${esc(supplierName(o.supplierId))}</div><div class="row-sub">${o.minQty ? `ab ${int.format(o.minQty)} Stk.` : "ohne Mindestmenge"}${o.note ? ` · ${esc(o.note)}` : ""}</div></div><div class="inline">${o === chosen ? '<span class="badge blue">verwendet</span>' : ""}${o === cheapest ? '<span class="badge good">günstigster</span>' : ""}<strong class="num">${money(C.offerCost(o, data.settings))}</strong></div></div>`).join("")}</div>` : `<div class="empty">Noch keine Preise.</div>`}
    <div class="section-label inline" style="justify-content:space-between;margin-top:18px">Produkte mit diesem Textil ${btn("Als Produkt anlegen", "productFromTextile", { cls: "small", icon: "plus", data: { id: t.id } })}</div>
    ${used.length ? `<div class="chips">${used.map((p) => `<button type="button" class="chip" data-action="openProduct" data-id="${p.id}">${esc(p.name)}${hasPrice(p) ? ` · ${money(Number(p.priceGross))}` : " · Preis fehlt"}</button>`).join("")}</div>` : `<p class="note">Noch kein Produkt. Im Angebotsrechner ist es trotzdem unter „Nur Textil“ wählbar.</p>`}
    <p class="note">Ohne Standard nimmt die Kalkulation das günstigste Angebot.</p>`;
}

/* ----- Lieferanten ----- */
PAGE_RENDER.suppliers = () => {
  if (!byId(data.suppliers, ui.supplierId)) ui.supplierId = data.suppliers[0]?.id || "";
  const s = byId(data.suppliers, ui.supplierId);
  return `${pageHead("Lieferanten", "Kontakte und was sie liefern", btn("Neuer Lieferant", "newSupplier", { cls: "primary", icon: "plus" }))}
  <div class="split">
    ${live("supplierList", supplierList, "div", 'class="list"')}
    ${!s ? `<div class="card empty">Noch keine Lieferanten.</div>` : `<div class="grid cols-2">
      <div class="card"><h2 class="card-title">Kontakt ${btn("", "deleteSupplier", { cls: "icon-btn danger", icon: "trash", title: "Lieferant löschen" })}</h2><div class="fields">
        ${field("Firma", text(`suppliers.${s.id}.name`, s.name))}
        ${field("Ansprechpartner", text(`suppliers.${s.id}.contact`, s.contact))}
        ${field("E-Mail", text(`suppliers.${s.id}.email`, s.email, { type: "email" }))}
        ${field("Telefon", text(`suppliers.${s.id}.phone`, s.phone, { type: "tel" }))}
        ${field("Website", text(`suppliers.${s.id}.website`, s.website, { type: "url" }))}
        ${field("Notizen", area(`suppliers.${s.id}.notes`, s.notes))}
      </div></div>
      ${live("supplierItems", () => supplierItems(s), "div", 'class="card"')}
    </div>`}
  </div>`;
};
function supplierList() {
  if (!data.suppliers.length) return `<div class="empty">Noch keine Lieferanten.</div>`;
  return data.suppliers.map((s) => {
    const count = data.textiles.reduce((n, t) => n + t.offers.filter((o) => o.supplierId === s.id).length, 0) + data.materials.filter((m) => m.supplierId === s.id).length;
    return `<button type="button" class="row" data-action="selectSupplier" data-id="${s.id}" aria-current="${s.id === ui.supplierId}"><div class="row-main"><div class="row-title">${esc(s.name || "Ohne Namen")}</div><div class="row-sub">${esc(s.contact || s.email || "kein Kontakt")}</div></div><div class="row-end"><span class="badge">${count}</span></div>${icon("chev", "chev")}</button>`;
  }).join("");
}
function supplierItems(s) {
  const offers = data.textiles.flatMap((t) => t.offers.filter((o) => o.supplierId === s.id).map((o) => ({ t, o })));
  const materials = data.materials.filter((m) => m.supplierId === s.id);
  return `<h2 class="card-title">Liefert</h2>
    ${offers.length || materials.length ? `<div class="breakdown">
      ${offers.map(({ t, o }) => `<div class="bd-row"><span>${esc(t.name)} ${C.textileOffer(data, t.id) === o ? '<span class="badge blue">Standard</span>' : ""}</span><span class="num">${money(C.offerCost(o, data.settings))}</span></div>`).join("")}
      ${materials.map((m) => `<div class="bd-row"><span>${esc(m.name)}</span><span class="num">${unitMoney(C.materialUnitCost(m, data.settings))} / ${esc(m.unit)}</span></div>`).join("")}
    </div>` : `<div class="empty">Noch nichts zugeordnet. Angebote legst du unter Textilien an.</div>`}
    ${s.email ? `<p class="note"><a href="mailto:${esc(s.email)}" style="color:var(--accent)">E-Mail schreiben</a></p>` : ""}`;
}

/* ----- Material & Druck ----- */
PAGE_RENDER.materials = () => {
  const u = data.printUsage;
  const supplierOpts = [["", "–"], ...data.suppliers.map((s) => [s.id, s.name])];
  return `${pageHead("Material & Druck", "Einkaufspreise und Verbrauch je Druck", btn("Material", "newMaterial", { cls: "primary", icon: "plus" }))}
  <div class="card"><h2 class="card-title">Einkauf <small>Preis je Einheit = (Warenwert + Bezugskosten) ÷ Menge</small></h2>
    <div class="table-wrap"><table><thead><tr><th>Position</th><th>Verwendung</th><th class="n">Warenwert</th><th class="n">Bezugskosten</th><th class="n">Menge</th><th>Einheit</th><th>Basis</th><th>Lieferant</th><th class="n">je Einheit</th><th></th></tr></thead><tbody>
    ${data.materials.map((m) => `<tr>
      <td style="min-width:140px">${text(`materials.${m.id}.name`, m.name)}</td>
      <td>${m.role ? `<span class="badge blue">${esc(ROLE_LABEL[m.role])}</span>` : '<span class="faint">frei</span>'}</td>
      <td style="width:110px">${num(`materials.${m.id}.price`, m.price, { unit: "€", label: "Warenwert" })}</td>
      <td style="width:100px">${num(`materials.${m.id}.procurement`, m.procurement, { unit: "€", label: "Bezugskosten" })}</td>
      <td style="width:100px">${num(`materials.${m.id}.quantity`, m.quantity, { label: "Menge" })}</td>
      <td style="width:90px">${text(`materials.${m.id}.unit`, m.unit)}</td>
      <td style="width:96px">${select(`materials.${m.id}.basis`, m.basis, [["netto", "netto"], ["brutto", "brutto"]], { rerender: false })}</td>
      <td style="width:130px">${select(`materials.${m.id}.supplierId`, m.supplierId, supplierOpts, { rerender: false })}</td>
      ${live(`mat-${m.id}`, () => { const v = C.materialUnitCost(m, data.settings); return v === null ? '<span class="badge mid">fehlt</span>' : `<strong>${unitMoney(v)}</strong>`; }, "td", 'class="n"')}
      <td>${m.role ? "" : btn("", "deleteMaterial", { cls: "icon-btn danger", icon: "trash", title: "Material löschen", data: { id: m.id } })}</td>
    </tr>`).join("")}
    </tbody></table></div>
  </div>
  <div class="grid cols-2" style="margin-top:16px">
    <div class="card"><h2 class="card-title">Verbrauch je Referenzdruck</h2><div class="fields">
      ${field("Tinte CMYK", num("printUsage.cmykMl", u.cmykMl, { unit: "ml", label: "CMYK ml" }), "Summe aller Farben")}
      ${field("Tinte Weiß", num("printUsage.whiteMl", u.whiteMl, { unit: "ml", label: "Weiß ml" }))}
      ${field("Pulver", num("printUsage.powderG", u.powderG, { unit: "g", label: "Pulver g" }))}
      ${field("Folie", num("printUsage.filmSheets", u.filmSheets, { unit: "Blatt", label: "Folie Blatt" }))}
    </div></div>
    ${live("printCost", () => { const c = C.printCosts(data); return `<h2 class="card-title">Material je Druck <small>${vatNote()}</small></h2><div class="breakdown"><div class="bd-row"><span>Tinte</span><span class="num">${money(c.ink)}</span></div><div class="bd-row"><span>Pulver</span><span class="num">${money(c.powder)}</span></div><div class="bd-row"><span>Folie</span><span class="num">${money(c.film)}</span></div><div class="bd-row total"><span>Gesamt je Druck</span><span class="num">${money(c.total)}</span></div></div><p class="note">Faktoren pro Produkt passen den Verbrauch an größere oder kleinere Motive an.</p>`; }, "div", 'class="card"')}
  </div>`;
};

/* ----- Fixkosten ----- */
PAGE_RENDER.fixed = () => `${pageHead("Fixkosten", "Personal, laufende Kosten und Standorte pro Monat")}
  ${live("fixedKpis", fixedKpis, "div", 'class="grid cols-4"')}
  <div class="card" style="margin-top:16px"><h2 class="card-title">Personal ${btn("Person", "addStaff", { cls: "small", icon: "plus" })}</h2>
    <div class="table-wrap"><table><thead><tr><th>Position</th><th class="n">Budget / Person</th><th class="n">Anzahl</th><th class="n">Monat</th><th>Notiz</th><th></th></tr></thead><tbody>
    ${data.staff.map((s) => `<tr><td style="min-width:180px">${text(`staff.${s.id}.name`, s.name)}</td><td style="width:140px">${num(`staff.${s.id}.budget`, s.budget, { unit: "€", label: "Budget" })}</td><td style="width:90px">${num(`staff.${s.id}.count`, s.count, { label: "Anzahl" })}</td>${live(`staff-${s.id}`, () => `<strong>${money(Number(s.budget) * Number(s.count))}</strong>`, "td", 'class="n"')}<td style="min-width:160px">${text(`staff.${s.id}.note`, s.note || "")}</td><td>${btn("", "deleteRow", { cls: "icon-btn danger", icon: "trash", title: "Entfernen", data: { list: "staff", id: s.id } })}</td></tr>`).join("")}
    </tbody></table></div></div>
  <div class="card" style="margin-top:16px"><h2 class="card-title">Laufende Kosten ${btn("Kosten", "addFixed", { cls: "small", icon: "plus" })}</h2>
    <div class="table-wrap"><table><thead><tr><th>Aktiv</th><th>Position</th><th>Kategorie</th><th class="n">Betrag</th><th>Basis</th><th>Intervall</th><th class="n">Monat</th><th></th></tr></thead><tbody>
    ${data.fixedCosts.map((f) => `<tr><td>${toggle(`fixedCosts.${f.id}.active`, f.active !== false, "Aktiv")}</td><td style="min-width:180px">${text(`fixedCosts.${f.id}.name`, f.name)}</td><td style="width:140px">${text(`fixedCosts.${f.id}.category`, f.category || "")}</td><td style="width:120px">${num(`fixedCosts.${f.id}.amount`, f.amount, { unit: "€", label: "Betrag" })}</td><td style="width:96px">${select(`fixedCosts.${f.id}.basis`, f.basis, [["netto", "netto"], ["brutto", "brutto"]], { rerender: false })}</td><td style="width:120px">${select(`fixedCosts.${f.id}.interval`, f.interval, [["monthly", "monatlich"], ["yearly", "jährlich"]], { rerender: false })}</td>${live(`fc-${f.id}`, () => { const v = C.costBasis(f.interval === "yearly" ? Number(f.amount) / 12 : Number(f.amount), f.basis, data.settings); return f.active === false ? '<span class="faint">aus</span>' : money(v); }, "td", 'class="n"')}<td>${btn("", "deleteRow", { cls: "icon-btn danger", icon: "trash", title: "Entfernen", data: { list: "fixedCosts", id: f.id } })}</td></tr>`).join("")}
    </tbody></table></div></div>
  <div class="grid cols-2" style="margin-top:16px">
    <div class="card"><h2 class="card-title">Standorte ${btn("Standort", "addScenario", { cls: "small", icon: "plus" })}</h2>
      <div class="table-wrap"><table><thead><tr><th>Aktiv</th><th>Name</th><th class="n">m²</th><th class="n">Miete/m²</th><th class="n">NK/m²</th><th class="n">Monat</th><th></th></tr></thead><tbody>
      ${data.scenarios.map((s) => `<tr><td><input type="radio" name="scenario" data-path="settings.scenarioId" value="${s.id}" ${data.settings.scenarioId === s.id ? "checked" : ""} aria-label="Aktiver Standort"></td><td>${text(`scenarios.${s.id}.name`, s.name)}</td><td style="width:84px">${num(`scenarios.${s.id}.area`, s.area, { label: "Fläche" })}</td><td style="width:96px">${num(`scenarios.${s.id}.rentPerM2`, s.rentPerM2, { unit: "€", label: "Miete je m²" })}</td><td style="width:96px">${num(`scenarios.${s.id}.extraPerM2`, s.extraPerM2, { unit: "€", label: "Nebenkosten je m²" })}</td>${live(`sc-${s.id}`, () => money(Number(s.area) * (Number(s.rentPerM2) + Number(s.extraPerM2))), "td", 'class="n"')}<td>${btn("", "deleteRow", { cls: "icon-btn danger", icon: "trash", title: "Entfernen", data: { list: "scenarios", id: s.id } })}</td></tr>`).join("")}
      </tbody></table></div><p class="note">Der aktive Standort fließt in alle Rechnungen. In der Übersicht kannst du umschalten.</p></div>
    <div class="card"><h2 class="card-title">Plattformabos <small>aus Marktplätze</small></h2>
      ${live("subs", () => `<div class="breakdown">${data.channels.map((c) => `<div class="bd-row"><span>${esc(c.name)} ${C.channelPlan(c) ? `<span class="faint">${esc(C.channelPlan(c).name)}</span>` : ""} ${c.active === false ? '<span class="faint">inaktiv</span>' : ""}</span><span class="num">${money(C.channelMonthlyFee(c))}</span></div>`).join("")}</div>`)}
      <div class="section-label">Ergebnisziel</div>
      <div class="fields">${field("Zusätzlich pro Monat", num("settings.profitTarget", data.settings.profitTarget, { unit: "€", label: "Ergebnisziel" }), "Überschuss vor Steuern, fließt in den Break-even")}</div>
    </div>
  </div>`;
function fixedKpis() {
  const f = C.fixedCosts(data);
  return [
    kpi("Fixkosten / Monat", money0(f.total), esc(scenarioName())),
    kpi("Personal", money0(f.staff), `${pct(f.staff / (f.total || 1))} der Fixkosten`),
    kpi("Laufend + Plattformen", money0(f.running + f.platforms), `Plattformen ${money0(f.platforms)}`),
    kpi("Standort", money0(f.location), `pro Tag ${money0(f.total / Math.max(1, Number(data.settings.daysPerMonth)))} gesamt`),
  ].join("");
}

/* ----- Marktplätze ----- */
PAGE_RENDER.channels = () => `${pageHead("Marktplätze", "Gebühren je Verkauf und Monatsabos", `<div class="inline"><span class="faint" style="font-size:12.5px">Beispielpreis</span><div style="width:110px">${num("@.examplePrice", ui.examplePrice, { unit: "€", label: "Beispielpreis brutto" })}</div></div>${btn("Kanal", "newChannel", { cls: "primary", icon: "plus" })}`)}
  <div class="grid cols-2">${data.channels.map(channelCard).join("")}</div>`;
function channelCard(c) {
  const p = (key) => `channels.${c.id}.${key}`;
  return `<div class="card">
    <h2 class="card-title"><span class="inline" style="flex:1">${toggle(p("active"), c.active !== false, "Aktiv")}<span style="flex:1">${text(p("name"), c.name, { label: "Name" })}</span></span>${btn("", "deleteChannel", { cls: "icon-btn danger", icon: "trash", title: "Kanal löschen", data: { id: c.id } })}</h2>
    <div class="form-grid">
      ${(c.plans || []).length
        ? `<div class="stack"><label>Tarif</label>${select(p("planId"), c.planId, [["", "kein Tarif"], ...c.plans.map((pl) => [pl.id, `${pl.name} · ${money(Number(pl.monthlyFee))}`])])}</div>`
        : `<div class="stack"><label>Monatsabo netto</label>${num(p("monthlyFee"), c.monthlyFee, { unit: "€" })}</div>`}
    </div>
    ${live(`fee-${c.id}`, () => { const price = Number(ui.examplePrice) || 0; const f = C.channelFees(c, price, data.settings); return `<div class="bd-row" style="border:0;padding-top:12px"><span>Gebühren bei ${money(price)}</span><span class="num"><strong>${money(f.total)}</strong> <span class="faint">${pct(price ? f.total / price : 0)}</span></span></div>`; })}
    ${disclosure(`channel-${c.id}`, "Gebühren bearbeiten", `    <div class="form-grid">
      <div class="stack"><label>Mindestprovision</label>${num(p("minCommission"), c.minCommission, { unit: "€" })}</div>
      <div class="stack"><label>Zahlung %</label>${num(p("paymentRate"), c.paymentRate, { kind: "pct", unit: "%" })}</div>
      <div class="stack"><label>Zahlung fix</label>${num(p("paymentFixed"), c.paymentFixed, { unit: "€" })}</div>
      <div class="stack"><label>Bestellpauschale</label>${num(p("orderFee"), c.orderFee, { unit: "€" })}</div>
      <div class="stack"><label>Pauschale über Grenze</label><div class="inline">${num(p("orderFeeHigh"), c.orderFeeHigh, { kind: "opt", unit: "€", placeholder: "–" })}<span class="faint">ab</span>${num(p("orderFeeThreshold"), c.orderFeeThreshold, { kind: "opt", unit: "€", placeholder: "–" })}</div></div>
      <div class="stack"><label>Einstellgebühr</label>${num(p("listingFee"), c.listingFee, { unit: "€" })}</div>
      <div class="stack"><label>Stückgebühr</label>${num(p("perItemFee"), c.perItemFee, { unit: "€" })}</div>
      <div class="stack"><label>Werbegebühr %</label>${num(p("adRate"), c.adRate, { kind: "pct", unit: "%" })}</div>
      <div class="stack"><label>Anteil beworbener Verkäufe</label>${num(p("adShare"), c.adShare, { kind: "pct", unit: "%" })}</div>
    </div>
    <div class="section-label inline" style="justify-content:space-between">Provision ${seg(p("tierMode"), c.tierMode || "whole", [["whole", "Satz nach Preis"], ["marginal", "gestaffelt"]], { label: "Provisionsmodell" })}</div>
    <div class="table-wrap"><table><thead><tr><th class="n">bis Preis</th><th class="n">Satz</th><th></th></tr></thead><tbody>
      ${(c.tiers || []).map((t) => `<tr><td>${num(`channels.${c.id}.tiers.${t.id}.upTo`, t.upTo ?? "", { kind: "opt", unit: "€", placeholder: "unbegrenzt" })}</td><td>${num(`channels.${c.id}.tiers.${t.id}.rate`, t.rate, { kind: "pct", unit: "%" })}</td><td>${btn("", "deleteTier", { cls: "icon-btn danger", icon: "trash", title: "Stufe entfernen", data: { channel: c.id, id: t.id } })}</td></tr>`).join("") || `<tr><td colspan="3" class="faint">Keine Provision.</td></tr>`}
    </tbody></table></div>
    <div class="inline" style="justify-content:space-between;margin-top:8px">${btn("Stufe", "addTier", { cls: "small", icon: "plus", data: { channel: c.id } })}<span class="faint" style="font-size:12px">${c.tierMode === "marginal" ? "Satz gilt nur für den Teil im Bereich" : "Der passende Satz gilt für den ganzen Preis"}</span></div>
    <div class="section-label inline" style="justify-content:space-between;margin-top:20px">Tarife ${btn("Tarif", "addPlan", { cls: "small", icon: "plus", data: { channel: c.id } })}</div>
    ${(c.plans || []).length ? `<div class="table-wrap"><table><thead><tr><th>Aktiv</th><th>Tarif</th><th class="n">Monatsabo</th><th class="n">Stückgebühr</th><th></th></tr></thead><tbody>
      ${c.plans.map((pl) => `<tr><td><input type="radio" name="plan-${c.id}" data-path="channels.${c.id}.planId" value="${esc(pl.id)}" ${c.planId === pl.id ? "checked" : ""} data-rerender aria-label="Tarif ${esc(pl.name)} aktiv"></td><td>${text(`channels.${c.id}.plans.${pl.id}.name`, pl.name, { label: "Tarifname" })}</td><td>${num(`channels.${c.id}.plans.${pl.id}.monthlyFee`, pl.monthlyFee, { unit: "€", label: "Monatsabo" })}</td><td>${num(`channels.${c.id}.plans.${pl.id}.perItemFee`, pl.perItemFee ?? "", { kind: "opt", unit: "€", placeholder: "wie Kanal", label: "Stückgebühr" })}</td><td>${btn("", "deletePlan", { cls: "icon-btn danger", icon: "trash", title: "Tarif entfernen", data: { channel: c.id, id: pl.id } })}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="note">Ohne Tarife gilt das Monatsabo oben. Mit Tarifen wählst du z. B. zwischen Shop-Stufen.</p>`}
    <div style="margin-top:10px">${text(p("note"), c.note || "", { placeholder: "Notiz, Quelle, Stand" })}</div>
`)}
  </div>`;
}

/* ----- Einstellungen ----- */
PAGE_RENDER.settings = () => {
  const s = data.settings;
  const theme = store.get("kalk.theme", "system");
  return `${pageHead("Einstellungen")}
  ${s.setupDone ? "" : `<div class="card welcome"><div><h2 class="card-title">Willkommen</h2><p class="note">Trag unter „Firma auf Angeboten“ deine Firma und dein Logo ein, prüf die Umsatzsteuer und leg dann unter Lieferanten, Textilien und Produkte los.</p></div>${btn("Fertig", "finishSetup", { cls: "primary" })}</div>`}
  <div class="grid cols-2">
    <div class="card"><h2 class="card-title">Steuer und Rechnung</h2><div class="fields">
      ${field("Umsatzsteuerpflichtig", toggle("settings.vatLiable", s.vatLiable, "Umsatzsteuerpflichtig", { rerender: true }), s.vatLiable ? "USt wird aus dem Verkaufspreis herausgerechnet, Einkauf netto mit Vorsteuer" : "Kleinunternehmer: voller Preis bleibt, Einkauf und Gebühren zählen brutto")}
      ${field("Umsatzsteuersatz", num("settings.vatRate", s.vatRate, { kind: "pct", unit: "%" }))}
      ${field("Kalendertage pro Monat", num("settings.daysPerMonth", s.daysPerMonth, { kind: "int" }))}
      ${field("Monatsziel runden auf", num("settings.roundTo", s.roundTo, { kind: "int", unit: "Stk." }))}
      ${field("Ergebnisziel pro Monat", num("settings.profitTarget", s.profitTarget, { unit: "€" }), "zusätzlich zu den Fixkosten")}
      ${field("Standardkanal", select("settings.dashboardChannelId", s.dashboardChannelId, channelOptions(), { rerender: false }), "für Produktliste und neue Produkte")}
    </div></div>
    <div class="card"><h2 class="card-title">B2B-Staffel <small>Rabatt auf deinen Grundpreis</small></h2>
      <div class="table-wrap"><table><thead><tr><th>Ab Menge</th><th>Rabatt</th><th></th></tr></thead><tbody>
        ${data.b2b.tiers.map((t) => `<tr><td>${num(`b2b.tiers.${t.id}.minQty`, t.minQty, { kind: "int", unit: "Stk.", label: "Ab Menge" })}</td><td>${num(`b2b.tiers.${t.id}.discount`, t.discount, { kind: "pct", unit: "%", label: "Rabatt" })}</td><td>${btn("", "deleteB2bTier", { cls: "icon-btn danger", icon: "trash", title: "Stufe entfernen", data: { id: t.id } })}</td></tr>`).join("")}
      </tbody></table></div>
      <div style="margin-top:8px">${btn("Stufe", "addB2bTier", { cls: "small", icon: "plus" })}</div>
      <div class="fields" style="margin-top:14px">
        ${field("Einrichtungspauschale", num("b2b.setupFee", data.b2b.setupFee, { unit: "€", label: "Einrichtungspauschale netto" }), "netto, einmal je Angebot")}
        ${field("Entfällt ab", num("b2b.setupFreeFrom", data.b2b.setupFreeFrom, { kind: "int", unit: "Stk.", label: "Einrichtung entfällt ab" }))}
      </div>
    </div>
    <div class="card"><h2 class="card-title">Firma auf Angeboten</h2><div class="fields">
      ${field("Logo", `<div class="logo-field">${data.company.logo ? `<img src="${esc(data.company.logo)}" alt="Logo">` : ""}${btn(data.company.logo ? "Ändern" : "Logo wählen", "pickLogo", { cls: "small" })}${data.company.logo ? btn("", "removeLogo", { cls: "icon-btn danger", icon: "trash", title: "Logo entfernen" }) : ""}<input type="file" id="logo-file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden></div>`, "PNG, JPG oder SVG")}
      ${[["name", "Firma"], ["street", "Straße"], ["zip", "PLZ"], ["city", "Ort"], ["country", "Land"], ["manager", "Geschäftsführer"], ["register", "Handelsregister", "z. B. Amtsgericht Musterstadt HRB 12345"], ["vatId", "USt-IdNr."], ["taxNumber", "Steuernummer"], ["phone", "Telefon"], ["email", "E-Mail"], ["website", "Website"], ["bankName", "Bank"], ["iban", "IBAN"], ["bic", "BIC"]]
        .map(([key, label, placeholder]) => field(label, text(`company.${key}`, data.company[key], { label, placeholder }))).join("")}
      ${field("Akzentfarbe", text("company.accent", data.company.accent || "#0a7d6b", { type: "color", label: "Akzentfarbe für Rabatte" }), "Rabatte im Angebot")}
      ${field("Angebot gültig", num("company.validDays", data.company.validDays, { kind: "int", unit: "Tage", label: "Gültigkeit in Tagen" }))}
    </div>
    ${disclosure("company-texts", "Standardtexte", `<div class="fields">${field("Einleitung", area("company.intro", data.company.intro))}${field("Schluss", area("company.closing", data.company.closing))}</div>`, "für neue Angebote")}
    </div>
    <div class="card"><h2 class="card-title">Darstellung</h2><div class="fields">
      ${field("Erscheinungsbild", `<div class="seg" role="radiogroup" aria-label="Erscheinungsbild" style="--n:3;--i:${["system", "light", "dark"].indexOf(theme)}"><span class="thumb" style="width:calc((100% - 4px) / var(--n));transform:translateX(calc(var(--i) * 100%))"></span>${[["system", "System"], ["light", "Hell"], ["dark", "Dunkel"]].map(([v, l], i) => `<input type="radio" id="theme-${v}" name="theme" value="${v}" data-theme-choice data-seg-index="${i}" ${theme === v ? "checked" : ""}><label for="theme-${v}">${l}</label>`).join("")}</div>`)}
    </div>
    <h2 class="card-title" style="margin-top:22px">Daten</h2>
    <p class="note">Gespeichert in <code>Kalkulation\\data\\data.json</code>, jeden Tag eine Sicherung in <code>data\\backups</code>.</p>
    <div class="inline" style="flex-wrap:wrap;margin-top:10px">${btn("Exportieren", "exportData")}${btn("Importieren", "importData")}${btn("Auf Startstand zurücksetzen", "resetData",{ cls: "danger" })}</div>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
    ${live("backups", () => (ui.backups ? `<div class="section-label">Sicherungen</div><div class="breakdown">${ui.backups.slice(0, 8).map((b) => `<div class="bd-row"><span>${esc(b.replace("data-", "").replace(".json", ""))}</span><span class="faint">${esc(b)}</span></div>`).join("") || '<span class="faint">noch keine</span>'}</div>` : ""))}
    </div>
  </div>`;
};

/* ---------- Rendern ---------- */
function renderNav() {
  let html = "";
  for (const page of PAGES) {
    if (page.group) html += `<div class="nav-group">${esc(page.group)}</div>`;
    html += `<button type="button" class="nav-item" data-action="go" data-page="${page.id}" ${ui.page === page.id ? 'aria-current="page"' : ""}>${icon(page.icon)}<span>${esc(page.label)}</span></button>`;
  }
  document.getElementById("nav").innerHTML = html;
}
function render() {
  for (const key of Object.keys(LIVE)) delete LIVE[key];
  const main = document.getElementById("main");
  const scroll = main.scrollTop;
  const active = document.activeElement?.dataset?.path;
  main.innerHTML = `<div class="page">${(PAGE_RENDER[ui.page] || PAGE_RENDER.dashboard)()}</div>`;
  main.scrollTop = scroll;
  renderNav();
  for (const el of main.querySelectorAll('input[type="range"]')) paintRange(el);
  refreshLive();
  fitPaper();
  if (active) main.querySelector(`[data-path="${CSS.escape(active)}"]:not([type=radio])`)?.focus({ preventScroll: true });
  store.set("kalk.ui", ui);
}
// Gebündelt nach dem aktuellen Ereignis, auch wenn das Fenster verdeckt ist (kein rAF).
let livePending = false;
function refreshLive() {
  if (livePending) return;
  livePending = true;
  queueMicrotask(() => {
    livePending = false;
    for (const el of document.querySelectorAll("[data-live]")) {
      const fn = LIVE[el.dataset.live];
      if (fn) el.innerHTML = fn();
    }
  });
}
function go(page) {
  ui.page = page;
  render();
  document.getElementById("main").scrollTop = 0;
}

/* ---------- Dialog und Hinweis ---------- */
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}
function confirmDialog(title, body, action = "Löschen") {
  const dialog = document.getElementById("dialog");
  dialog.innerHTML = `<h3>${esc(title)}</h3><p>${esc(body)}</p><div class="dialog-actions"><button type="button" class="btn" value="cancel">Abbrechen</button><button type="button" class="btn primary" value="ok" style="${action === "Löschen" ? "background:var(--red)" : ""}">${esc(action)}</button></div>`;
  return new Promise((resolveDialog) => {
    dialog.onclick = (event) => { const value = event.target.closest("button")?.value; if (value) { dialog.close(); resolveDialog(value === "ok"); } };
    dialog.oncancel = () => resolveDialog(false);
    dialog.showModal();
    dialog.querySelector('[value="ok"]').focus();
  });
}

/* ---------- Aktionen ---------- */
const blankProduct = () => ({ id: uid("p"), name: "Neues Produkt", category: "", priceGross: 24.95, textileId: data.textiles[0]?.id || "", supplierId: "", ownTextilePrice: "", procurement: 0, prints: 1, inkFactor: 1, powderFactor: 1, filmFactor: 1, scrapRate: 0, cleaning: 0, shippingOverride: "", packagingExtra: 0, returnsReserve: 0, adPerSale: 0, adShareOfPrice: 0, otherVariable: 0, plannedMonthly: 0, planChannelId: data.settings.dashboardChannelId || "", notes: "" });
const ACTIONS = {
  go: (d) => go(d.page),
  newProduct: () => { const p = blankProduct(); data.products.push(p); ui.productId = p.id; scheduleSave(); go("products"); setTimeout(() => document.querySelector(`[data-path="products.${p.id}.name"]`)?.select(), 30); },
  duplicateProduct: () => { const src = byId(data.products, ui.productId); if (!src) return; const p = { ...structuredClone(src), id: uid("p"), name: `${src.name} Kopie` }; data.products.splice(data.products.indexOf(src) + 1, 0, p); ui.productId = p.id; scheduleSave(); render(); toast("Produkt dupliziert"); },
  deleteProduct: async () => { const p = byId(data.products, ui.productId); if (p && await confirmDialog(`„${p.name}“ löschen?`, "Das Produkt und seine Planmenge werden entfernt.")) { data.products = data.products.filter((x) => x !== p); scheduleSave(); render(); } },
  selectProduct: (d) => { ui.productId = d.id; render(); },
  openProduct: (d) => { ui.productId = d.id; go("products"); },
  productFromTextile: (d) => {
    const t = byId(data.textiles, d.id); if (!t) return;
    const p = productFromTextile(data, t);
    data.products.push(p); ui.productId = p.id; scheduleSave(); go("products");
    setTimeout(() => document.querySelector(`[data-path="products.${p.id}.priceGross"]`)?.focus(), 30);
    toast(`Produkt „${t.name}“ angelegt – Verkaufspreis eintragen`);
  },
  applyPlayPrice: (d) => { const p = byId(data.products, d.id); p.priceGross = Number(ui.play[d.id].price); scheduleSave(); render(); toast(`Preis für ${p.name} übernommen`); },
  setPlanChannel: (d) => { byId(data.products, d.id).planChannelId = d.channel; scheduleSave(); render(); },
  setTargetMargin: (d) => { ui.targetMargin = Number(d.value); render(); },
  setProductPrice: (d) => {
    const p = byId(data.products, ui.productId); if (!p) return;
    const before = p.priceGross;
    p.priceGross = Number(d.value); scheduleSave(); render();
    toast(`Verkaufspreis ${money(p.priceGross)}${before !== "" && before !== undefined ? ` (vorher ${money(Number(before))})` : ""}`);
  },
  newTextile: () => { const t = { id: uid("t"), name: "Neues Textil", category: "", preferredSupplierId: "", offers: [{ id: uid("o"), supplierId: data.suppliers[0]?.id || "", price: "", procurement: 0, basis: "netto", minQty: "", note: "" }] }; data.textiles.push(t); ui.textileId = t.id; scheduleSave(); render(); },
  selectTextile: (d) => { ui.textileId = d.id; render(); },
  deleteTextile: async () => { const t = byId(data.textiles, ui.textileId); const used = data.products.filter((p) => p.textileId === t.id); if (await confirmDialog(`„${t.name}“ löschen?`, used.length ? `Wird in ${used.map((p) => p.name).join(", ")} verwendet. Dort fehlt danach der Textilpreis.` : "Alle Angebote dieses Textils werden entfernt.")) { data.textiles = data.textiles.filter((x) => x !== t); scheduleSave(); render(); } },
  addOffer: () => { byId(data.textiles, ui.textileId).offers.push({ id: uid("o"), supplierId: "", price: "", procurement: 0, basis: "netto", minQty: "", note: "" }); scheduleSave(); render(); },
  deleteOffer: (d) => { const t = byId(data.textiles, ui.textileId); const o = byId(t.offers, d.id); t.offers = t.offers.filter((x) => x !== o); if (t.preferredSupplierId === o?.supplierId) t.preferredSupplierId = ""; scheduleSave(); render(); },
  newSupplier: () => { const s = { id: uid("s"), name: "Neuer Lieferant", contact: "", email: "", phone: "", website: "", notes: "" }; data.suppliers.push(s); ui.supplierId = s.id; scheduleSave(); render(); setTimeout(() => document.querySelector(`[data-path="suppliers.${s.id}.name"]`)?.select(), 30); },
  selectSupplier: (d) => { ui.supplierId = d.id; render(); },
  deleteSupplier: async () => {
    const s = byId(data.suppliers, ui.supplierId);
    const offers = data.textiles.reduce((n, t) => n + t.offers.filter((o) => o.supplierId === s.id).length, 0);
    if (!await confirmDialog(`„${s.name}“ löschen?`, offers ? `${offers} Textil-Angebote dieses Lieferanten werden ebenfalls entfernt.` : "Der Lieferant wird entfernt.")) return;
    for (const t of data.textiles) { t.offers = t.offers.filter((o) => o.supplierId !== s.id); if (t.preferredSupplierId === s.id) t.preferredSupplierId = ""; }
    for (const m of data.materials) if (m.supplierId === s.id) m.supplierId = "";
    for (const p of data.products) if (p.supplierId === s.id) p.supplierId = "";
    data.suppliers = data.suppliers.filter((x) => x !== s); scheduleSave(); render();
  },
  newMaterial: () => { data.materials.push({ id: uid("m"), role: null, name: "Neues Material", price: 0, procurement: 0, quantity: 1, unit: "Stück", basis: "netto", supplierId: "", note: "" }); scheduleSave(); render(); },
  deleteMaterial: async (d) => { const m = byId(data.materials, d.id); if (await confirmDialog(`„${m.name}“ löschen?`, "Das Material wird entfernt.")) { data.materials = data.materials.filter((x) => x !== m); scheduleSave(); render(); } },
  addStaff: () => { data.staff.push({ id: uid("st"), name: "Neue Position", budget: 0, count: 1, note: "" }); scheduleSave(); render(); },
  addFixed: () => { data.fixedCosts.push({ id: uid("fc"), name: "Neue Kosten", category: "", amount: 0, basis: "netto", interval: "monthly", active: true }); scheduleSave(); render(); },
  addScenario: () => { data.scenarios.push({ id: uid("sc"), name: "Neuer Standort", area: 0, rentPerM2: 0, extraPerM2: 0 }); scheduleSave(); render(); },
  deleteRow: async (d) => {
    const list = data[d.list]; const row = byId(list, d.id);
    if (d.list === "scenarios" && list.length <= 1) return toast("Mindestens ein Standort bleibt");
    if (!await confirmDialog(`„${row.name}“ entfernen?`, "Die Zeile wird gelöscht.")) return;
    data[d.list] = list.filter((x) => x !== row);
    if (d.list === "scenarios" && data.settings.scenarioId === row.id) data.settings.scenarioId = data.scenarios[0].id;
    scheduleSave(); render();
  },
  newChannel: () => { data.channels.push({ id: uid("c"), name: "Neuer Kanal", active: true, monthlyFee: 0, tierMode: "whole", tiers: [{ id: uid("t"), upTo: null, rate: 0.1 }], minCommission: 0, paymentRate: 0, paymentFixed: 0, orderFee: 0, orderFeeHigh: "", orderFeeThreshold: "", listingFee: 0, adRate: 0, adShare: 0, perItemFee: 0, note: "" }); scheduleSave(); render(); },
  deleteChannel: async (d) => { const c = byId(data.channels, d.id); if (data.channels.length <= 1) return toast("Mindestens ein Kanal bleibt"); if (await confirmDialog(`„${c.name}“ löschen?`, "Gebühren und Monatsabo dieses Kanals werden entfernt.")) { data.channels = data.channels.filter((x) => x !== c); normalize(data); for (const p of data.products) if (p.planChannelId === c.id) p.planChannelId = data.channels[0].id; scheduleSave(); render(); } },
  addPlan: (d) => {
    const c = byId(data.channels, d.channel);
    c.plans ||= [];
    if (!c.plans.length && Number(c.monthlyFee)) c.plans.push({ id: uid("pl"), name: "Aktuell", monthlyFee: Number(c.monthlyFee), perItemFee: "" });
    const plan = { id: uid("pl"), name: "Neuer Tarif", monthlyFee: 0, perItemFee: "" };
    c.plans.push(plan);
    c.planId ||= c.plans[0].id;
    scheduleSave(); render();
  },
  deletePlan: (d) => { const c = byId(data.channels, d.channel); c.plans = c.plans.filter((x) => x.id !== d.id); if (c.planId === d.id) c.planId = c.plans[0]?.id || ""; scheduleSave(); render(); },
  addTier: (d) => { byId(data.channels, d.channel).tiers.push({ id: uid("t"), upTo: null, rate: 0 }); scheduleSave(); render(); },
  deleteTier: (d) => { const c = byId(data.channels, d.channel); c.tiers = c.tiers.filter((t) => t.id !== d.id); scheduleSave(); render(); },
  setQty: (d) => { ui.quote.quantity = Number(d.qty); render(); },
  setDiscount: (d) => { ui.quote.discount = Number(d.value); ui.quote.discountAuto = false; render(); },
  useTierDiscount: () => { ui.quote.discountAuto = true; render(); },
  addB2bTier: () => { const last = data.b2b.tiers[data.b2b.tiers.length - 1]; data.b2b.tiers.push({ id: uid("bt"), minQty: last ? Number(last.minQty) * 2 : 25, discount: Math.min(0.9, last ? Number(last.discount) + 0.05 : 0.05) }); scheduleSave(); render(); },
  deleteB2bTier: (d) => { data.b2b.tiers = data.b2b.tiers.filter((t) => t.id !== d.id); scheduleSave(); render(); },
  setQuotePrice: (d) => { ui.quote.price = Number(d.value); render(); },
  addToOffer: () => {
    const input = quoteInput(); if (!input.product) return;
    if (!(Number(ui.quote.price) > 0)) return toast("Erst einen Preis eintragen");
    const r = C.quote(data, input);
    const o = byId(data.offers, ui.offerId) || createOffer(ui.quote.customer || "");
    if (!o.customer && ui.quote.customer) o.customer = ui.quote.customer;
    const prints = Number(input.overrides.prints ?? input.product.prints ?? 1);
    const details = [prints > 1 ? `inkl. ${prints} Drucke` : prints === 1 ? "inkl. Druck" : "", input.shippingIncluded ? "inkl. Versand" : ""].filter(Boolean).join(", ");
    o.positions.push({ id: uid("pos"), productId: ui.quote.productId, title: input.product.name, details, qty: r.quantity, unitNet: Number(ui.quote.price), discount: r.discount, unitCost: Math.round(r.unitCost * 10000) / 10000 });
    // Einrichtungspauschale einmal je Angebot, sobald eine Position unter der Freigrenze liegt.
    const fee = Number(data.b2b.setupFee) || 0;
    if (fee > 0 && r.quantity < Number(data.b2b.setupFreeFrom) && !o.positions.some((p) => p.kind === "setup")) {
      o.positions.push({ id: uid("pos"), kind: "setup", productId: "", title: "Einrichtung / Druckvorbereitung", details: `einmalig, entfällt ab ${int.format(Number(data.b2b.setupFreeFrom))} Stück`, qty: 1, unitNet: fee, discount: 0, unitCost: "" });
    }
    scheduleSave(); store.set("kalk.ui", ui); refreshLive();
    toast(`${int.format(r.quantity)} × ${input.product.name} zu ${o.number} hinzugefügt`);
  },
  newOffer: (d) => { createOffer(); if (d.stay) { refreshLive(); store.set("kalk.ui", ui); toast("Neues Angebot begonnen"); } else go("offers"); },
  duplicateOffer: () => {
    const src = byId(data.offers, ui.offerId); if (!src) return;
    const o = createOffer(src.customer);
    Object.assign(o, { subject: src.subject, intro: src.intro, closing: src.closing, positions: src.positions.map((p) => ({ ...p, id: uid("pos") })) });
    render(); toast(`Kopie ${o.number} angelegt`);
  },
  deleteOffer: async () => {
    const o = byId(data.offers, ui.offerId);
    if (o && await confirmDialog(`${o.number} löschen?`, `${firstLine(o.customer) || "Ohne Kunde"} · ${o.positions.length} Positionen`)) { data.offers = data.offers.filter((x) => x !== o); ui.offerId = ""; scheduleSave(); render(); }
  },
  addOfferPos: () => {
    const o = byId(data.offers, ui.offerId); if (!o) return;
    const pos = { id: uid("pos"), productId: "", title: "", details: "", qty: 1, unitNet: "", discount: "", unitCost: "" };
    o.positions.push(pos); scheduleSave(); render();
    setTimeout(() => document.querySelector(`[data-path="offers.${o.id}.positions.${pos.id}.title"]`)?.focus(), 30);
  },
  deleteOfferPos: (d) => { const o = byId(data.offers, ui.offerId); o.positions = o.positions.filter((p) => p.id !== d.id); scheduleSave(); render(); },
  printOffer: () => {
    const o = byId(data.offers, ui.offerId); if (!o) return;
    const root = document.getElementById("print-root");
    root.innerHTML = offerDoc(o);
    const title = document.title;
    document.title = `Angebot ${o.number}${firstLine(o.customer) ? ` ${firstLine(o.customer)}` : ""}`;
    document.body.classList.add("print-offer");
    const done = () => { document.body.classList.remove("print-offer"); root.innerHTML = ""; document.title = title; };
    window.addEventListener("afterprint", done, { once: true });
    // Logo erst laden lassen, sonst fehlt es im PDF.
    const img = root.querySelector("img");
    const go = () => window.print();
    if (img && !img.complete) img.addEventListener("load", go, { once: true }); else go();
  },
  copyQuote: async () => {
    const input = quoteInput(); if (!input.product) return;
    if (!(Number(ui.quote.price) > 0)) return toast("Erst einen Preis eintragen");
    const r = C.quote(data, input); const vat = data.settings.vatLiable;
    const lines = [`Angebot${ui.quote.customer ? ` für ${ui.quote.customer}` : ""}`, `${input.product.name}, ${int.format(r.quantity)} Stück`, `Preis je Stück: ${money(r.unitNet)}${vat ? ` netto (${money(r.unitGross)} brutto)` : ""}`, r.discount ? `inkl. ${pct(r.discount)} Rabatt` : "", `Gesamt: ${money(r.revenueNet)}${vat ? ` netto, ${money(r.revenueGross)} brutto` : ""}`, input.shippingIncluded ? "inkl. Versand" : "zzgl. Versand"].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(lines); toast("Angebotstext kopiert"); } catch { toast("Kopieren nicht möglich"); }
  },
  exportData: () => { const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `kalkulation-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href); },
  importData: () => document.getElementById("import-file").click(),
  resetData: async () => {
    if (!await confirmDialog("Auf Startstand zurücksetzen?", "Alle Produkte, Preise und Angebote werden durch den Startstand ersetzt. Die heutige Sicherung bleibt in data\\backups.", "Zurücksetzen")) return;
    data = normalize(await (await fetch("seed.json")).json()); scheduleSave(); render(); toast("Startstand wiederhergestellt");
  },
  pickLogo: () => document.getElementById("logo-file").click(),
  removeLogo: () => { data.company.logo = ""; scheduleSave(); render(); },
  finishSetup: () => {
    if (!data.company.name.trim()) return toast("Trag zuerst deinen Firmennamen ein");
    data.settings.setupDone = true; scheduleSave(); go("dashboard"); toast("Fertig eingerichtet");
  },
};

/* ---------- Ereignisse ---------- */
document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (el && ACTIONS[el.dataset.action]) { event.preventDefault(); ACTIONS[el.dataset.action](el.dataset, el); }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (!el.dataset.path || el.matches('select, [type="checkbox"], [type="radio"]')) return;
  writeFromInput(el);
  if (el.dataset.path === "@.quote.discount") ui.quote.discountAuto = false;
  if (el.dataset.path === "@.quote.quantity") syncTierDiscount();
  refreshLive();
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if (el.matches("[data-theme-choice]")) { applyTheme(el.value); store.set("kalk.theme", el.value); moveThumb(el); return; }
  if (el.id === "import-file") return importFile(el);
  if (el.id === "logo-file") return importLogo(el);
  if (!el.dataset.path) return;
  if (el.matches('select, [type="checkbox"], [type="radio"]')) {
    if (el.type === "radio" && !el.checked) return;
    writeFromInput(el);
    if (el.dataset.segIndex !== undefined) moveThumb(el);
    if (el.dataset.rerender !== undefined || el.dataset.path === "settings.scenarioId") render(); else refreshLive();
  } else {
    // Zahl nach dem Verlassen sauber formatieren, ohne den Fokus zu stören.
    if (el.dataset.kind && el.dataset.kind !== "text") el.value = displayValue(readPath(el.dataset.path), el.dataset.kind);
    if (el.dataset.rerender !== undefined) render();
  }
});
document.addEventListener("toggle", (event) => {
  const el = event.target;
  if (!el.matches?.("details[data-open-key]")) return;
  ui.open ||= {};
  ui.open[el.dataset.openKey] = el.open;
  store.set("kalk.ui", ui);
}, true);
function moveThumb(radio) { radio.closest(".seg")?.style.setProperty("--i", radio.dataset.segIndex); }
async function importFile(input) {
  const file = input.files?.[0]; input.value = "";
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported.products || !imported.settings) throw new Error("format");
    if (!await confirmDialog("Daten importieren?", `${file.name} ersetzt den aktuellen Stand. Die heutige Sicherung bleibt erhalten.`, "Importieren")) return;
    data = normalize(imported); scheduleSave(); render(); toast("Daten importiert");
  } catch { toast("Datei ist keine Kalkulation"); }
}
// Logo als Data-URL in den Daten: wandert mit Export, Import und Sicherung.
async function importLogo(input) {
  const file = input.files?.[0]; input.value = "";
  if (!file) return;
  if (file.size > 1024 * 1024) return toast("Logo ist größer als 1 MB");
  const url = await new Promise((resolveRead, rejectRead) => { const r = new FileReader(); r.onload = () => resolveRead(r.result); r.onerror = rejectRead; r.readAsDataURL(file); });
  data.company.logo = url; scheduleSave(); render(); toast("Logo übernommen");
}
function applyTheme(value) {
  if (value === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = value;
}
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); clearTimeout(saveTimer); dirty = true; flush(); }
});

/* ---------- Start ---------- */
applyTheme(store.get("kalk.theme", "system"));
setStatus("saving", "Lädt …");
try {
  const response = await fetch("/api/data");
  rev = response.headers.get("X-Rev");
  data = normalize(await response.json());
  setStatus("", "Alle Änderungen gespeichert");
  if (migrated) scheduleSave();
} catch {
  data = normalize(await (await fetch("seed.json")).json());
  setStatus("error", "Server nicht erreichbar – Änderungen werden nicht gespeichert");
}
if (!data.settings.setupDone) ui.page = "settings";
render();
fetch("/api/backups").then((r) => r.json()).then((list) => { ui.backups = list; if (ui.page === "settings") refreshLive(); }).catch(() => {});
