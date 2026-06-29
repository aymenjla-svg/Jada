import { el, segmented } from "../ui.js";

// État (persiste entre les rendus)
let metricId = "repas";
let rangeDays = 14;

const localDay = (ts) => {
  const d = new Date(ts); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const todayISO = () => localDay(Date.now());
const shiftDay = (iso, delta) => {
  const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};

const METRICS = [
  { id: "repas",   label: "Repas",   cat: "feed",  get: (b) => b.repas,           fmt: (v) => String(Math.round(v)) },
  { id: "sommeil", label: "Sommeil", cat: "sleep", get: (b) => b.sleepSec / 3600, fmt: (v) => v.toFixed(1) + " h" },
  { id: "biberon", label: "Bib.",    cat: "bot",   get: (b) => b.bibMl,           fmt: (v) => Math.round(v) + " ml" },
  { id: "couches", label: "Couches", cat: "diap",  get: (b) => b.diapers,         fmt: (v) => String(Math.round(v)) },
  { id: "hydra",   label: "Hydra",   cat: "water", get: (b) => b.hydraMl,         fmt: (v) => Math.round(v) + " ml" },
  { id: "pump",    label: "Tire-l.", cat: "pump",  get: (b) => b.pumpMl,          fmt: (v) => Math.round(v) + " ml" },
];

function buildSeries(events, days) {
  const list = [];
  for (let i = days - 1; i >= 0; i--) list.push(shiftDay(todayISO(), -i));
  const map = {};
  list.forEach((d) => (map[d] = { repas: 0, tetees: 0, bibMl: 0, sleepSec: 0, diapers: 0, hydraMl: 0, pumpMl: 0 }));
  (events || []).forEach((e) => {
    if (e.payload && e.payload.ongoing) return;
    const b = map[localDay(e.timestamp)];
    if (!b) return;
    const p = e.payload || {};
    if (e.type === "feeding") { b.repas++; if (p.kind === "biberon") b.bibMl += p.volumeMl || 0; else b.tetees++; }
    else if (e.type === "sleep") b.sleepSec += p.durationSec || 0;
    else if (e.type === "diaper") b.diapers++;
    else if (e.type === "hydration") b.hydraMl += p.volumeMl || 0;
    else if (e.type === "pump") b.pumpMl += p.volumeMl || 0;
  });
  return list.map((d) => ({ day: d, bucket: map[d] }));
}

function barChart(series, metric) {
  const W = 520, H = 215, padL = 10, padR = 10, padT = 16, padB = 30;
  const vals = series.map((s) => metric.get(s.bucket));
  const max = Math.max(1, ...vals);
  const n = series.length;
  const slot = (W - padL - padR) / n;
  const bw = Math.min(slot * 0.6, 26);
  const y0 = H - padB;
  const sy = (v) => y0 - (v / max) * (H - padT - padB);
  const color = `var(--${metric.cat})`;

  const bars = series.map((s, i) => {
    const v = metric.get(s.bucket);
    const x = padL + slot * i + (slot - bw) / 2;
    const y = sy(v);
    const h = Math.max(0, y0 - y);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(5, bw / 2).toFixed(1)}" fill="${color}" opacity="${v ? 0.9 : 0.18}"/>`;
  }).join("");

  // Moyenne (ligne pointillée)
  const avg = vals.reduce((a, b) => a + b, 0) / (n || 1);
  const yAvg = sy(avg);
  const avgLine = `<line x1="${padL}" y1="${yAvg.toFixed(1)}" x2="${W - padR}" y2="${yAvg.toFixed(1)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 4" opacity=".55"/>`;

  // Étiquettes de dates (≈ 5 réparties)
  const idxs = n <= 7 ? series.map((_, i) => i) : [0, Math.round((n - 1) / 4), Math.round((n - 1) / 2), Math.round(3 * (n - 1) / 4), n - 1];
  const fmtD = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
  const labels = [...new Set(idxs)].map((i) => {
    const cx = padL + slot * i + slot / 2;
    const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
    return `<text x="${cx.toFixed(1)}" y="${H - 10}" font-size="10.5" fill="#B9A6BD" text-anchor="${anchor}">${fmtD.format(new Date(series[i].day + "T12:00:00"))}</text>`;
  }).join("");

  const wrap = el("div", {});
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:215px">
    <line x1="${padL}" y1="${y0}" x2="${W - padR}" y2="${y0}" stroke="rgba(61,43,70,.10)" stroke-width="1"/>
    ${bars}${avgLine}${labels}</svg>`;
  return wrap;
}

// Comparaison des modèles de tire-lait (volume moyen, durée, rendement).
function pumpByBrand(events) {
  const pumps = (events || []).filter((e) => e.type === "pump");
  if (!pumps.length) return null;

  const map = {};
  pumps.forEach((e) => {
    const p = e.payload || {};
    const name = p.pump || "Non précisé";
    const b = map[name] || (map[name] = { name, n: 0, nVol: 0, ml: 0, sec: 0 });
    b.n++;
    if (p.volumeMl) { b.ml += p.volumeMl; b.nVol++; }
    b.sec += p.durationSec || 0;
  });

  const rows = Object.values(map).map((b) => ({
    name: b.name,
    n: b.n,
    avgMl: b.nVol ? b.ml / b.nVol : 0,
    avgMin: b.n ? b.sec / 60 / b.n : 0,
    mlPerMin: b.sec ? b.ml / (b.sec / 60) : 0,
  })).sort((a, b) => b.avgMl - a.avgMl);

  const maxMl = Math.max(1, ...rows.map((r) => r.avgMl));

  const card = el("div", { class: "card tight" });
  rows.forEach((r) => {
    const sub = [
      `${r.n} séance${r.n > 1 ? "s" : ""}`,
      r.avgMin ? `${Math.round(r.avgMin)} min` : null,
      r.mlPerMin ? `${r.mlPerMin.toFixed(1)} ml/min` : null,
    ].filter(Boolean).join(" · ");
    card.appendChild(el("div", { class: "brand-row" }, [
      el("div", { class: "brand-top" }, [
        el("span", { class: "brand-name" }, r.name),
        el("span", { class: "brand-val" }, r.avgMl ? `${Math.round(r.avgMl)} ml` : "—"),
      ]),
      el("div", { class: "brand-bar" }, el("span", { style: `width:${Math.round((r.avgMl / maxMl) * 100)}%` })),
      el("div", { class: "brand-sub" }, sub),
    ]));
  });
  return [el("div", { class: "section-title" }, "Tire-lait par modèle"), card];
}

export function renderStats(ctx) {
  const metric = METRICS.find((m) => m.id === metricId) || METRICS[0];
  const series = buildSeries(ctx.cache.events || [], rangeDays);
  const vals = series.map((s) => metric.get(s.bucket));
  const total = vals.reduce((a, b) => a + b, 0);
  const avg = total / (rangeDays || 1);
  const max = Math.max(...vals, 0);

  const metricSeg = segmented(METRICS.map((m) => ({ id: m.id, label: m.label })), metricId, (v) => { metricId = v; ctx.rerender(); });
  const rangeSeg = segmented([{ id: "7", label: "7 j" }, { id: "14", label: "14 j" }, { id: "30", label: "30 j" }], String(rangeDays),
    (v) => { rangeDays = Number(v); ctx.rerender(); });

  const summary = el("div", { class: "stats-summary" }, [
    el("div", { class: "ss-cell" }, [el("div", { class: "ss-val" }, metric.fmt(avg)), el("div", { class: "ss-lab" }, "moyenne / jour")]),
    el("div", { class: "ss-cell" }, [el("div", { class: "ss-val" }, metric.fmt(total)), el("div", { class: "ss-lab" }, "total")]),
    el("div", { class: "ss-cell" }, [el("div", { class: "ss-val" }, metric.fmt(max)), el("div", { class: "ss-lab" }, "record")]),
  ]);

  const brands = pumpByBrand(ctx.cache.events);

  return el("div", { class: "screen active" }, [
    el("div", { class: "title-page" }, "Stats"),
    el("div", { class: "stats-controls" }, [metricSeg.node, el("div", { style: "height:8px" }), rangeSeg.node]),
    el("div", { class: "card" }, [summary, el("div", { style: "height:8px" }), barChart(series, metric)]),
    ...(brands || []),
    el("div", { class: "disclaimer" }, "Évolution jour par jour. La ligne pointillée indique la moyenne de la période."),
  ]);
}
