import { el, ringSVG, openSheet, closeSheet, toast, field, segmented, caregiverToggle } from "../ui.js";
import { uuid, fmtTime, fmtElapsed, relative, ageDescription, STOOL_COLORS } from "../data.js";
import { openWelcomeSheet } from "../welcome.js";
import { computeReminders } from "../notify.js";
import { emoji, eventVisual } from "../icons.js";

const REF_INTERVAL = 3 * 3600 * 1000; // 3 h de référence pour remplir l'anneau

// Décrit un événement : emoji + couleur de catégorie + libellé.
function describe(e) {
  const p = e.payload || {};
  const v = eventVisual(e);
  let text = e.type;
  if (e.type === "feeding") {
    if (p.kind === "biberon") text = `Biberon${p.volumeMl ? ` · ${p.volumeMl} ml` : ""}`;
    else {
      const side = p.side === "gauche" ? " G" : p.side === "droite" ? " D" : "";
      const dur = p.durationSec ? ` · ${Math.round(p.durationSec / 60)} min` : "";
      text = `Tétée${side}${dur}`;
    }
  } else if (e.type === "hydration") {
    text = `${p.product || "Adiaryl"} · ${p.volumeMl} ml`;
  } else if (e.type === "diaper") {
    const k = p.kind === "caca" ? "Caca" : p.kind === "mixte" ? "Mixte" : "Pipi";
    text = `Couche ${k.toLowerCase()}${p.stoolColor ? ` · ${p.stoolColor}` : ""}`;
  } else if (e.type === "sleep") {
    text = `Sommeil${p.durationSec ? ` · ${fmtDur(p.durationSec)}` : ""}`;
  }
  return { emo: v.emo, cat: v.cat, text };
}

