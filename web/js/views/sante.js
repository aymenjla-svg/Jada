import { el, openSheet, closeSheet, toast, field, segmented } from "../ui.js";
import { uuid, fmtDay, fmtFull } from "../data.js";
import { emoji } from "../icons.js";
import { stockSection } from "./stock.js";

export function renderSante(ctx) {
  const { cache } = ctx;
  const vaccines = [...cache.vaccines].sort((a, b) => a.months - b.months);
  const appts = [...cache.appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
  const measures = [...cache.measurements].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const nextVaccine = vaccines.filter((v) => !v.done_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
  const nextAppt = appts.filter((a) => new Date(a.date) >= new Date())[0];

  // --- Échéances ---
  const ech = el("div", { class: "card" });
  if (nextVaccine) ech.appendChild(echeance("vaccin", "sleep", nextVaccine.name,
    nextVaccine.due_date ? "Vers " + fmtFull(nextVaccine.due_date) : `Vers ${nextVaccine.months} mois`));
  if (nextAppt) ech.appendChild(echeance("steto", "feed", nextAppt.title,
    fmtFull(nextAppt.date) + (nextAppt.practitioner ? " · " + nextAppt.practitioner : "")));
  if (!nextVaccine && !nextAppt) ech.appendChild(el("div", { class: "empty" }, "Aucune échéance à venir."));

  // --- Courbe ---
  const growth = el("div", { class: "card" }, growthCard(measures));

  // --- Vaccins ---
  const vacCard = el("div", { class: "card tight" });
  vaccines.forEach((v) => {
    const row = el("div", { class: "vaccine" + (v.done_date ? " done" : "") }, [
      el("div", { class: "check" }, v.done_date ? "☑" : "☐"),
      el("div", {}, [
        el("div", { class: "name" }, v.name),
        el("div", { class: "when" }, v.done_date ? "Fait le " + fmtDay(v.done_date) : `Vers ${v.months} mois`),
      ]),
    ]);
    row.onclick = async () => {
      await ctx.store.update("vaccines", v.id, { done_date: v.done_date ? null : new Date().toISOString() });
    };
    vacCard.appendChild(row);
  });

  // --- Historique ---
  const entries = [...cache.medical_entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const histNodes = entries.length
    ? entries.map((e) => el("div", { class: "card" }, [
        el("div", { style: "display:flex;justify-content:space-between;gap:10px" }, [
          el("div", { class: "t", style: "font-weight:500" }, e.title),
          el("div", { class: "when", style: "font-family:var(--font-mono);font-size:11px;color:var(--ink-2)" }, fmtDay(e.date)),
        ]),
        e.summary ? el("div", { class: "muted", style: "font-size:14px;margin-top:4px" }, e.summary) : null,
      ]))
    : [el("div", { class: "card" }, el("div", { class: "empty" }, "Aucune entrée. Notez la jaunisse, une analyse…"))];

  return el("div", { class: "screen active" }, [
    el("div", { class: "title-page" }, "Santé"),

    el("div", { class: "section-title" }, "Prochaines échéances"),
    ech,

    el("div", { class: "section-title" }, "Rendez-vous"),
    apptsCard(ctx, appts),
    addRow("Ajouter un rendez-vous", () => sheetAppointment(ctx)),

    ...stockSection(ctx),

    el("div", { class: "section-title" }, "Courbe de croissance"),
    growth,
    addRow("Ajouter une mensuration", () => sheetMeasurement(ctx)),

    el("div", { class: "section-title" }, "Calendrier vaccinal (FR)"),
    vacCard,

    el("div", { class: "section-title" }, "Historique médical"),
    ...histNodes,
    addRow("Ajouter à l'historique", () => sheetEntry(ctx)),

    el("div", { class: "disclaimer" },
      "JADA organise, archive et rappelle. Elle ne donne jamais de conseil médical : toute question de santé relève d'un professionnel."),
  ]);
}

function echeance(emoName, cat, title, sub) {
  return el("div", { class: "echeance" }, [
    el("div", { class: "avatar i-" + cat }, emoji(emoName)),
    el("div", {}, [el("div", { style: "font-weight:500" }, title), el("div", { class: "s", style: "font-size:13px;color:var(--ink-2)" }, sub)]),
  ]);
}

function addRow(label, onclick) {
  return el("div", { class: "row-add" }, [el("button", { class: "badge", onclick }, "＋ " + label)]);
}

// Liste complète des rendez-vous (à venir d'abord, puis passés), avec suppression.
function apptsCard(ctx, appts) {
  const card = el("div", { class: "card tight" });
  if (!appts.length) {
    card.appendChild(el("div", { class: "empty" }, "Aucun rendez-vous. Ajoutez-en un 👇"));
    return card;
  }
  const now = Date.now();
  const sorted = [...appts].sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = sorted.filter((a) => new Date(a.date).getTime() >= now);
  const past = sorted.filter((a) => new Date(a.date).getTime() < now).reverse();
  [...upcoming, ...past].forEach((a) => {
    const isPast = new Date(a.date).getTime() < now;
    const sub = [fmtFull(a.date), a.practitioner, a.location].filter(Boolean).join(" · ");
    const row = el("div", { class: "appt tappable" + (isPast ? " past" : "") }, [
      el("div", { class: "avatar i-feed" }, emoji("steto")),
      el("div", { style: "flex:1;min-width:0" }, [
        el("div", { style: "font-weight:500" }, a.title),
        el("div", { class: "appt-sub" }, sub),
      ]),
      el("div", { class: "appt-chevron" }, "›"),
    ]);
    row.onclick = () => sheetAppointment(ctx, a);
    card.appendChild(row);
  });
  return card;
}

// ---------- Courbe (SVG fait main) ----------
const METRICS = [
  { id: "weight", label: "Poids", unit: "kg", get: (m) => (m.weight_g ? m.weight_g / 1000 : null) },
  { id: "height", label: "Taille", unit: "cm", get: (m) => (m.height_mm ? m.height_mm / 10 : null) },
  { id: "head", label: "P. crânien", unit: "cm", get: (m) => (m.head_mm ? m.head_mm / 10 : null) },
];

function growthCard(measures) {
  let metric = METRICS[0];
  const seg = segmented(METRICS.map((m) => ({ id: m.id, label: m.label })), metric.id, (v) => {
    metric = METRICS.find((m) => m.id === v); draw();
  });
  const holder = el("div", {});
  function draw() {
    const pts = measures.map((m) => ({ x: new Date(m.timestamp).getTime(), y: metric.get(m) }))
      .filter((p) => p.y != null);
    holder.innerHTML = "";
    holder.appendChild(pts.length < 1 ? el("div", { class: "chart-empty" }, "Pas encore de mesure. Ajoutez une mensuration 👇")
      : chartSVG(pts, metric.unit));
  }
  draw();
  return [seg.node, el("div", { style: "height:12px" }), holder];
}

function chartSVG(pts, unit) {
  const W = 520, H = 200, pad = 30;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs) || minX + 1;
  const minY = Math.min(...ys) * 0.95, maxY = Math.max(...ys) * 1.05 || 1;
  const sx = (x) => pad + (maxX === minX ? W / 2 : ((x - minX) / (maxX - minX)) * (W - 2 * pad));
  const sy = (y) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const area = `${line} L${sx(maxX).toFixed(1)},${H - pad} L${sx(minX).toFixed(1)},${H - pad} Z`;
  const dots = pts.map((p) => `<circle class="pt" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="4"/>`).join("");

  // Dates sous l'axe des abscisses (premier, derniers, intermédiaires).
  const n = pts.length;
  const idxs = n <= 1 ? [0] : n <= 4 ? pts.map((_, i) => i)
    : [0, Math.round((n - 1) / 3), Math.round((n - 1) * 2 / 3), n - 1];
  const xlabels = [...new Set(idxs)].map((i) => {
    const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
    return `<text x="${sx(pts[i].x).toFixed(1)}" y="${H - 8}" font-size="11" fill="#9A7A92" text-anchor="${anchor}">${fmtDay(pts[i].x)}</text>`;
  }).join("");

  const wrap = el("div", { class: "chart" });
  wrap.innerHTML = `
  <svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="areagrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#A98AD6" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#A98AD6" stop-opacity="0"/></linearGradient></defs>
    <line class="axis" x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}"/>
    <path class="area" d="${area}"/>
    <path class="line" d="${line}"/>
    ${dots}
    <text x="${pad}" y="16" font-size="12" fill="#9A7A92">${unit}</text>
    ${xlabels}
  </svg>`;
  return wrap;
}

// ============================================================
//  Feuilles d'ajout
// ============================================================

function nowLocal(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
const dateLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Création (existing=null) OU détails + modification d'un rendez-vous.
function sheetAppointment(ctx, existing = null) {
  const title = el("input", { type: "text", placeholder: "Visite des 4 mois", value: existing?.title || "" });
  const prac = el("input", { type: "text", placeholder: "Dr Martin", value: existing?.practitioner || "" });
  const loc = el("input", { type: "text", placeholder: "Cabinet", value: existing?.location || "" });
  const date = el("input", { type: "datetime-local",
    value: existing ? toLocalDT(existing.date) : nowLocal(1) });
  const notes = el("textarea", { placeholder: "Notes (questions à poser, à apporter…)", value: existing?.notes || "" });

  const children = [field("Titre", title), field("Praticien", prac), field("Lieu", loc),
                    field("Date", date), field("Notes", notes)];

  if (existing) {
    children.push(el("button", { class: "sheet-secondary", style: "color:#c0392b;margin-top:8px",
      onclick: async () => {
        if (confirm(`Supprimer le rendez-vous « ${existing.title} » ?`)) {
          await ctx.store.remove("appointments", existing.id); closeSheet(); toast("RDV supprimé");
        }
      } }, "🗑 Supprimer ce rendez-vous"));
  }

  openSheet(existing ? "Rendez-vous" : "Nouveau RDV", el("div", {}, children), { onSave: async () => {
    if (!title.value.trim()) return toast("Indiquez un titre");
    const data = {
      title: title.value.trim(), practitioner: prac.value, location: loc.value,
      notes: notes.value || null, date: new Date(date.value).toISOString(),
    };
    if (existing) {
      await ctx.store.update("appointments", existing.id, data);
      toast("RDV modifié");
    } else {
      await ctx.store.insert("appointments", { id: uuid(), ...data });
      toast("RDV ajouté");
    }
    closeSheet();
  }});
}

function toLocalDT(iso) {
  const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function sheetMeasurement(ctx) {
  const w = el("input", { type: "number", inputmode: "decimal", placeholder: "kg" });
  const h = el("input", { type: "number", inputmode: "decimal", placeholder: "cm" });
  const p = el("input", { type: "number", inputmode: "decimal", placeholder: "cm" });
  const date = el("input", { type: "date", value: dateLocal() });
  const content = el("div", {}, [field("Poids (kg)", w), field("Taille (cm)", h), field("Périmètre crânien (cm)", p), field("Date", date)]);
  openSheet("Mensuration", content, { onSave: async () => {
    const wg = parseFloat((w.value || "").replace(",", ".")), hc = parseFloat((h.value || "").replace(",", ".")), pc = parseFloat((p.value || "").replace(",", "."));
    if (!wg && !hc && !pc) return toast("Saisissez au moins une valeur");
    await ctx.store.insert("measurements", { id: uuid(), created_by: ctx.caregiver,
      timestamp: new Date(date.value).toISOString(),
      weight_g: wg ? Math.round(wg * 1000) : null, height_mm: hc ? Math.round(hc * 10) : null, head_mm: pc ? Math.round(pc * 10) : null });
    closeSheet(); toast("Mensuration ajoutée");
  }});
}

function sheetEntry(ctx) {
  const title = el("input", { type: "text", placeholder: "Jaunisse" });
  const date = el("input", { type: "date", value: dateLocal() });
  const summary = el("textarea", { placeholder: "Observations…" });
  const content = el("div", {}, [field("Titre", title), field("Date", date), field("Détail", summary)]);
  openSheet("Historique", content, { onSave: async () => {
    if (!title.value.trim()) return toast("Indiquez un titre");
    await ctx.store.insert("medical_entries", { id: uuid(), title: title.value.trim(),
      date: new Date(date.value).toISOString(), summary: summary.value });
    closeSheet(); toast("Entrée ajoutée");
  }});
}
