# El Secreto del Faro — aventura gráfica point-and-click

Una aventura gráfica clásica de apuntar y hacer clic, construida con un **motor propio en
HTML5 + JavaScript puro** (sin dependencias ni proceso de build). Funciona en cualquier
navegador moderno, en escritorio y en móvil.

Dos actos, seis escenas, personaje andante, conversaciones con opciones de respuesta,
música y sonido generativos, puntuación estilo Sierra (135 puntos) y dos idiomas
(español e inglés, botón EN/ES).

**Gráficos estilo Sierra:** pixel art a 320×180 con la paleta EGA de 16 colores y
tramado Bayer 4×4 (el «dithering» de los King's Quest), spritesheet del personaje con
ciclo de andar de 4 fotogramas y capas de resplandor compuestas con transparencia.

## Cómo jugar

Abre `index.html` en el navegador. No hace falta servidor, aunque también puedes usar uno:

```bash
# opción A: doble clic en index.html
# opción B: con un servidor local
python3 -m http.server 8000
# y visita http://localhost:8000
```

**Controles**

| Acción | Cómo |
|---|---|
| Caminar | Clic en cualquier punto de la escena: el personaje va andando |
| Mirar / Usar / Hablar | Botones de verbo (o teclas `1`, `2`, `3`) y clic en la escena |
| Usar objeto con algo | Clic en el objeto del inventario y luego clic en la escena |
| Examinar un objeto | Verbo *Mirar* + clic en el objeto del inventario |
| Responder en un diálogo | Clic en una de las opciones del cuadro de texto |
| Saltar un mensaje | Clic sobre el cuadro de texto |
| Ver las zonas interactivas | Botón *✨ Pistas* o barra espaciadora |
| Idioma | Botón *EN / ES* |
| Sonido / Música | Botones *🔊* y *🎵* (todo sintetizado con WebAudio, sin archivos) |
| Guardar / Cargar | Botones superiores (usa `localStorage`; además hay autoguardado al cambiar de sala) |

**El objetivo:** el farero de Punta Bruma ha desaparecido, una tormenta se acerca y el faro
lleva tres noches apagado. Enciende el faro... y descubre después adónde se llevó el canto
al farero. La puntuación máxima es ⭐ 135/135.

## Arquitectura: motor + datos (estructura de nodos)

El proyecto sigue la misma filosofía que Adventure Game Studio o Adventure Creator:
**el motor es genérico y el juego se define aparte, de forma declarativa**. Cada
habitación es un nodo independiente, lo que facilita añadir o quitar pantallas sin tocar
el resto del juego.

```
index.html          Interfaz (escena, verbos, inventario, mensajes, marcador)
game/styles.css     Estilo de la interfaz, animación ambiental y del personaje
game/engine.js      Motor genérico: nodos, hotspots, personaje andante, verbos,
                    inventario, flags, diálogos con opciones, condicionales,
                    variantes de escena, puntuación, idiomas y guardado
game/audio.js       Sonido: ambiente de mar/viento, música generativa y
                    efectos, todo sintetizado con WebAudio (sin archivos)
game/game-data.js   EL JUEGO: habitaciones, objetos, puzles y textos (es/en)
game/scenes.js      Gráficos horneados (generado): escenas EGA, variantes
                    transparentes, iconos y spritesheet como data URIs
game/assets/        player-sheet.png: el spritesheet del personaje (editable)
tools/bake-scenes.js  Herramienta de horneado: SVG → pixel art EGA
```

### Anatomía de una habitación (nodo)

Los textos son bilingües con el helper `T(español, inglés)`; también se acepta un
string simple si no necesitas traducción.

```js
rooms: {
  miSala: {
    name: T("Nombre visible", "Visible name"),
    ambience: "interior",   // opcional: "interior" o "cave" atenúan el mar y cambian la música
    floor: { xMin: 60, xMax: 900, yMin: 420, yMax: 520 },  // zona transitable del personaje
    spawns: { default: { x: 100, y: 470 }, desdeOtraSala: { x: 860, y: 480, facing: -1 } },
    svg: `... escena dibujada en SVG (viewBox 960x540) ...`,
    variants: [   // capas extra de escena activadas por condición
      { if: { flag: "faroEncendido" }, svg: `<circle .../>` },
    ],
    onEnter: { say: T("Texto al entrar", "Text on entry") },
    hotspots: [
      {
        id: "cofre",
        name: T("el cofre", "the chest"),         // aparece en la barra de estado
        shape: { x: 100, y: 200, w: 80, h: 60 },  // o { circle: [cx,cy,rx,ry] } o { poly: "..." }
        walkTo: { x: 140, y: 470 },               // adónde camina el personaje (opcional)
        visible: { notFlag: "cofreAbierto" },     // condición de visibilidad (opcional)
        look: T("Un cofre viejo.", "An old chest."),
        use:  { if: { hasItem: "llave" }, then: "...", else: T("Está cerrado.", "It's locked.") },
        talk: { choices: [                        // conversación con opciones de respuesta
          { text: T("¿Qué guardas?", "What's inside?"), then: { dialog: [...] } },
          { if: { flag: "pista" }, text: T("...", "..."), then: [...] },  // opción condicional
        ] },
        items: {                                  // usar objeto del inventario con el hotspot
          llave: [ { removeItem: "llave" }, { setFlag: "cofreAbierto" }, { points: 10 }, "¡Abierto!" ],
        },
      },
    ],
  },
}
```

### El mini-lenguaje de acciones

Cualquier acción (`look`, `use`, `talk`, `items.X`, `onEnter`, `intro`) admite:

| Forma | Efecto |
|---|---|
| `"texto"` | Muestra el mensaje |
| `[a, b, c]` | Secuencia de acciones |
| `{ say: "..." }` | Mensaje |
| `{ dialog: [...] }` | Conversación (líneas con `speaker` opcional) |
| `{ addItem / removeItem: "id" }` | Inventario |
| `{ setFlag: "nombre" }` | Activa un flag de estado |
| `{ goto: "sala", at: "spawn" }` | Cambia de nodo (con fundido, autoguardado y punto de aparición) |
| `{ choices: [{text, then, if?}] }` | Opciones de respuesta en un diálogo (anidables) |
| `{ points: 10 }` | Suma puntos al marcador estilo Sierra |
| `{ sfx: "pickup" }` | Efecto de sonido (`pickup`, `unlock`, `match`, `splash`, `magic`, `success`) |
| `{ interlude: { title, text } }` | Pantalla de capítulo con botón «Continuar» |
| `{ if: cond, then: ..., else: ... }` | Condicional |
| `{ once: true, do: ..., otherwise: ... }` | Solo la primera vez |
| `{ ending: { title, text } }` | Pantalla de final |
| `function (api) { ... }` | Lógica libre en JS (la `api` expone `say`, `goto`, `addItem`, `hasItem`, `flag`, `setFlag`, ...) |

Condiciones disponibles: `{ flag }`, `{ notFlag }`, `{ hasItem }`, `{ notItem }`,
`{ all: [...] }`, `{ any: [...] }` o una función `(api) => boolean`.

### La tubería de gráficos (SVG → pixel art EGA)

Las escenas se **dibujan en SVG** (fácil de editar) y se **hornean a pixel art**:

```bash
node tools/bake-scenes.js   # requiere Playwright
```

El horneado rasteriza cada sala a 320×180, cuantiza los colores a la paleta EGA de
16 colores con realce de saturación y tramado ordenado Bayer 4×4, y guarda todo en
`game/scenes.js`. Las **variantes** (el faro encendido, la lámpara ardiendo) se generan
como capas PNG con canal alfa que el motor superpone —transparencias reales sobre el
pixel art— y el **spritesheet del personaje** (5 fotogramas de 16×32, dibujado píxel a
píxel en el propio script) se anima recortando el `viewBox`. Si `game/scenes.js` no
está cargado, el motor usa los SVG vectoriales originales: la versión pixel art es una
capa de presentación, no una dependencia.

### Crear tu propio juego

1. Copia `game/game-data.js` y sustituye título, objetos y habitaciones.
2. Dibuja cada escena como SVG con `viewBox 0 0 960 540` (a mano, exportado de
   Figma/Inkscape, o generado con IA) y pégala en el campo `svg`.
3. Define los hotspots con coordenadas en ese mismo sistema de 960×540.
4. Encadena los puzles con objetos (`items`) y flags (`setFlag` / `if`).

No hay que tocar `engine.js` para nada de esto.

## Verificación

El recorrido completo del juego (todos los puzles hasta el final, más guardar/cargar y
reiniciar) está automatizado con Playwright; el script vive fuera del repo pero puedes
reproducirlo: los hotspots exponen `data-id` en el DOM precisamente para poder testearlos.

## Alternativas con motores existentes

Si prefieres partir de un motor comercial en lugar de este motor propio:

- **Adventure Game Studio (AGS)** — especializado en point-and-click clásico; inventario,
  guardado y movimiento ya resueltos.
- **Unity + Adventure Creator** — el ecosistema más grande; ideal si el proyecto va a crecer.
- **GDevelop** — sin código, editor en el navegador, con asistente de IA integrado.

La estructura de datos de `game-data.js` (habitaciones → hotspots → acciones) se traslada
casi 1:1 a cualquiera de ellos, así que este proyecto también sirve como prototipo jugable
para migrar después.
