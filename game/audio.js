/* ============================================================
 * Audio sintetizado con WebAudio: ambiente de mar/viento y
 * efectos de sonido. Sin archivos de audio: todo se genera.
 * El contexto se crea en el primer gesto del usuario (política
 * de autoplay de los navegadores).
 * ============================================================ */

const Sound = (() => {
  const MUTE_KEY = "pnc-muted";

  let ctx = null;
  let master = null;
  let ambGain = null;
  let muted = localStorage.getItem(MUTE_KEY) === "1";
  let ambienceLevel = 1;

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      startAmbient();
    } catch (e) {
      ctx = null; // sin audio, pero el juego sigue funcionando
    }
  }

  function noiseBuffer(brown) {
    const len = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.5;
      } else {
        d[i] = white;
      }
    }
    return buf;
  }

  // Olas: ruido marrón grave con vaivén lento. Viento: ruido suave agudo.
  function startAmbient() {
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.22 * ambienceLevel;
    ambGain.connect(master);

    const waves = ctx.createBufferSource();
    waves.buffer = noiseBuffer(true);
    waves.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    const wg = ctx.createGain();
    wg.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.3;
    lfo.connect(lfoG);
    lfoG.connect(wg.gain);
    waves.connect(lp);
    lp.connect(wg);
    wg.connect(ambGain);
    waves.start();
    lfo.start();

    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuffer(false);
    wind.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700;
    bp.Q.value = 0.6;
    const ig = ctx.createGain();
    ig.gain.value = 0.035;
    wind.connect(bp);
    bp.connect(ig);
    ig.connect(ambGain);
    wind.start();
  }

  // level 1 = exterior, 0.25 = interior (el mar se oye lejos)
  function setAmbience(level) {
    ambienceLevel = level;
    if (ctx && ambGain) {
      ambGain.gain.linearRampToValueAtTime(0.22 * level, ctx.currentTime + 0.8);
    }
  }

  function tone(freq, t0, dur, type = "sine", vol = 0.25) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function burst(t0, dur, freq, type, vol) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(false);
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  const SFX = {
    pickup(t) {
      tone(880, t, 0.12, "sine", 0.2);
      tone(1318, t + 0.09, 0.18, "sine", 0.18);
    },
    unlock(t) {
      tone(140, t, 0.12, "square", 0.22);
      tone(95, t + 0.13, 0.2, "square", 0.25);
    },
    match(t) {
      burst(t, 0.25, 2400, "highpass", 0.25);
    },
    splash(t) {
      burst(t, 0.5, 500, "lowpass", 0.35);
      tone(220, t + 0.05, 0.25, "sine", 0.1);
    },
    success(t) {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone(f, t + i * 0.16, 0.5, "triangle", 0.22)
      );
    },
  };

  function sfx(name) {
    ensure();
    if (!ctx || !SFX[name]) return;
    SFX[name](ctx.currentTime + 0.01);
  }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (ctx && master) master.gain.value = muted ? 0 : 1;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  // El primer gesto del usuario arranca el ambiente
  document.addEventListener("pointerdown", ensure, { once: false });

  return { sfx, setAmbience, toggleMute, isMuted };
})();
