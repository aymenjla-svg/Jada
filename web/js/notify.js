// Rappels JADA.
//  - Calcul des rappels (tétée en retard, vaccin proche, RDV proche) : fiable.
//  - Notifications système : best-effort (surtout en app installée sur iPhone).

export function remindersOn() { return localStorage.getItem("jada:notify") === "on"; }
export function setRemindersOn(on) { localStorage.setItem("jada:notify", on ? "on" : "off"); }
export function feedIntervalH() {
  const v = parseFloat(localStorage.getItem("jada:feedInterval"));
  return isNaN(v) ? 3 : v;
}
export function setFeedIntervalH(h) { localStorage.setItem("jada:feedInterval", String(h)); }

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

// Calcule la liste des rappels actifs à partir du cache.
export function computeReminders(cache) {
  const out = [];
  const now = Date.now();
  const todayStr = new Date(now).toISOString().slice(0, 10);

  // Tétée en retard (mesurée depuis la FIN de la dernière tétée)
  const feedEnd = (e) => new Date(e.timestamp).getTime() + (e.payload?.durationSec || 0) * 1000;
  const feeds = (cache.events || [])
    .filter((e) => e.type === "feeding" && !(e.payload && e.payload.ongoing))
    .sort((a, b) => feedEnd(b) - feedEnd(a));
  const lastFeed = feeds[0];
  const intervalMs = feedIntervalH() * 3600 * 1000;
  if (lastFeed && intervalMs > 0) {
    const elapsed = now - feedEnd(lastFeed);
    if (elapsed >= intervalMs) {
      const h = Math.floor(elapsed / 3600000), m = Math.floor((elapsed % 3600000) / 60000);
      out.push({
        icon: "🍼", title: "Pensez à la tétée",
        text: `Tétée : ${h}h${String(m).padStart(2, "0")} depuis la dernière`,
        body: `${h}h${String(m).padStart(2, "0")} depuis la dernière tétée.`,
        key: "feed", stamp: lastFeed.id || lastFeed.timestamp,
      });
    }
  }

  // Prochain vaccin (≤ 14 jours)
  const nextVac = (cache.vaccines || [])
    .filter((v) => !v.done_date && v.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
  if (nextVac) {
    const days = Math.ceil((new Date(nextVac.due_date) - now) / 86400000);
    if (days <= 14) {
      const when = days <= 0 ? "à faire" : `dans ${days} j`;
      out.push({ icon: "💉", title: "Vaccin à prévoir", text: `Vaccin ${nextVac.name} ${when}`,
        body: `${nextVac.name} ${when}.`, key: "vaccine-" + nextVac.id, stamp: todayStr });
    }
  }

  // Prochain RDV (≤ 2 jours)
  const nextAppt = (cache.appointments || [])
    .filter((a) => new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  if (nextAppt) {
    const days = Math.ceil((new Date(nextAppt.date) - now) / 86400000);
    if (days <= 2) {
      const when = days <= 0 ? "aujourd'hui" : days === 1 ? "demain" : `dans ${days} j`;
      out.push({ icon: "🩺", title: "Rendez-vous bientôt", text: `RDV ${nextAppt.title} ${when}`,
        body: `${nextAppt.title} ${when}.`, key: "appt-" + nextAppt.id, stamp: todayStr });
    }
  }

  return out;
}

// Déclenche les notifications système pour les rappels dus (si activées).
export function checkReminders(cache) {
  if (!remindersOn()) return;
  computeReminders(cache).forEach((r) => fire(r.stamp, r.title, r.body, r.key));
}
