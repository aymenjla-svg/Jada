import { el, openSheet, closeSheet, toast, field } from "../ui.js";
import { uuid, fmtFull, fmtDay } from "../data.js";

const cg = (id) => (id === "papa" ? "Papa" : "Maman");
const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function renderAlbum(ctx) {
  const photos = [...(ctx.cache.daily_photos || [])].sort((a, b) => new Date(b.day) - new Date(a.day));
  const t = todayISO();
  const todayPhoto = photos.find((p) => p.day === t);

  const fileInput = el("input", { type: "file", accept: "image/*", style: "display:none",
    onchange: (e) => handleFile(ctx, e.target.files[0]) });

  // Photo du jour
  const featured = el("div", { class: "card album-featured" });
  if (todayPhoto) {
    featured.appendChild(photoImg(ctx, todayPhoto, "album-hero"));
    if (todayPhoto.caption) featured.appendChild(el("div", { class: "album-cap" }, todayPhoto.caption));
    featured.appendChild(el("div", { class: "pill", style: "display:block;text-align:center;margin-top:8px" },
      fmtFull(todayPhoto.day) + " · par " + cg(todayPhoto.created_by)));
  } else {
    featured.appendChild(el("div", { class: "album-empty" }, [
      el("div", { style: "font-size:42px" }, "📷"),
      el("div", { class: "muted", style: "margin-top:6px" }, "Pas encore de photo aujourd'hui"),
    ]));
  }

  const addBtn = el("button", { class: "btn-primary", style: "margin-top:12px", onclick: () => fileInput.click() },
    "📸 Ajouter la photo du jour");

  // Calendrier-vignettes (une par jour)
  const grid = el("div", { class: "album-grid" });
  const byDay = {};
  photos.forEach((p) => { if (!byDay[p.day]) byDay[p.day] = p; });
  const days = Object.values(byDay).sort((a, b) => new Date(b.day) - new Date(a.day));
  if (!days.length) {
    grid.appendChild(el("div", { class: "empty" }, "Vos souvenirs apparaîtront ici, jour après jour."));
  } else {
    days.forEach((p) => {
      const cell = el("div", { class: "album-cell" }, [
        photoImg(ctx, p, "album-thumb"),
        el("div", { class: "album-date" }, fmtDay(p.day)),
      ]);
      cell.onclick = () => openPhoto(ctx, p);
      grid.appendChild(cell);
    });
  }

  return el("div", { class: "screen active" }, [
    el("div", { class: "title-page" }, "Album"),
    el("div", { class: "section-title" }, "Photo du jour"),
    featured,
    addBtn, fileInput,
    el("div", { class: "section-title" }, "Souvenirs"),
    grid,
  ]);
}

function photoImg(ctx, p, cls) {
  const img = el("img", { class: cls, alt: "photo", loading: "lazy" });
  if (p.data) img.src = p.data;
  else if (p.path) ctx.store.imageURL(p.path).then((u) => { if (u) img.src = u; });
  return img;
}

function openPhoto(ctx, p) {
  const cap = el("input", { type: "text", placeholder: "Légende…", value: p.caption || "" });
  const del = el("button", { class: "sheet-secondary", style: "color:#c0392b;margin-top:8px",
    onclick: async () => {
      if (confirm("Supprimer cette photo ?")) {
        if (p.path) await ctx.store.deleteImage(p.path);
        await ctx.store.remove("daily_photos", p.id);
        closeSheet(); toast("Photo supprimée");
      }
    } }, "🗑 Supprimer");
  openSheet(fmtFull(p.day), el("div", {}, [photoImg(ctx, p, "album-hero"), field("Légende", cap), del]), {
    onSave: async () => { await ctx.store.update("daily_photos", p.id, { caption: cap.value || null }); closeSheet(); toast("Enregistré"); },
  });
}

async function handleFile(ctx, file) {
  if (!file) return;
  toast("Ajout de la photo…");
  try {
    const blob = await compress(file, 1280, 0.72);
    const row = { id: uuid(), day: todayISO(), caption: null, featured: true, created_by: ctx.caregiver, path: null, data: null };
    if (ctx.store.mode === "cloud") row.path = await ctx.store.uploadImage(blob);
    else row.data = await blobToDataURL(blob);
    await ctx.store.insert("daily_photos", row);
    toast("Photo ajoutée ✨");
  } catch (e) {
    console.error(e);
    toast("Échec de l'ajout (réessaie)");
  }
}

// Redimensionne/compresse l'image avant envoi (plus léger, plus rapide).
function compress(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale); height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress"))), "image/jpeg", quality);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function blobToDataURL(blob) {
  return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
}
