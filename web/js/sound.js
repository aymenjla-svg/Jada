// Petit carillon doux au lancement de l'app (esprit berceuse).
// iOS bloque l'audio sans geste : on joue donc au 1er contact après l'ouverture.
// Désactivable via localStorage "jada:sound" = "off".

let armed = false;

function chime() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ac = new AC();

  const play = () => {
    const now = ac.currentTime;
    const master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(ac.destination);

    // Trois notes douces qui montent (do–mi–sol), avec une couche légèrement
    // désaccordée pour la chaleur, et un long fondu type célesta.
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

  if (ac.state === "running") {
    play(); // Android / ordinateur : son immédiat à l'ouverture.
  } else {
    // iPhone : on attend le tout premier geste pour débloquer, puis on joue.
    const onGesture = () => {
      ac.resume().then(play).catch(() => {});
      events.forEach((e) => removeEventListener(e, onGesture, true));
    };
    const events = ["pointerdown", "touchend", "click", "keydown"];
    events.forEach((e) => addEventListener(e, onGesture, { capture: true }));
  }
}

export function welcomeSound() {
  if (armed) return;
  armed = true;
  if (localStorage.getItem("jada:sound") === "off") return;
  try { chime(); } catch (e) {}
}

// Active / coupe le son (utilisable plus tard depuis un réglage).
export function setSoundEnabled(on) {
  localStorage.setItem("jada:sound", on ? "on" : "off");
}
export function isSoundEnabled() {
  return localStorage.getItem("jada:sound") !== "off";
}
