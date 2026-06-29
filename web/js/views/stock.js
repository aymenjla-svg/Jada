// Stock de lait maternel exprimé : réserves au frigo / congélateur, péremption
// indicative, et consommation. JADA range et rappelle — pas de conseil médical.
import { el, openSheet, closeSheet, toast, field, segmented } from "../ui.js";
import { uuid, fmtDay, fmtFull } from "../data.js";
import { emoji } from "../icons.js";

// Durées de conservation INDICATIVES (hygiène alimentaire usuelle, pas un avis médical).
const STORAGE = {
  frigo:  { label: "Frigo",        days: 4 },
  congel: { label: "Congélateur",  days: 180 },
};

const DAY = 86400000;
const expiresAt = (b) => new Date(b.expressed_at).getTime() + (STORAGE[b.storage]?.days || 4) * DAY;
const dispo = (s) => (s || []).filter((b) => b.status === "dispo");

function nowLocal() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
const fromLocal = (v) => (v ? new Date(v).toISOString() : new Date().toISOString());
const toLocal = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

// Étiquette de péremption + classe d'état (ok / warn / bad).
function expiryInfo(b) {
  const left = expiresAt(b) - Date.now();
  const days = Math.ceil(left / DAY);
  if (left <= 0) return { cls: "bad", text: "Périmé" };
  if (days <= 1) return { cls: "warn", text: "Aujourd'hui" };
  if (days <= 3) return { cls: "warn", text: `Dans ${days} j` };
  return { cls: "ok", text: fmtDay(expiresAt(b)) };
}

// Insère un lot dans le stock (appelé aussi depuis la feuille tire-lait).
export async function addMilkToStock(ctx, { volumeMl, expressedAtISO, storage = "frigo" }) {
  if (!volumeMl) return;
  await ctx.store.insert("milk_stock", {
    id: uuid(), expressed_at: expressedAtISO || new Date().toISOString(),
    volume_ml: Math.round(volumeMl), storage, status: "dispo", used_at: null,
    note: null, created_by: ctx.caregiver,
  });
}

// Section à insérer dans l'onglet Santé : total + lots disponibles + bouton d'ajout.
export function stockSection(ctx) {
  const lots = dispo(ctx.cache.milk_stock).sort((a, b) => expiresAt(a) - expiresAt(b)); // périme en premier
  const totalMl = lots.reduce((s, b) => s + (b.volume_ml || 0), 0);
  const frigoMl = lots.filter((b) => b.storage === "frigo").reduce((s, b) => s + b.volume_ml, 0);
  const congelMl = lots.filter((b) => b.storage === "congel").reduce((s, b) => s + b.volume_ml, 0);

  const head = el("div", { class: "stock-head" }, [
    el("div", { class: "stock-total" }, [
      el("span", { class: "st-val" }, totalMl + " ml"),
      el("span", { class: "st-lab" }, lots.length + (lots.length > 1 ? " lots dispo" : " lot dispo")),
    ]),
    el("div", { class: "stock-split" }, [
      el("span", {}, `❄️ ${frigoMl} ml`),
      el("span", {}, `🧊 ${congelMl} ml`),
    ]),
  ]);

  const card = el("div", { class: "card tight" });
  card.appendChild(head);
  if (!lots.length) {
    card.appendChild(el("div", { class: "empty" }, "Aucune réserve. Ajoutez du lait exprimé 👇"));
  } else {
    lots.forEach((b) => {
      const inf = expiryInfo(b);
      const row = el("div", { class: "milk-row tappable" }, [
        el("div", { class: "avatar i-pump" }, emoji("lait")),
        el("div", { style: "flex:1;min-width:0" }, [
          el("div", { style: "font-weight:600" }, `${b.volume_ml} ml · ${STORAGE[b.storage]?.label || ""}`),
          el("div", { class: "milk-sub" }, "Exprimé le " + fmtFull(b.expressed_at)),
        ]),
        el("div", { class: "milk-pill " + inf.cls }, inf.text),
      ]);
      row.onclick = () => sheetMilk(ctx, b);
      card.appendChild(row);
    });
  }

  return [
    el("div", { class: "section-title" }, "Stock de lait maternel"),
    card,
    el("div", { class: "row-add" }, [el("button", { class: "badge", onclick: () => sheetMilk(ctx) }, "＋ Ajouter du lait au stock")]),
  ];
}

// Feuille d'ajout (existing=null) ou de gestion d'un lot.
function sheetMilk(ctx, existing = null) {
  const vol = el("input", { type: "number", inputmode: "numeric", placeholder: "120", value: existing?.volume_ml || "" });
  const store = segmented(
    [{ id: "frigo", label: "Frigo (≈4 j)" }, { id: "congel", label: "Congél. (≈6 mois)" }],
    existing?.storage || "frigo"
  );
  const when = el("input", { type: "datetime-local", value: existing ? toLocal(existing.expressed_at) : nowLocal() });

  const children = [
    field("Volume (ml)", vol),
    field("Conservation", store.node),
    field("Exprimé le", when),
  ];

  if (existing) {
    const usedBtn = el("button", { class: "sheet-secondary", onclick: async () => {
      await ctx.store.update("milk_stock", existing.id, { status: "fini", used_at: new Date().toISOString() });
      closeSheet(); toast("Lot marqué comme utilisé");
    } }, "✓ Marquer comme utilisé");
    const trashBtn = el("button", { class: "sheet-secondary", onclick: async () => {
      await ctx.store.update("milk_stock", existing.id, { status: "jete", used_at: new Date().toISOString() });
      closeSheet(); toast("Lot jeté");
    } }, "♻️ Jeter (périmé)");
    const delBtn = el("button", { class: "sheet-secondary", style: "color:#c0392b", onclick: async () => {
      if (confirm("Supprimer définitivement ce lot ?")) { await ctx.store.remove("milk_stock", existing.id); closeSheet(); toast("Lot supprimé"); }
    } }, "🗑 Supprimer");
    children.push(el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:6px" }, [usedBtn, trashBtn, delBtn]));
  }

  openSheet(existing ? "Lot de lait" : "Ajouter au stock", el("div", {}, children), {
    onSave: async () => {
      const v = Number(vol.value) || 0;
      if (!v) return toast("Indiquez un volume");
      const data = { volume_ml: Math.round(v), storage: store.get(), expressed_at: fromLocal(when.value) };
      if (existing) { await ctx.store.update("milk_stock", existing.id, data); toast("Lot modifié"); }
      else { await ctx.store.insert("milk_stock", { id: uuid(), status: "dispo", used_at: null, note: null, created_by: ctx.caregiver, ...data }); toast("Ajouté au stock"); }
      closeSheet();
    },
  });
}
