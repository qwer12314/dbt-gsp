/* ============================================================
 * Horneado de gráficos estilo Sierra (EGA pixel art)
 * ------------------------------------------------------------
 * Renderiza los SVG vectoriales de game-data.js a 320x180,
 * los cuantiza a la paleta EGA de 16 colores con tramado
 * ordenado Bayer 4x4 (el "dithering" clásico de King's Quest)
 * y genera:
 *   - una imagen base por sala
 *   - las variantes como capas PNG CON TRANSPARENCIA (alfa)
 *   - el spritesheet del personaje (5 fotogramas de 16x32)
 *   - los iconos del inventario a 16x16
 * Todo se escribe como data URIs en game/scenes.js.
 *
 * Uso:  node tools/bake-scenes.js
 * Requiere Playwright (usa Chromium para rasterizar los SVG).
 * ============================================================ */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GAME_DATA_SRC = fs.readFileSync(path.join(ROOT, "game/game-data.js"), "utf8");

// El código que se ejecuta dentro del navegador para cuantizar
const PAGE_LIB = `
  // Paleta EGA de 16 colores (la de los Sierra AGI/SCI0)
  const EGA = [
    [0x00,0x00,0x00],[0x00,0x00,0xAA],[0x00,0xAA,0x00],[0x00,0xAA,0xAA],
    [0xAA,0x00,0x00],[0xAA,0x00,0xAA],[0xAA,0x55,0x00],[0xAA,0xAA,0xAA],
    [0x55,0x55,0x55],[0x55,0x55,0xFF],[0x55,0xFF,0x55],[0x55,0xFF,0xFF],
    [0xFF,0x55,0x55],[0xFF,0x55,0xFF],[0xFF,0xFF,0x55],[0xFF,0xFF,0xFF],
  ];
  const BAYER = [
    [ 0,  8,  2, 10],
    [12,  4, 14,  6],
    [ 3, 11,  1,  9],
    [15,  7, 13,  5],
  ];
  const SPREAD = 44;  // fuerza del tramado
  const SAT = 1.7;    // realce de saturación antes de buscar color
                      // (las escenas nocturnas deben caer en los azules
                      //  EGA, no en los grises)

  function nearestEga(r, g, b) {
    const gray = (r + g + b) / 3;
    r = Math.max(0, Math.min(255, gray + (r - gray) * SAT));
    g = Math.max(0, Math.min(255, gray + (g - gray) * SAT));
    b = Math.max(0, Math.min(255, gray + (b - gray) * SAT));
    let best = 0, bd = 1e9;
    for (let i = 0; i < 16; i++) {
      const dr = r - EGA[i][0], dg = g - EGA[i][1], db = b - EGA[i][2];
      const d = dr * dr + dg * dg + db * db;
      if (d < bd) { bd = d; best = i; }
    }
    return EGA[best];
  }

  // Cuantiza un canvas a EGA con dithering Bayer; el alfa se
  // conserva en 4 niveles (transparencias al estilo de capas).
  function quantize(canvas) {
    const g = canvas.getContext("2d");
    const im = g.getImageData(0, 0, canvas.width, canvas.height);
    const d = im.data;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const a = d[i + 3];
        if (a === 0) continue;
        const t = (BAYER[y & 3][x & 3] / 16 - 0.5) * SPREAD;
        const c = nearestEga(
          Math.max(0, Math.min(255, d[i] + t)),
          Math.max(0, Math.min(255, d[i + 1] + t)),
          Math.max(0, Math.min(255, d[i + 2] + t))
        );
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
        // el color se cuantiza a EGA pero el alfa se conserva:
        // las capas de resplandor mantienen su transparencia suave
      }
    }
    g.putImageData(im, 0, 0);
    return canvas.toDataURL("image/png");
  }

  // Rasteriza un fragmento SVG (coordenadas 960x540) a w x h
  function rasterize(svgInner, w, h, viewW = 960, viewH = 540) {
    return new Promise((resolve, reject) => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
        viewW + ' ' + viewH + '" width="' + w + '" height="' + h + '">' +
        svgInner + "</svg>";
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c);
      };
      img.onerror = reject;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }

  async function bakeSvg(svgInner, w, h, viewW, viewH) {
    return quantize(await rasterize(svgInner, w, h, viewW, viewH));
  }
`;

