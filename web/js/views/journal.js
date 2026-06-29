import { el, toast } from "../ui.js";
import { emoji } from "../icons.js";

// Jour sélectionné (persiste entre les rendus), au format local AAAA-MM-JJ.
let selDay = null;

const localDay = (ts) => {
  const d = new Date(ts); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const todayISO = () => localDay(Date.now());
const shiftDay = (iso, delta) => {
  const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};
function dayLabel(iso) {
  if (iso === todayISO()) return "Aujourd'hui";
  if (iso === shiftDay(todayISO(), -1)) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso + "T12:00:00"));
}
function fmtDur(sec) {
  const m = Math.round((sec || 0) / 60);
  if (!m) return "0";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

function dayStats(events, day) {
  const evs = events.filter((e) => localDay(e.timestamp) === day && !(e.payload && e.payload.ongoing));
  const feeds = evs.filter((e) => e.type === "feeding");
  const tetees = feeds.filter((e) => (e.payload?.kind || "sein") === "sein");
  const bibs = feeds.filter((e) => e.payload?.kind === "biberon");
  const bibMl = bibs.reduce((s, e) => s + (e.payload?.volumeMl || 0), 0);
  const bibMat = bibs.filter((e) => e.payload?.milk === "maternel").length;
  const bibPou = bibs.filter((e) => e.payload?.milk === "poudre").length;
  const teteeSec = tetees.reduce((s, e) => s + (e.payload?.durationSec || 0), 0);
  const sleeps = evs.filter((e) => e.type === "sleep");
  const sleepSec = sleeps.reduce((s, e) => s + (e.payload?.durationSec || 0), 0);
  const diapers = evs.filter((e) => e.type === "diaper");
  const pipi = diapers.filter((e) => ["pipi", "mixte"].includes(e.payload?.kind)).length;
  const caca = diapers.filter((e) => ["caca", "mixte"].includes(e.payload?.kind)).length;
  const hydra = evs.filter((e) => e.type === "hydration");
  const hydraMl = hydra.reduce((s, e) => s + (e.payload?.volumeMl || 0), 0);
  const pumps = evs.filter((e) => e.type === "pump");
  const pumpMl = pumps.reduce((s, e) => s + (e.payload?.volumeMl || 0), 0);
  return {
    total: evs.length,
    repas: tetees.length + bibs.length,
    tetees: tetees.length, teteeSec,
    bibs: bibs.length, bibMl, bibMat, bibPou,
    sleepSec, nDodos: sleeps.length,
    diapers: diapers.length, pipi, caca,
    hydra: hydra.length, hydraMl,
    pumps: pumps.length, pumpMl,
  };
}

function statCard(emoName, cat, value, label, sub) {
  return el("div", { class: "jcard" }, [
    el("div", { class: "jic i-" + cat }, emoji(emoName)),
    el("div", { class: "jbody" }, [
      el("div", { class: "jval" }, value),
      el("div", { class: "jlab" }, label),
      sub ? el("div", { class: "jsub" }, sub) : null,
    ]),
  ]);
}

export function renderJournal(ctx) {
  if (!selDay) selDay = todayISO();
  const s = dayStats(ctx.cache.events || [], selDay);
  const isToday = selDay === todayISO();

  const prev = el("button", { class: "day-arrow", onclick: () => { selDay = shiftDay(selDay, -1); ctx.rerender(); } }, "‹");
  const next = el("button", { class: "day-arrow" + (isToday ? " off" : ""), onclick: () => {
    if (isToday) return; selDay = shiftDay(selDay, 1); ctx.rerender();
  } }, "›");
  const nav = el("div", { class: "day-nav" }, [
    prev,
    el("div", { class: "day-label" }, [emoji("calendrier", "emo dl-emo"), dayLabel(selDay)]),
    next,
  ]);

  let content;
  if (!s.total) {
    content = el("div", { class: "card" }, el("div", { class: "empty" }, "Rien enregistré ce jour-là."));
  } else {
    content = el("div", { class: "jgrid" }, [
      statCard("repas", "feed", String(s.repas), "Repas", "tétées + biberons"),
      statCard("tetee", "feed", String(s.tetees), "Tétées", s.teteeSec ? fmtDur(s.teteeSec) + " au sein" : null),
      statCard("biberon", "bot", String(s.bibs), "Biberons", [s.bibMl ? s.bibMl + " ml" : null, (s.bibMat || s.bibPou) ? `${s.bibMat} mat./${s.bibPou} pdr` : null].filter(Boolean).join(" · ") || null),
      statCard("sommeil", "sleep", fmtDur(s.sleepSec), "Sommeil", s.nDodos + (s.nDodos > 1 ? " dodos" : " dodo")),
      statCard("couche", "diap", String(s.diapers), "Couches", `${s.pipi} pipi · ${s.caca} caca`),
      statCard("eau", "water", s.hydraMl ? s.hydraMl + " ml" : "—", "Hydratation", s.hydra ? s.hydra + " fois" : null),
      s.pumps ? statCard("lait", "pump", s.pumpMl ? s.pumpMl + " ml" : String(s.pumps), "Tire-lait", s.pumps + (s.pumps > 1 ? " séances" : " séance")) : null,
    ]);
  }

  return el("div", { class: "screen active" }, [
    el("div", { class: "title-page" }, "Journal"),
    nav,
    content,
    el("div", { class: "disclaimer" }, "Résumé du jour à partir de vos enregistrements. Touchez ‹ › pour changer de jour."),
  ]);
}
