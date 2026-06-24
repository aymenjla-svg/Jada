import { SYNC_ENABLED } from "./config.js";
import { createStore, getSupabaseClient } from "./db.js";
import { buildVaccines, uuid } from "./data.js";
import { el, clear, toast } from "./ui.js";
import { renderMaman } from "./views/maman.js";
import { renderSante } from "./views/sante.js";
import { welcomeSound } from "./sound.js";

const root = () => document.getElementById("root");

const ctx = {
  store: null,
  caregiver: localStorage.getItem("jada:caregiver") || "maman",
  tab: "maman",
  cache: { child: null, events: [], measurements: [], vaccines: [], appointments: [], medical_entries: [] },
  setCaregiver(v) { ctx.caregiver = v; localStorage.setItem("jada:caregiver", v); render(); },
};

// ----------------------------------------------------------------
//  Démarrage
// ----------------------------------------------------------------
async function boot() {
  registerSW();
  welcomeSound();

  if (SYNC_ENABLED) {
    const ok = await ensureAuth();
    if (!ok) return; // l'écran de connexion est affiché
  }

  ctx.store = await createStore();
  ctx.store.onChange(refresh);
  await refresh();
}

async function refresh() {
  const s = ctx.store;
  const [child, events, measurements, vaccines, appointments, medical_entries] = await Promise.all([
    s.getChild(), s.list("events"), s.list("measurements"),
    s.list("vaccines"), s.list("appointments"), s.list("medical_entries"),
  ]);
  ctx.cache = { child, events, measurements, vaccines, appointments, medical_entries };
  render();
}

// ----------------------------------------------------------------
//  Rendu
// ----------------------------------------------------------------
function render() {
  const r = root();
  clear(r);

  if (!ctx.cache.child) { r.appendChild(onboarding()); return; }

  r.appendChild(ctx.tab === "maman" ? renderMaman(ctx) : renderSante(ctx));
  r.appendChild(tabbar());
}

function tabbar() {
  const make = (id, ic, label) => {
    const b = el("button", { class: "tab" + (ctx.tab === id ? " active" : "") }, [
      el("div", { class: "ti" }, ic), el("div", {}, label)]);
    b.onclick = () => { ctx.tab = id; render(); scrollTo(0, 0); };
    return b;
  };
  return el("div", { class: "tabbar" }, [
    make("maman", "🤱", "Maman"),
    make("sante", "🩺", "Santé"),
  ]);
}

// ----------------------------------------------------------------
//  Onboarding (création de l'enfant + calendrier vaccinal FR)
// ----------------------------------------------------------------
function onboarding() {
  const name = el("input", { type: "text", value: "Jade" });
  const birth = el("input", { type: "date", value: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) });
  const weight = el("input", { type: "number", inputmode: "numeric", placeholder: "3240" });
  const height = el("input", { type: "number", inputmode: "numeric", placeholder: "495" });

  const btn = el("button", { class: "btn-primary" }, "Commencer ✨");
  btn.onclick = async () => {
    if (!name.value.trim()) return toast("Indiquez un prénom");
    const child = {
      id: uuid(), name: name.value.trim(), birth_date: new Date(birth.value).toISOString(),
      birth_weight_g: Number(weight.value) || null, birth_height_mm: Number(height.value) || null,
    };
    await ctx.store.setChild(child);
    await ctx.store.insertMany("vaccines", buildVaccines(child.birth_date));
    await refresh();
  };

  return el("div", { class: "auth" }, [
    el("img", { class: "logo-img", src: "icons/logo.png", alt: "JADA" }),
    el("div", { class: "tag" }, "Le quotidien de votre bébé, à deux."),
    el("div", { class: "card" }, [
      f("Prénom", name), f("Date de naissance", birth),
      el("div", { style: "display:flex;gap:10px" }, [f("Poids (g)", weight), f("Taille (mm)", height)]),
    ]),
    el("div", { style: "height:18px" }), btn,
    SYNC_ENABLED ? el("div", { class: "auth toggle", style: "margin-top:18px" },
      [el("button", { class: "btn-link", onclick: signOut }, "Se déconnecter")]) : null,
  ]);

  function f(label, input) { return el("div", { class: "field" }, [el("label", {}, label), input]); }
}

