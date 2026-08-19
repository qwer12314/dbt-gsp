/* ============================================================
 * Motor de aventuras gráficas point-and-click
 * ------------------------------------------------------------
 * Estructura basada en nodos: cada habitación (room) es un nodo
 * independiente con su escena SVG, sus hotspots y sus salidas.
 * El juego se define de forma declarativa en game-data.js.
 * ============================================================ */

const Engine = (() => {
  const SAVE_KEY = "pnc-save-v1";

  let GAME = null;

  // Estado mutable de la partida
  let state = null;

  // Verbo activo: "look" | "use" | "talk"
  let verb = "use";

  // Objeto del inventario seleccionado (para "usar X con Y"), o null
  let selectedItem = null;

  // Cola de mensajes pendientes de mostrar
  let msgQueue = [];
  let msgTimer = null;

  // ---------- Utilidades de estado ----------

  function freshState() {
    return {
      room: GAME.start,
      inventory: [],
      flags: {},
      seen: {}, // acciones "once" ya ejecutadas
    };
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

  // Puente opcional con el módulo de sonido (el juego funciona sin él)
  function audio(fn, arg) {
    if (typeof Sound !== "undefined" && Sound[fn]) Sound[fn](arg);
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

  // ---------- Intérprete de acciones ----------
  // Una acción puede ser:
  //   - string                  → mostrar mensaje
  //   - array                   → secuencia de acciones
  //   - function(api)           → lógica libre en JS
  //   - objeto declarativo      → { say, goto, addItem, removeItem,
  //                                 setFlag, dialog, once, if/then/else, ending }

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

    if (typeof action === "string") {
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

    // Objeto declarativo
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
    if (action.say) say(action.say);
    if (action.dialog) playDialog(action.dialog);
    if (action.addItem) addItem(action.addItem);
    if (action.removeItem) removeItem(action.removeItem);
    if (action.setFlag) setFlag(action.setFlag, action.value !== false);
    if (action.goto) gotoRoom(action.goto);
    if (action.ending) showEnding(action.ending);
  }

  // API que se expone a las funciones definidas en game-data.js
  const api = {
    say: (t) => say(t),
    goto: (r) => gotoRoom(r),
    addItem,
    removeItem,
    hasItem,
    setFlag,
    flag,
    dialog: (lines) => playDialog(lines),
    ending: (e) => showEnding(e),
    run: (a) => run(a),
    state: () => state,
  };

  // ---------- Mensajes y diálogos ----------

  function say(text) {
    msgQueue.push({ text });
    if (!msgTimer) nextMessage();
  }

  function playDialog(lines) {
    lines.forEach((l) =>
      msgQueue.push(typeof l === "string" ? { text: l } : l)
    );
    if (!msgTimer) nextMessage();
  }

  function nextMessage() {
    const box = document.getElementById("message");
    if (msgQueue.length === 0) {
      msgTimer = null;
      return;
    }
    const m = msgQueue.shift();
    box.innerHTML = "";
    if (m.speaker) {
      const s = document.createElement("span");
      s.className = "speaker";
      s.textContent = m.speaker + ": ";
      box.appendChild(s);
    }
    box.appendChild(document.createTextNode(m.text));
    box.classList.remove("pop");
    void box.offsetWidth; // reinicia la animación
    box.classList.add("pop");
    const ms = Math.max(2200, 55 * m.text.length);
    msgTimer = setTimeout(nextMessage, ms);
  }

  function skipMessage() {
    if (msgTimer) {
      clearTimeout(msgTimer);
      msgTimer = null;
      if (msgQueue.length) nextMessage();
      else document.getElementById("message").textContent = "";
    }
  }

  // ---------- Renderizado ----------

  function room() {
    return GAME.rooms[state.room];
  }

  function gotoRoom(id) {
    if (!GAME.rooms[id]) {
      console.warn("Habitación desconocida:", id);
      return;
    }
    const stage = document.getElementById("stage");
    stage.classList.add("fade");
    setTimeout(() => {
      state.room = id;
      selectedItem = null;
      renderRoom();
      renderInventory();
      stage.classList.remove("fade");
      const r = room();
      audio("setAmbience", r.ambience === "interior" ? 0.25 : 1);
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

  function renderRoom() {
    const r = room();
    document.getElementById("room-name").textContent = r.name;

    const stage = document.getElementById("stage");
    stage.innerHTML =
      `<svg id="scene" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid meet">` +
      r.svg +
      `<g id="hotspots"></g></svg>`;

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
  }

  function actionLabel(h) {
    if (selectedItem) {
      const it = GAME.items[selectedItem];
      return `Usar ${it.name} con ${h.name}`;
    }
    const v = { look: "Mirar", use: "Usar", talk: "Hablar con" }[verb];
    return `${v} ${h.name}`;
  }

  function setStatus(text) {
    document.getElementById("status").textContent = text;
  }

  // ---------- Interacción ----------

  function onHotspot(h) {
    skipMessage();
    if (selectedItem) {
      const handler = h.items && h.items[selectedItem];
      const key = `${state.room}:${h.id}:item:${selectedItem}`;
      if (handler !== undefined) run(handler, key);
      else say(GAME.defaults.cantUseItem);
      selectedItem = null;
      renderInventory();
      renderRoom();
      setStatus("");
      return;
    }
    const handler = h[verb];
    const key = `${state.room}:${h.id}:${verb}`;
    if (handler !== undefined) run(handler, key);
    else say(GAME.defaults[verb]);
    renderRoom(); // los hotspots condicionales pueden haber cambiado
    setStatus("");
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
      b.title = it.name;
      b.dataset.item = id;
      b.innerHTML = `<svg viewBox="0 0 48 48">${it.icon}</svg>`;
      b.addEventListener("click", () => {
        skipMessage();
        if (verb === "look") {
          say(it.desc || it.name);
          return;
        }
        selectedItem = selectedItem === id ? null : id;
        renderInventory();
        updateCursor();
        setStatus(selectedItem ? `Usar ${it.name} con...` : "");
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

  // ---------- Final del juego ----------

  function showEnding(e) {
    audio("sfx", "success");
    const ov = document.getElementById("ending");
    ov.querySelector("h2").textContent = e.title;
    ov.querySelector("p").textContent = e.text;
    ov.classList.add("show");
  }

  // ---------- Guardado ----------

  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    say("Partida guardada.");
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
      say("No hay ninguna partida guardada.");
      return;
    }
    state = JSON.parse(raw);
    selectedItem = null;
    renderRoom();
    renderInventory();
    say("Partida cargada.");
  }

  function restart() {
    state = freshState();
    selectedItem = null;
    msgQueue = [];
    document.getElementById("ending").classList.remove("show");
    renderRoom();
    renderInventory();
    run(GAME.intro, "intro");
  }

  // ---------- Arranque ----------

  function init(gameData) {
    GAME = gameData;
    state = freshState();

    document.getElementById("title").textContent = GAME.title;
    document.title = GAME.title;

    document.querySelectorAll("#verbs button").forEach((b) =>
      b.addEventListener("click", () => setVerb(b.dataset.verb))
    );
    document.getElementById("btn-save").addEventListener("click", save);
    document.getElementById("btn-load").addEventListener("click", load);
    document.getElementById("btn-restart").addEventListener("click", restart);
    document
      .getElementById("ending")
      .querySelector("button")
      .addEventListener("click", restart);
    document.getElementById("message").addEventListener("click", skipMessage);

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
      const paint = (m) => (muteBtn.textContent = m ? "🔇 Sonido" : "🔊 Sonido");
      if (typeof Sound !== "undefined") paint(Sound.isMuted());
      muteBtn.addEventListener("click", () => {
        if (typeof Sound !== "undefined") paint(Sound.toggleMute());
      });
    }

    setVerb("use");
    renderRoom();
    renderInventory();
    run(GAME.intro, "intro");
  }

  return { init };
})();
