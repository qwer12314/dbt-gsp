/* ============================================================
 * EL SECRETO DEL FARO — juego de demostración
 * ------------------------------------------------------------
 * Todo el juego se define aquí de forma declarativa.
 * Cada habitación es un nodo con:
 *   - svg:      la escena dibujada en vectorial (viewBox 960x540)
 *   - hotspots: zonas interactivas con acciones look / use / talk
 *               e "items" (usar objeto del inventario con la zona)
 * Para crear tu propio juego, sustituye este archivo.
 * ============================================================ */

const GAME_DATA = {
  title: "El Secreto del Faro",
  start: "muelle",

  intro: {
    dialog: [
      "Una tormenta se acerca a Punta Bruma. El farero ha desaparecido y el faro lleva tres noches apagado.",
      "Si ningún barco quiere acabar contra las rocas, alguien tendrá que encenderlo esta noche.",
      "Ese alguien, por lo visto, eres tú.",
    ],
  },

  defaults: {
    look: "No ves nada especial.",
    use: "No puedes hacer nada con eso.",
    talk: "No parece muy hablador.",
    cantUseItem: "Eso no funcionaría.",
  },

  items: {
    cuerda: {
      name: "cuerda",
      desc: "Una cuerda vieja pero resistente. Huele a salitre.",
      icon: `<circle cx="24" cy="24" r="14" fill="none" stroke="#c9a227" stroke-width="6"/><circle cx="24" cy="24" r="14" fill="none" stroke="#8a6d1d" stroke-width="2" stroke-dasharray="4 5"/>`,
    },
    aparejos: {
      name: "caja de aparejos",
      desc: "Una caja de pesca llena de anzuelos y sedales. En la tapa pone «R.M.».",
      icon: `<rect x="8" y="18" width="32" height="20" rx="3" fill="#3f7d4e"/><rect x="8" y="18" width="32" height="7" fill="#2c5c38"/><rect x="20" y="12" width="8" height="8" rx="2" fill="none" stroke="#2c5c38" stroke-width="3"/><rect x="21" y="26" width="6" height="5" fill="#c9a227"/>`,
    },
    llave: {
      name: "llave oxidada",
      desc: "Una llave grande y oxidada. Parece la llave de una puerta importante.",
      icon: `<circle cx="16" cy="18" r="8" fill="none" stroke="#a05f2c" stroke-width="5"/><rect x="19" y="21" width="18" height="5" rx="2" fill="#a05f2c" transform="rotate(38 19 21)"/><rect x="30" y="33" width="7" height="4" fill="#a05f2c" transform="rotate(38 30 33)"/>`,
    },
    aceite: {
      name: "lata de aceite",
      desc: "Aceite para lámparas. El depósito está lleno.",
      icon: `<rect x="14" y="18" width="20" height="20" rx="3" fill="#b3443c"/><rect x="20" y="12" width="8" height="8" fill="#8c2f29"/><path d="M32 16 L42 10 L42 15 L34 20 Z" fill="#8c2f29"/><circle cx="24" cy="28" r="5" fill="#e8d9b0"/>`,
    },
    cerillas: {
      name: "cerillas",
      desc: "Una caja de cerillas casi llena. «Fósforos La Sirena».",
      icon: `<rect x="10" y="20" width="28" height="14" rx="2" fill="#31577d"/><rect x="10" y="20" width="28" height="5" fill="#24405c"/><rect x="24" y="8" width="3" height="16" fill="#d9b98a" transform="rotate(20 24 8)"/><circle cx="30" cy="9" r="4" fill="#e2574c"/>`,
    },
    nota: {
      name: "nota del farero",
      desc: "«Tres noches oyendo cantos desde la cueva del sur. Esta vez bajaré a ver. Si alguien lee esto: el aceite de repuesto está en la alacena. Cuidad de mi faro. — El farero»",
      icon: `<rect x="10" y="8" width="28" height="34" rx="2" fill="#e8d9b0"/><g stroke="#8a7a52" stroke-width="2.5"><line x1="15" y1="17" x2="33" y2="17"/><line x1="15" y1="24" x2="33" y2="24"/><line x1="15" y1="31" x2="27" y2="31"/></g>`,
    },
  },

  rooms: {
    /* ================= MUELLE ================= */
    muelle: {
      name: "El muelle",
      svg: `
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#2a3a68"/>
          </linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1d4568"/><stop offset="1" stop-color="#0e2237"/>
          </linearGradient>
        </defs>
        <rect width="960" height="330" fill="url(#sky)"/>
        <g fill="#e8ecff" class="anim-twinkle"><circle cx="90" cy="60" r="2"/><circle cx="210" cy="110" r="1.5"/><circle cx="330" cy="45" r="2"/><circle cx="480" cy="90" r="1.5"/><circle cx="600" cy="40" r="2"/><circle cx="720" cy="120" r="1.5"/><circle cx="860" cy="70" r="2"/><circle cx="150" cy="160" r="1.5"/><circle cx="560" cy="150" r="1.5"/></g>
        <circle cx="790" cy="85" r="42" fill="#f4edd8"/><circle cx="775" cy="75" r="10" fill="#e3dbc2"/><circle cx="805" cy="98" r="7" fill="#e3dbc2"/>
        <rect y="300" width="960" height="240" fill="url(#sea)"/>
        <g stroke="#3d6a94" stroke-width="3" opacity="0.6"><line x1="60" y1="340" x2="180" y2="340"/><line x1="420" y1="365" x2="560" y2="365"/><line x1="740" y1="345" x2="880" y2="345"/><line x1="200" y1="395" x2="330" y2="395"/></g>
        <!-- barca -->
        <g class="anim-sway">
          <path d="M640 330 Q700 372 780 330 L764 302 L656 302 Z" fill="#6b4a2f"/>
          <path d="M640 330 Q700 372 780 330 L774 318 L648 318 Z" fill="#57390f" opacity="0.55"/>
          <rect x="706" y="240" width="6" height="66" fill="#4a3321"/>
        </g>
        <!-- pantalán de madera -->
        <path d="M0 420 L960 420 L960 540 L0 540 Z" fill="#5c4027"/>
        <g stroke="#43301d" stroke-width="4"><line x1="0" y1="452" x2="960" y2="452"/><line x1="0" y1="488" x2="960" y2="488"/><line x1="120" y1="420" x2="110" y2="540"/><line x1="300" y1="420" x2="295" y2="540"/><line x1="500" y1="420" x2="500" y2="540"/><line x1="700" y1="420" x2="706" y2="540"/><line x1="880" y1="420" x2="890" y2="540"/></g>
        <!-- farol -->
        <rect x="70" y="180" width="10" height="245" fill="#2c2c38"/>
        <rect x="56" y="150" width="38" height="42" rx="6" fill="#1d1d28"/>
        <rect x="63" y="158" width="24" height="26" fill="#ffd97a"/>
        <circle cx="75" cy="171" r="34" fill="#ffd97a" opacity="0.14" class="anim-glow"/>
        <!-- pescador sentado -->
        <g>
          <circle cx="560" cy="342" r="16" fill="#d9a066"/>
          <path d="M541 337 Q560 318 579 337 L575 328 Q560 314 545 328 Z" fill="#c9a227"/>
          <rect x="543" y="356" width="36" height="42" rx="8" fill="#31577d"/>
          <rect x="545" y="392" width="44" height="14" rx="6" fill="#24405c"/>
          <line x1="578" y1="360" x2="640" y2="320" stroke="#8a6d1d" stroke-width="4"/>
          <line x1="640" y1="320" x2="648" y2="392" stroke="#cfd6e6" stroke-width="1.5"/>
        </g>
        <!-- cuerda en el suelo -->
        <g id="g-cuerda">
          <circle cx="235" cy="472" r="24" fill="none" stroke="#c9a227" stroke-width="9"/>
          <circle cx="235" cy="472" r="24" fill="none" stroke="#8a6d1d" stroke-width="3" stroke-dasharray="6 7"/>
        </g>
        <!-- salida al sendero -->
        <path d="M900 420 L960 400 L960 540 L905 540 Z" fill="#4b5a3a"/>
        <path d="M918 430 L952 418 M914 470 L950 460 M912 508 L948 500" stroke="#39452c" stroke-width="5"/>
      `,
      hotspots: [
        {
          id: "pescador",
          name: "el pescador",
          shape: { x: 528, y: 316, w: 70, h: 92 },
          look: "Un pescador de gesto tranquilo. No parece tener prisa por volver a casa, ni siquiera con la tormenta acercándose.",
          use: "Mejor no zarandear a un hombre que sujeta anzuelos.",
          talk: {
            if: { flag: "aparejosEntregados" },
            then: {
              dialog: [
                { speaker: "Pescador", text: "¿Aún por aquí? La llave del faro la tenía el viejo farero... aunque dicen que la perdió en el pozo del sendero." },
                { speaker: "Pescador", text: "Date prisa. La tormenta no espera a nadie." },
              ],
            },
            else: {
              dialog: [
                { speaker: "Tú", text: "Buenas noches. El faro lleva días apagado... ¿sabe algo del farero?" },
                { speaker: "Pescador", text: "Desapareció hace tres días. Y yo perdí mi caja de aparejos por el sendero del acantilado, así que cada cual tiene sus penas." },
                { speaker: "Pescador", text: "Tráemela y puede que encuentre algo útil para ti en los bolsillos." },
              ],
            },
          },
          items: {
            aparejos: [
              { removeItem: "aparejos" },
              { addItem: "cerillas" },
              { setFlag: "aparejosEntregados" },
              {
                dialog: [
                  { speaker: "Pescador", text: "¡Mi caja! Sabía que andaría entre los arbustos. Toma, unas cerillas: al farero siempre le hacían falta." },
                  { speaker: "Pescador", text: "Y otra cosa: la llave del faro cayó al pozo del sendero. Necesitarás algo para bajar a por ella." },
                ],
              },
            ],
          },
        },
        {
          id: "cuerda",
          name: "la cuerda",
          shape: { circle: [235, 472, 34, 30] },
          visible: { notFlag: "cuerdaCogida" },
          look: "Un rollo de cuerda abandonado en el pantalán. Vieja, pero resistente.",
          use: [
            { setFlag: "cuerdaCogida" },
            { addItem: "cuerda" },
            "Recoges la cuerda. Nunca se sabe cuándo hará falta una buena cuerda.",
          ],
        },
        {
          id: "barca",
          name: "la barca",
          shape: { x: 636, y: 236, w: 150, h: 122 },
          look: "La barca del pescador. «La Gaviota Coja», según los restos de pintura del casco.",
          use: "Robar la barca de un pescador trae siete años de mala pesca. Mejor no.",
        },
        {
          id: "mar",
          name: "el mar",
          shape: { x: 0, y: 300, w: 600, h: 110 },
          look: "El mar está cada vez más revuelto. A lo lejos, ni rastro de la luz del faro.",
          use: "Está mojado. Confirmado.",
        },
        {
          id: "farol",
          name: "el farol",
          shape: { x: 50, y: 140, w: 50, h: 100 },
          look: "El único farol del muelle. Su luz apenas llega al agua.",
        },
        {
          id: "salida-sendero",
          name: "el sendero",
          shape: { poly: "895,395 960,375 960,540 895,540" },
          look: "Un sendero sube por el acantilado hacia el faro.",
          use: { goto: "sendero" },
        },
      ],
    },

    /* ================= SENDERO ================= */
    sendero: {
      name: "El sendero del acantilado",
      svg: `
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#2a3a68"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#sky2)"/>
        <g fill="#e8ecff" class="anim-twinkle"><circle cx="120" cy="70" r="2"/><circle cx="260" cy="40" r="1.5"/><circle cx="420" cy="90" r="2"/><circle cx="640" cy="50" r="1.5"/><circle cx="840" cy="100" r="2"/><circle cx="500" cy="30" r="1.5"/></g>
        <circle cx="150" cy="90" r="36" fill="#f4edd8"/><circle cx="140" cy="82" r="9" fill="#e3dbc2"/>
        <!-- faro lejano -->
        <g id="g-faro-lejano">
          <path d="M880 120 L904 120 L910 210 L874 210 Z" fill="#cfd6e6"/>
          <rect x="874" y="140" width="36" height="16" fill="#b3443c"/>
          <rect x="874" y="176" width="36" height="16" fill="#b3443c"/>
          <rect x="878" y="104" width="28" height="18" fill="#1d1d28"/>
          <path d="M870 214 L914 214 L918 224 L866 224 Z" fill="#8b93a8"/>
        </g>
        <!-- terreno -->
        <path d="M0 300 Q240 260 480 290 Q720 320 960 280 L960 540 L0 540 Z" fill="#3f4d31"/>
        <path d="M0 380 Q300 350 620 380 Q800 396 960 370 L960 540 L0 540 Z" fill="#2f3a25"/>
        <!-- camino -->
        <path d="M80 540 Q300 430 560 400 Q760 378 940 300 L960 300 L960 320 Q770 400 580 420 Q340 448 180 540 Z" fill="#6d5b3e"/>
        <!-- pozo -->
        <g id="g-pozo">
          <ellipse cx="330" cy="440" rx="80" ry="26" fill="#5a5f6e"/>
          <ellipse cx="330" cy="432" rx="80" ry="26" fill="#7d8496"/>
          <ellipse cx="330" cy="432" rx="52" ry="16" fill="#12141c"/>
          <rect x="262" y="330" width="10" height="104" fill="#57390f"/>
          <rect x="388" y="330" width="10" height="104" fill="#57390f"/>
          <path d="M250 336 L330 296 L410 336 Z" fill="#6b4a2f"/>
          <line x1="330" y1="336" x2="330" y2="410" stroke="#8a6d1d" stroke-width="3"/>
          <rect x="318" y="404" width="24" height="18" rx="3" fill="#8b93a8"/>
        </g>
        <!-- arbusto -->
        <g id="g-arbusto">
          <circle cx="660" cy="470" r="46" fill="#2c5c38"/>
          <circle cx="618" cy="486" r="34" fill="#234a2d"/>
          <circle cx="702" cy="488" r="36" fill="#234a2d"/>
          <circle cx="648" cy="452" r="8" fill="#3f7d4e"/>
          <circle cx="684" cy="466" r="7" fill="#3f7d4e"/>
        </g>
        <!-- cartel -->
        <g id="g-cartel">
          <rect x="132" y="330" width="10" height="90" fill="#57390f"/>
          <rect x="92" y="308" width="92" height="40" rx="4" fill="#8a6240"/>
          <line x1="102" y1="322" x2="174" y2="322" stroke="#43301d" stroke-width="4"/>
          <line x1="102" y1="336" x2="160" y2="336" stroke="#43301d" stroke-width="4"/>
        </g>
      `,
      hotspots: [
        {
          id: "pozo",
          name: "el pozo",
          shape: { x: 246, y: 296, w: 170, h: 170 },
          look: {
            if: { flag: "llaveRecuperada" },
            then: "El viejo pozo. Ya no queda nada ahí abajo salvo agua oscura.",
            else: "Un pozo de piedra. Al fondo se oye agua... y algo metálico brilla junto al cubo hundido.",
          },
          use: {
            if: { flag: "llaveRecuperada" },
            then: "Ya has sacado todo lo que había de valor ahí abajo.",
            else: "Está demasiado profundo. Necesitarías algo para bajar el cubo hasta el fondo.",
          },
          items: {
            cuerda: {
              if: { flag: "llaveRecuperada" },
              then: "No hace falta volver a bajar la cuerda.",
              else: [
                { sfx: "splash" },
                { removeItem: "cuerda" },
                { addItem: "llave" },
                { setFlag: "llaveRecuperada" },
                "Atas la cuerda al cubo y lo bajas hasta el fondo. Tras varios intentos... ¡subes una llave grande y oxidada!",
              ],
            },
          },
        },
        {
          id: "arbusto",
          name: "el arbusto",
          shape: { circle: [660, 472, 92, 62] },
          look: {
            if: { flag: "aparejosEncontrados" },
            then: "Solo ramas y espinas. Ya no hay nada más ahí dentro.",
            else: "Un arbusto espeso. Algo verde y cuadrado asoma entre las ramas...",
          },
          use: {
            if: { flag: "aparejosEncontrados" },
            then: "Solo consigues arañarte. Ahí ya no hay nada.",
            else: [
              { setFlag: "aparejosEncontrados" },
              { addItem: "aparejos" },
              "Apartas las ramas con cuidado y encuentras una caja de aparejos de pesca. ¿De quién será?",
            ],
          },
        },
        {
          id: "cartel",
          name: "el cartel",
          shape: { x: 86, y: 300, w: 104, h: 124 },
          look: "«FARO DE PUNTA BRUMA — 500 m». Debajo, alguien ha escrito con tiza: «Cerrado hasta nuevo aviso».",
          use: "Está bien clavado al poste.",
        },
        {
          id: "faro-lejano",
          name: "el faro a lo lejos",
          shape: { x: 860, y: 96, w: 64, h: 132 },
          look: "Ahí está: el faro de Punta Bruma, apagado como una vela mojada.",
        },
        {
          id: "salida-muelle",
          name: "el muelle",
          shape: { poly: "0,440 90,470 90,540 0,540" },
          look: "El camino baja de vuelta al muelle.",
          use: { goto: "muelle" },
        },
        {
          id: "salida-faro",
          name: "el camino al faro",
          shape: { poly: "880,280 960,250 960,360 880,330" },
          look: "El sendero continúa hasta la base del faro.",
          use: { goto: "faro" },
        },
      ],
    },

    /* ================= EXTERIOR DEL FARO ================= */
    faro: {
      name: "El faro de Punta Bruma",
      svg: `
        <defs>
          <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#2a3a68"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#sky3)"/>
        <g fill="#e8ecff" class="anim-twinkle"><circle cx="100" cy="80" r="2"/><circle cx="220" cy="140" r="1.5"/><circle cx="760" cy="60" r="2"/><circle cx="870" cy="150" r="1.5"/><circle cx="300" cy="50" r="1.5"/></g>
        <circle cx="820" cy="90" r="40" fill="#f4edd8"/><circle cx="808" cy="80" r="10" fill="#e3dbc2"/>
        <!-- terreno rocoso -->
        <path d="M0 430 Q240 400 480 424 Q720 448 960 416 L960 540 L0 540 Z" fill="#3a4152"/>
        <path d="M40 470 L110 430 L190 474 Z" fill="#2b3140"/>
        <path d="M760 480 L830 436 L910 484 Z" fill="#2b3140"/>
        <!-- faro -->
        <g>
          <path d="M400 430 L560 430 L524 120 L436 120 Z" fill="#e8ecf5"/>
          <path d="M414 372 L546 372 L539 314 L421 314 Z" fill="#b3443c"/>
          <path d="M427 256 L533 256 L527 200 L433 200 Z" fill="#b3443c"/>
          <rect x="430" y="96" width="100" height="30" fill="#8b93a8"/>
          <rect x="442" y="46" width="76" height="52" fill="#1d1d28"/>
          <rect x="452" y="54" width="56" height="36" fill="#2e3448"/>
          <path d="M430 46 L530 46 L480 16 Z" fill="#b3443c"/>
          <rect x="424" y="424" width="112" height="14" fill="#8b93a8"/>
        </g>
        <!-- puerta -->
        <g id="g-puerta">
          <path d="M444 430 L516 430 L516 330 Q480 306 444 330 Z" fill="#57390f"/>
          <path d="M452 430 L508 430 L508 335 Q480 314 452 335 Z" fill="#6b4a2f"/>
          <line x1="480" y1="318" x2="480" y2="430" stroke="#43301d" stroke-width="4"/>
          <circle cx="494" cy="384" r="5" fill="#c9a227"/>
          <rect x="472" y="352" width="16" height="22" rx="3" fill="#2c2c38"/>
        </g>
        <!-- gaviota -->
        <g id="g-gaviota" class="anim-bob">
          <ellipse cx="640" cy="410" rx="20" ry="13" fill="#e8ecf5"/>
          <circle cx="657" cy="398" r="8" fill="#e8ecf5"/>
          <path d="M663 396 L674 399 L663 402 Z" fill="#e2a13c"/>
          <circle cx="659" cy="396" r="1.8" fill="#12141c"/>
          <path d="M628 406 Q618 396 624 388 Q632 398 636 402 Z" fill="#cfd6e6"/>
          <line x1="648" y1="422" x2="648" y2="432" stroke="#e2a13c" stroke-width="3"/>
          <line x1="638" y1="422" x2="638" y2="432" stroke="#e2a13c" stroke-width="3"/>
        </g>
      `,
      hotspots: [
        {
          id: "puerta",
          name: "la puerta del faro",
          shape: { x: 440, y: 306, w: 80, h: 128 },
          look: {
            if: { flag: "puertaAbierta" },
            then: "La puerta del faro, ahora abierta. Dentro se adivina una escalera de caracol.",
            else: "Una puerta maciza de roble con una cerradura enorme y oxidada. Está cerrada con llave.",
          },
          use: {
            if: { flag: "puertaAbierta" },
            then: { goto: "interior" },
            else: "Empujas con todas tus fuerzas. La puerta ni se inmuta: está cerrada con llave.",
          },
          items: {
            llave: [
              { sfx: "unlock" },
              { removeItem: "llave" },
              { setFlag: "puertaAbierta" },
              "La llave encaja. La cerradura gira con un chirrido que espanta a la gaviota... La puerta está abierta.",
            ],
          },
        },
        {
          id: "gaviota",
          name: "la gaviota",
          shape: { circle: [648, 408, 42, 34] },
          look: "Una gaviota te observa con el descaro típico de las gaviotas.",
          talk: {
            dialog: [
              { speaker: "Tú", text: "¿Tú no sabrás dónde está el farero, verdad?" },
              { speaker: "Gaviota", text: "¡Uaaark!" },
              { speaker: "Tú", text: "Ya. Eso me temía." },
            ],
          },
          use: "La gaviota esquiva tu mano y te dedica un graznido ofendido.",
        },
        {
          id: "linterna",
          name: "la linterna del faro",
          shape: { x: 430, y: 10, w: 100, h: 110 },
          look: "Allá arriba, la linterna del faro sigue apagada. Esta noche eso tiene que cambiar.",
        },
        {
          id: "rocas",
          name: "las rocas",
          shape: { x: 20, y: 420, w: 200, h: 70 },
          look: "Rocas afiladas como dientes. Sin la luz del faro, más de un casco ha acabado aquí.",
        },
        {
          id: "salida-sendero",
          name: "el sendero",
          shape: { poly: "0,440 80,462 80,540 0,540" },
          look: "El sendero baja de vuelta hacia el pozo y el muelle.",
          use: { goto: "sendero" },
        },
      ],
    },

    /* ================= INTERIOR DEL FARO ================= */
    interior: {
      name: "La sala de la linterna",
      ambience: "interior",
      svg: `
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2e3448"/><stop offset="1" stop-color="#1c2030"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#wall)"/>
        <!-- piedras de la pared -->
        <g stroke="#232838" stroke-width="3" fill="none" opacity="0.8">
          <line x1="0" y1="120" x2="960" y2="120"/><line x1="0" y1="240" x2="960" y2="240"/><line x1="0" y1="360" x2="960" y2="360"/>
          <line x1="160" y1="0" x2="160" y2="120"/><line x1="480" y1="0" x2="480" y2="120"/><line x1="800" y1="0" x2="800" y2="120"/>
          <line x1="320" y1="120" x2="320" y2="240"/><line x1="640" y1="120" x2="640" y2="240"/>
          <line x1="200" y1="240" x2="200" y2="360"/><line x1="760" y1="240" x2="760" y2="360"/>
        </g>
        <rect y="460" width="960" height="80" fill="#43301d"/>
        <g stroke="#332413" stroke-width="4"><line x1="0" y1="486" x2="960" y2="486"/><line x1="0" y1="514" x2="960" y2="514"/></g>
        <!-- ventana -->
        <g id="g-ventana">
          <path d="M700 150 a56 56 0 0 1 112 0 l0 110 l-112 0 Z" fill="#0b1030"/>
          <path d="M708 152 a48 48 0 0 1 96 0 l0 100 l-96 0 Z" fill="#16233f"/>
          <line x1="756" y1="104" x2="756" y2="252" stroke="#43301d" stroke-width="6"/>
          <line x1="708" y1="180" x2="804" y2="180" stroke="#43301d" stroke-width="6"/>
          <circle cx="726" cy="136" r="2" fill="#e8ecff"/><circle cx="782" cy="150" r="1.5" fill="#e8ecff"/>
        </g>
        <!-- escalera de caracol -->
        <g id="g-escalera">
          <path d="M60 460 L200 460 L200 60 L60 60 Z" fill="#171b28"/>
          <g fill="#57390f">
            <path d="M70 440 L190 440 L190 420 L70 428 Z"/>
            <path d="M85 392 L190 384 L190 364 L85 376 Z"/>
            <path d="M70 340 L175 332 L175 312 L70 324 Z"/>
            <path d="M85 288 L190 280 L190 260 L85 272 Z"/>
            <path d="M70 236 L175 228 L175 208 L70 220 Z"/>
            <path d="M85 184 L190 176 L190 156 L85 168 Z"/>
            <path d="M70 132 L175 124 L175 104 L70 116 Z"/>
          </g>
          <line x1="130" y1="60" x2="130" y2="460" stroke="#2c2c38" stroke-width="10"/>
        </g>
        <!-- lámpara del faro -->
        <g id="g-lampara">
          <rect x="420" y="380" width="160" height="80" rx="8" fill="#3a4152"/>
          <rect x="436" y="396" width="128" height="48" rx="6" fill="#2b3140"/>
          <circle cx="500" cy="420" r="14" fill="#12141c"/>
          <path d="M448 380 L552 380 L536 300 L464 300 Z" fill="#8b93a8"/>
          <circle cx="500" cy="252" r="56" fill="#1d1d28"/>
          <circle cx="500" cy="252" r="44" fill="#2e3448"/>
          <circle cx="500" cy="252" r="20" fill="#12141c"/>
          <path d="M470 226 Q500 200 530 226" stroke="#8b93a8" stroke-width="5" fill="none"/>
        </g>
        <!-- alacena -->
        <g id="g-alacena">
          <rect x="640" y="330" width="130" height="130" rx="6" fill="#57390f"/>
          <rect x="648" y="338" width="55" height="114" fill="#6b4a2f"/>
          <rect x="707" y="338" width="55" height="114" fill="#6b4a2f" transform="skewY(0)"/>
          <circle cx="698" cy="396" r="4" fill="#c9a227"/>
          <circle cx="712" cy="396" r="4" fill="#c9a227"/>
          <line x1="648" y1="376" x2="703" y2="376" stroke="#43301d" stroke-width="3"/>
          <line x1="707" y1="376" x2="762" y2="376" stroke="#43301d" stroke-width="3"/>
        </g>
      `,
      hotspots: [
        {
          id: "lampara",
          name: "la lámpara del faro",
          shape: { x: 416, y: 190, w: 168, h: 274 },
          look: {
            if: { flag: "lamparaConAceite" },
            then: "El depósito está lleno de aceite y la mecha, empapada. Solo falta una chispa.",
            else: "La gran lámpara del faro. El depósito de aceite está completamente seco.",
          },
          use: {
            if: { flag: "lamparaConAceite" },
            then: "La mecha está lista. Ahora necesitas fuego.",
            else: "Giras la válvula, pero sin aceite la lámpara no sirve de nada.",
          },
          items: {
            aceite: [
              { removeItem: "aceite" },
              { setFlag: "lamparaConAceite" },
              "Viertes el aceite en el depósito y empapas bien la mecha. La lámpara está lista para arder.",
            ],
            cerillas: {
              if: { flag: "lamparaConAceite" },
              then: [
                { sfx: "match" },
                {
                  dialog: [
                    "Frotas la cerilla. La llama tiembla un instante...",
                    "...y la mecha prende. La luz crece, rebota en los espejos y sale disparada hacia el mar.",
                  ],
                },
                {
                  ending: {
                    title: "¡El faro brilla de nuevo!",
                    text: "El haz de luz barre la costa de Punta Bruma justo cuando los primeros truenos estallan sobre el mar. Esta noche, ningún barco acabará contra las rocas. Puede que el farero siga desaparecido... pero esa ya es otra aventura.",
                  },
                },
              ],
              else: [
                { sfx: "match" },
                "Enciendes una cerilla junto a la mecha seca. Se apaga sin más. Sin aceite, esto no va a arder.",
              ],
            },
          },
        },
        {
          id: "alacena",
          name: "la alacena",
          shape: { x: 634, y: 324, w: 142, h: 142 },
          look: "Una alacena de madera con las puertas entreabiertas. Dentro se ven trastos del farero.",
          use: {
            if: { flag: "aceiteCogido" },
            then: "Solo quedan tazas desportilladas, sedal y un calendario de 1957.",
            else: [
              { setFlag: "aceiteCogido" },
              { addItem: "aceite" },
              "Rebuscas entre los trastos... ¡Una lata de aceite para lámparas, y está llena!",
            ],
          },
        },
        {
          id: "ventana",
          name: "la ventana",
          shape: { x: 694, y: 90, w: 124, h: 176 },
          look: "A través del cristal cubierto de salitre se ve la tormenta acercándose por el horizonte.",
        },
        {
          id: "escalera",
          name: "la escalera de caracol",
          shape: { x: 55, y: 55, w: 150, h: 410 },
          look: {
            if: { flag: "notaEncontrada" },
            then: "La escalera de caracol. Ya no queda nada entre los peldaños sueltos.",
            else: "Una escalera de caracol que sube hasta la galería. Uno de los peldaños está suelto... y parece que hay algo debajo.",
          },
          use: {
            if: { flag: "notaEncontrada" },
            then: "Subes unos peldaños, cruje TODO, y decides que lo importante está aquí abajo: la lámpara.",
            else: [
              { setFlag: "notaEncontrada" },
              { addItem: "nota" },
              "Levantas el peldaño suelto y encuentras un papel doblado. Es la letra del farero.",
            ],
          },
        },
        {
          id: "salida",
          name: "la puerta",
          shape: { poly: "880,300 960,280 960,540 880,540" },
          look: "La puerta de vuelta al exterior del faro.",
          use: { goto: "faro" },
        },
      ],
    },
  },
};