// ----------------------------------------------------------------
//  Connexion (uniquement en mode synchro)
// ----------------------------------------------------------------
async function ensureAuth() {
  const sb = await getSupabaseClient();
  const { data: { session } } = await sb.auth.getSession();
  if (session) return true;
  showAuthScreen(sb);
  sb.auth.onAuthStateChange((_e, s) => { if (s) boot(); });
  return false;
}

function showAuthScreen(sb) {
  let mode = "in"; // in | up
  const email = el("input", { type: "email", placeholder: "email", autocomplete: "email" });
  const pass = el("input", { type: "password", placeholder: "mot de passe", autocomplete: "current-password" });
  const msg = el("div", { class: "muted", style: "font-size:13px;margin-top:10px;min-height:18px" });
  const btn = el("button", { class: "btn-primary" }, "Se connecter");
  const toggle = el("button", { class: "btn-link" }, "Créer un compte");

  btn.onclick = async () => {
    msg.textContent = "…";
    const args = { email: email.value.trim(), password: pass.value };
    if (mode === "in") {
      const { error } = await sb.auth.signInWithPassword(args);
      if (error) { msg.textContent = traduire(error.message); return; }
      msg.textContent = "Connexion…";
    } else {
      const { data, error } = await sb.auth.signUp(args);
      if (error) { msg.textContent = traduire(error.message); return; }
      if (!data.session) {
        // Confirmation par email activée : on bascule en mode connexion.
        msg.textContent = "Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.";
        mode = "in";
        btn.textContent = "Se connecter";
        toggle.textContent = "Créer un compte";
      } else {
        msg.textContent = "Compte créé. Connexion…";
      }
    }
  };
  toggle.onclick = () => {
    mode = mode === "in" ? "up" : "in";
    btn.textContent = mode === "in" ? "Se connecter" : "Créer un compte";
    toggle.textContent = mode === "in" ? "Créer un compte" : "J'ai déjà un compte";
    msg.textContent = "";
  };

  clear(root());
  root().appendChild(el("div", { class: "auth" }, [
    el("img", { class: "logo-img", src: "icons/logo.png", alt: "JADA" }),
    el("div", { class: "tag" }, "Connectez-vous pour retrouver vos données partagées."),
    el("div", { class: "card" }, [
      el("div", { class: "field" }, [el("label", {}, "Email"), email]),
      el("div", { class: "field" }, [el("label", {}, "Mot de passe"), pass]),
      btn, msg,
    ]),
    el("div", { class: "toggle" }, toggle),
  ]));
}

async function signOut() {
  const sb = await getSupabaseClient();
  await sb.auth.signOut();
  location.reload();
}

function traduire(m) {
  if (/Invalid login/i.test(m)) return "Email ou mot de passe incorrect.";
  if (/already registered/i.test(m)) return "Ce compte existe déjà — connectez-vous.";
  if (/at least 6/i.test(m)) return "Mot de passe : 6 caractères minimum.";
  if (/signups? not allowed|disabled/i.test(m)) return "Les inscriptions sont fermées (accès réservé à la famille).";
  return m;
}

// ----------------------------------------------------------------
//  Service worker (mode appli / hors-ligne)
// ----------------------------------------------------------------
function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  // Si une version est déjà installée, on rechargera automatiquement
  // dès qu'une nouvelle version prend la main (plus de version figée).
  if (navigator.serviceWorker.controller) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }

  navigator.serviceWorker.register("sw.js").then((reg) => {
    reg.update();
    // Revérifie à chaque retour dans l'app.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update();
    });
  }).catch(() => {});
}

boot();
