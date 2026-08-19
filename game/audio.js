/* ============================================================
 * Audio sintetizado con WebAudio: ambiente de mar/viento,
 * música generativa y efectos de sonido. Sin archivos de audio:
 * todo se genera. El contexto se crea en el primer gesto del
 * usuario (política de autoplay de los navegadores).
 * ============================================================ */

const Sound = (() => {
  const MUTE_KEY = "pnc-muted";
  const MUSIC_KEY = "pnc-music-off";

  let ctx = null;
  let master = null;
  let ambGain = null;
  let musicGain = null;
  let delaySend = null;
  let muted = localStorage.getItem(MUTE_KEY) === "1";
  let musicOff = localStorage.getItem(MUSIC_KEY) === "1";
  let scene = "sea"; // "sea" | "interior" | "cave"

  const AMBIENCE = { sea: 1, interior: 0.25, cave: 0.12 };

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
      startMusic();
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

  // ---------- Ambiente: olas y viento ----------

  function startAmbient() {
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.22 * (AMBIENCE[scene] ?? 1);
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

  // ---------- Música generativa ----------
  // Paseo aleatorio por una escala pentatónica con eco largo.
  // En la cueva la escala baja y el tempo se vuelve más espacioso.

  const SCALES = {
    sea: [220, 261.6, 293.7, 329.6, 392, 440, 523.3], // La menor pentatónica
    interior: [220, 261.6, 293.7, 329.6, 392, 440, 523.3],
    cave: [146.8, 174.6, 196, 220, 261.6, 293.7], // Re menor, más grave
  };
  let noteIdx = 3;

  function startMusic() {
    musicGain = ctx.createGain();
    musicGain.gain.value = musicOff ? 0 : 1;
    musicGain.connect(master);

    // Eco con retroalimentación filtrada para dar espacio
    delaySend = ctx.createDelay(1.5);
    delaySend.delayTime.value = 0.46;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    delaySend.connect(fb);
    fb.connect(lp);
    lp.connect(delaySend);
    delaySend.connect(musicGain);

    scheduleNote();
  }

  function scheduleNote() {
    const range = scene === "cave" ? [3200, 5600] : [2200, 4200];
    setTimeout(() => {
      playNote();
      scheduleNote();
    }, range[0] + Math.random() * (range[1] - range[0]));
  }

  function playNote() {
    if (!ctx || muted || musicOff) return;
    const scale = SCALES[scene] || SCALES.sea;
    const jump = Math.random() < 0.25 ? 2 : 1;
    noteIdx = Math.max(
      0,
      Math.min(scale.length - 1, noteIdx + (Math.random() < 0.5 ? -jump : jump))
    );
    const f = scale[noteIdx];
    const t = ctx.currentTime + 0.02;
    note(f, t, 0.07);
    // Quinta ocasional, más tenue
    if (Math.random() < 0.3) note(f * 1.5, t + 0.35, 0.035);
  }

  function note(freq, t, vol) {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g);
    g.connect(musicGain);
    g.connect(delaySend);
    o.start(t);
    o.stop(t + 2.6);
  }

  // level por escena: exterior 1, interior 0.25, cueva 0.12
  function setScene(name) {
    scene = name;
    if (ctx && ambGain) {
      ambGain.gain.linearRampToValueAtTime(
        0.22 * (AMBIENCE[name] ?? 1),
        ctx.currentTime + 0.8
      );
    }
  }

  // ---------- Efectos ----------

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
    magic(t) {
      [1046, 1318, 1568, 2093].forEach((f, i) =>
        tone(f, t + i * 0.07, 0.6, "sine", 0.12)
      );
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

  // ---------- Controles ----------

  function toggleMute() {
    muted = !muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (ctx && master) master.gain.value = muted ? 0 : 1;
    return muted;
  }

  function toggleMusic() {
    musicOff = !musicOff;
    localStorage.setItem(MUSIC_KEY, musicOff ? "1" : "0");
    if (ctx && musicGain) musicGain.gain.value = musicOff ? 0 : 1;
    return musicOff;
  }

  function isMuted() {
    return muted;
  }

  function isMusicOff() {
    return musicOff;
  }

  // El primer gesto del usuario arranca el ambiente
  document.addEventListener("pointerdown", ensure, { once: false });

  return { sfx, setScene, toggleMute, toggleMusic, isMuted, isMusicOff };
})();
