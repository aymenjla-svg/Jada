// Son d'accueil au lancement de l'app.
//  - Si un message vocal a été enregistré → on le joue.
//  - Sinon → un doux carillon synthétisé (esprit berceuse).
// iOS bloque l'audio sans geste : on joue donc au 1er contact après l'ouverture.
// Désactivable via "jada:sound" = "off".

let armed = false;

// ---------- Stockage du message vocal (local à l'appareil) ----------
export function getWelcomeAudio() { return localStorage.getItem("jada:welcomeAudio"); }
export function setWelcomeAudio(dataUrl) { localStorage.setItem("jada:welcomeAudio", dataUrl); }
export function clearWelcomeAudio() { localStorage.removeItem("jada:welcomeAudio"); }

export function getWelcomeText() { return localStorage.getItem("jada:welcomeText") || ""; }
export function setWelcomeText(t) { localStorage.setItem("jada:welcomeText", t); }
export function clearWelcomeText() { localStorage.removeItem("jada:welcomeText"); }

export function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 0.95;
    u.pitch = 1.1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {}
}

export function setSoundEnabled(on) { localStorage.setItem("jada:sound", on ? "on" : "off"); }
export function isSoundEnabled() { return localStorage.getItem("jada:sound") !== "off"; }

// ---------- Déclenchement ----------
function onFirstGesture(fn) {
  const evs = ["pointerdown", "touchend", "click", "keydown"];
  const h = () => { evs.forEach((e) => removeEventListener(e, h, true)); fn(); };
  evs.forEach((e) => addEventListener(e, h, { capture: true }));
}

function playDataUrl(url) {
  try { const a = new Audio(url); a.play().catch(() => {}); } catch (e) {}
}

export function welcomeSound() {
  if (armed) return;
  armed = true;
  if (!isSoundEnabled()) return;

  const rec = getWelcomeAudio();
  const txt = getWelcomeText();
  if (rec) {
    onFirstGesture(() => playDataUrl(rec));
  } else if (txt) {
    onFirstGesture(() => speak(txt));
  } else {
    chime();
  }
}

// ---------- Carillon de secours (synthétisé) ----------
function chime() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ac = new AC();

  const play = () => {
    const now = ac.currentTime;
    const master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(ac.destination);
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      const t = now + i * 0.14;
      [{ d: 0, v: 0.16 }, { d: 5, v: 0.05 }].forEach((layer) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = layer.d;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(layer.v, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + 1.4);
      });
    });
    setTimeout(() => ac.close().catch(() => {}), 2800);
  };

  if (ac.state === "running") play();
  else onFirstGesture(() => ac.resume().then(play).catch(() => {}));
}
