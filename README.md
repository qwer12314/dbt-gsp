# El Secreto del Faro — aventura gráfica point-and-click

Una aventura gráfica clásica de apuntar y hacer clic, construida con un **motor propio en
HTML5 + JavaScript puro** (sin dependencias ni proceso de build). Funciona en cualquier
navegador moderno, en escritorio y en móvil.

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
| Mirar / Usar / Hablar | Botones de verbo (o teclas `1`, `2`, `3`) y clic en la escena |
| Usar objeto con algo | Clic en el objeto del inventario y luego clic en la escena |
| Examinar un objeto | Verbo *Mirar* + clic en el objeto del inventario |
| Saltar un mensaje | Clic sobre el cuadro de texto |
| Guardar / Cargar | Botones superiores (usa `localStorage`) |

**El objetivo:** el farero de Punta Bruma ha desaparecido, una tormenta se acerca y el faro
lleva tres noches apagado. Consigue encenderlo antes de que algún barco acabe en las rocas.

## Arquitectura: motor + datos (estructura de nodos)

El proyecto sigue la misma filosofía que Adventure Game Studio o Adventure Creator:
**el motor es genérico y el juego se define aparte, de forma declarativa**. Cada
habitación es un nodo independiente, lo que facilita añadir o quitar pantallas sin tocar
el resto del juego.

```
index.html          Interfaz (escena, verbos, inventario, mensajes)
game/styles.css     Estilo de la interfaz
game/engine.js      Motor genérico: nodos, hotspots, verbos, inventario,
                    flags, diálogos, condicionales, guardado
game/game-data.js   EL JUEGO: habitaciones, objetos, puzles y textos
```

### Anatomía de una habitación (nodo)

```js
rooms: {
  miSala: {
    name: "Nombre visible de la sala",
    svg: `... escena dibujada en SVG (viewBox 960x540) ...`,
    onEnter: { say: "Texto al entrar (opcional)" },
    hotspots: [
      {
        id: "cofre",
        name: "el cofre",                   // aparece en la barra de estado
        shape: { x: 100, y: 200, w: 80, h: 60 },  // o { circle: [cx,cy,rx,ry] } o { poly: "..." }
        visible: { notFlag: "cofreAbierto" },     // condición de visibilidad (opcional)
        look: "Un cofre viejo.",
        use:  { if: { hasItem: "llave" }, then: "...", else: "Está cerrado." },
        talk: { dialog: [ { speaker: "Tú", text: "Hola, cofre." } ] },
        items: {                             // usar objeto del inventario con el hotspot
          llave: [ { removeItem: "llave" }, { setFlag: "cofreAbierto" }, "¡Abierto!" ],
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
| `{ goto: "sala" }` | Cambia de nodo/habitación (con fundido) |
| `{ if: cond, then: ..., else: ... }` | Condicional |
| `{ once: true, do: ..., otherwise: ... }` | Solo la primera vez |
| `{ ending: { title, text } }` | Pantalla de final |
| `function (api) { ... }` | Lógica libre en JS (la `api` expone `say`, `goto`, `addItem`, `hasItem`, `flag`, `setFlag`, ...) |

Condiciones disponibles: `{ flag }`, `{ notFlag }`, `{ hasItem }`, `{ notItem }`,
`{ all: [...] }`, `{ any: [...] }` o una función `(api) => boolean`.

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
