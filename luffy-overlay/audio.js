export function createSfx() {
  let ctx;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function envGain(t, attack, hold, release, peak = 0.2) {
    const g = ac().createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    return g;
  }

  function tone(freq, type, dur, peak, slide = 0) {
    const t = ac().currentTime;
    const o = ac().createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    const g = envGain(t, 0.02, dur * 0.35, dur * 0.6, peak);
    o.connect(g);
    g.connect(ac().destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  return {
    unlock() {
      ac();
    },
    woosh() {
      const t = ac().currentTime;
      const o = ac().createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(620, t + 0.18);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.45);
      const g = envGain(t, 0.03, 0.12, 0.32, 0.07);
      const f = ac().createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(800, t);
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.2);
      o.connect(f);
      f.connect(g);
      g.connect(ac().destination);
      o.start(t);
      o.stop(t + 0.5);
    },
    slap() {
      tone(220, "square", 0.09, 0.12, -80);
      tone(90, "triangle", 0.12, 0.1, -40);
    },
    chomp() {
      tone(160, "square", 0.08, 0.14, -70);
      setTimeout(() => tone(110, "square", 0.1, 0.12, -50), 70);
    },
    pop() {
      tone(480, "sine", 0.12, 0.1, 200);
    },
    start() {
      tone(392, "triangle", 0.12, 0.08);
      setTimeout(() => tone(523, "triangle", 0.14, 0.09), 100);
      setTimeout(() => tone(659, "triangle", 0.2, 0.1), 200);
    },
    scream() {
      tone(180, "triangle", 0.08, 0.05, 40);
    },
    gear() {
      tone(523, "sine", 0.18, 0.1, 300);
      setTimeout(() => tone(784, "sine", 0.22, 0.1, 400), 120);
      setTimeout(() => tone(1046, "triangle", 0.4, 0.12, 200), 240);
    },
    slash() {
      tone(880, "sawtooth", 0.08, 0.07, 400);
      tone(220, "square", 0.1, 0.06, -80);
    },
    zap() {
      tone(980, "square", 0.07, 0.08, 500);
      setTimeout(() => tone(1400, "square", 0.06, 0.06, -300), 50);
    },
    beam() {
      tone(240, "sawtooth", 0.22, 0.08, 700);
      tone(720, "sine", 0.18, 0.06, 200);
    },
    kick() {
      tone(160, "triangle", 0.1, 0.1, 180);
      tone(420, "sawtooth", 0.08, 0.06, 90);
    },
    join() {
      tone(392, "triangle", 0.1, 0.08);
      setTimeout(() => tone(523, "triangle", 0.12, 0.09), 90);
      setTimeout(() => tone(784, "triangle", 0.18, 0.1), 180);
    },
    stamp() {
      tone(110, "square", 0.12, 0.1, -30);
      tone(330, "triangle", 0.1, 0.07);
    },
  };
}
