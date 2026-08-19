/* ============================================================
 * Motor de aventuras gráficas point-and-click
 * ------------------------------------------------------------
 * Estructura basada en nodos: cada habitación (room) es un nodo
 * independiente con su escena SVG, sus hotspots y sus salidas.
 * El juego se define de forma declarativa en game-data.js.
 *
 * Capacidades: personaje andante con perspectiva, verbos,
 * inventario, flags, diálogos con opciones de respuesta,
 * condicionales, variantes de escena, puntuación, interludios,
 * dos idiomas (es/en) y guardado en localStorage.
 * ============================================================ */

const Engine = (() => {
  const SAVE_KEY = "pnc-save-v1";
  const LANG_KEY = "pnc-lang";

  let GAME = null;
  let state = null;

  // Verbo activo: "look" | "use" | "talk"
  let verb = "use";
  let selectedItem = null;
  let lang = localStorage.getItem(LANG_KEY) === "en" ? "en" : "es";

  // Cola de mensajes / diálogos
  let msgQueue = [];
  let msgTimer = null;
  let choicesActive = false;
  let pendingOverlay = null; // final o interludio pospuesto hasta vaciar la cola
  let overlayMode = "restart";
  let pendingAt = null; // punto de aparición del jugador en la próxima sala

  // ---------- Textos de la interfaz ----------

  const UI = {
    es: {
      verbs: { look: "👁 Mirar", use: "🖐 Usar", talk: "💬 Hablar" },
      verbNames: { look: "Mirar", use: "Usar", talk: "Hablar con" },
      useWith: (i, h) => `Usar ${i} con ${h}`,
      useWithDots: (i) => `Usar ${i} con...`,
      hints: "✨ Pistas",
      soundOn: "🔊 Sonido",
      soundOff: "🔇 Sonido",
      music: "🎵 Música",
      save: "💾 Guardar",
      load: "📂 Cargar",
      restart: "↺ Reiniciar",
      playAgain: "Jugar otra vez",
      cont: "Continuar",
      saved: "Partida guardada.",
      loaded: "Partida cargada.",
      noSave: "No hay ninguna partida guardada.",
      score: (s, m) => `⭐ ${s}/${m}`,
    },
    en: {
      verbs: { look: "👁 Look", use: "🖐 Use", talk: "💬 Talk" },
      verbNames: { look: "Look at", use: "Use", talk: "Talk to" },
      useWith: (i, h) => `Use ${i} with ${h}`,
      useWithDots: (i) => `Use ${i} with...`,
      hints: "✨ Hints",
      soundOn: "🔊 Sound",
      soundOff: "🔇 Sound",
      music: "🎵 Music",
      save: "💾 Save",
      load: "📂 Load",
      restart: "↺ Restart",
      playAgain: "Play again",
      cont: "Continue",
      saved: "Game saved.",
      loaded: "Game loaded.",
      noSave: "There is no saved game.",
      score: (s, m) => `⭐ ${s}/${m}`,
    },
  };
  const ui = () => UI[lang];

  // Resuelve un texto localizable: "hola" o { es: "hola", en: "hello" }
  function L(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[lang] !== undefined ? v[lang] : v.es;
  }

  function isText(v) {
    return (
      typeof v === "string" ||
      (v && !Array.isArray(v) && (v.es !== undefined || v.en !== undefined))
    );
  }

  // ---------- Utilidades de estado ----------

  function freshState() {
    return { room: GAME.start, inventory: [], flags: {}, seen: {}, score: 0 };
  }

  function hasItem(id) {
    return state.inventory.includes(id);
  }

  function addItem(id) {
    if (!hasItem(id)) {
      state.inventory.push(id);
      renderInventory();
      flashInventory(id);
      audio("sfx", "pickup");
    }
  }

  function removeItem(id) {
    state.inventory = state.inventory.filter((i) => i !== id);
    if (selectedItem === id) selectedItem = null;
    renderInventory();
  }

  function setFlag(name, value = true) {
    state.flags[name] = value;
  }

  function flag(name) {
    return !!state.flags[name];
  }

  // Puente opcional con el módulo de sonido (el juego funciona sin él)
  function audio(fn, arg) {
    if (typeof Sound !== "undefined" && Sound[fn]) Sound[fn](arg);
  }

  function addPoints(n) {
    state.score = (state.score || 0) + n;
    updateScore(true);
  }

  function updateScore(pulse) {
    const el = document.getElementById("score");
    if (!el) return;
    if (!GAME.maxScore) {
      el.textContent = "";
      return;
    }
    el.textContent = ui().score(state.score || 0, GAME.maxScore);
    if (pulse) {
      el.classList.remove("pulse");
      void el.offsetWidth;
      el.classList.add("pulse");
    }
  }

  // ---------- Intérprete de acciones ----------
  // Una acción puede ser:
  //   - string o texto {es,en}   → mostrar mensaje
  //   - array                    → secuencia
  //   - function(api)            → lógica libre en JS
  //   - objeto declarativo       → { say, dialog, choices, addItem,
  //       removeItem, setFlag, goto, at, sfx, points, once,
  //       if/then/else, interlude, ending }

  function checkCond(cond) {
    if (typeof cond === "function") return !!cond(api);
    if (cond.flag !== undefined) return flag(cond.flag);
    if (cond.notFlag !== undefined) return !flag(cond.notFlag);
    if (cond.hasItem !== undefined) return hasItem(cond.hasItem);
    if (cond.notItem !== undefined) return !hasItem(cond.notItem);
    if (cond.all) return cond.all.every(checkCond);
    if (cond.any) return cond.any.some(checkCond);
    return false;
  }

  function run(action, onceKey) {
    if (action == null) return;

    if (isText(action)) {
      say(action);
      return;
    }
    if (Array.isArray(action)) {
      action.forEach((a, i) => run(a, onceKey ? onceKey + ":" + i : null));
      return;
    }
    if (typeof action === "function") {
      action(api);
      return;
    }

    if (action.if !== undefined) {
      run(checkCond(action.if) ? action.then : action.else, onceKey);
      return;
    }
    if (action.once) {
      const key = onceKey || JSON.stringify(action).slice(0, 80);
      if (state.seen[key]) {
        run(action.otherwise, null);
        return;
      }
      state.seen[key] = true;
      run(action.do, null);
      return;
    }

    if (action.sfx) audio("sfx", action.sfx);
    if (action.points) addPoints(action.points);
    if (action.say) say(action.say);
    if (action.dialog) playDialog(action.dialog);
    if (action.choices) {
      msgQueue.push({ choices: action.choices });
      if (!msgTimer && !choicesActive) nextMessage();
    }
    if (action.addItem) addItem(action.addItem);
    if (action.removeItem) removeItem(action.removeItem);
    if (action.setFlag) setFlag(action.setFlag, action.value !== false);
    if (action.goto) gotoRoom(action.goto, action.at);
    if (action.interlude) queueOverlay(action.interlude, "continue");
    if (action.ending) queueOverlay(action.ending, "restart");
  }

  // API que se expone a las funciones definidas en game-data.js
  const api = {
    say: (t) => say(t),
    goto: (r, at) => gotoRoom(r, at),
    addItem,
    removeItem,
    hasItem,
    setFlag,
    flag,
    addPoints,
    dialog: (lines) => playDialog(lines),
    run: (a) => run(a),
    state: () => state,
    lang: () => lang,
  };

  // ---------- Mensajes, diálogos y opciones ----------

  function say(text) {
    msgQueue.push({ text });
    if (!msgTimer && !choicesActive) nextMessage();
  }

  function playDialog(lines) {
    lines.forEach((l) =>
      msgQueue.push(l && l.choices ? l : isText(l) ? { text: l } : l)
    );
    if (!msgTimer && !choicesActive) nextMessage();
  }

  function nextMessage() {
    const box = document.getElementById("message");
    if (msgQueue.length === 0) {
      msgTimer = null;
      flushOverlay();
      return;
    }
    const m = msgQueue.shift();
    if (m.choices) {
      renderChoices(m.choices, box);
      return;
    }
    box.innerHTML = "";
    if (m.speaker) {
      const s = document.createElement("span");
      s.className = "speaker";
      s.textContent = L(m.speaker) + ": ";
      box.appendChild(s);
    }
    const text = L(m.text);
    box.appendChild(document.createTextNode(text));
    box.classList.remove("pop");
    void box.offsetWidth; // reinicia la animación
    box.classList.add("pop");
    const ms = Math.max(2200, 55 * text.length);
    msgTimer = setTimeout(nextMessage, ms);
  }

  function renderChoices(choices, box) {
    choicesActive = true;
    msgTimer = null;
    box.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "choices";
    choices
      .filter((c) => !c.if || checkCond(c.if))
      .forEach((c) => {
        const b = document.createElement("button");
        b.textContent = "› " + L(c.text);
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          choicesActive = false;
          box.innerHTML = "";
          run(c.then);
          if (!msgTimer && !choicesActive) nextMessage();
        });
        wrap.appendChild(b);
      });
    box.appendChild(wrap);
  }

  function skipMessage() {
    if (choicesActive) return;
    if (msgTimer) {
      clearTimeout(msgTimer);
      msgTimer = null;
      if (msgQueue.length) {
        nextMessage();
      } else {
        document.getElementById("message").textContent = "";
        flushOverlay();
      }
    }
  }

  // ---------- Final e interludios ----------

  function queueOverlay(data, mode) {
    if (msgTimer || msgQueue.length || choicesActive) {
      pendingOverlay = { data, mode };
    } else {
      showOverlay(data, mode);
    }
  }

  function flushOverlay() {
    if (pendingOverlay) {
      const p = pendingOverlay;
      pendingOverlay = null;
      showOverlay(p.data, p.mode);
    }
  }

  function showOverlay(data, mode) {
    overlayMode = mode;
    if (mode === "restart") audio("sfx", "success");
    const ov = document.getElementById("ending");
    ov.querySelector("h2").textContent = L(data.title);
    ov.querySelector("p").textContent = L(data.text);
    const sc = ov.querySelector(".score");
    if (sc) {
      sc.textContent =
        mode === "restart" && GAME.maxScore
          ? ui().score(state.score || 0, GAME.maxScore)
          : "";
    }
    ov.querySelector("button").textContent =
      mode === "restart" ? ui().playAgain : ui().cont;
    ov.classList.add("show");
  }

  // ---------- Personaje ----------

  // Sprite vectorial de reserva (si no hay gráficos horneados)
  const PLAYER_SVG = `
    <g class="pj">
      <ellipse cx="0" cy="0" rx="16" ry="4" fill="#000" opacity="0.25"/>
      <g class="leg-l"><rect x="-9" y="-36" width="8" height="36" rx="3" fill="#24405c"/></g>
      <g class="leg-r"><rect x="1" y="-36" width="8" height="36" rx="3" fill="#2c4d6e"/></g>
      <path d="M-13 -80 L13 -80 L11 -34 L-11 -34 Z" fill="#8c3b32"/>
      <rect x="-14" y="-80" width="28" height="9" fill="#742f28"/>
      <g class="arm-l"><rect x="-18" y="-76" width="6" height="32" rx="3" fill="#742f28"/></g>
      <g class="arm-r"><rect x="12" y="-76" width="6" height="32" rx="3" fill="#742f28"/></g>
      <circle cx="0" cy="-90" r="11" fill="#d9a066"/>
      <path d="M-11 -93 Q0 -106 11 -93 L11 -88 L-11 -88 Z" fill="#c9a227"/>
      <rect x="-11" y="-90" width="22" height="2.5" fill="#8a6d1d"/>
    </g>`;

  // ¿Hay gráficos horneados (pixel art EGA de tools/bake-scenes.js)?
  function baked() {
    return typeof SCENES !== "undefined" ? SCENES : null;
  }

  // Spritesheet del personaje: 5 fotogramas de 16x32 (0 = quieto,
  // 1-4 = ciclo de andar). Se anima cambiando el viewBox del svg interior.
  function playerMarkup() {
    const S = baked();
    if (S && S.player) {
      return `<g class="pj">
        <ellipse cx="0" cy="2" rx="15" ry="4" fill="#000" opacity="0.3"/>
        <svg class="sprite" x="-24" y="-94" width="48" height="96" viewBox="0 0 16 32">
          <image href="${S.player}" x="0" y="0" width="80" height="32"/>
        </svg>
      </g>`;
    }
    return PLAYER_SVG;
  }

  function setPlayerFrame(f) {
    if (player.spriteEl) {
      player.spriteEl.setAttribute("viewBox", `${f * 16} 0 16 32`);
    }
  }

  const player = {
    x: 0, y: 0, tx: 0, ty: 0,
    cb: null, facing: 1, walking: false, raf: 0, el: null, spriteEl: null,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function playerScale(y) {
    const f = room().floor;
    if (!f) return 1;
    const t = (y - f.yMin) / (f.yMax - f.yMin || 1);
    return 0.55 + 0.5 * clamp(t, 0, 1);
  }

  function paintPlayer() {
    if (!player.el) return;
    // Autocorrección: si alguna coordenada se corrompe, recoloca al
    // personaje en la zona transitable en lugar de congelar el juego.
    if (!isFinite(player.x) || !isFinite(player.y)) {
      const f = room().floor;
      player.x = f ? (f.xMin + f.xMax) / 2 : 480;
      player.y = f ? f.yMax - 20 : 480;
      player.tx = player.x;
      player.ty = player.y;
    }
    const s = playerScale(player.y);
    player.el.setAttribute(
      "transform",
      `translate(${player.x} ${player.y}) scale(${s * player.facing} ${s})`
    );
    player.el.classList.toggle("walking", player.walking);
  }

  function stopWalk() {
    cancelAnimationFrame(player.raf);
    player.walking = false;
    player.cb = null;
  }

  function spawnPlayer(at) {
    const r = room();
    const g = document.getElementById("player-g");
    if (!r.floor || !g) {
      player.el = null;
      return;
    }
    g.innerHTML = playerMarkup();
    player.el = g;
    player.spriteEl = g.querySelector(".sprite");
    setPlayerFrame(0);
    const f = r.floor;
    const p =
      (r.spawns && (r.spawns[at] || r.spawns.default)) ||
      { x: (f.xMin + f.xMax) / 2, y: f.yMax - 20 };
    player.x = clamp(p.x, f.xMin, f.xMax);
    player.y = clamp(p.y, f.yMin, f.yMax);
    player.facing = p.facing || 1;
    player.walking = false;
    player.cb = null;
    paintPlayer();
  }

  // Camina hasta un punto (acotado a la zona transitable) y ejecuta cb al llegar
  function walkTo(pt, cb) {
    const f = room().floor;
    if (!f || !player.el) {
      if (cb) cb();
      return;
    }
    const gx = Number(pt && pt.x);
    const gy = Number(pt && pt.y);
    player.tx = clamp(isFinite(gx) ? gx : player.x, f.xMin, f.xMax);
    player.ty = clamp(isFinite(gy) ? gy : player.y, f.yMin, f.yMax);
    player.cb = cb || null;
    if (Math.abs(player.tx - player.x) > 4) {
      player.facing = player.tx > player.x ? 1 : -1;
    }
    if (!player.walking) {
      player.walking = true;
      let last = performance.now();
      const step = (now) => {
        if (!player.el || !player.walking) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const speed = (window.PNC_FAST ? 8000 : 250) * playerScale(player.y);
        const dx = player.tx - player.x;
        const dy = player.ty - player.y;
        const d = Math.hypot(dx, dy);
        if (d <= speed * dt) {
          player.x = player.tx;
          player.y = player.ty;
          player.walking = false;
          setPlayerFrame(0);
          paintPlayer();
          const done = player.cb;
          player.cb = null;
          if (done) done();
          return;
        }
        player.x += (dx / d) * speed * dt;
        player.y += (dy / d) * speed * dt;
        setPlayerFrame(1 + (Math.floor(now / 110) % 4)); // ciclo de andar
        paintPlayer();
        player.raf = requestAnimationFrame(step);
      };
      player.raf = requestAnimationFrame(step);
    }
    paintPlayer();
  }

  function hotspotCenter(h) {
    const s = h.shape;
    if (s.circle) return { x: s.circle[0], y: s.circle[1] };
    if (s.poly) {
      const pts = s.poly.split(" ").map((p) => p.split(",").map(Number));
      return {
        x: pts.reduce((a, p) => a + p[0], 0) / pts.length,
        y: pts.reduce((a, p) => a + p[1], 0) / pts.length,
      };
    }
    return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
  }

  // ---------- Renderizado ----------

  function room() {
    return GAME.rooms[state.room];
  }

  function gotoRoom(id, at) {
    if (!GAME.rooms[id]) {
      console.warn("Habitación desconocida:", id);
      return;
    }
    stopWalk();
    pendingAt = at || null;
    const stage = document.getElementById("stage");
    stage.classList.add("fade");
    setTimeout(() => {
      state.room = id;
      selectedItem = null;
      renderRoom();
      renderInventory();
      stage.classList.remove("fade");
      const r = room();
      audio("setScene", r.ambience || "sea");
      autosave();
      if (r.onEnter) run(r.onEnter, "enter:" + id);
    }, 220);
  }

  function shapeToSvg(shape) {
    if (shape.poly) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      p.setAttribute("points", shape.poly);
      return p;
    }
    if (shape.circle) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      c.setAttribute("cx", shape.circle[0]);
      c.setAttribute("cy", shape.circle[1]);
      c.setAttribute("rx", shape.circle[2]);
      c.setAttribute("ry", shape.circle[3] ?? shape.circle[2]);
      return c;
    }
    const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r.setAttribute("x", shape.x);
    r.setAttribute("y", shape.y);
    r.setAttribute("width", shape.w);
    r.setAttribute("height", shape.h);
    return r;
  }

  // Capas de escena adicionales activadas por condición (p. ej. el faro encendido)
  function variantSvg(r) {
    if (!r.variants) return "";
    return r.variants
      .filter((v) => checkCond(v.if))
      .map((v) => v.svg)
      .join("");
  }

  // Escena: pixel art horneado si existe (base + capas transparentes),
  // o el SVG vectorial original como reserva.
  function sceneMarkup(r) {
    const S = baked();
    const img = S && S.rooms && S.rooms[state.room];
    if (!img) return r.svg + variantSvg(r);
    let s = `<image href="${img}" x="0" y="0" width="960" height="540" preserveAspectRatio="none"/>`;
    if (r.variants) {
      r.variants.forEach((v, i) => {
        const layer = S.variants[state.room] && S.variants[state.room][i];
        if (layer && checkCond(v.if)) {
          s += `<image href="${layer}" x="0" y="0" width="960" height="540" preserveAspectRatio="none" class="overlay-glow"/>`;
        }
      });
    }
    return s;
  }

  function renderRoom() {
    const r = room();
    document.getElementById("room-name").textContent = L(r.name);

    const stage = document.getElementById("stage");
    stage.innerHTML =
      `<svg id="scene" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid meet">` +
      sceneMarkup(r) +
      `<g id="player-g"></g><g id="hotspots"></g></svg>`;

    const svg = stage.querySelector("svg");
    // Clic en la escena (fuera de un hotspot): caminar hasta allí
    svg.addEventListener("click", (e) => {
      if (choicesActive) return;
      skipMessage();
      const rect = svg.getBoundingClientRect();
      walkTo({
        x: ((e.clientX - rect.left) / rect.width) * 960,
        y: ((e.clientY - rect.top) / rect.height) * 540,
      });
    });

    const layer = stage.querySelector("#hotspots");
    r.hotspots.forEach((h) => {
      if (h.visible && !checkCond(h.visible)) return;
      const el = shapeToSvg(h.shape);
      el.classList.add("hotspot");
      el.dataset.id = h.id;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onHotspot(h);
      });
      el.addEventListener("mouseenter", () => setStatus(actionLabel(h)));
      el.addEventListener("mouseleave", () => setStatus(""));
      layer.appendChild(el);
    });

    spawnPlayer(pendingAt);
    pendingAt = null;
  }

  // Re-renderiza la sala (hotspots o variantes cambiados) sin mover al jugador
  function refreshScene() {
    const px = player.x, py = player.y, pf = player.facing;
    const had = player.el != null;
    renderRoom();
    if (had && player.el) {
      player.x = px;
      player.y = py;
      player.facing = pf;
      paintPlayer();
    }
  }

  function actionLabel(h) {
    if (selectedItem) {
      const it = GAME.items[selectedItem];
      return ui().useWith(L(it.name), L(h.name));
    }
    return `${ui().verbNames[verb]} ${L(h.name)}`;
  }

  function setStatus(text) {
    document.getElementById("status").textContent = text;
  }

  // ---------- Interacción ----------

  function onHotspot(h) {
    if (choicesActive) return;
    skipMessage();
    const held = selectedItem;

    const act = () => {
      if (held) {
        const handler = h.items && h.items[held];
        const key = `${state.room}:${h.id}:item:${held}`;
        if (handler !== undefined && hasItem(held)) run(handler, key);
        else say(GAME.defaults.cantUseItem);
        selectedItem = null;
        renderInventory();
        updateCursor();
      } else {
        const handler = h[verb];
        const key = `${state.room}:${h.id}:${verb}`;
        if (handler !== undefined) run(handler, key);
        else say(GAME.defaults[verb]);
      }
      refreshScene(); // hotspots o variantes condicionales pueden haber cambiado
      setStatus("");
    };

    // El personaje camina hasta el objetivo antes de actuar
    walkTo(h.walkTo || hotspotCenter(h), act);
  }

  function setVerb(v) {
    verb = v;
    selectedItem = null;
    document
      .querySelectorAll("#verbs button")
      .forEach((b) => b.classList.toggle("active", b.dataset.verb === v));
    renderInventory();
    updateCursor();
  }

  // Cursor con el icono del verbo activo (o del objeto seleccionado)
  function updateCursor() {
    const glyph = selectedItem
      ? "🎒"
      : { look: "👁", use: "🖐", talk: "💬" }[verb];
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">` +
      `<text y="24" font-size="22">${glyph}</text></svg>`;
    document.documentElement.style.setProperty(
      "--hotspot-cursor",
      `url("data:image/svg+xml,${encodeURIComponent(svg)}") 8 8, pointer`
    );
  }

  // Resalta brevemente todos los hotspots de la escena (tecla espacio o botón)
  function revealHotspots() {
    const stage = document.getElementById("stage");
    stage.classList.add("reveal");
    setTimeout(() => stage.classList.remove("reveal"), 1600);
  }

  // ---------- Inventario ----------

  function renderInventory() {
    const inv = document.getElementById("inventory");
    inv.innerHTML = "";
    state.inventory.forEach((id) => {
      const it = GAME.items[id];
      const b = document.createElement("button");
      b.className = "item" + (selectedItem === id ? " selected" : "");
      b.title = L(it.name);
      b.dataset.item = id;
      const S = baked();
      b.innerHTML =
        S && S.icons && S.icons[id]
          ? `<img src="${S.icons[id]}" alt="">`
          : `<svg viewBox="0 0 48 48">${it.icon}</svg>`;
      b.addEventListener("click", () => {
        skipMessage();
        if (choicesActive) return;
        if (verb === "look") {
          say(it.desc || it.name);
          return;
        }
        selectedItem = selectedItem === id ? null : id;
        renderInventory();
        updateCursor();
        setStatus(selectedItem ? ui().useWithDots(L(it.name)) : "");
      });
      inv.appendChild(b);
    });
  }

  function flashInventory(id) {
    const el = document.querySelector(`#inventory .item[data-item="${id}"]`);
    if (el) {
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 900);
    }
  }

  // ---------- Idioma ----------

  function paintChrome() {
    document.querySelectorAll("#verbs button").forEach((b) => {
      b.textContent = ui().verbs[b.dataset.verb];
    });
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("btn-hint", ui().hints);
    set("btn-save", ui().save);
    set("btn-load", ui().load);
    set("btn-restart", ui().restart);
    set("btn-music", ui().music);
    set("btn-lang", lang === "es" ? "EN" : "ES");
    const muteBtn = document.getElementById("btn-mute");
    if (muteBtn && typeof Sound !== "undefined") {
      muteBtn.textContent = Sound.isMuted() ? ui().soundOff : ui().soundOn;
    } else if (muteBtn) {
      muteBtn.textContent = ui().soundOn;
    }
    document.getElementById("title").textContent = L(GAME.title);
    document.title = L(GAME.title);
  }

  function toggleLang() {
    lang = lang === "es" ? "en" : "es";
    localStorage.setItem(LANG_KEY, lang);
    paintChrome();
    refreshScene();
    renderInventory();
    updateScore();
    setStatus("");
  }

  // ---------- Guardado ----------

  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    say(ui().saved);
  }

  // Autoguardado silencioso en cada cambio de sala
  function autosave() {
    localStorage.setItem(SAVE_KEY + "-auto", JSON.stringify(state));
  }

  function load() {
    // Prefiere el guardado manual; si no existe, recurre al autoguardado
    const raw =
      localStorage.getItem(SAVE_KEY) ||
      localStorage.getItem(SAVE_KEY + "-auto");
    if (!raw) {
      say(ui().noSave);
      return;
    }
    state = JSON.parse(raw);
    state.score = state.score || 0;
    selectedItem = null;
    renderRoom();
    renderInventory();
    updateScore();
    audio("setScene", room().ambience || "sea");
    say(ui().loaded);
  }

  function restart() {
    state = freshState();
    selectedItem = null;
    msgQueue = [];
    choicesActive = false;
    pendingOverlay = null;
    if (msgTimer) clearTimeout(msgTimer);
    msgTimer = null;
    document.getElementById("message").textContent = "";
    document.getElementById("ending").classList.remove("show");
    renderRoom();
    renderInventory();
    updateScore();
    audio("setScene", room().ambience || "sea");
    run(GAME.intro, "intro");
  }

  // ---------- Arranque ----------

  function init(gameData) {
    GAME = gameData;
    state = freshState();

    document.querySelectorAll("#verbs button").forEach((b) =>
      b.addEventListener("click", () => setVerb(b.dataset.verb))
    );
    document.getElementById("btn-save").addEventListener("click", save);
    document.getElementById("btn-load").addEventListener("click", load);
    document.getElementById("btn-restart").addEventListener("click", restart);
    document.getElementById("message").addEventListener("click", skipMessage);

    const endBtn = document.getElementById("ending").querySelector("button");
    endBtn.addEventListener("click", () => {
      if (overlayMode === "restart") restart();
      else document.getElementById("ending").classList.remove("show");
    });

    // Atajos de teclado: 1/2/3 para verbos, espacio para revelar hotspots
    document.addEventListener("keydown", (e) => {
      if (e.key === "1") setVerb("look");
      if (e.key === "2") setVerb("use");
      if (e.key === "3") setVerb("talk");
      if (e.key === " ") {
        e.preventDefault();
        revealHotspots();
      }
    });

    const hintBtn = document.getElementById("btn-hint");
    if (hintBtn) hintBtn.addEventListener("click", revealHotspots);

    const muteBtn = document.getElementById("btn-mute");
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        if (typeof Sound !== "undefined") {
          muteBtn.textContent = Sound.toggleMute()
            ? ui().soundOff
            : ui().soundOn;
        }
      });
    }

    const musicBtn = document.getElementById("btn-music");
    if (musicBtn) {
      if (typeof Sound !== "undefined") {
        musicBtn.classList.toggle("off", Sound.isMusicOff());
      }
      musicBtn.addEventListener("click", () => {
        if (typeof Sound !== "undefined") {
          musicBtn.classList.toggle("off", Sound.toggleMusic());
        }
      });
    }

    const langBtn = document.getElementById("btn-lang");
    if (langBtn) langBtn.addEventListener("click", toggleLang);

    paintChrome();
    setVerb("use");
    renderRoom();
    renderInventory();
    updateScore();
    audio("setScene", room().ambience || "sea");
    run(GAME.intro, "intro");
  }

  return { init };
})();
