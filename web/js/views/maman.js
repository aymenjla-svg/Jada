import { el, ringSVG, openSheet, closeSheet, toast, field, segmented, caregiverToggle } from "../ui.js";
import { uuid, fmtTime, fmtElapsed, relative, ageDescription, STOOL_COLORS } from "../data.js";
import { openWelcomeSheet } from "../welcome.js";

const REF_INTERVAL = 3 * 3600 * 1000; // 3 h de référence pour remplir l'anneau

// Décrit un événement (icône, libellé, couleur).
function describe(e) {
  const p = e.payload || {};
  if (e.type === "feeding") {
    if (p.kind === "biberon") return { ic: "🍼", tint: "pink", text: `Biberon${p.volumeMl ? ` · ${p.volumeMl} ml` : ""}` };
    const side = p.side === "gauche" ? " G" : p.side === "droite" ? " D" : "";
    const dur = p.durationSec ? ` · ${Math.round(p.durationSec / 60)} min` : "";
    return { ic: "🤱", tint: "pink", text: `Tétée${side}${dur}` };
  }
  if (e.type === "hydration") return { ic: "💧", tint: "water", text: `${p.product || "Adiaryl"} · ${p.volumeMl} ml` };
  if (e.type === "diaper") {
    const k = p.kind === "caca" ? "Caca" : p.kind === "mixte" ? "Mixte" : "Pipi";
    const col = p.stoolColor ? ` · ${p.stoolColor}` : "";
    return { ic: p.kind === "pipi" ? "💦" : "💩", tint: "lav", text: `Couche ${k.toLowerCase()}${col}` };
  }
  return { ic: "•", tint: "plum", text: e.type };
}

export function renderMaman(ctx) {
  const { cache } = ctx;
  const child = cache.child;
  const feeds = cache.events.filter((e) => e.type === "feeding").sort(byTimeDesc);
  const all = [...cache.events].sort(byTimeDesc);
  const lastFeed = feeds[0];

  // Anneau
  const elapsed = lastFeed ? Date.now() - new Date(lastFeed.timestamp) : 0;
  const progress = lastFeed ? elapsed / REF_INTERVAL : 0;

  const ring = el("div", { class: "ring", html: ringSVG(progress) });
  ring.appendChild(el("div", { class: "center" }, [
    el("div", { class: "label" }, "Depuis la dernière tétée"),
    el("div", { class: "big" }, lastFeed ? fmtElapsed(elapsed) : "—"),
    lastFeed ? el("div", { class: "sub" }, "à " + fmtTime(lastFeed.timestamp)) : null,
  ]));

  // Dernier événement
  const lastCard = el("div", { class: "card" });
  if (lastFeed) {
    const d = describe(lastFeed);
    lastCard.appendChild(el("div", { class: "last-row" }, [
      el("div", { class: "avatar " + d.tint }, d.ic),
      el("div", {}, [
        el("div", { class: "t" }, d.text),
        el("div", { class: "s" }, `${relative(lastFeed.timestamp)} · par ${cgLabel(lastFeed.created_by)}`),
      ]),
    ]));
  } else {
    lastCard.appendChild(el("div", { class: "empty" }, "Aucun événement encore. Loggez la première tétée 👇"));
  }

  // Grille d'actions
  const actions = el("div", { class: "card" }, [
    el("div", { class: "actions" }, [
      chip("🤱", "Tétée", "rgba(232,160,214,.18)", () => sheetFeeding(ctx)),
      chip("🍼", "Biberon", "rgba(232,160,214,.18)", () => sheetFeeding(ctx, "biberon")),
      chip("💧", "Hydrat.", "rgba(169,200,240,.20)", () => sheetHydration(ctx)),
      chip("💩", "Couche", "rgba(169,138,214,.16)", () => sheetDiaper(ctx)),
    ]),
  ]);

  // Fil du jour
  const list = el("div", { class: "card tight" });
  const today = all.filter(sameDay).slice(0, 30);
  if (!today.length) list.appendChild(el("div", { class: "empty" }, "Rien aujourd'hui."));
  else today.forEach((e) => {
    const d = describe(e);
    list.appendChild(el("div", { class: "event" }, [
      el("div", { class: "mini " + d.tint }, d.ic),
      el("div", {}, [el("div", { class: "t" }, d.text), el("div", { class: "by" }, "par " + cgLabel(e.created_by))]),
      el("div", { class: "time" }, fmtTime(e.timestamp)),
    ]));
  });

  return el("div", { class: "screen active" }, [
    el("div", { class: "screen-head" }, [
      el("div", { class: "hello" }, [
        el("div", { class: "hello-av" }, (child?.name || "B").trim().charAt(0).toUpperCase()),
        el("div", {}, [
          el("div", { class: "greeting" }, greeting()),
          el("div", { class: "name-row" }, [
            el("div", { class: "title-xl" }, child?.name || "Bébé"),
            el("span", { class: "name-heart" }, "💗"),
          ]),
        ]),
      ]),
      el("div", { style: "text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px" }, [
        el("div", { class: "age-pill" }, child ? "👶 " + ageDescription(child.birth_date) : ""),
        el("div", { style: "display:flex;align-items:center;gap:8px" }, [
          el("button", { class: "sound-btn", title: "Son d'accueil", onclick: () => openWelcomeSheet() }, "🔔"),
          caregiverBadge(ctx),
        ]),
      ]),
    ]),
    el("div", { class: "ring-wrap" }, ring),
    lastCard,
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
function chip(ic, cap, bg, onclick) {
  return el("button", { class: "chip", onclick }, [
    el("div", { class: "ic", style: `background:${bg}` }, ic),
    el("div", { class: "cap" }, cap),
  ]);
}

function caregiverBadge(ctx) {
  const b = el("button", { class: "badge" }, ["👤 " + cgLabel(ctx.caregiver)]);
  b.onclick = () => {
    ctx.setCaregiver(ctx.caregiver === "maman" ? "papa" : "maman");
    toast("Vous êtes : " + cgLabel(ctx.caregiver));
  };
  return b;
}

const cgLabel = (id) => (id === "papa" ? "Papa" : "Maman");
const byTimeDesc = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

// Salutation douce selon l'heure (la lune pour les tétées de nuit).
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Coucou 🌙";
  if (h < 12) return "Bonjour ☀️";
  if (h < 18) return "Coucou 🌸";
  return "Bonsoir 🌙";
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
    closeSheet(); toast("Tétée enregistrée");
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
    await ctx.store.insert("events", { id: uuid(), type: "diaper", ...common.read(),
      payload: { kind, stoolColor: kind === "pipi" ? null : color }, note: null });
    closeSheet(); toast("Couche enregistrée");
  }});
}

// ---------- dates input local ----------
function nowLocal() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
function fromLocal(v) { return v ? new Date(v).toISOString() : new Date().toISOString(); }