// ---------- Spritesheet del personaje (dibujado píxel a píxel) ----------
// 5 fotogramas de 16x32 mirando a la derecha: quieto + ciclo de andar
// de 4 pasos (contacto, paso, contacto opuesto, paso). Paleta EGA pura.
const PLAYER_DRAW = `
  function drawPlayerSheet() {
    const C = {
      hat: "#FFFF55", hatDark: "#AA5500",
      skin: "#FF5555", eye: "#000000",
      coat: "#AA0000", coatDark: "#550000",
      belt: "#000000",
      pants: "#0000AA", pantsHi: "#5555FF",
      boot: "#000000",
      outline: "#000000",
    };
    // coatDark #550000 no es EGA puro: usa negro para sombras
    C.coatDark = "#000000";

    const canvas = document.createElement("canvas");
    canvas.width = 80; canvas.height = 32;
    const g = canvas.getContext("2d");
    const px = (f, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(f * 16 + x, y, w, h); };

    // legs[frame] = [ [xIzq, alto, boteCuerpo], [xDer, alto] ]
    // El bote (bounce) sube el cuerpo 1px en los fotogramas de paso.
    const FRAMES = [
      { l: [5, 10], r: [9, 10], arm: 0, b: 0 },  // 0 quieto
      { l: [3, 10], r: [10, 9], arm: 1, b: 0 },  // 1 contacto: izq atrás, der delante levantada
      { l: [6, 10], r: [8, 10], arm: 0, b: 1 },  // 2 paso (piernas juntas, bote)
      { l: [10, 9], r: [3, 10], arm: -1, b: 0 }, // 3 contacto opuesto
      { l: [8, 10], r: [6, 10], arm: 0, b: 1 },  // 4 paso
    ];

    FRAMES.forEach((F, f) => {
      const b = F.b; // bote: todo el cuerpo 1px arriba
      // gorro
      px(f, 5, 1 - b, 7, 1, C.hatDark);
      px(f, 4, 2 - b, 8, 2, C.hat);
      px(f, 4, 4 - b, 10, 1, C.hat); // visera hacia delante
      // cabeza (perfil derecho)
      px(f, 5, 5 - b, 7, 4, C.skin);
      px(f, 10, 6 - b, 1, 1, C.eye); // ojo
      px(f, 5, 9 - b, 6, 1, C.skin); // mentón
      // abrigo
      px(f, 4, 10 - b, 8, 8, C.coat);
      px(f, 4, 10 - b, 1, 8, C.coatDark); // sombra trasera
      // brazo visible (balanceo)
      px(f, 7 + F.arm, 11 - b, 2, 6, C.coat);
      px(f, 7 + F.arm, 17 - b, 2, 1, C.skin); // mano
      // cinturón
      px(f, 4, 18 - b, 8, 1, C.belt);
      // piernas
      const legTop = 19 - b;
      px(f, F.l[0], legTop, 3, F.l[1], C.pants);
      px(f, F.r[0], legTop, 3, F.r[1], C.pantsHi);
      // botas
      px(f, F.l[0], legTop + F.l[1], 3, 2, C.boot);
      px(f, F.r[0], legTop + F.r[1], 3, 2, C.boot);
    });
    return canvas.toDataURL("image/png");
  }
`;

(async () => {
  // CHROMIUM_PATH permite apuntar a un Chromium ya instalado
  const executablePath =
    process.env.CHROMIUM_PATH ||
    (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: GAME_DATA_SRC });
  await page.addScriptTag({ content: PAGE_LIB });
  await page.addScriptTag({ content: PLAYER_DRAW });

  const result = await page.evaluate(async () => {
    const out = { rooms: {}, variants: {}, icons: {}, player: null };
    for (const [id, r] of Object.entries(GAME_DATA.rooms)) {
      out.rooms[id] = await bakeSvg(r.svg, 320, 180);
      if (r.variants) {
        out.variants[id] = [];
        for (const v of r.variants) {
          out.variants[id].push(await bakeSvg(v.svg, 320, 180));
        }
      }
    }
    for (const [id, it] of Object.entries(GAME_DATA.items)) {
      out.icons[id] = await bakeSvg(it.icon, 16, 16, 48, 48);
    }
    out.player = drawPlayerSheet();
    return out;
  });

  await browser.close();

  // game/scenes.js: los gráficos horneados que consume el motor
  const js =
    "/* Generado por tools/bake-scenes.js — NO editar a mano.\n" +
    " * Escenas e iconos en paleta EGA con dithering Bayer, variantes\n" +
    " * como capas PNG con transparencia y spritesheet del personaje. */\n" +
    "const SCENES = " +
    JSON.stringify(result) +
    ";\n";
  fs.writeFileSync(path.join(ROOT, "game/scenes.js"), js);

  // El spritesheet también como PNG suelto, para poder editarlo
  const sheetB64 = result.player.replace(/^data:image\/png;base64,/, "");
  fs.mkdirSync(path.join(ROOT, "game/assets"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "game/assets/player-sheet.png"), Buffer.from(sheetB64, "base64"));

  const kb = (s) => Math.round(s.length / 1024);
  console.log("Salas horneadas:", Object.keys(result.rooms).join(", "));
  console.log("Variantes:", Object.entries(result.variants).map(([k, v]) => `${k}(${v.length})`).join(", "));
  console.log("Iconos:", Object.keys(result.icons).length);
  console.log("game/scenes.js:", kb(js) + " KB");
})();
