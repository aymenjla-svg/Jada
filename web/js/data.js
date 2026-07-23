// Données de référence + helpers (calendrier vaccinal FR, formatage).

export const CAREGIVERS = {
  maman: { id: "maman", label: "Maman" },
  papa:  { id: "papa",  label: "Papa" },
  tata:  { id: "tata",  label: "Tata" },
};

// Ordre d'affichage / de bascule (badge « Qui suis-je ? »).
export const CAREGIVER_IDS = Object.keys(CAREGIVERS);

// Libellé d'un soignant à partir de son id (repli sur Maman si inconnu).
export const caregiverLabel = (id) => (CAREGIVERS[id]?.label || CAREGIVERS.maman.label);

export const STOOL_COLORS = [
  { id: "jaune",  label: "Jaune",  hex: "#E9C46A" },
  { id: "marron", label: "Marron", hex: "#8B5E3C" },
  { id: "vert",   label: "Vert",   hex: "#6A994E" },
  { id: "noir",   label: "Noir",   hex: "#2B2B2B" },
  { id: "blanc",  label: "Blanc",  hex: "#F0EAD6" },
  { id: "rouge",  label: "Rouge",  hex: "#C1413B" },
];

// Calendrier vaccinal français (nourrisson). JADA range et rappelle,
// elle ne donne aucun conseil médical.
export const FR_VACCINES = [
  { name: "DTP-Coq-Hib-Hép B (1re dose)", months: 2,  detail: "Diphtérie, tétanos, polio, coqueluche, Hib, hépatite B" },
  { name: "Pneumocoque (1re dose)",        months: 2,  detail: "Infections à pneumocoque" },
  { name: "Méningocoque B",                months: 3,  detail: "Infections à méningocoque B" },
  { name: "DTP-Coq-Hib-Hép B (2e dose)",   months: 4,  detail: "Diphtérie, tétanos, polio, coqueluche, Hib, hépatite B" },
  { name: "Pneumocoque (2e dose)",         months: 4,  detail: "Infections à pneumocoque" },
  { name: "Méningocoque C",                months: 5,  detail: "Infections à méningocoque C" },
  { name: "DTP-Coq-Hib-Hép B (rappel)",    months: 11, detail: "Rappel hexavalent" },
  { name: "Pneumocoque (rappel)",          months: 11, detail: "Rappel pneumocoque" },
  { name: "Méningocoque C (rappel)",       months: 12, detail: "Rappel méningocoque C" },
  { name: "ROR (1re dose)",                months: 12, detail: "Rougeole, oreillons, rubéole" },
  { name: "ROR (2e dose)",                 months: 16, detail: "Rougeole, oreillons, rubéole" },
];

export function buildVaccines(birthISO) {
  const birth = new Date(birthISO);
  return FR_VACCINES.map((v) => {
    const due = new Date(birth);
    due.setMonth(due.getMonth() + v.months);
    return {
      id: uuid(),
      name: v.name,
      months: v.months,
      detail: v.detail,
      due_date: due.toISOString(),
      done_date: null,
    };
  });
}

// ---------- IDs ----------
export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---------- Formatage (FR) ----------
const fTime = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const fDay  = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const fFull = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export const fmtTime = (d) => fTime.format(new Date(d));
export const fmtDay  = (d) => fDay.format(new Date(d));
export const fmtFull = (d) => fFull.format(new Date(d));

export function fmtElapsed(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m} min`;
}

export function relative(d) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d)) / 1000));
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `il y a ${h} h ${m % 60}` : `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export function ageDescription(birthISO) {
  const days = Math.floor((Date.now() - new Date(birthISO)) / 86400000);
  if (days < 31) return `${days} j`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months} mois`;
  return `${Math.floor(months / 12)} ans`;
}
