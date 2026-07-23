// Helpers d'interface partagés.

import { CAREGIVERS } from "./data.js";

// Crée un élément : el("div", {class:"card"}, [child, "texte"])
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

// ---------- Anneau SVG « temps depuis la dernière tétée » ----------
export function ringSVG(progress) {
  const r = 112, c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));
  return `
  <svg viewBox="0 0 240 240" aria-hidden="true">
    <defs>
      <linearGradient id="ringgrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F7B8C8"/>
        <stop offset="50%" stop-color="#E8A0D6"/>
        <stop offset="100%" stop-color="#7D6AD0"/>
      </linearGradient>
    </defs>
    <circle class="track" cx="120" cy="120" r="${r}"></circle>
    <circle class="progress" cx="120" cy="120" r="${r}"
      stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
  </svg>`;
}

// ---------- Modale (sheet) ----------
const backdrop = () => document.getElementById("sheet-backdrop");
const sheetEl = () => document.getElementById("sheet");

export function openSheet(title, contentNode, { onSave, saveLabel = "Enregistrer" } = {}) {
  const s = sheetEl();
  clear(s);
  s.appendChild(el("div", { class: "grabber" }));
  s.appendChild(el("h2", {}, title));
  s.appendChild(contentNode);
  const actions = el("div", { class: "sheet-actions" }, [
    el("button", { class: "cancel", onclick: closeSheet }, "Annuler"),
    el("button", { class: "btn-primary", onclick: () => { if (onSave) onSave(); } }, saveLabel),
  ]);
  s.appendChild(actions);
  backdrop().classList.add("open");
  requestAnimationFrame(() => s.classList.add("open"));
  backdrop().onclick = closeSheet;
}

export function closeSheet() {
  sheetEl().classList.remove("open");
  backdrop().classList.remove("open");
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- Champs de formulaire ----------
export function field(label, control) {
  return el("div", { class: "field" }, [el("label", {}, label), control]);
}

// Segmented control. options=[{id,label}], renvoie {node, get()}
export function segmented(options, initial, onChange) {
  let value = initial;
  const buttons = options.map((o) =>
    el("button", { class: o.id === value ? "on" : "", type: "button",
      onclick: () => { value = o.id; render(); onChange && onChange(value); } }, o.label));
  const node = el("div", { class: "seg" }, buttons);
  function render() { buttons.forEach((b, i) => b.className = options[i].id === value ? "on" : ""); }
  return { node, get: () => value };
}

export function caregiverToggle(initial) {
  const options = Object.values(CAREGIVERS).map((c) => ({ id: c.id, label: c.label }));
  return segmented(options, initial);
}