// Durée lisible : « 1h05 », « 18 min », « 45 s ».
function fmtDur(sec) {
  sec = Math.round(sec);
  if (sec < 60) return `${sec} s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

export function renderMaman(ctx) {
  stopLiveTimers();
  const { cache } = ctx;
  const child = cache.child;
  const greet = greeting();
  const feeds = cache.events.filter((e) => e.type === "feeding").sort(byTimeDesc);
  const ongoingFeed = feeds.find((e) => e.payload && e.payload.ongoing);
  const completedFeeds = feeds.filter((e) => !(e.payload && e.payload.ongoing));
  const ongoingSleep = cache.events.find((e) => e.type === "sleep" && e.payload && e.payload.ongoing);
  const all = [...cache.events].sort((a, b) => eventTime(b) - eventTime(a));
  const lastFeed = [...completedFeeds].sort((a, b) => eventTime(b) - eventTime(a))[0];

  // Anneau (mesuré depuis la FIN de la dernière tétée)
  const elapsed = lastFeed ? Date.now() - eventTime(lastFeed) : 0;
  const progress = lastFeed ? elapsed / REF_INTERVAL : 0;

  const ring = el("div", { class: "ring", html: ringSVG(progress) });
  ring.appendChild(el("div", { class: "center" }, [
    el("div", { class: "label" }, "Depuis la dernière tétée"),
    el("div", { class: "big" }, lastFeed ? fmtElapsed(elapsed) : "—"),
    lastFeed ? el("div", { class: "sub" }, "à " + fmtTime(eventTime(lastFeed))) : null,
  ]));

  // Dernier événement
  const lastCard = el("div", { class: "card" });
  if (lastFeed) {
    const d = describe(lastFeed);
    lastCard.appendChild(el("div", { class: "last-row" }, [
      el("div", { class: "avatar i-" + d.cat }, emoji(d.emo)),
      el("div", {}, [
        el("div", { class: "t" }, d.text),
        el("div", { class: "s" }, `${relative(eventTime(lastFeed))} · par ${cgLabel(lastFeed.created_by)}`),
      ]),
    ]));
  } else {
    lastCard.appendChild(el("div", { class: "empty" }, "Aucun événement encore. Loggez la première tétée 👇"));
  }

  // Tétée minutée : bouton « Commencer » ou carte « en cours ».
  const feedControl = ongoingFeed
    ? ongoingFeedCard(ctx, ongoingFeed)
    : el("button", { class: "btn-feed", onclick: () => startFeed(ctx, completedFeeds) }, [el("span", { class: "tri" }), "Commencer la tétée"]);

  // Sommeil minuté : « Endormie » / carte « en cours ».
  const sleepControl = ongoingSleep
    ? ongoingSleepCard(ctx, ongoingSleep)
    : el("button", { class: "btn-feed sleep", onclick: () => startSleep(ctx) }, [emoji("lune"), "Endormie · démarrer le sommeil"]);

  // Rappels (tétée en retard, vaccin/RDV proche)
  const rems = computeReminders(cache);
  const reminder = rems.length
    ? el("div", { class: "card reminders" }, rems.map((r) =>
        el("div", { class: "reminder-item" }, [el("span", { class: "ri-ic" }, emoji(r.emo || "cloche")), el("span", {}, r.text)])))
    : null;

  // Résumé du jour
  const s = daySummary(cache.events);
  const summaryCard = el("div", { class: "card summary" }, [
    statCell("tetee", String(s.feeds), "tétées"),
    statCell("biberon", s.ml ? `${s.ml}` : "—", "ml bib."),
    statCell("couche", String(s.diapers), "couches"),
    statCell("sommeil", s.sleepSec ? fmtDur(s.sleepSec) : "—", "sommeil"),
  ]);

  // Grille d'actions
  const actions = el("div", { class: "card" }, [
    el("div", { class: "actions" }, [
      chip("tetee", "Tétée", "feed", () => sheetFeeding(ctx)),
      chip("biberon", "Biberon", "bot", () => sheetFeeding(ctx, "biberon")),
      chip("eau", "Hydrat.", "water", () => sheetHydration(ctx)),
      chip("couche", "Couche", "diap", () => sheetDiaper(ctx)),
    ]),
  ]);

  // Fil du jour (on masque la tétée en cours, montrée dans sa carte dédiée)
  const list = el("div", { class: "card tight" });
  const today = all.filter(sameDay)
    .filter((e) => !(e.payload && e.payload.ongoing))
    .slice(0, 30);
  if (!today.length) list.appendChild(el("div", { class: "empty" }, "Rien aujourd'hui."));
  else today.forEach((e) => {
    const d = describe(e);
    const editor = EDITORS[e.type];
    const row = el("div", { class: "event" + (editor ? " tappable" : "") }, [
      el("div", { class: "mini i-" + d.cat }, emoji(d.emo)),
      el("div", { style: "flex:1;min-width:0" }, [el("div", { class: "t" }, d.text), el("div", { class: "by" }, "par " + cgLabel(e.created_by))]),
      el("div", { class: "time" }, fmtTime(eventTime(e))),
    ]);
    if (editor) row.onclick = () => editor(ctx, e);
    list.appendChild(row);
  });

  return el("div", { class: "screen active" }, [
    el("div", { class: "screen-head" }, [
      el("div", { class: "hello" }, [
        el("div", { class: "hello-av" }, (child?.name || "B").trim().charAt(0).toUpperCase()),
        el("div", {}, [
          el("div", { class: "greeting" }, [greet.label + " ", emoji(greet.emo)]),
          el("div", { class: "name-row" }, [
            el("div", { class: "title-xl" }, child?.name || "Bébé"),
            el("span", { class: "name-heart" }, emoji("coeur")),
          ]),
        ]),
      ]),
      el("div", { style: "text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px" }, [
        el("div", { class: "age-pill" }, child ? [emoji("bebe"), " " + ageDescription(child.birth_date)] : ""),
        el("div", { style: "display:flex;align-items:center;gap:8px" }, [
          el("button", { class: "sound-btn", title: "Réglages", onclick: () => openWelcomeSheet() }, emoji("cloche")),
          caregiverBadge(ctx),
        ]),
      ]),
    ]),
    el("div", { class: "ring-wrap" }, ring),
    reminder,
    summaryCard,
    lastCard,
    feedControl,
    sleepControl,
    actions,
    el("div", { class: "section-title" }, "Aujourd'hui"),
    list,
  ]);

  function sameDay(e) {
    const a = new Date(e.timestamp), b = new Date();
    return a.toDateString() === b.toDateString();
  }
}

// ---------- Pastilles ----------
function chip(emoName, cap, cat, onclick) {
  return el("button", { class: "chip", onclick }, [
    el("div", { class: "ic i-" + cat }, emoji(emoName)),
    el("div", { class: "cap" }, cap),
  ]);
}

function caregiverBadge(ctx) {
  const b = el("button", { class: "badge" }, [emoji("personne"), " " + cgLabel(ctx.caregiver)]);
  b.onclick = () => {
    ctx.setCaregiver(ctx.caregiver === "maman" ? "papa" : "maman");
    toast("Vous êtes : " + cgLabel(ctx.caregiver));
  };
  return b;
}

const cgLabel = (id) => (id === "papa" ? "Papa" : "Maman");
const byTimeDesc = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

// Heure « parlante » d'un événement : la FIN pour une tétée/un sommeil minuté
// (début + durée), sinon l'horodatage. Renvoie un nombre (ms).
function eventTime(e) {
  const p = e.payload || {};
  const start = new Date(e.timestamp).getTime();
  if ((e.type === "feeding" || e.type === "sleep") && p.durationSec) return start + p.durationSec * 1000;
  return start;
}

// Salutation douce selon l'heure (la lune pour les tétées de nuit).
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return { label: "Coucou", emo: "lune" };
  if (h < 12) return { label: "Bonjour", emo: "soleil" };
  if (h < 18) return { label: "Coucou", emo: "fleur" };
  return { label: "Bonsoir", emo: "lune" };
}

// ============================================================
//  Tétée minutée (chrono en direct) + édition
// ============================================================

let liveIntervals = [];
function stopLiveTimers() { liveIntervals.forEach(clearInterval); liveIntervals = []; }
function addLiveTimer(node, startISO) {
  const upd = () => { node.textContent = fmtClock(Date.now() - new Date(startISO)); };
  upd();
  liveIntervals.push(setInterval(upd, 1000));
}
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// Termine un sommeil en cours à l'instant `atISO` (réveil). Renvoie true si fait.
// Un événement enregistré AVANT le début du sommeil ne le termine pas.
async function endOngoingSleep(ctx, atISO) {
  const sleeping = ctx.cache.events.find((e) => e.type === "sleep" && e.payload && e.payload.ongoing);
  if (!sleeping) return false;
  const start = new Date(sleeping.timestamp).getTime();
  const at = new Date(atISO).getTime();
  if (at <= start) return false;
  await ctx.store.update("events", sleeping.id, { payload: { durationSec: Math.max(1, Math.round((at - start) / 1000)) } });
  return true;
}

async function startFeed(ctx, completedFeeds) {
  const woke = await endOngoingSleep(ctx, new Date().toISOString());
  // Alterne automatiquement le côté par rapport à la dernière tétée au sein.
  const lastSide = completedFeeds.find((f) => f.payload && f.payload.side)?.payload?.side;
  const side = lastSide === "gauche" ? "droite" : "gauche";
  await ctx.store.insert("events", {
    id: uuid(), type: "feeding", timestamp: new Date().toISOString(),
    created_by: ctx.caregiver, note: null,
    payload: { kind: "sein", side, ongoing: true },
  });
  toast(woke ? "Sommeil terminé · tétée démarrée ⏱️" : "Tétée démarrée ⏱️");
}

function ongoingFeedCard(ctx, ev) {
  const p = ev.payload || {};
  const sideSeg = segmented(
    [{ id: "gauche", label: "Gauche" }, { id: "droite", label: "Droite" }],
    p.side || "gauche",
    async (v) => { await ctx.store.update("events", ev.id, { payload: { ...p, side: v } }); }
  );
  const timer = el("div", { class: "feed-timer" }, "00:00");
  addLiveTimer(timer, ev.timestamp);

  const stopBtn = el("button", { class: "btn-feed stop", onclick: async () => {
    const sec = Math.max(1, Math.round((Date.now() - new Date(ev.timestamp)) / 1000));
    await ctx.store.update("events", ev.id, { payload: { kind: "sein", side: sideSeg.get(), durationSec: sec } });
    toast("Tétée enregistrée ✓");
  } }, "■ Arrêter la tétée");

  return el("div", { class: "card feed-live" }, [
    el("div", { class: "feed-live-head" }, [
      el("span", {}, [emoji("tetee"), " Tétée en cours"]),
      el("span", { class: "pill" }, "par " + cgLabel(ev.created_by)),
    ]),
    el("div", { class: "feed-timer-wrap" }, timer),
    field("Côté", sideSeg.node),
    stopBtn,
    el("button", { class: "btn-link", style: "display:block;margin:8px auto 0", onclick: () => adjustStart(ctx, ev) },
      "Modifier l'heure de début"),
  ]);
}

function adjustStart(ctx, ev) {
  const when = el("input", { type: "datetime-local", value: toLocal(ev.timestamp) });
  openSheet("Heure de début", el("div", {}, [field("Début de la tétée", when)]), {
    saveLabel: "OK",
    onSave: async () => { await ctx.store.update("events", ev.id, { timestamp: fromLocal(when.value) }); closeSheet(); },
  });
}

function editFeedSheet(ctx, ev) {
  const p = ev.payload || {};
  const isBib = p.kind === "biberon";
  const side = segmented([{ id: "gauche", label: "Gauche" }, { id: "droite", label: "Droite" }], p.side || "gauche");
  const minutes = p.durationSec ? Math.round(p.durationSec / 60) : 0;
  const minLabel = el("label", {}, `Durée : ${minutes} min`);
  const range = el("input", { type: "range", min: 0, max: 60, value: minutes,
    oninput: () => (minLabel.textContent = `Durée : ${range.value} min`) });
  const vol = el("input", { type: "number", inputmode: "numeric", value: p.volumeMl || "" });
  const when = el("input", { type: "datetime-local", value: toLocal(ev.timestamp) });

  const del = el("button", { class: "sheet-secondary", style: "color:#c0392b;margin-top:8px",
    onclick: async () => { if (confirm("Supprimer cette tétée ?")) { await ctx.store.remove("events", ev.id); closeSheet(); toast("Supprimée"); } } },
    "🗑 Supprimer");

  const content = el("div", {}, [
    isBib ? field("Volume (ml)", vol)
          : el("div", {}, [field("Côté", side.node), el("div", { class: "field" }, [minLabel, range])]),
    field("Quand ?", when),
    del,
  ]);

  openSheet(isBib ? "Modifier le biberon" : "Modifier la tétée", content, { onSave: async () => {
    const payload = isBib
      ? { kind: "biberon", volumeMl: Number(vol.value) || null }
      : { kind: "sein", side: side.get(), durationSec: Number(range.value) * 60 };
    await ctx.store.update("events", ev.id, { payload, timestamp: fromLocal(when.value) });
    closeSheet(); toast("Tétée modifiée");
  }});
}

// ---------- Sommeil minuté ----------
async function startSleep(ctx) {
  // Si une tétée est restée en cours, on la termine (filet de sécurité).
  const feeding = ctx.cache.events.find((e) => e.type === "feeding" && e.payload && e.payload.ongoing);
  if (feeding) {
    const sec = Math.max(1, Math.round((Date.now() - new Date(feeding.timestamp)) / 1000));
    await ctx.store.update("events", feeding.id, { payload: { kind: "sein", side: feeding.payload.side || "gauche", durationSec: sec } });
  }
  await ctx.store.insert("events", {
    id: uuid(), type: "sleep", timestamp: new Date().toISOString(),
    created_by: ctx.caregiver, note: null, payload: { ongoing: true },
  });
  toast(feeding ? "Tétée terminée · sommeil démarré 😴" : "Sommeil démarré 😴");
}

function ongoingSleepCard(ctx, ev) {
  const timer = el("div", { class: "feed-timer" }, "00:00");
  addLiveTimer(timer, ev.timestamp);
  const stopBtn = el("button", { class: "btn-feed stop", onclick: async () => {
    const sec = Math.max(1, Math.round((Date.now() - new Date(ev.timestamp)) / 1000));
    await ctx.store.update("events", ev.id, { payload: { durationSec: sec } });
    toast("Sommeil enregistré ✓");
  } }, [emoji("soleil"), "Réveillée (fin du sommeil)"]);
  return el("div", { class: "card feed-live sleep" }, [
    el("div", { class: "feed-live-head" }, [
      el("span", {}, [emoji("sommeil"), " Sommeil en cours"]),
      el("span", { class: "pill" }, "par " + cgLabel(ev.created_by)),
    ]),
    el("div", { class: "feed-timer-wrap" }, timer),
    stopBtn,
    el("button", { class: "btn-link", style: "display:block;margin:8px auto 0", onclick: () => adjustStart(ctx, ev) },
      "Modifier l'heure de début"),
  ]);
}

// ---------- Édition couche / hydratation / sommeil ----------
function delButton(ctx, ev, msg) {
  return el("button", { class: "sheet-secondary", style: "color:#c0392b;margin-top:8px",
    onclick: async () => { if (confirm(msg)) { await ctx.store.remove("events", ev.id); closeSheet(); toast("Supprimé"); } } },
    "🗑 Supprimer");
}

function editHydrationSheet(ctx, ev) {
  const p = ev.payload || {};
  const product = el("input", { type: "text", value: p.product || "Adiaryl" });
  const vol = el("input", { type: "number", inputmode: "numeric", value: p.volumeMl || "" });
  const when = el("input", { type: "datetime-local", value: toLocal(ev.timestamp) });
  openSheet("Modifier l'hydratation",
    el("div", {}, [field("Produit", product), field("Volume (ml)", vol), field("Quand ?", when), delButton(ctx, ev, "Supprimer cette hydratation ?")]),
    { onSave: async () => {
      await ctx.store.update("events", ev.id, { payload: { product: product.value || "Adiaryl", volumeMl: Number(vol.value) || 0 }, timestamp: fromLocal(when.value) });
      closeSheet(); toast("Modifié");
    } });
}

function editDiaperSheet(ctx, ev) {
  const p = ev.payload || {};
  let kind = p.kind || "pipi";
  const seg = segmented([{ id: "pipi", label: "Pipi" }, { id: "caca", label: "Caca" }, { id: "mixte", label: "Mixte" }], kind,
    (v) => { kind = v; colorBox.style.display = v === "pipi" ? "none" : ""; });
  let color = p.stoolColor || "jaune";
  const swatches = STOOL_COLORS.map((c) => {
    const sw = el("div", { class: "swatch" + (c.id === color ? " on" : "") }, [el("div", { class: "dot", style: `background:${c.hex}` }), el("span", {}, c.label)]);
    sw.onclick = () => { color = c.id; [...colors.children].forEach((n, i) => n.className = "swatch" + (STOOL_COLORS[i].id === color ? " on" : "")); };
    return sw;
  });
  const colors = el("div", { class: "colors" }, swatches);
  const colorBox = field("Couleur des selles", colors);
  colorBox.style.display = kind === "pipi" ? "none" : "";
  const when = el("input", { type: "datetime-local", value: toLocal(ev.timestamp) });
  openSheet("Modifier la couche",
    el("div", {}, [field("Type", seg.node), colorBox, field("Quand ?", when), delButton(ctx, ev, "Supprimer cette couche ?")]),
    { onSave: async () => {
      await ctx.store.update("events", ev.id, { payload: { kind, stoolColor: kind === "pipi" ? null : color }, timestamp: fromLocal(when.value) });
      closeSheet(); toast("Modifié");
    } });
}

function editSleepSheet(ctx, ev) {
  const p = ev.payload || {};
  const minutes = p.durationSec ? Math.round(p.durationSec / 60) : 0;
  const dur = el("input", { type: "number", inputmode: "numeric", value: minutes });
  const when = el("input", { type: "datetime-local", value: toLocal(ev.timestamp) });
  openSheet("Modifier le sommeil",
    el("div", {}, [field("Durée (min)", dur), field("Début", when), delButton(ctx, ev, "Supprimer ce sommeil ?")]),
    { onSave: async () => {
      await ctx.store.update("events", ev.id, { payload: { durationSec: (Number(dur.value) || 0) * 60 }, timestamp: fromLocal(when.value) });
      closeSheet(); toast("Sommeil modifié");
    } });
}

const EDITORS = { feeding: editFeedSheet, hydration: editHydrationSheet, diaper: editDiaperSheet, sleep: editSleepSheet };

// ---------- Résumé du jour ----------
function daySummary(events) {
  const today = events.filter((e) => new Date(e.timestamp).toDateString() === new Date().toDateString());
  const feeds = today.filter((e) => e.type === "feeding" && !(e.payload && e.payload.ongoing));
  const ml = feeds.reduce((sum, f) => sum + (f.payload?.volumeMl || 0), 0);
  const diapers = today.filter((e) => e.type === "diaper").length;
  const sleepSec = today.filter((e) => e.type === "sleep").reduce((sum, e) => sum + (e.payload?.durationSec || 0), 0);
  return { feeds: feeds.length, ml, diapers, sleepSec };
}
function statCell(emoName, val, label) {
  return el("div", { class: "stat" }, [
    el("div", { class: "stat-ic" }, emoji(emoName)),
    el("div", { class: "stat-val" }, val),
    el("div", { class: "stat-lab" }, label),
  ]);
}

// ============================================================
//  Feuilles de saisie
// ============================================================

function commonFields(ctx) {
  const cg = caregiverToggle(ctx.caregiver);
  const when = el("input", { type: "datetime-local", value: nowLocal() });
  return {
    node: el("div", {}, [field("Qui ?", cg.node), field("Quand ?", when)]),
    read: () => ({ created_by: cg.get(), timestamp: fromLocal(when.value) }),
  };
}

function sheetFeeding(ctx, forceKind) {
  let kind = forceKind || "sein";
  const seg = segmented([{ id: "sein", label: "Sein" }, { id: "biberon", label: "Biberon" }], kind, (v) => { kind = v; toggle(); });
  const side = segmented([{ id: "gauche", label: "Gauche" }, { id: "droite", label: "Droite" }], "gauche");
  const minLabel = el("label", {}, "Durée : 15 min");
  const range = el("input", { type: "range", min: 1, max: 45, value: 15,
    oninput: () => (minLabel.textContent = `Durée : ${range.value} min`) });
  const seinBox = el("div", {}, [field("Côté", side.node), el("div", { class: "field" }, [minLabel, range])]);
  const vol = el("input", { type: "number", inputmode: "numeric", placeholder: "120" });
  const bibBox = field("Volume (ml)", vol);
  const common = commonFields(ctx);

  function toggle() { seinBox.style.display = kind === "sein" ? "" : "none"; bibBox.style.display = kind === "biberon" ? "" : "none"; }
  const content = el("div", {}, [field("Type", seg.node), seinBox, bibBox, common.node]);
  toggle();

  openSheet("Tétée", content, { onSave: async () => {
    const base = common.read();
    const payload = kind === "sein"
      ? { kind: "sein", side: side.get(), durationSec: Number(range.value) * 60 }
      : { kind: "biberon", volumeMl: Number(vol.value) || null };
    await ctx.store.insert("events", { id: uuid(), type: "feeding", ...base, payload, note: null });
    const woke = await endOngoingSleep(ctx, base.timestamp); // un repas réveille le bébé
    closeSheet(); toast(woke ? "Repas enregistré · sommeil terminé" : (kind === "biberon" ? "Biberon enregistré" : "Tétée enregistrée"));
  }});
}

function sheetHydration(ctx) {
  const product = el("input", { type: "text", value: "Adiaryl" });
  const vol = el("input", { type: "number", inputmode: "numeric", value: "30" });
  const common = commonFields(ctx);
  const content = el("div", {}, [field("Produit", product), field("Volume (ml)", vol), common.node]);
  openSheet("Hydratation", content, { onSave: async () => {
    await ctx.store.insert("events", { id: uuid(), type: "hydration", ...common.read(),
      payload: { product: product.value || "Adiaryl", volumeMl: Number(vol.value) || 0 }, note: null });
    closeSheet(); toast("Hydratation enregistrée");
  }});
}

function sheetDiaper(ctx) {
  let kind = "pipi";
  const seg = segmented([{ id: "pipi", label: "Pipi" }, { id: "caca", label: "Caca" }, { id: "mixte", label: "Mixte" }], kind,
    (v) => { kind = v; colorBox.style.display = v === "pipi" ? "none" : ""; });
  let color = "jaune";
  const swatches = STOOL_COLORS.map((c) => {
    const s = el("div", { class: "swatch" + (c.id === color ? " on" : "") }, [
      el("div", { class: "dot", style: `background:${c.hex}` }), el("span", {}, c.label)]);
    s.onclick = () => { color = c.id; [...colors.children].forEach((n, i) => n.className = "swatch" + (STOOL_COLORS[i].id === color ? " on" : "")); };
    return s;
  });
  const colors = el("div", { class: "colors" }, swatches);
  const colorBox = field("Couleur des selles", colors);
  colorBox.style.display = "none";
  const common = commonFields(ctx);
  const content = el("div", {}, [field("Type", seg.node), colorBox, common.node]);

  openSheet("Couche", content, { onSave: async () => {
    const base = common.read();
    await ctx.store.insert("events", { id: uuid(), type: "diaper", ...base,
      payload: { kind, stoolColor: kind === "pipi" ? null : color }, note: null });
    // Un caca (ou mixte) réveille le bébé : on termine un sommeil en cours.
    const woke = (kind === "caca" || kind === "mixte") ? await endOngoingSleep(ctx, base.timestamp) : false;
    closeSheet(); toast(woke ? "Couche enregistrée · sommeil terminé" : "Couche enregistrée");
  }});
}

// ---------- dates input local ----------
function nowLocal() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
function fromLocal(v) { return v ? new Date(v).toISOString() : new Date().toISOString(); }
function toLocal(iso) {
  const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
