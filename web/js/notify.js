// Rappels JADA.
//  - NOTIFICATIONS (système) : uniquement repas > seuil et sommeil > seuil.
//  - Vaccin / RDV : affichés dans l'app (cartes), sans notification.
//  Le seuil est l'« intervalle » réglable (par défaut 3 h).

export function remindersOn() { return localStorage.getItem("jada:notify") === "on"; }
export function setRemindersOn(on) { localStorage.setItem("jada:notify", on ? "on" : "off"); }
export function feedIntervalH() {
  const v = parseFloat(localStorage.getItem("jada:feedInterval"));
  return isNaN(v) ? 3 : v;
}
export function setFeedIntervalH(h) { localStorage.setItem("jada:feedInterval", String(h)); }
// Seuil séparé pour le tire-lait (0 = désactivé : toutes les mamans ne tirent pas leur lait).
export function pumpIntervalH() {
  const v = parseFloat(localStorage.getItem("jada:pumpInterval"));
  return isNaN(v) ? 0 : v;
}
export function setPumpIntervalH(h) { localStorage.setItem("jada:pumpInterval", String(h)); }

export function notifSupported() { return "Notification" in window; }

export async function requestNotifPermission() {
  if (!notifSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}

function fire(stampId, title, body, key) {
  if (!notifSupported() || Notification.permission !== "granted") return;
  if (localStorage.getItem("jada:notified:" + key) === String(stampId)) return; // déjà notifié pour cet état
  localStorage.setItem("jada:notified:" + key, String(stampId));
  const opts = { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: key };
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, opts)).catch(() => {});
    } else {
      new Notification(title, opts);
    }
  } catch (e) {}
}

// Différence en jours de CALENDRIER (ignore l'heure) : aujourd'hui=0, demain=1…
function calDaysUntil(dateISO) {
  const a = new Date(dateISO), b = new Date();
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((da - db) / 86400000);
}
function hm(ms) {
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${String(m).padStart(2, "0")}`;
}
function dayWord(d) { return d <= 0 ? "aujourd'hui" : d === 1 ? "demain" : `dans ${d} j`; }

// Liste des rappels (affichage in-app). `notify:true` = déclenche une notification.
export function computeReminders(cache) {
  const out = [];
  const now = Date.now();
  const todayStr = new Date(now).toISOString().slice(0, 10);
  const intervalMs = feedIntervalH() * 3600 * 1000;

  if (intervalMs > 0) {
    // Dernier repas (tétée OU biberon) au-delà du seuil — mesuré depuis sa fin.
    const feedEnd = (e) => new Date(e.timestamp).getTime() + (e.payload?.durationSec || 0) * 1000;
    const lastFeed = (cache.events || [])
      .filter((e) => e.type === "feeding" && !(e.payload && e.payload.ongoing))
      .sort((a, b) => feedEnd(b) - feedEnd(a))[0];
    if (lastFeed) {
      const elapsed = now - feedEnd(lastFeed);
      if (elapsed >= intervalMs) {
        out.push({ emo: "biberon", notify: true, key: "feed", stamp: lastFeed.id || lastFeed.timestamp,
          title: "Repas à prévoir", text: `Dernier repas il y a ${hm(elapsed)}`,
          body: `${hm(elapsed)} depuis le dernier repas (tétée ou biberon).` });
      }
    }
    // Sommeil en cours au-delà du seuil.
    const sleeping = (cache.events || []).find((e) => e.type === "sleep" && e.payload && e.payload.ongoing);
    if (sleeping) {
      const elapsed = now - new Date(sleeping.timestamp).getTime();
      if (elapsed >= intervalMs) {
        out.push({ emo: "sommeil", notify: true, key: "sleep", stamp: sleeping.id,
          title: "Sommeil prolongé", text: `Sommeil en cours : ${hm(elapsed)}`,
          body: `Bébé dort depuis ${hm(elapsed)}.` });
      }
    }
  }

  // Dernière séance de tire-lait au-delà du seuil (seuil propre, mesuré depuis sa fin).
  const pumpMs = pumpIntervalH() * 3600 * 1000;
  if (pumpMs > 0) {
    const pumpEnd = (e) => new Date(e.timestamp).getTime() + (e.payload?.durationSec || 0) * 1000;
    const lastPump = (cache.events || [])
      .filter((e) => e.type === "pump")
      .sort((a, b) => pumpEnd(b) - pumpEnd(a))[0];
    if (lastPump) {
      const elapsed = now - pumpEnd(lastPump);
      if (elapsed >= pumpMs) {
        out.push({ emo: "lait", notify: true, key: "pump", stamp: lastPump.id || lastPump.timestamp,
          title: "Séance de tire-lait", text: `Dernière séance il y a ${hm(elapsed)}`,
          body: `${hm(elapsed)} depuis la dernière séance de tire-lait.` });
      }
    }
  }

  // Vaccin proche (in-app uniquement)
  const nextVac = (cache.vaccines || []).filter((v) => !v.done_date && v.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
  if (nextVac) {
    const d = calDaysUntil(nextVac.due_date);
    if (d >= 0 && d <= 14) out.push({ emo: "vaccin", notify: false, key: "vaccine-" + nextVac.id, stamp: todayStr,
      title: "Vaccin", text: `Vaccin ${nextVac.name} ${d === 0 ? "à faire" : dayWord(d)}`, body: "" });
  }

  // RDV proche (in-app uniquement)
  const nextAppt = (cache.appointments || []).filter((a) => new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  if (nextAppt) {
    const d = calDaysUntil(nextAppt.date);
    if (d <= 2) out.push({ emo: "steto", notify: false, key: "appt-" + nextAppt.id, stamp: todayStr,
      title: "Rendez-vous", text: `RDV ${nextAppt.title} ${dayWord(d)}`, body: "" });
  }

  return out;
}

// Déclenche les notifications système pour les rappels marqués notify (si activées).
export function checkReminders(cache) {
  if (!remindersOn()) return;
  computeReminders(cache).forEach((r) => { if (r.notify) fire(r.stamp, r.title, r.body, r.key); });
}
