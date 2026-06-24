import { el, openSheet, closeSheet, toast, field, segmented } from "./ui.js";
import {
  getWelcomeAudio, setWelcomeAudio, clearWelcomeAudio,
  getWelcomeText, setWelcomeText, clearWelcomeText,
  isSoundEnabled, setSoundEnabled, speak,
} from "./sound.js";
import {
  remindersOn, setRemindersOn, feedIntervalH, setFeedIntervalH,
  requestNotifPermission, notifSupported,
} from "./notify.js";

export function openWelcomeSheet() {
  let mr = null, chunks = [], stream = null, timer = null, recording = false;

  const status = el("div", { class: "muted", style: "font-size:13px;min-height:18px;margin-top:6px" });
  const recBtn = el("button", { class: "btn-primary" });
  const listenBtn = el("button", { class: "sheet-secondary" }, "▶︎ Écouter");
  const delBtn = el("button", { class: "sheet-secondary" }, "🗑 Supprimer la voix");
  const textInput = el("textarea", { placeholder: "Ex. Coucou ma puce, papa et maman t'aiment ❤️", rows: 2 });
  const onoff = el("button", { class: "sheet-secondary" });

  function refresh() {
    const has = !!getWelcomeAudio();
    recBtn.textContent = recording ? "⏹ Arrêter" : (has ? "🎙️ Réenregistrer" : "🎙️ Enregistrer ma voix");
    listenBtn.style.display = has && !recording ? "" : "none";
    delBtn.style.display = has && !recording ? "" : "none";
    onoff.textContent = isSoundEnabled() ? "🔔 Son d'accueil : activé" : "🔕 Son d'accueil : coupé";
  }

  // --- Enregistrement voix ---
  recBtn.onclick = async () => {
    if (recording) { stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia) { status.textContent = "Micro non disponible sur ce navigateur."; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      status.textContent = "Micro refusé. Autorise le micro (ou ouvre le lien dans Safari).";
      return;
    }
    chunks = [];
    mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: mr.mimeType || "audio/mp4" });
      const fr = new FileReader();
      fr.onload = () => {
        setWelcomeAudio(fr.result);
        clearWelcomeText(); // la voix a priorité ; on évite le doublon
        recording = false; clearTimeout(timer); refresh();
        status.textContent = "Message vocal enregistré ✓";
        toast("Message enregistré");
      };
      fr.readAsDataURL(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    recording = true; refresh();
    status.textContent = "🔴 Enregistrement… parle, puis « Arrêter » (max 10 s)";
    timer = setTimeout(stop, 10000);
  };
  function stop() { if (mr && mr.state !== "inactive") mr.stop(); }

  listenBtn.onclick = () => { const u = getWelcomeAudio(); if (u) new Audio(u).play().catch(() => {}); };
  delBtn.onclick = () => { clearWelcomeAudio(); refresh(); status.textContent = "Message vocal supprimé."; };

  // --- Texte lu à voix haute ---
  textInput.value = getWelcomeText();
  const saveTextBtn = el("button", { class: "sheet-secondary" }, "💾 Enregistrer le texte");
  const tryTextBtn = el("button", { class: "sheet-secondary" }, "🔊 Tester");
  saveTextBtn.onclick = () => {
    const t = textInput.value.trim();
    if (!t) { clearWelcomeText(); status.textContent = "Texte effacé."; return; }
    setWelcomeText(t);
    status.textContent = getWelcomeAudio()
      ? "Texte enregistré (mais ta voix est prioritaire — supprime-la pour utiliser le texte)."
      : "Petit mot enregistré ✓";
    toast("Petit mot enregistré");
  };
  tryTextBtn.onclick = () => { const t = textInput.value.trim(); if (t) speak(t); };

  onoff.onclick = () => { setSoundEnabled(!isSoundEnabled()); refresh(); };

  // --- Rappels ---
  const notifBtn = el("button", { class: "sheet-secondary" });
  const intervalSeg = segmented(
    [{ id: "0", label: "Off" }, { id: "2", label: "2 h" }, { id: "3", label: "3 h" }, { id: "4", label: "4 h" }],
    String(feedIntervalH()),
    (v) => setFeedIntervalH(Number(v))
  );
  function refreshNotif() {
    const on = remindersOn() && (!notifSupported() || Notification.permission === "granted");
    notifBtn.textContent = on ? "🔔 Notifications : activées" : "🔕 Activer les notifications";
  }
  notifBtn.onclick = async () => {
    if (remindersOn()) { setRemindersOn(false); refreshNotif(); return; }
    const res = await requestNotifPermission();
    if (res === "granted") { setRemindersOn(true); toast("Notifications activées"); }
    else if (res === "unsupported") { setRemindersOn(true); toast("Rappels visibles dans l'app (notifs non gérées ici)"); }
    else toast("Notifications refusées par le navigateur");
    refreshNotif();
  };

  const content = el("div", {}, [
    el("div", { class: "ws-block" }, [
      el("div", { class: "ws-title" }, "🔔 Rappels"),
      el("p", { class: "muted", style: "font-size:13px;line-height:1.5;margin-bottom:10px" },
        "Rappel de tétée si le délai dépasse l'intervalle choisi, + vaccins et RDV proches. (Les notifications hors-app marchent surtout si l'app est sur l'écran d'accueil.)"),
      field("Intervalle entre tétées", intervalSeg.node),
      el("div", { style: "margin-top:10px" }, notifBtn),
    ]),

    el("p", { class: "muted", style: "font-size:14px;line-height:1.5;margin-top:16px" },
      "Son joué au lancement de l'app (dès que tu touches l'écran)."),

    el("div", { class: "ws-block" }, [
      el("div", { class: "ws-title" }, "🎙️ Ta voix"),
      el("div", { style: "display:flex;flex-direction:column;gap:8px" }, [recBtn, listenBtn, delBtn]),
    ]),

    el("div", { class: "ws-block" }, [
      el("div", { class: "ws-title" }, "✍️ Ou un petit mot écrit (lu à voix haute)"),
      textInput,
      el("div", { style: "display:flex;gap:8px;margin-top:8px" }, [saveTextBtn, tryTextBtn]),
    ]),

    el("div", { class: "ws-block" }, [onoff]),
    status,
  ]);

  refresh();
  refreshNotif();
  openSheet("Réglages", content, { onSave: closeSheet, saveLabel: "OK" });
}
