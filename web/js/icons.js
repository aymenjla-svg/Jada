import { el } from "./ui.js";

// Jeu d'emojis Twemoji embarqué (web/emoji/*.svg) — rendu identique iPhone/Android.
const DIR = "emoji/";

export function emoji(name, cls = "emo") {
  return el("img", { class: cls, src: DIR + name + ".svg", alt: "", "aria-hidden": "true", loading: "lazy" });
}

// Couleur (catégorie) + emoji selon le type d'événement.
export function eventVisual(e) {
  const p = e.payload || {};
  if (e.type === "feeding") return p.kind === "biberon" ? { emo: "biberon", cat: "bot" } : { emo: "tetee", cat: "feed" };
  if (e.type === "hydration") return { emo: "eau", cat: "water" };
  if (e.type === "diaper") {
    const emo = p.kind === "caca" ? "caca" : p.kind === "mixte" ? "couche" : "pipi";
    return { emo, cat: "diap" };
  }
  if (e.type === "sleep") return { emo: "sommeil", cat: "sleep" };
  return { emo: "coeur", cat: "feed" };
}
