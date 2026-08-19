/* ============================================================
 * EL SECRETO DEL FARO — juego de demostración
 * ------------------------------------------------------------
 * Todo el juego se define aquí de forma declarativa.
 * Cada habitación es un nodo con:
 *   - svg:      la escena en vectorial (viewBox 960x540)
 *   - variants: capas extra de escena activadas por condición
 *   - floor:    zona transitable del personaje
 *   - spawns:   puntos de aparición según por dónde se entra
 *   - hotspots: zonas interactivas (look / use / talk / items)
 * Los textos son bilingües mediante T(español, inglés).
 * Para crear tu propio juego, sustituye este archivo.
 * ============================================================ */

const T = (es, en) => ({ es, en });

// Nombres de personaje reutilizados en los diálogos
const P_TU = T("Tú", "You");
const P_PES = T("Pescador", "Fisherman");
const P_GAV = T("Gaviota", "Seagull");
const P_SIR = T("Sirena", "Mermaid");
const P_FAR = T("Farero", "Keeper");

const GAME_DATA = {
  title: T("El Secreto del Faro", "The Secret of the Lighthouse"),
  start: "muelle",
  maxScore: 135,

  intro: {
    dialog: [
      T(
        "Una tormenta se acerca a Punta Bruma. El farero ha desaparecido y el faro lleva tres noches apagado.",
        "A storm is closing in on Cape Mist. The lighthouse keeper has vanished and the light has been dark for three nights."
      ),
      T(
        "Si ningún barco quiere acabar contra las rocas, alguien tendrá que encenderlo esta noche.",
        "If no ship is to end up on the rocks, someone will have to light it tonight."
      ),
      T("Ese alguien, por lo visto, eres tú.", "That someone, apparently, is you."),
    ],
  },

  defaults: {
    look: T("No ves nada especial.", "You see nothing special."),
    use: T("No puedes hacer nada con eso.", "You can't do anything with that."),
    talk: T("No parece muy hablador.", "Not much of a talker."),
    cantUseItem: T("Eso no funcionaría.", "That wouldn't work."),
  },

  items: {
    cuerda: {
      name: T("cuerda", "rope"),
      desc: T(
        "Una cuerda vieja pero resistente. Huele a salitre.",
        "An old but sturdy rope. It smells of brine."
      ),
      icon: `<circle cx="24" cy="24" r="14" fill="none" stroke="#c9a227" stroke-width="6"/><circle cx="24" cy="24" r="14" fill="none" stroke="#8a6d1d" stroke-width="2" stroke-dasharray="4 5"/>`,
    },
    aparejos: {
      name: T("caja de aparejos", "tackle box"),
      desc: T(
        "Una caja de pesca llena de anzuelos y sedales. En la tapa pone «R.M.».",
        "A fishing box full of hooks and lines. The lid reads “R.M.”."
      ),
      icon: `<rect x="8" y="18" width="32" height="20" rx="3" fill="#3f7d4e"/><rect x="8" y="18" width="32" height="7" fill="#2c5c38"/><rect x="20" y="12" width="8" height="8" rx="2" fill="none" stroke="#2c5c38" stroke-width="3"/><rect x="21" y="26" width="6" height="5" fill="#c9a227"/>`,
    },
    llave: {
      name: T("llave oxidada", "rusty key"),
      desc: T(
        "Una llave grande y oxidada. Parece la llave de una puerta importante.",
        "A big rusty key. It looks like the key to an important door."
      ),
      icon: `<circle cx="16" cy="18" r="8" fill="none" stroke="#a05f2c" stroke-width="5"/><rect x="19" y="21" width="18" height="5" rx="2" fill="#a05f2c" transform="rotate(38 19 21)"/><rect x="30" y="33" width="7" height="4" fill="#a05f2c" transform="rotate(38 30 33)"/>`,
    },
    aceite: {
      name: T("lata de aceite", "oil can"),
      desc: T(
        "Aceite para lámparas. El depósito está lleno.",
        "Lamp oil. The can is full."
      ),
      icon: `<rect x="14" y="18" width="20" height="20" rx="3" fill="#b3443c"/><rect x="20" y="12" width="8" height="8" fill="#8c2f29"/><path d="M32 16 L42 10 L42 15 L34 20 Z" fill="#8c2f29"/><circle cx="24" cy="28" r="5" fill="#e8d9b0"/>`,
    },
    cerillas: {
      name: T("cerillas", "matches"),
      desc: T(
        "Una caja de cerillas casi llena. «Fósforos La Sirena».",
        "A nearly full box of matches. “The Mermaid Matchworks”."
      ),
      icon: `<rect x="10" y="20" width="28" height="14" rx="2" fill="#31577d"/><rect x="10" y="20" width="28" height="5" fill="#24405c"/><rect x="24" y="8" width="3" height="16" fill="#d9b98a" transform="rotate(20 24 8)"/><circle cx="30" cy="9" r="4" fill="#e2574c"/>`,
    },
    nota: {
      name: T("nota del farero", "keeper's note"),
      desc: T(
        "«Tres noches oyendo cantos desde la cala del sur. Esta vez bajaré a ver. Si alguien lee esto: el aceite de repuesto está en la alacena. Cuidad de mi faro. — El farero»",
        "“Three nights now I've heard singing from the southern cove. This time I'll go down and see. If anyone reads this: the spare oil is in the cupboard. Look after my lighthouse. — The keeper”"
      ),
      icon: `<rect x="10" y="8" width="28" height="34" rx="2" fill="#e8d9b0"/><g stroke="#8a7a52" stroke-width="2.5"><line x1="15" y1="17" x2="33" y2="17"/><line x1="15" y1="24" x2="33" y2="24"/><line x1="15" y1="31" x2="27" y2="31"/></g>`,
    },
    candil: {
      name: T("candil de tormenta", "storm lantern"),
      desc: T(
        "El candil del pescador. Su llama aguanta cualquier ventisca.",
        "The fisherman's lantern. Its flame can take any gale."
      ),
      icon: `<rect x="21" y="6" width="6" height="5" fill="#2c2c38"/><path d="M14 11 L34 11 L31 36 L17 36 Z" fill="#1d1d28"/><path d="M18 14 L30 14 L28 33 L20 33 Z" fill="#ffd97a"/><rect x="15" y="36" width="18" height="5" rx="2" fill="#2c2c38"/>`,
    },
    sardina: {
      name: T("sardina", "sardine"),
      desc: T(
        "Una sardina plateada. Huele exactamente como esperarías.",
        "A silvery sardine. It smells exactly as you'd expect."
      ),
      icon: `<path d="M8 24 Q22 12 36 24 Q22 36 8 24 Z" fill="#8b93a8"/><path d="M36 24 L44 17 L44 31 Z" fill="#6b7386"/><circle cx="15" cy="22" r="2" fill="#12141c"/>`,
    },
    peine: {
      name: T("peine de nácar", "mother-of-pearl comb"),
      desc: T(
        "Un peine tallado en nácar. Cambia de color según cómo lo mires, como el interior de una caracola.",
        "A comb carved from mother-of-pearl. It shifts colour as you turn it, like the inside of a seashell."
      ),
      icon: `<path d="M10 18 Q24 8 38 18 L38 24 L10 24 Z" fill="#e8ecf5"/><g stroke="#cfd6e6" stroke-width="3"><line x1="14" y1="24" x2="14" y2="38"/><line x1="20" y1="24" x2="20" y2="40"/><line x1="26" y1="24" x2="26" y2="40"/><line x1="32" y1="24" x2="32" y2="38"/></g><path d="M10 18 Q24 8 38 18 L38 20 Q24 11 10 20 Z" fill="#b8e0dc"/>`,
    },
  },

  rooms: {
    /* ================= MUELLE ================= */
    muelle: {
      name: T("El muelle", "The pier"),
      floor: { xMin: 40, xMax: 900, yMin: 430, yMax: 525 },
      spawns: {
        default: { x: 430, y: 480 },
        fromSendero: { x: 870, y: 470, facing: -1 },
      },
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
          name: T("el pescador", "the fisherman"),
          shape: { x: 528, y: 316, w: 70, h: 92 },
          walkTo: { x: 555, y: 435 },
          look: T(
            "Un pescador de gesto tranquilo. No parece tener prisa por volver a casa, ni siquiera con la tormenta acercándose.",
            "A calm-faced fisherman. He seems in no hurry to head home, storm or no storm."
          ),
          use: T(
            "Mejor no zarandear a un hombre que sujeta anzuelos.",
            "Better not to jostle a man holding fish hooks."
          ),
          talk: {
            choices: [
              {
                text: T("¿Sabe algo del farero?", "Do you know anything about the keeper?"),
                then: {
                  dialog: [
                    {
                      speaker: P_PES,
                      text: T(
                        "Desapareció hace tres noches. Decía que oía cantos desde el sur... Yo ya no bajo a esa cala ni por todo el pescado del mar.",
                        "He vanished three nights ago. Kept saying he heard singing from the south... Me, I don't go down to that cove for all the fish in the sea."
                      ),
                    },
                  ],
                },
              },
              {
                if: { notFlag: "aparejosEntregados" },
                text: T("¿Ha perdido algo?", "Have you lost something?"),
                then: {
                  dialog: [
                    {
                      speaker: P_PES,
                      text: T(
                        "Mi caja de aparejos, por el sendero del acantilado. Tráemela y puede que encuentre algo útil para ti en los bolsillos.",
                        "My tackle box, somewhere along the cliff path. Bring it back and I might find something useful for you in my pockets."
                      ),
                    },
                  ],
                },
              },
              {
                if: { all: [{ flag: "faroEncendido" }, { notFlag: "candilDado" }] },
                text: T("¿Me presta su candil?", "Could you lend me your lantern?"),
                then: [
                  { setFlag: "candilDado" },
                  { addItem: "candil" },
                  { points: 5 },
                  {
                    dialog: [
                      {
                        speaker: P_PES,
                        text: T(
                          "Tómalo. Es un candil de tormenta: ni el viento de la cala lo apaga. Devuélveme al farero de una pieza.",
                          "Take it. It's a storm lantern: not even the cove wind can put it out. Bring the keeper back in one piece."
                        ),
                      },
                    ],
                  },
                ],
              },
              {
                if: { all: [{ flag: "cangrejoVisto" }, { notFlag: "sardinaDada" }] },
                text: T("¿Le sobra alguna sardina?", "Could you spare a sardine?"),
                then: [
                  { setFlag: "sardinaDada" },
                  { addItem: "sardina" },
                  { points: 5 },
                  {
                    dialog: [
                      {
                        speaker: P_PES,
                        text: T(
                          "Toma una. ¿Vas a sobornar a alguien con escamas? No respondas: prefiero no saberlo.",
                          "Here, take one. Bribing someone with scales, are you? Don't answer that: I'd rather not know."
                        ),
                      },
                    ],
                  },
                ],
              },
              {
                text: T("Nada, gracias.", "Nothing, thanks."),
                then: {
                  dialog: [
                    {
                      speaker: P_PES,
                      text: T("Que la luna te guíe, muchacho.", "May the moon light your way, kid."),
                    },
                  ],
                },
              },
            ],
          },
          items: {
            aparejos: [
              { removeItem: "aparejos" },
              { addItem: "cerillas" },
              { setFlag: "aparejosEntregados" },
              { points: 10 },
              {
                dialog: [
                  {
                    speaker: P_PES,
                    text: T(
                      "¡Mi caja! Sabía que andaría entre los arbustos. Toma, unas cerillas: al farero siempre le hacían falta.",
                      "My box! I knew it'd be in those bushes. Here, take these matches: the keeper could never keep hold of his."
                    ),
                  },
                  {
                    speaker: P_PES,
                    text: T(
                      "Y otra cosa: la llave del faro cayó al pozo del sendero. Necesitarás algo para bajar a por ella.",
                      "One more thing: the lighthouse key fell down the well on the path. You'll need something to fish it out."
                    ),
                  },
                ],
              },
            ],
          },
        },
        {
          id: "cuerda",
          name: T("la cuerda", "the rope"),
          shape: { circle: [235, 472, 34, 30] },
          visible: { notFlag: "cuerdaCogida" },
          look: T(
            "Un rollo de cuerda abandonado en el pantalán. Vieja, pero resistente.",
            "A coil of rope left on the pier. Old, but sturdy."
          ),
          use: [
            { setFlag: "cuerdaCogida" },
            { addItem: "cuerda" },
            { points: 5 },
            T(
              "Recoges la cuerda. Nunca se sabe cuándo hará falta una buena cuerda.",
              "You pick up the rope. You never know when a good rope will come in handy."
            ),
          ],
        },
        {
          id: "barca",
          name: T("la barca", "the boat"),
          shape: { x: 636, y: 236, w: 150, h: 122 },
          walkTo: { x: 700, y: 435 },
          look: T(
            "La barca del pescador. «La Gaviota Coja», según los restos de pintura del casco.",
            "The fisherman's boat. “The Limping Gull”, according to what's left of the paint."
          ),
          use: T(
            "Robar la barca de un pescador trae siete años de mala pesca. Mejor no.",
            "Stealing a fisherman's boat brings seven years of bad fishing. Better not."
          ),
        },
        {
          id: "mar",
          name: T("el mar", "the sea"),
          shape: { x: 0, y: 300, w: 600, h: 110 },
          walkTo: { x: 300, y: 435 },
          look: T(
            "El mar está cada vez más revuelto. A lo lejos, ni rastro de la luz del faro.",
            "The sea is getting rougher. Out there, no trace of the lighthouse beam."
          ),
          use: T("Está mojado. Confirmado.", "It's wet. Confirmed."),
        },
        {
          id: "farol",
          name: T("el farol", "the lamp post"),
          shape: { x: 50, y: 140, w: 50, h: 100 },
          walkTo: { x: 100, y: 450 },
          look: T(
            "El único farol del muelle. Su luz apenas llega al agua.",
            "The pier's only lamp. Its light barely reaches the water."
          ),
        },
        {
          id: "salida-sendero",
          name: T("el sendero", "the path"),
          shape: { poly: "895,395 960,375 960,540 895,540" },
          walkTo: { x: 890, y: 480 },
          look: T(
            "Un sendero sube por el acantilado hacia el faro.",
            "A path climbs the cliff towards the lighthouse."
          ),
          use: { goto: "sendero", at: "fromMuelle" },
        },
      ],
    },

    /* ================= SENDERO ================= */
    sendero: {
      name: T("El sendero del acantilado", "The cliff path"),
      floor: { xMin: 40, xMax: 920, yMin: 400, yMax: 525 },
      spawns: {
        default: { x: 70, y: 495 },
        fromMuelle: { x: 70, y: 495 },
        fromFaro: { x: 890, y: 410, facing: -1 },
      },
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
          name: T("el pozo", "the well"),
          shape: { x: 246, y: 296, w: 170, h: 170 },
          walkTo: { x: 330, y: 480 },
          look: {
            if: { flag: "llaveRecuperada" },
            then: T(
              "El viejo pozo. Ya no queda nada ahí abajo salvo agua oscura.",
              "The old well. Nothing left down there but dark water."
            ),
            else: T(
              "Un pozo de piedra. Al fondo se oye agua... y algo metálico brilla junto al cubo hundido.",
              "A stone well. You hear water at the bottom... and something metallic glints beside the sunken bucket."
            ),
          },
          use: {
            if: { flag: "llaveRecuperada" },
            then: T(
              "Ya has sacado todo lo que había de valor ahí abajo.",
              "You've already fished out everything worth having."
            ),
            else: T(
              "Está demasiado profundo. Necesitarías algo para bajar el cubo hasta el fondo.",
              "It's too deep. You'd need something to lower the bucket all the way down."
            ),
          },
          items: {
            cuerda: {
              if: { flag: "llaveRecuperada" },
              then: T(
                "No hace falta volver a bajar la cuerda.",
                "No need to lower the rope again."
              ),
              else: [
                { sfx: "splash" },
                { removeItem: "cuerda" },
                { addItem: "llave" },
                { setFlag: "llaveRecuperada" },
                { points: 10 },
                T(
                  "Atas la cuerda al cubo y lo bajas hasta el fondo. Tras varios intentos... ¡subes una llave grande y oxidada!",
                  "You tie the rope to the bucket and lower it to the bottom. After a few tries... up comes a big rusty key!"
                ),
              ],
            },
          },
        },
        {
          id: "arbusto",
          name: T("el arbusto", "the bush"),
          shape: { circle: [660, 472, 92, 62] },
          walkTo: { x: 600, y: 500 },
          look: {
            if: { flag: "aparejosEncontrados" },
            then: T(
              "Solo ramas y espinas. Ya no hay nada más ahí dentro.",
              "Just twigs and thorns. Nothing else in there."
            ),
            else: T(
              "Un arbusto espeso. Algo verde y cuadrado asoma entre las ramas...",
              "A thick bush. Something green and square is poking out between the branches..."
            ),
          },
          use: {
            if: { flag: "aparejosEncontrados" },
            then: T(
              "Solo consigues arañarte. Ahí ya no hay nada.",
              "You only manage to scratch yourself. There's nothing left."
            ),
            else: [
              { setFlag: "aparejosEncontrados" },
              { addItem: "aparejos" },
              { points: 5 },
              T(
                "Apartas las ramas con cuidado y encuentras una caja de aparejos de pesca. ¿De quién será?",
                "You carefully part the branches and find a fishing tackle box. Whose could it be?"
              ),
            ],
          },
        },
        {
          id: "cartel",
          name: T("el cartel", "the sign"),
          shape: { x: 86, y: 300, w: 104, h: 124 },
          walkTo: { x: 160, y: 440 },
          look: T(
            "«FARO DE PUNTA BRUMA — 500 m». Debajo, alguien ha escrito con tiza: «Cerrado hasta nuevo aviso».",
            "“CAPE MIST LIGHTHOUSE — 500 m”. Below, someone has chalked: “Closed until further notice”."
          ),
          use: T("Está bien clavado al poste.", "It's firmly nailed to the post."),
        },
        {
          id: "faro-lejano",
          name: T("el faro a lo lejos", "the distant lighthouse"),
          shape: { x: 860, y: 96, w: 64, h: 132 },
          walkTo: { x: 860, y: 410 },
          look: T(
            "Ahí está: el faro de Punta Bruma, apagado como una vela mojada.",
            "There it is: the Cape Mist lighthouse, as dark as a wet candle."
          ),
        },
        {
          id: "salida-muelle",
          name: T("el muelle", "the pier"),
          shape: { poly: "0,440 90,470 90,540 0,540" },
          walkTo: { x: 60, y: 500 },
          look: T("El camino baja de vuelta al muelle.", "The path leads back down to the pier."),
          use: { goto: "muelle", at: "fromSendero" },
        },
        {
          id: "salida-faro",
          name: T("el camino al faro", "the way to the lighthouse"),
          shape: { poly: "880,280 960,250 960,360 880,330" },
          walkTo: { x: 900, y: 405 },
          look: T(
            "El sendero continúa hasta la base del faro.",
            "The path continues to the foot of the lighthouse."
          ),
          use: { goto: "faro", at: "fromSendero" },
        },
      ],
    },

    /* ================= EXTERIOR DEL FARO ================= */
    faro: {
      name: T("El faro de Punta Bruma", "The Cape Mist lighthouse"),
      floor: { xMin: 40, xMax: 920, yMin: 430, yMax: 520 },
      spawns: {
        default: { x: 80, y: 480 },
        fromSendero: { x: 80, y: 480 },
        fromInterior: { x: 480, y: 470 },
        fromPlaya: { x: 890, y: 490, facing: -1 },
      },
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
      variants: [
        {
          if: { flag: "faroEncendido" },
          svg: `
            <g>
              <polygon points="518,60 960,10 960,150 528,92" fill="#ffd97a" opacity="0.16"/>
              <rect x="452" y="54" width="56" height="36" fill="#ffd97a"/>
              <circle cx="480" cy="72" r="46" fill="#ffd97a" opacity="0.25" class="anim-glow"/>
            </g>
            <path d="M870 490 Q910 500 960 480 L960 540 L880 540 Z" fill="#5a5244"/>
            <path d="M888 500 L930 494 M894 520 L940 512" stroke="#43301d" stroke-width="4"/>
          `,
        },
      ],
      hotspots: [
        {
          id: "puerta",
          name: T("la puerta del faro", "the lighthouse door"),
          shape: { x: 440, y: 306, w: 80, h: 128 },
          walkTo: { x: 480, y: 460 },
          look: {
            if: { flag: "puertaAbierta" },
            then: T(
              "La puerta del faro, ahora abierta. Dentro se adivina una escalera de caracol.",
              "The lighthouse door, open now. Inside you can just make out a spiral staircase."
            ),
            else: T(
              "Una puerta maciza de roble con una cerradura enorme y oxidada. Está cerrada con llave.",
              "A solid oak door with a huge rusty lock. It's locked."
            ),
          },
          use: {
            if: { flag: "puertaAbierta" },
            then: { goto: "interior", at: "fromFaro" },
            else: T(
              "Empujas con todas tus fuerzas. La puerta ni se inmuta: está cerrada con llave.",
              "You push with all your strength. The door doesn't budge: it's locked."
            ),
          },
          items: {
            llave: [
              { sfx: "unlock" },
              { removeItem: "llave" },
              { setFlag: "puertaAbierta" },
              { points: 10 },
              T(
                "La llave encaja. La cerradura gira con un chirrido que espanta a la gaviota... La puerta está abierta.",
                "The key fits. The lock turns with a screech that startles the seagull... The door is open."
              ),
            ],
          },
        },
        {
          id: "gaviota",
          name: T("la gaviota", "the seagull"),
          shape: { circle: [648, 408, 42, 34] },
          walkTo: { x: 610, y: 450 },
          look: T(
            "Una gaviota te observa con el descaro típico de las gaviotas.",
            "A seagull watches you with typical seagull insolence."
          ),
          talk: {
            dialog: [
              {
                speaker: P_TU,
                text: T(
                  "¿Tú no sabrás dónde está el farero, verdad?",
                  "You wouldn't happen to know where the keeper is, would you?"
                ),
              },
              { speaker: P_GAV, text: T("¡Uaaark!", "Squaaawk!") },
              { speaker: P_TU, text: T("Ya. Eso me temía.", "Right. That's what I was afraid of.") },
            ],
          },
          use: T(
            "La gaviota esquiva tu mano y te dedica un graznido ofendido.",
            "The seagull dodges your hand and gives you an offended squawk."
          ),
        },
        {
          id: "linterna",
          name: T("la linterna del faro", "the lighthouse lantern"),
          shape: { x: 430, y: 10, w: 100, h: 110 },
          walkTo: { x: 480, y: 460 },
          look: {
            if: { flag: "faroEncendido" },
            then: T(
              "¡La linterna arde como un pequeño sol! Su haz barre el mar y la cala del sur.",
              "The lantern blazes like a small sun! Its beam sweeps the sea and the southern cove."
            ),
            else: T(
              "Allá arriba, la linterna del faro sigue apagada. Esta noche eso tiene que cambiar.",
              "Up there, the lantern is still dark. Tonight that has to change."
            ),
          },
        },
        {
          id: "rocas",
          name: T("las rocas", "the rocks"),
          shape: { x: 20, y: 420, w: 200, h: 70 },
          walkTo: { x: 130, y: 490 },
          look: T(
            "Rocas afiladas como dientes. Sin la luz del faro, más de un casco ha acabado aquí.",
            "Rocks as sharp as teeth. Without the light, more than one hull has ended up here."
          ),
        },
        {
          id: "salida-sendero",
          name: T("el sendero", "the path"),
          shape: { poly: "0,440 80,462 80,540 0,540" },
          walkTo: { x: 60, y: 490 },
          look: T(
            "El sendero baja de vuelta hacia el pozo y el muelle.",
            "The path leads back down towards the well and the pier."
          ),
          use: { goto: "sendero", at: "fromFaro" },
        },
        {
          id: "salida-playa",
          name: T("la bajada a la cala", "the way down to the cove"),
          shape: { poly: "870,470 960,450 960,540 880,540" },
          visible: { flag: "faroEncendido" },
          walkTo: { x: 890, y: 500 },
          look: T(
            "La luz del faro ha revelado unos escalones tallados en la roca. Bajan hacia una cala escondida.",
            "The lighthouse beam has revealed steps cut into the rock. They lead down to a hidden cove."
          ),
          use: { goto: "playa", at: "fromFaro" },
        },
      ],
    },

    /* ================= INTERIOR DEL FARO ================= */
    interior: {
      name: T("La sala de la linterna", "The lantern room"),
      ambience: "interior",
      floor: { xMin: 120, xMax: 880, yMin: 400, yMax: 510 },
      spawns: {
        default: { x: 830, y: 470, facing: -1 },
        fromFaro: { x: 830, y: 470, facing: -1 },
      },
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
          <rect x="707" y="338" width="55" height="114" fill="#6b4a2f"/>
          <circle cx="698" cy="396" r="4" fill="#c9a227"/>
          <circle cx="712" cy="396" r="4" fill="#c9a227"/>
          <line x1="648" y1="376" x2="703" y2="376" stroke="#43301d" stroke-width="3"/>
          <line x1="707" y1="376" x2="762" y2="376" stroke="#43301d" stroke-width="3"/>
        </g>
      `,
      variants: [
        {
          if: { flag: "faroEncendido" },
          svg: `
            <circle cx="500" cy="252" r="20" fill="#ffd97a"/>
            <circle cx="500" cy="252" r="60" fill="#ffd97a" opacity="0.2" class="anim-glow"/>
            <circle cx="500" cy="252" r="120" fill="#ffd97a" opacity="0.07"/>
          `,
        },
      ],
      hotspots: [
        {
          id: "lampara",
          name: T("la lámpara del faro", "the lighthouse lamp"),
          shape: { x: 416, y: 190, w: 168, h: 274 },
          walkTo: { x: 500, y: 480 },
          look: {
            if: { flag: "faroEncendido" },
            then: T(
              "La lámpara arde con fuerza. Los espejos lanzan su luz hacia el mar.",
              "The lamp burns bright. The mirrors hurl its light out to sea."
            ),
            else: {
              if: { flag: "lamparaConAceite" },
              then: T(
                "El depósito está lleno de aceite y la mecha, empapada. Solo falta una chispa.",
                "The tank is full of oil and the wick is soaked. All it needs is a spark."
              ),
              else: T(
                "La gran lámpara del faro. El depósito de aceite está completamente seco.",
                "The great lighthouse lamp. The oil tank is bone dry."
              ),
            },
          },
          use: {
            if: { flag: "faroEncendido" },
            then: T("Ya está encendida. Mejor no tocarla.", "It's already lit. Best not to touch it."),
            else: {
              if: { flag: "lamparaConAceite" },
              then: T(
                "La mecha está lista. Ahora necesitas fuego.",
                "The wick is ready. Now you need fire."
              ),
              else: T(
                "Giras la válvula, pero sin aceite la lámpara no sirve de nada.",
                "You turn the valve, but without oil the lamp is useless."
              ),
            },
          },
          items: {
            aceite: [
              { removeItem: "aceite" },
              { setFlag: "lamparaConAceite" },
              { points: 10 },
              T(
                "Viertes el aceite en el depósito y empapas bien la mecha. La lámpara está lista para arder.",
                "You pour the oil into the tank and soak the wick. The lamp is ready to burn."
              ),
            ],
            cerillas: {
              if: { flag: "faroEncendido" },
              then: T("El faro ya está encendido.", "The lighthouse is already lit."),
              else: {
                if: { flag: "lamparaConAceite" },
                then: [
                  { sfx: "match" },
                  { setFlag: "faroEncendido" },
                  { points: 20 },
                  {
                    dialog: [
                      T(
                        "Frotas la cerilla. La llama tiembla un instante...",
                        "You strike the match. The flame trembles for a moment..."
                      ),
                      T(
                        "...y la mecha prende. La luz crece, rebota en los espejos y sale disparada hacia el mar.",
                        "...and the wick catches. The light swells, bounces off the mirrors and shoots out to sea."
                      ),
                      T(
                        "Abajo, entre las rocas, el haz ilumina una cala que la marea escondía. Y desde allí, débil, llega un canto.",
                        "Below, among the rocks, the beam reveals a cove the tide had been hiding. And from it, faintly, comes a song."
                      ),
                    ],
                  },
                  {
                    interlude: {
                      title: T("¡El faro brilla de nuevo!", "The lighthouse shines again!"),
                      text: T(
                        "Punta Bruma vuelve a tener luz... pero el farero sigue ahí fuera. El haz ha descubierto una cala al sur del faro, y con ella, un canto que no es de este mundo. Quizá el pescador pueda ayudarte a bajar hasta allí.",
                        "Cape Mist has its light back... but the keeper is still out there. The beam has uncovered a cove south of the lighthouse, and with it, a song that isn't of this world. Perhaps the fisherman can help you get down there."
                      ),
                    },
                  },
                ],
                else: [
                  { sfx: "match" },
                  T(
                    "Enciendes una cerilla junto a la mecha seca. Se apaga sin más. Sin aceite, esto no va a arder.",
                    "You strike a match next to the dry wick. It just goes out. Without oil, this won't burn."
                  ),
                ],
              },
            },
          },
        },
        {
          id: "alacena",
          name: T("la alacena", "the cupboard"),
          shape: { x: 634, y: 324, w: 142, h: 142 },
          walkTo: { x: 700, y: 470 },
          look: T(
            "Una alacena de madera con las puertas entreabiertas. Dentro se ven trastos del farero.",
            "A wooden cupboard with its doors ajar. Inside you can see the keeper's odds and ends."
          ),
          use: {
            if: { flag: "aceiteCogido" },
            then: T(
              "Solo quedan tazas desportilladas, sedal y un calendario de 1957.",
              "Only chipped mugs, fishing line and a calendar from 1957 remain."
            ),
            else: [
              { setFlag: "aceiteCogido" },
              { addItem: "aceite" },
              { points: 5 },
              T(
                "Rebuscas entre los trastos... ¡Una lata de aceite para lámparas, y está llena!",
                "You rummage through the clutter... A can of lamp oil, and it's full!"
              ),
            ],
          },
        },
        {
          id: "ventana",
          name: T("la ventana", "the window"),
          shape: { x: 694, y: 90, w: 124, h: 176 },
          walkTo: { x: 760, y: 440 },
          look: T(
            "A través del cristal cubierto de salitre se ve la tormenta acercándose por el horizonte.",
            "Through the salt-crusted glass you can see the storm advancing along the horizon."
          ),
        },
        {
          id: "escalera",
          name: T("la escalera de caracol", "the spiral staircase"),
          shape: { x: 55, y: 55, w: 150, h: 410 },
          walkTo: { x: 220, y: 470 },
          look: {
            if: { flag: "notaEncontrada" },
            then: T(
              "La escalera de caracol. Ya no queda nada entre los peldaños sueltos.",
              "The spiral staircase. Nothing left between the loose steps."
            ),
            else: T(
              "Una escalera de caracol que sube hasta la galería. Uno de los peldaños está suelto... y parece que hay algo debajo.",
              "A spiral staircase climbing to the gallery. One of the steps is loose... and there seems to be something underneath."
            ),
          },
          use: {
            if: { flag: "notaEncontrada" },
            then: T(
              "Subes unos peldaños, cruje TODO, y decides que lo importante está aquí abajo: la lámpara.",
              "You climb a few steps, EVERYTHING creaks, and you decide what matters is down here: the lamp."
            ),
            else: [
              { setFlag: "notaEncontrada" },
              { addItem: "nota" },
              { points: 5 },
              T(
                "Levantas el peldaño suelto y encuentras un papel doblado. Es la letra del farero.",
                "You lift the loose step and find a folded paper. It's the keeper's handwriting."
              ),
            ],
          },
        },
        {
          id: "salida",
          name: T("la puerta", "the door"),
          shape: { poly: "880,300 960,280 960,540 880,540" },
          walkTo: { x: 860, y: 480 },
          look: T(
            "La puerta de vuelta al exterior del faro.",
            "The door back outside the lighthouse."
          ),
          use: { goto: "faro", at: "fromInterior" },
        },
      ],
    },

    /* ================= LA CALA DEL SUR ================= */
    playa: {
      name: T("La cala del sur", "The southern cove"),
      floor: { xMin: 60, xMax: 900, yMin: 420, yMax: 520 },
      spawns: {
        default: { x: 100, y: 470 },
        fromFaro: { x: 100, y: 470 },
        fromCueva: { x: 840, y: 480, facing: -1 },
      },
      svg: `
        <defs>
          <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#233158"/>
          </linearGradient>
          <linearGradient id="sea4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1d4568"/><stop offset="1" stop-color="#0e2237"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#sky4)"/>
        <g fill="#e8ecff" class="anim-twinkle"><circle cx="150" cy="60" r="2"/><circle cx="320" cy="100" r="1.5"/><circle cx="540" cy="40" r="2"/><circle cx="700" cy="90" r="1.5"/><circle cx="240" cy="150" r="1.5"/></g>
        <!-- haz del faro cruzando el cielo -->
        <polygon points="0,0 120,0 430,130 330,165" fill="#ffd97a" opacity="0.20"/>
        <polygon points="20,0 95,0 395,135 350,152" fill="#ffe9b0" opacity="0.12"/>
        <!-- mar -->
        <rect y="330" width="960" height="120" fill="url(#sea4)"/>
        <g stroke="#3d6a94" stroke-width="3" opacity="0.6"><line x1="80" y1="360" x2="220" y2="360"/><line x1="380" y1="390" x2="520" y2="390"/><line x1="120" y1="410" x2="240" y2="410"/></g>
        <!-- playa de guijarros -->
        <path d="M0 440 Q240 410 520 430 Q760 448 960 420 L960 540 L0 540 Z" fill="#4a4438"/>
        <g fill="#3a352c"><ellipse cx="150" cy="490" rx="14" ry="6"/><ellipse cx="260" cy="510" rx="10" ry="5"/><ellipse cx="420" cy="480" rx="16" ry="7"/><ellipse cx="560" cy="512" rx="12" ry="5"/><ellipse cx="330" cy="465" rx="9" ry="4"/><ellipse cx="640" cy="470" rx="11" ry="5"/></g>
        <!-- acantilado con boca de cueva -->
        <path d="M700 540 L700 240 Q760 180 850 200 L960 170 L960 540 Z" fill="#2b3140"/>
        <path d="M740 540 L750 380 Q790 330 840 360 L850 540 Z" fill="#12141c"/>
        <path d="M746 540 L756 390 Q790 345 834 372 L842 540 Z" fill="#0a0c14"/>
        <!-- algas -->
        <g id="g-algas" stroke="#2c5c38" stroke-width="5" fill="none">
          <path d="M180 452 Q174 432 182 416"/>
          <path d="M196 454 Q204 434 198 420"/>
          <path d="M210 450 Q206 436 212 424"/>
        </g>
        <!-- cangrejo con algo brillante -->
        <g id="g-cangrejo">
          <ellipse cx="480" cy="500" rx="22" ry="14" fill="#c25542"/>
          <circle cx="472" cy="488" r="4" fill="#12141c"/>
          <circle cx="488" cy="488" r="4" fill="#12141c"/>
          <path d="M458 496 Q444 486 448 474 L456 480 Q452 488 462 492 Z" fill="#a8402f"/>
          <path d="M502 496 Q516 486 512 474 L504 480 Q508 488 498 492 Z" fill="#a8402f"/>
          <g stroke="#a8402f" stroke-width="4"><line x1="462" y1="510" x2="450" y2="518"/><line x1="470" y1="513" x2="462" y2="522"/><line x1="490" y1="513" x2="498" y2="522"/><line x1="498" y1="510" x2="510" y2="518"/></g>
          <path d="M506 476 Q516 468 526 474 L524 480 Q516 476 510 482 Z" fill="#e8ecf5"/>
        </g>
        <!-- escalones tallados de vuelta al faro -->
        <path d="M0 415 L95 438 L95 540 L0 540 Z" fill="#3a4152"/>
        <g stroke="#4a5266" stroke-width="5"><line x1="8" y1="450" x2="74" y2="462"/><line x1="6" y1="478" x2="80" y2="488"/><line x1="4" y1="506" x2="84" y2="514"/></g>
      `,
      hotspots: [
        {
          id: "cangrejo",
          name: T("el cangrejo", "the crab"),
          shape: { circle: [485, 498, 55, 40] },
          walkTo: { x: 430, y: 495 },
          look: [
            { setFlag: "cangrejoVisto" },
            {
              if: { hasItem: "peine" },
              then: T(
                "El cangrejo te mira con rencor. Le has quitado su tesoro.",
                "The crab glares at you. You took its treasure."
              ),
              else: T(
                "Un cangrejo enorme monta guardia sobre algo nacarado que brilla a la luz del faro. No parece dispuesto a soltarlo... salvo, quizá, por un buen bocado.",
                "A huge crab stands guard over something pearly that glints in the lighthouse beam. It doesn't look willing to let go... except, perhaps, for a good bite to eat."
              ),
            },
          ],
          talk: [
            { setFlag: "cangrejoVisto" },
            {
              dialog: [
                {
                  speaker: P_TU,
                  text: T("Hola. ¿Eso que guardas es un peine?", "Hello. Is that a comb you're guarding?"),
                },
                { speaker: T("Cangrejo", "Crab"), text: T("(chasquido, chasquido)", "(click, click)") },
                {
                  speaker: P_TU,
                  text: T(
                    "Entiendo. Negociación dura. Todos tenemos un precio, amigo.",
                    "I see. Hard bargaining. Everyone has a price, my friend."
                  ),
                },
              ],
            },
          ],
          use: [
            { setFlag: "cangrejoVisto" },
            T(
              "Acercas la mano y el cangrejo la recibe con las pinzas por delante. Mensaje captado.",
              "You reach out and the crab greets your hand claws-first. Message received."
            ),
          ],
          items: {
            sardina: [
              { removeItem: "sardina" },
              { addItem: "peine" },
              { points: 10 },
              T(
                "Dejas la sardina en los guijarros. El cangrejo lo medita un segundo, suelta su tesoro y se abalanza sobre la cena. ¡Has conseguido un peine de nácar!",
                "You lay the sardine on the pebbles. The crab thinks it over for a second, drops its treasure and pounces on dinner. You've got a mother-of-pearl comb!"
              ),
            ],
          },
        },
        {
          id: "cueva",
          name: T("la boca de la cueva", "the cave mouth"),
          shape: { poly: "740,540 750,380 790,335 840,365 850,540" },
          walkTo: { x: 700, y: 490 },
          look: T(
            "Una boca oscura en el acantilado. De dentro sale un canto dulce... y frío.",
            "A dark mouth in the cliff. From inside comes a song, sweet... and cold."
          ),
          use: {
            if: { hasItem: "candil" },
            then: [
              T(
                "Con el candil por delante, te adentras en la gruta.",
                "Holding the lantern out in front of you, you step into the grotto."
              ),
              { goto: "cueva", at: "fromPlaya" },
            ],
            else: T(
              "Está negro como boca de lobo, y la brisa marina apagaría cualquier cerilla. Necesitas una luz protegida.",
              "It's pitch black in there, and the sea breeze would kill any match. You need a sheltered light."
            ),
          },
          items: {
            cerillas: T(
              "La brisa marina las apaga una tras otra. Necesitas una llama protegida.",
              "The sea breeze snuffs them out one after another. You need a sheltered flame."
            ),
            candil: [
              T(
                "Con el candil por delante, te adentras en la gruta.",
                "Holding the lantern out in front of you, you step into the grotto."
              ),
              { goto: "cueva", at: "fromPlaya" },
            ],
          },
        },
        {
          id: "algas",
          name: T("las algas", "the seaweed"),
          shape: { x: 168, y: 405, w: 60, h: 55 },
          walkTo: { x: 230, y: 470 },
          look: T(
            "Algas frescas traídas por la marea. Brillan como cintas oscuras.",
            "Fresh seaweed left by the tide. It gleams like dark ribbons."
          ),
          use: T(
            "Blandas y resbaladizas. No, gracias.",
            "Soft and slippery. No, thank you."
          ),
        },
        {
          id: "mar-cala",
          name: T("el mar", "the sea"),
          shape: { x: 0, y: 330, w: 680, h: 100 },
          walkTo: { x: 300, y: 440 },
          look: T(
            "Aquí el agua está extrañamente en calma, como si escuchara el canto.",
            "The water here is strangely calm, as if it were listening to the song."
          ),
        },
        {
          id: "salida-faro",
          name: T("los escalones del faro", "the lighthouse steps"),
          shape: { poly: "0,420 90,440 90,540 0,540" },
          walkTo: { x: 80, y: 470 },
          look: T(
            "Los escalones tallados suben de vuelta al faro.",
            "The carved steps climb back up to the lighthouse."
          ),
          use: { goto: "faro", at: "fromPlaya" },
        },
      ],
    },

    /* ================= LA GRUTA DE LA SIRENA ================= */
    cueva: {
      name: T("La gruta de la sirena", "The mermaid's grotto"),
      ambience: "cave",
      floor: { xMin: 80, xMax: 880, yMin: 430, yMax: 515 },
      spawns: {
        default: { x: 130, y: 480 },
        fromPlaya: { x: 130, y: 480 },
      },
      svg: `
        <rect width="960" height="540" fill="#0a0d16"/>
        <!-- paredes de roca -->
        <path d="M0 0 L960 0 L960 120 Q800 60 640 110 Q400 160 200 100 Q80 70 0 130 Z" fill="#161b2a"/>
        <path d="M0 130 Q120 90 220 140 L200 540 L0 540 Z" fill="#1a2030"/>
        <path d="M960 120 L960 540 L780 540 Q810 300 880 190 Z" fill="#1a2030"/>
        <!-- estalactitas -->
        <g id="g-estalactitas" fill="#232a3e">
          <path d="M300 60 L322 60 L311 150 Z"/>
          <path d="M420 40 L448 40 L434 170 Z"/>
          <path d="M560 55 L580 55 L570 130 Z"/>
          <path d="M660 70 L686 70 L673 190 Z"/>
        </g>
        <!-- suelo -->
        <path d="M0 460 Q240 430 480 450 Q720 470 960 440 L960 540 L0 540 Z" fill="#20263a"/>
        <!-- poza luminosa -->
        <g id="g-poza">
          <ellipse cx="430" cy="430" rx="190" ry="46" fill="#123c3f"/>
          <ellipse cx="430" cy="424" rx="170" ry="38" fill="#1c6e6a"/>
          <ellipse cx="430" cy="421" rx="120" ry="26" fill="#2fd4c8" opacity="0.55" class="anim-glow"/>
          <ellipse cx="430" cy="420" rx="60" ry="13" fill="#7ef0e4" opacity="0.5"/>
          <circle cx="430" cy="380" r="130" fill="#2fd4c8" opacity="0.06"/>
        </g>
        <!-- roca de la sirena -->
        <path d="M360 430 Q400 380 470 400 Q500 412 490 434 Q420 448 360 430 Z" fill="#2b3140"/>
        <!-- sirena -->
        <g id="g-sirena" class="anim-bob">
          <path d="M430 402 Q470 396 496 416 Q510 428 498 434 Q470 424 444 420 Z" fill="#1c8f84"/>
          <path d="M496 416 Q516 404 522 390 Q524 408 510 422 Z" fill="#2fd4c8"/>
          <path d="M418 366 Q430 356 442 366 L440 402 Q430 408 420 402 Z" fill="#d9a066"/>
          <circle cx="430" cy="348" r="13" fill="#d9a066"/>
          <path d="M416 340 Q410 380 422 408 L408 406 Q398 370 408 340 Z" fill="#16655c"/>
          <path d="M444 340 Q452 378 438 408 L452 406 Q462 368 452 340 Z" fill="#16655c"/>
          <path d="M415 342 Q430 324 445 342 Q438 332 430 332 Q422 332 415 342 Z" fill="#16655c"/>
          <path d="M412 348 Q408 376 416 398" stroke="#2fd4c8" stroke-width="2" fill="none" opacity="0.6"/>
          <path d="M448 348 Q452 374 444 398" stroke="#2fd4c8" stroke-width="2" fill="none" opacity="0.6"/>
        </g>
        <!-- farero en trance -->
        <g id="g-farero" class="anim-bob">
          <circle cx="700" cy="360" r="13" fill="#d9a066"/>
          <path d="M687 352 Q700 340 713 352 L713 358 L687 358 Z" fill="#31577d"/>
          <path d="M692 372 Q700 380 708 372 L708 386 Q700 392 692 386 Z" fill="#cfd6e6"/>
          <rect x="685" y="372" width="30" height="46" rx="6" fill="#3a4152"/>
          <rect x="688" y="416" width="10" height="34" fill="#24405c"/>
          <rect x="702" y="416" width="10" height="34" fill="#2c4d6e"/>
          <line x1="689" y1="380" x2="680" y2="404" stroke="#3a4152" stroke-width="6"/>
          <line x1="711" y1="380" x2="720" y2="404" stroke="#3a4152" stroke-width="6"/>
        </g>
        <!-- luz cálida de la entrada -->
        <circle cx="110" cy="470" r="80" fill="#ffd97a" opacity="0.08"/>
      `,
      hotspots: [
        {
          id: "sirena",
          name: T("la sirena", "the mermaid"),
          shape: { x: 396, y: 320, w: 130, h: 120 },
          walkTo: { x: 320, y: 490 },
          look: T(
            "Una sirena de ojos antiguos, sentada en la roca de la poza. Se peina el cabello con los dedos, despacio, como si le faltara algo.",
            "A mermaid with ancient eyes, seated on the rock in the pool. She combs her hair with her fingers, slowly, as if something were missing."
          ),
          use: T(
            "Tocar a una sirena sin permiso acaba mal en todas las canciones.",
            "Touching a mermaid uninvited ends badly in every song ever sung."
          ),
          talk: {
            if: { flag: "peineQuestKnown" },
            then: {
              dialog: [
                {
                  speaker: P_SIR,
                  text: T(
                    "Mi peine, caminante. El mar sabe lo que se llevó... y la playa sabe lo que guarda.",
                    "My comb, walker. The sea knows what it took... and the shore knows what it keeps."
                  ),
                },
              ],
            },
            else: [
              {
                dialog: [
                  {
                    speaker: P_SIR,
                    text: T(
                      "Vaya, vaya. Primero el hombre de la luz, y ahora tú. ¿También vienes a escucharme cantar?",
                      "Well, well. First the man of the light, and now you. Have you also come to hear me sing?"
                    ),
                  },
                ],
              },
              {
                choices: [
                  {
                    text: T("¡Suelta al farero ahora mismo!", "Release the keeper right now!"),
                    then: {
                      dialog: [
                        {
                          speaker: P_SIR,
                          text: T(
                            "(ríe, y su risa suena a olas) Qué valiente. Y qué inútil. Las exigencias se las lleva la marea.",
                            "(she laughs, and her laugh sounds like waves) How brave. And how useless. Demands wash away with the tide."
                          ),
                        },
                      ],
                    },
                  },
                  {
                    text: T("¿Qué le has hecho al farero?", "What have you done to the keeper?"),
                    then: [
                      {
                        dialog: [
                          {
                            speaker: P_SIR,
                            text: T(
                              "¿Hacerle? Nada. Vino siguiendo mi canto, como todos. Su alma tararea conmigo... y conmigo seguirá, hasta que alguien me devuelva lo que el mar me robó.",
                              "Done to him? Nothing. He followed my song, as they all do. His soul hums along with me... and with me it stays, until someone returns what the sea stole from me."
                            ),
                          },
                        ],
                      },
                      {
                        choices: [
                          {
                            text: T("¿Qué te robó el mar?", "What did the sea steal from you?"),
                            then: [
                              { setFlag: "peineQuestKnown" },
                              { points: 10 },
                              {
                                dialog: [
                                  {
                                    speaker: P_SIR,
                                    text: T(
                                      "Mi peine de nácar. Una ola celosa me lo arrancó del cabello, y algo con pinzas lo arrastró a la playa.",
                                      "My mother-of-pearl comb. A jealous wave tore it from my hair, and something with claws dragged it up the shore."
                                    ),
                                  },
                                  {
                                    speaker: P_SIR,
                                    text: T(
                                      "Devuélvemelo y el hombre de la luz volverá a casa. Palabra de sirena.",
                                      "Bring it back to me and the man of the light goes home. A mermaid's word."
                                    ),
                                  },
                                ],
                              },
                            ],
                          },
                          {
                            text: T("A mí no me engañas, sirena.", "You won't fool me, mermaid."),
                            then: {
                              dialog: [
                                {
                                  speaker: P_SIR,
                                  text: T(
                                    "(se encoge de hombros y vuelve a cantar, más alto)",
                                    "(she shrugs and starts singing again, louder)"
                                  ),
                                },
                              ],
                            },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    text: T("Cantas... muy bien.", "You sing... very well."),
                    then: {
                      dialog: [
                        {
                          speaker: P_SIR,
                          text: T(
                            "(sonríe, halagada) Lo sé. Es lo único que el mar no ha podido quitarme.",
                            "(she smiles, flattered) I know. It's the one thing the sea hasn't managed to take from me."
                          ),
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          items: {
            peine: [
              { sfx: "magic" },
              { removeItem: "peine" },
              { setFlag: "fareroLiberado" },
              { points: 25 },
              {
                dialog: [
                  T(
                    "La sirena toma el peine con las dos manos, como quien recoge agua. Se lo pasa por el cabello... y el canto cambia.",
                    "The mermaid takes the comb in both hands, the way one scoops up water. She draws it through her hair... and the song changes."
                  ),
                  {
                    speaker: P_SIR,
                    text: T(
                      "Trato es trato. Llévatelo. Y dile que un farero se debe a su luz, no a la mía.",
                      "A deal is a deal. Take him. And tell him a keeper belongs to his own light, not to mine."
                    ),
                  },
                  {
                    speaker: P_FAR,
                    text: T(
                      "¿Dónde...? ¡El faro! ¿Quién ha encendido el faro?",
                      "Where...? The lighthouse! Who lit the lighthouse?"
                    ),
                  },
                  {
                    speaker: P_TU,
                    text: T(
                      "Es una larga historia. Se la cuento subiendo.",
                      "Long story. I'll tell you on the way up."
                    ),
                  },
                ],
              },
              {
                ending: {
                  title: T("El secreto del faro", "The secret of the lighthouse"),
                  text: T(
                    "El farero despierta del canto y la sirena se hunde en su poza con su peine de nácar. Volvéis juntos bajo el haz del faro: esta noche, Punta Bruma tiene dos guardianes. FIN.",
                    "The keeper wakes from the song and the mermaid sinks into her pool with her mother-of-pearl comb. You climb back together under the lighthouse beam: tonight, Cape Mist has two keepers. THE END."
                  ),
                },
              },
            ],
          },
        },
        {
          id: "farero",
          name: T("el farero", "the keeper"),
          shape: { x: 670, y: 340, w: 60, h: 115 },
          walkTo: { x: 640, y: 480 },
          look: T(
            "El farero, de pie sobre la roca, con la mirada perdida y una sonrisa lejana. Tararea la melodía de la sirena.",
            "The keeper, standing on the rock, eyes lost and a faraway smile. He hums the mermaid's melody."
          ),
          talk: {
            dialog: [
              { speaker: P_TU, text: T("¡Eh! ¿Me oye? ¡Su faro está encendido!", "Hey! Can you hear me? Your lighthouse is lit!") },
              {
                speaker: P_FAR,
                text: T("(tararea, feliz, en otra parte)", "(he hums, happily, somewhere else entirely)"),
              },
            ],
          },
          use: T(
            "Lo zarandeas con cuidado. Nada: su cuerpo está aquí, pero él no.",
            "You shake him gently. Nothing: his body is here, but he isn't."
          ),
        },
        {
          id: "poza",
          name: T("la poza luminosa", "the glowing pool"),
          shape: { circle: [430, 428, 180, 50] },
          walkTo: { x: 300, y: 490 },
          look: T(
            "El agua brilla con luz propia, verde y azul a la vez. En el fondo se adivinan monedas de cien naufragios.",
            "The water glows with its own light, green and blue at once. At the bottom you can make out coins from a hundred shipwrecks."
          ),
          use: T(
            "Metes un dedo. El agua está tibia y te devuelve el reflejo de alguien más guapo. Sirenas.",
            "You dip a finger in. The water is warm and your reflection looks suspiciously more handsome. Mermaids."
          ),
        },
        {
          id: "estalactitas",
          name: T("las estalactitas", "the stalactites"),
          shape: { x: 290, y: 30, w: 400, h: 160 },
          walkTo: { x: 480, y: 500 },
          look: T(
            "Colmillos de piedra que gotean al compás del canto. Mejor no cantar debajo.",
            "Stone fangs dripping in time with the song. Best not to sing beneath them."
          ),
        },
        {
          id: "salida-playa",
          name: T("la salida", "the way out"),
          shape: { poly: "60,400 150,420 150,540 60,540" },
          walkTo: { x: 120, y: 490 },
          look: T(
            "La luz del candil marca el camino de vuelta a la cala.",
            "The lantern light marks the way back to the cove."
          ),
          use: { goto: "playa", at: "fromCueva" },
        },
      ],
    },
  },
};
