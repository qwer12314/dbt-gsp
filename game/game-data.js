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
            <stop offset="0" stop-color="#241058"/><stop offset="1" stop-color="#5b2f9e"/>
          </linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2f6bd0"/><stop offset="1" stop-color="#142f7a"/>
          </linearGradient>
        </defs>
        <rect width="960" height="330" fill="url(#sky)"/>
        <!-- estrellas de destello (4 puntas) -->
        <g fill="#ffd23e" class="anim-twinkle">
          <path d="M90 53 L92 58 L97 60 L92 62 L90 67 L88 62 L83 60 L88 58 Z"/>
          <path d="M210 103 L212 108 L217 110 L212 112 L210 117 L208 112 L203 110 L208 108 Z"/>
          <path d="M330 38 L332 43 L337 45 L332 47 L330 52 L328 47 L323 45 L328 43 Z"/>
          <path d="M480 83 L482 88 L487 90 L482 92 L480 97 L478 92 L473 90 L478 88 Z"/>
          <path d="M600 33 L602 38 L607 40 L602 42 L600 47 L598 42 L593 40 L598 38 Z"/>
          <path d="M150 153 L152 158 L157 160 L152 162 L150 167 L148 162 L143 160 L148 158 Z"/>
          <path d="M560 143 L562 148 L567 150 L562 152 L560 157 L558 152 L553 150 L558 148 Z"/>
        </g>
        <!-- luna cartoon con cara dormida -->
        <g stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <circle cx="800" cy="88" r="48" fill="#ffe9a8"/>
          <circle cx="783" cy="76" r="9" fill="#f0d284" stroke-width="4"/>
          <circle cx="812" cy="108" r="6" fill="#f0d284" stroke-width="4"/>
          <path d="M785 92 Q790 96 795 92 M805 90 Q810 94 815 90" fill="none" stroke-width="4"/>
        </g>
        <!-- mar con horizonte combado -->
        <path d="M0 312 Q480 288 960 316 L960 434 L0 434 Z" fill="url(#sea)" stroke="#14092b" stroke-width="6"/>
        <g stroke="#8fc2ff" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8">
          <path d="M70 352 q22 -14 44 0 q22 14 44 0"/>
          <path d="M420 372 q22 -14 44 0 q22 14 44 0"/>
          <path d="M760 350 q20 -12 40 0"/>
        </g>
        <!-- barca banana -->
        <g class="anim-sway" stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <path d="M700 302 Q694 258 712 236" fill="none" stroke-width="9"/>
          <path d="M700 302 Q694 258 712 236" fill="none" stroke="#8a4a1e" stroke-width="4"/>
          <path d="M712 236 L744 244 L714 254 Z" fill="#d43d2a" stroke-width="4"/>
          <path d="M628 322 Q700 392 792 320 Q762 292 700 296 Q652 298 628 322 Z" fill="#c9772f"/>
          <path d="M640 322 Q700 372 780 320" fill="none" stroke="#7a3f12" stroke-width="4"/>
        </g>
        <!-- pantalán combado -->
        <path d="M0 540 L0 430 Q480 402 960 432 L960 540 Z" fill="#c9772f" stroke="#14092b" stroke-width="7"/>
        <g stroke="#7a3f12" stroke-width="5" stroke-linecap="round" fill="none">
          <path d="M118 424 Q112 480 106 540"/>
          <path d="M300 416 Q297 478 293 540"/>
          <path d="M500 412 Q501 476 502 540"/>
          <path d="M700 416 Q705 478 710 540"/>
          <path d="M880 424 Q888 482 894 540"/>
          <path d="M0 462 Q480 436 960 464"/>
          <path d="M0 502 Q480 480 960 506"/>
        </g>
        <!-- farol torcido como un signo de interrogación -->
        <g stroke="#14092b" stroke-linejoin="round" stroke-linecap="round">
          <path d="M76 425 Q56 300 84 224 Q94 194 74 172" fill="none" stroke-width="14"/>
          <path d="M76 425 Q56 300 84 224 Q94 194 74 172" fill="none" stroke="#3d2868" stroke-width="7"/>
          <circle cx="75" cy="171" r="40" fill="#ffd23e" opacity="0.16" class="anim-glow" stroke="none"/>
          <path d="M52 148 L96 152 L90 194 L58 190 Z" fill="#3d2868" stroke-width="6"/>
          <path d="M60 156 L88 159 L84 186 L64 183 Z" fill="#ffd23e" stroke-width="4"/>
          <path d="M50 146 Q74 132 98 150" fill="none" stroke-width="8"/>
        </g>
        <!-- pescador cartoon dormitando -->
        <g stroke="#14092b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
          <path d="M578 358 Q636 296 654 320" fill="none" stroke-width="7"/>
          <path d="M578 358 Q636 296 654 320" fill="none" stroke="#8a4a1e" stroke-width="3"/>
          <path d="M654 320 Q658 358 652 384" fill="none" stroke="#cfd6e6" stroke-width="2"/>
          <circle cx="652" cy="388" r="7" fill="#d43d2a" stroke-width="4"/>
          <path d="M540 362 Q560 348 584 362 Q592 392 580 404 Q558 412 546 402 Q534 386 540 362 Z" fill="#2f7a4f"/>
          <path d="M548 400 Q544 420 552 432 M574 402 Q578 420 572 432" fill="none" stroke-width="7"/>
          <ellipse cx="551" cy="436" rx="9" ry="5" fill="#14092b"/>
          <ellipse cx="572" cy="436" rx="9" ry="5" fill="#14092b"/>
          <circle cx="560" cy="338" r="17" fill="#f2b98a"/>
          <ellipse cx="576" cy="342" rx="8" ry="6" fill="#f2a170" stroke-width="4"/>
          <path d="M550 340 Q554 344 558 340 M562 338 Q566 342 570 338" fill="none" stroke-width="3"/>
          <path d="M536 330 Q560 306 586 330 L582 320 Q560 300 540 320 Z" fill="#e0a93c"/>
        </g>
        <!-- cuerda en el suelo -->
        <g id="g-cuerda">
          <circle cx="235" cy="472" r="26" fill="none" stroke="#14092b" stroke-width="15"/>
          <circle cx="235" cy="472" r="26" fill="none" stroke="#e0a93c" stroke-width="9"/>
          <circle cx="235" cy="472" r="12" fill="none" stroke="#14092b" stroke-width="10"/>
          <circle cx="235" cy="472" r="12" fill="none" stroke="#c98e2f" stroke-width="5"/>
        </g>
        <!-- salida al sendero -->
        <path d="M898 410 Q928 398 960 388 L960 540 L893 540 Z" fill="#3f7a2f" stroke="#14092b" stroke-width="6"/>
        <g stroke="#2c5c1e" stroke-width="4" fill="none" stroke-linecap="round">
          <path d="M916 440 q6 -10 12 0 q6 -10 12 0"/>
          <path d="M912 490 q6 -10 12 0 q6 -10 12 0"/>
        </g>
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
            <stop offset="0" stop-color="#241058"/><stop offset="1" stop-color="#5b2f9e"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#sky2)"/>
        <g fill="#ffd23e" class="anim-twinkle">
          <path d="M260 33 L262 38 L267 40 L262 42 L260 47 L258 42 L253 40 L258 38 Z"/>
          <path d="M420 83 L422 88 L427 90 L422 92 L420 97 L418 92 L413 90 L418 88 Z"/>
          <path d="M640 43 L642 48 L647 50 L642 52 L640 57 L638 52 L633 50 L638 48 Z"/>
          <path d="M840 93 L842 98 L847 100 L842 102 L840 107 L838 102 L833 100 L838 98 Z"/>
          <path d="M500 23 L502 28 L507 30 L502 32 L500 37 L498 32 L493 30 L498 28 Z"/>
        </g>
        <g stroke="#14092b" stroke-width="5" stroke-linejoin="round">
          <circle cx="150" cy="88" r="38" fill="#ffe9a8"/>
          <circle cx="138" cy="78" r="8" fill="#f0d284" stroke-width="3"/>
        </g>
        <!-- faro lejano, torcido incluso de lejos -->
        <g id="g-faro-lejano" stroke="#14092b" stroke-width="5" stroke-linejoin="round">
          <path d="M884 118 Q902 116 906 120 Q918 166 916 210 L872 210 Q872 162 884 118 Z" fill="#f7ead0"/>
          <path d="M876 144 Q896 138 912 146 L913 162 Q894 154 875 160 Z" fill="#e04a33" stroke-width="4"/>
          <path d="M874 182 Q896 176 914 184 L915 198 Q894 190 873 196 Z" fill="#e04a33" stroke-width="4"/>
          <path d="M882 104 L910 104 L906 120 L884 120 Z" fill="#2c1b4d"/>
          <path d="M878 98 Q896 88 912 100 Z" fill="#e04a33" stroke-width="4"/>
          <path d="M866 214 Q894 206 920 216 L922 226 L864 226 Z" fill="#7a5a9e" stroke-width="4"/>
        </g>
        <!-- colinas onduladas -->
        <path d="M0 302 Q240 254 480 292 Q720 328 960 276 L960 540 L0 540 Z" fill="#3f7a2f" stroke="#14092b" stroke-width="6"/>
        <path d="M0 384 Q300 348 620 384 Q800 402 960 368 L960 540 L0 540 Z" fill="#2c5c1e" stroke="#14092b" stroke-width="6"/>
        <!-- camino en S exagerada -->
        <path d="M70 540 Q310 424 560 398 Q770 376 936 298 L960 296 L960 320 Q780 402 584 422 Q350 450 190 540 Z" fill="#c98e2f" stroke="#14092b" stroke-width="6"/>
        <g stroke="#8a5a1a" stroke-width="4" fill="none" stroke-linecap="round">
          <path d="M240 500 q14 -8 28 0"/>
          <path d="M420 448 q14 -8 28 0"/>
          <path d="M640 414 q12 -7 24 0"/>
        </g>
        <!-- pozo torcido de cuento -->
        <g id="g-pozo" stroke="#14092b" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
          <path d="M268 434 Q256 328 274 322" fill="none" stroke-width="11"/>
          <path d="M268 434 Q256 328 274 322" fill="none" stroke="#8a4a1e" stroke-width="5"/>
          <path d="M392 434 Q406 330 388 322" fill="none" stroke-width="11"/>
          <path d="M392 434 Q406 330 388 322" fill="none" stroke="#8a4a1e" stroke-width="5"/>
          <path d="M244 340 Q330 280 416 342 Q400 316 330 302 Q262 314 244 340 Z" fill="#a8562a"/>
          <path d="M330 330 Q326 372 330 408" fill="none" stroke="#e0a93c" stroke-width="4" stroke-dasharray="8 6"/>
          <path d="M314 402 Q330 396 346 402 L344 424 Q330 430 316 424 Z" fill="#7a5a9e"/>
          <path d="M248 434 Q246 480 262 500 Q330 512 400 500 Q414 478 412 434 Z" fill="#8a68b8"/>
          <path d="M272 462 q16 -8 32 0 M334 468 q16 -8 32 0 M300 488 q14 -7 28 0" fill="none" stroke="#5b3f7e" stroke-width="4"/>
          <ellipse cx="330" cy="440" rx="84" ry="28" fill="#5b3f7e"/>
          <ellipse cx="330" cy="430" rx="84" ry="28" fill="#8a68b8"/>
          <ellipse cx="330" cy="430" rx="52" ry="17" fill="#14092b"/>
          <path d="M262 448 q12 -10 24 0 M312 456 q12 -10 24 0 M362 448 q12 -10 24 0" fill="none" stroke="#5b3f7e" stroke-width="4"/>
        </g>
        <!-- arbusto nube -->
        <g id="g-arbusto" stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <path d="M614 500 Q596 462 628 448 Q636 420 668 428 Q700 416 712 444 Q740 456 724 490 Q712 512 680 508 Q644 516 614 500 Z" fill="#2f7a4f"/>
          <circle cx="648" cy="454" r="7" fill="#d43d2a" stroke-width="4"/>
          <circle cx="686" cy="468" r="6" fill="#d43d2a" stroke-width="4"/>
          <circle cx="664" cy="486" r="6" fill="#d43d2a" stroke-width="4"/>
        </g>
        <!-- cartel doblado -->
        <g id="g-cartel" stroke="#14092b" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
          <path d="M136 420 Q128 372 140 330" fill="none" stroke-width="11"/>
          <path d="M136 420 Q128 372 140 330" fill="none" stroke="#8a4a1e" stroke-width="5"/>
          <path d="M94 306 L186 314 L180 352 L90 342 Z" fill="#c9772f"/>
          <path d="M102 320 Q140 322 172 326 M102 332 Q128 334 152 336" fill="none" stroke="#7a3f12" stroke-width="4"/>
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
            <stop offset="0" stop-color="#241058"/><stop offset="1" stop-color="#5b2f9e"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#sky3)"/>
        <g fill="#ffd23e" class="anim-twinkle">
          <path d="M100 73 L102 78 L107 80 L102 82 L100 87 L98 82 L93 80 L98 78 Z"/>
          <path d="M220 133 L222 138 L227 140 L222 142 L220 147 L218 142 L213 140 L218 138 Z"/>
          <path d="M760 53 L762 58 L767 60 L762 62 L760 67 L758 62 L753 60 L758 58 Z"/>
          <path d="M870 143 L872 148 L877 150 L872 152 L870 157 L868 152 L863 150 L868 148 Z"/>
          <path d="M300 43 L302 48 L307 50 L302 52 L300 57 L298 52 L293 50 L298 48 Z"/>
        </g>
        <g stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <circle cx="828" cy="88" r="42" fill="#ffe9a8"/>
          <circle cx="814" cy="78" r="9" fill="#f0d284" stroke-width="4"/>
        </g>
        <!-- suelo rocoso púrpura -->
        <path d="M0 432 Q240 398 480 426 Q720 452 960 414 L960 540 L0 540 Z" fill="#4a3a6e" stroke="#14092b" stroke-width="6"/>
        <path d="M36 478 Q70 420 116 434 Q160 446 190 480 Z" fill="#352457" stroke="#14092b" stroke-width="6"/>
        <path d="M756 484 Q800 424 856 440 Q896 452 914 488 Z" fill="#352457" stroke="#14092b" stroke-width="6"/>
        <!-- faro panzudo e inclinado -->
        <g stroke="#14092b" stroke-width="7" stroke-linejoin="round">
          <path d="M398 430 Q380 280 442 122 L520 118 Q586 276 564 430 Q480 452 398 430 Z" fill="#f7ead0"/>
          <path d="M408 376 Q480 398 552 372 Q550 340 546 318 Q478 342 414 316 Q410 344 408 376 Z" fill="#e04a33" stroke-width="6"/>
          <path d="M424 258 Q484 280 538 254 Q535 228 531 206 Q482 226 430 204 Q426 228 424 258 Z" fill="#e04a33" stroke-width="6"/>
          <path d="M424 122 Q480 100 536 120 L540 96 Q480 76 420 98 Z" fill="#7a5a9e" stroke-width="6"/>
          <path d="M436 94 L524 92 L518 44 L444 46 Z" fill="#2c1b4d"/>
          <path d="M448 86 L512 84 L508 52 L454 54 Z" fill="#3d2868" stroke-width="4"/>
          <path d="M430 46 Q480 4 532 44 Q506 24 480 24 Q454 24 430 46 Z" fill="#e04a33"/>
          <circle cx="481" cy="14" r="7" fill="#ffd23e" stroke-width="4"/>
          <path d="M416 434 Q480 456 546 432 L542 418 Q480 438 420 420 Z" fill="#7a5a9e" stroke-width="5"/>
        </g>
        <!-- puerta enorme y torcida -->
        <g id="g-puerta" stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <path d="M440 432 L520 430 L518 332 Q478 300 444 334 Z" fill="#8a4a1e"/>
          <path d="M450 428 L510 426 L508 338 Q478 312 452 340 Z" fill="#a8562a"/>
          <path d="M479 320 Q480 372 480 426" fill="none" stroke="#7a3f12" stroke-width="4"/>
          <circle cx="496" cy="384" r="7" fill="#ffd23e" stroke-width="4"/>
          <path d="M462 350 L482 348 L481 376 L462 378 Z" fill="#2c1b4d" stroke-width="4"/>
          <path d="M452 356 q-8 4 0 10 M452 396 q-8 4 0 10" fill="none" stroke-width="4"/>
        </g>
        <!-- gaviota cartoon -->
        <g id="g-gaviota" class="anim-bob" stroke="#14092b" stroke-width="4" stroke-linejoin="round">
          <path d="M622 416 Q638 394 662 404 Q674 410 668 420 Q646 428 622 416 Z" fill="#f3ecff"/>
          <circle cx="662" cy="396" r="10" fill="#f3ecff"/>
          <path d="M670 393 L688 397 L670 402 Z" fill="#ffb52e"/>
          <circle cx="662" cy="393" r="3.4" fill="#fff"/>
          <circle cx="663" cy="393" r="1.6" fill="#14092b" stroke="none"/>
          <path d="M646 424 Q645 432 644 436 M656 424 Q657 432 658 436" fill="none" stroke="#ffb52e" stroke-width="4"/>
        </g>
      `,
      variants: [
        {
          if: { flag: "faroEncendido" },
          svg: `
            <g>
              <path d="M516 56 Q740 -6 960 8 L960 150 Q740 140 528 94 Z" fill="#ffd23e" opacity="0.22"/>
              <path d="M452 86 L512 84 L508 52 L454 54 Z" fill="#ffd23e" stroke="#14092b" stroke-width="4"/>
              <circle cx="480" cy="70" r="52" fill="#ffd23e" opacity="0.28" class="anim-glow"/>
            </g>
            <path d="M866 486 Q908 500 960 478 L960 540 L876 540 Z" fill="#8a68b8" stroke="#14092b" stroke-width="6"/>
            <path d="M886 500 Q912 496 934 492 M892 520 Q918 516 942 510" stroke="#5b3f7e" stroke-width="5" fill="none" stroke-linecap="round"/>
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
            <stop offset="0" stop-color="#4a2d73"/><stop offset="1" stop-color="#2c1b4d"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#wall)"/>
        <!-- sillares combados -->
        <g stroke="#14092b" stroke-width="4" fill="none" opacity="0.75" stroke-linecap="round">
          <path d="M0 118 Q480 132 960 114"/>
          <path d="M0 238 Q480 224 960 242"/>
          <path d="M0 358 Q480 372 960 352"/>
          <path d="M160 0 Q168 60 158 118 M480 0 Q472 60 482 124 M800 0 Q810 58 798 116"/>
          <path d="M320 126 Q312 180 322 234 M640 122 Q650 178 638 232"/>
          <path d="M200 240 Q208 300 198 356 M760 236 Q750 298 762 360"/>
        </g>
        <!-- suelo mostaza combado -->
        <path d="M0 452 Q480 476 960 448 L960 540 L0 540 Z" fill="#c98e2f" stroke="#14092b" stroke-width="6"/>
        <g stroke="#8a5a1a" stroke-width="4" fill="none" stroke-linecap="round">
          <path d="M0 488 Q480 508 960 484"/>
          <path d="M0 518 Q480 532 960 514"/>
        </g>
        <!-- ventana de ojo de cerradura -->
        <g id="g-ventana" stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <path d="M696 152 Q702 96 756 94 Q812 96 816 154 Q820 210 812 262 L700 260 Q694 206 696 152 Z" fill="#8a4a1e"/>
          <path d="M706 154 Q712 106 756 104 Q802 106 806 156 Q809 206 803 252 L709 250 Q703 202 706 154 Z" fill="#241058"/>
          <path d="M756 104 Q752 178 756 250 M706 178 Q756 188 806 178" fill="none" stroke="#8a4a1e" stroke-width="6"/>
          <path d="M726 130 L728 135 L733 137 L728 139 L726 144 L724 139 L719 137 L724 135 Z" fill="#ffd23e" stroke="none"/>
          <path d="M782 146 L784 151 L789 153 L784 155 L782 160 L780 155 L775 153 L780 151 Z" fill="#ffd23e" stroke="none"/>
        </g>
        <!-- escalera de caracol vertiginosa -->
        <g id="g-escalera" stroke="#14092b" stroke-width="5" stroke-linejoin="round">
          <path d="M58 460 Q52 260 66 60 L198 62 Q208 262 202 460 Z" fill="#241058"/>
          <g fill="#a8562a">
            <path d="M66 442 Q130 452 194 438 L192 416 Q130 430 68 420 Z"/>
            <path d="M84 390 Q140 398 196 384 L194 362 Q140 376 86 368 Z"/>
            <path d="M66 336 Q124 344 180 330 L178 310 Q124 322 68 314 Z"/>
            <path d="M84 284 Q140 292 196 278 L194 258 Q140 270 86 262 Z"/>
            <path d="M66 232 Q124 240 180 226 L178 206 Q124 218 68 210 Z"/>
            <path d="M84 180 Q140 188 196 174 L194 154 Q140 166 86 158 Z"/>
            <path d="M66 128 Q124 136 180 122 L178 102 Q124 114 68 106 Z"/>
          </g>
          <path d="M132 62 Q124 260 132 458" fill="none" stroke-width="12"/>
          <path d="M132 62 Q124 260 132 458" fill="none" stroke="#5b3f7e" stroke-width="6"/>
        </g>
        <!-- gran lámpara de latón -->
        <g id="g-lampara" stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <path d="M414 384 Q500 366 586 382 Q592 428 582 458 Q500 476 420 460 Q408 424 414 384 Z" fill="#7a5a9e"/>
          <path d="M438 400 Q500 388 562 398 L558 444 Q500 454 442 446 Z" fill="#3d2868" stroke-width="5"/>
          <circle cx="500" cy="422" r="15" fill="#14092b"/>
          <circle cx="500" cy="422" r="6" fill="#ffb52e" stroke-width="3"/>
          <path d="M452 384 Q446 330 466 300 L534 298 Q556 330 548 382 Q500 394 452 384 Z" fill="#e0a93c"/>
          <path d="M470 336 Q500 328 530 334" fill="none" stroke="#8a5a1a" stroke-width="4"/>
          <circle cx="500" cy="250" r="60" fill="#e0a93c"/>
          <circle cx="500" cy="250" r="45" fill="#2c1b4d"/>
          <circle cx="500" cy="250" r="20" fill="#14092b"/>
          <path d="M464 216 Q500 186 536 216" fill="none" stroke="#e0a93c" stroke-width="7"/>
          <path d="M500 190 Q498 172 508 164" fill="none" stroke-width="7"/>
          <circle cx="512" cy="160" r="7" fill="#e0a93c" stroke-width="4"/>
        </g>
        <!-- alacena ladeada -->
        <g id="g-alacena" stroke="#14092b" stroke-width="6" stroke-linejoin="round">
          <path d="M636 334 L774 324 L778 458 L644 464 Z" fill="#8a4a1e"/>
          <path d="M648 342 L700 338 L704 452 L652 455 Z" fill="#a8562a"/>
          <path d="M710 338 L764 334 L768 450 L714 452 Z" fill="#a8562a"/>
          <circle cx="702" cy="396" r="5" fill="#ffd23e" stroke-width="4"/>
          <circle cx="716" cy="395" r="5" fill="#ffd23e" stroke-width="4"/>
          <path d="M652 378 Q676 374 700 376 M714 375 Q740 372 764 374" fill="none" stroke="#7a3f12" stroke-width="4"/>
        </g>
      `,
      variants: [
        {
          if: { flag: "faroEncendido" },
          svg: `
            <circle cx="500" cy="250" r="20" fill="#ffd23e" stroke="#14092b" stroke-width="4"/>
            <circle cx="500" cy="250" r="64" fill="#ffd23e" opacity="0.25" class="anim-glow"/>
            <circle cx="500" cy="250" r="130" fill="#ffd23e" opacity="0.08"/>
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
            <stop offset="0" stop-color="#1c1033"/><stop offset="1" stop-color="#3f1f5c"/>
          </linearGradient>
          <linearGradient id="sea4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2c7a3f"/><stop offset="1" stop-color="#123a26"/>
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#sky4)"/>
        <g fill="#8ef26f" class="anim-twinkle">
          <path d="M150 53 L152 58 L157 60 L152 62 L150 67 L148 62 L143 60 L148 58 Z"/>
          <path d="M320 93 L322 98 L327 100 L322 102 L320 107 L318 102 L313 100 L318 98 Z"/>
          <path d="M540 33 L542 38 L547 40 L542 42 L540 47 L538 42 L533 40 L538 38 Z"/>
          <path d="M700 83 L702 88 L707 90 L702 92 L700 97 L698 92 L693 90 L698 88 Z"/>
          <path d="M240 143 L242 148 L247 150 L242 152 L240 157 L238 152 L233 150 L238 148 Z"/>
        </g>
        <!-- haz del faro cruzando el cielo -->
        <path d="M0 0 L128 0 Q300 60 434 128 L330 168 Q160 90 0 24 Z" fill="#ffd23e" opacity="0.22"/>
        <!-- mar verdoso, extrañamente en calma -->
        <path d="M0 334 Q340 320 680 338 L680 434 L0 434 Z" fill="url(#sea4)" stroke="#14092b" stroke-width="6"/>
        <g stroke="#8ef26f" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7">
          <path d="M90 362 q20 -12 40 0 q20 12 40 0"/>
          <path d="M390 392 q20 -12 40 0"/>
          <path d="M140 412 q18 -10 36 0"/>
        </g>
        <!-- playa de guijarros -->
        <path d="M0 438 Q240 408 520 430 Q760 450 960 418 L960 540 L0 540 Z" fill="#5b4a7e" stroke="#14092b" stroke-width="6"/>
        <g fill="#463763" stroke="#14092b" stroke-width="3">
          <ellipse cx="150" cy="490" rx="16" ry="7"/><ellipse cx="260" cy="510" rx="12" ry="6"/>
          <ellipse cx="420" cy="480" rx="18" ry="8"/><ellipse cx="560" cy="512" rx="14" ry="6"/>
          <ellipse cx="330" cy="465" rx="10" ry="5"/><ellipse cx="640" cy="470" rx="13" ry="6"/>
        </g>
        <!-- acantilado púrpura con boca de cueva -->
        <path d="M700 540 L702 244 Q756 172 852 198 L960 166 L960 540 Z" fill="#5b2f7e" stroke="#14092b" stroke-width="7"/>
        <g stroke="#3f1f5c" stroke-width="5" fill="none" stroke-linecap="round">
          <path d="M726 300 Q790 280 860 292"/>
          <path d="M714 400 Q780 384 852 396"/>
          <path d="M880 240 Q920 232 958 240"/>
        </g>
        <path d="M736 540 Q740 420 754 378 Q792 322 838 362 Q852 420 852 540 Z" fill="#14092b" stroke="#14092b" stroke-width="6"/>
        <path d="M748 540 Q752 428 762 392 Q792 348 828 380 Q840 430 840 540 Z" fill="#060309"/>
        <path d="M770 384 q8 14 0 26 M800 372 q10 12 4 26" stroke="#8ef26f" stroke-width="3" fill="none" opacity="0.5"/>
        <!-- algas rizadas -->
        <g id="g-algas" stroke="#14092b" stroke-width="8" fill="none" stroke-linecap="round">
          <path d="M180 454 Q166 430 184 412"/>
          <path d="M198 456 Q212 430 198 414"/>
          <path d="M214 452 Q204 434 216 420"/>
        </g>
        <g stroke="#52d053" stroke-width="4" fill="none" stroke-linecap="round">
          <path d="M180 454 Q166 430 184 412"/>
          <path d="M198 456 Q212 430 198 414"/>
          <path d="M214 452 Q204 434 216 420"/>
        </g>
        <!-- cangrejo cartoon con ojos de tallo -->
        <g id="g-cangrejo" stroke="#14092b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
          <path d="M470 470 Q470 456 466 450 M494 470 Q494 456 498 450" fill="none" stroke-width="5"/>
          <circle cx="465" cy="446" r="7" fill="#fff"/>
          <circle cx="499" cy="446" r="7" fill="#fff"/>
          <circle cx="466" cy="447" r="3" fill="#14092b" stroke="none"/>
          <circle cx="498" cy="447" r="3" fill="#14092b" stroke="none"/>
          <ellipse cx="482" cy="496" rx="28" ry="18" fill="#e04a33"/>
          <path d="M470 500 Q482 508 494 500" fill="none" stroke-width="4"/>
          <path d="M450 490 Q426 480 430 458 Q444 462 448 472 Q436 468 444 484 Z" fill="#c22f1d"/>
          <path d="M514 490 Q538 480 534 458 Q520 462 516 472 Q528 468 520 484 Z" fill="#c22f1d"/>
          <path d="M462 512 Q452 520 446 528 M474 516 Q468 524 464 532 M492 516 Q498 524 502 532 M504 512 Q514 520 520 528" fill="none" stroke-width="5"/>
          <path d="M508 474 Q520 464 532 470 L529 479 Q519 474 512 481 Z" fill="#f3ecff" stroke-width="4"/>
        </g>
        <!-- escalones tallados de vuelta al faro -->
        <path d="M0 412 Q50 424 96 438 L96 540 L0 540 Z" fill="#8a68b8" stroke="#14092b" stroke-width="6"/>
        <g stroke="#5b3f7e" stroke-width="5" fill="none" stroke-linecap="round">
          <path d="M8 450 Q42 452 76 462"/>
          <path d="M6 478 Q44 482 82 490"/>
          <path d="M4 506 Q46 510 86 516"/>
        </g>
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
        <rect width="960" height="540" fill="#160b26"/>
        <!-- paredes de roca púrpura -->
        <path d="M0 0 L960 0 L960 118 Q800 56 640 108 Q400 158 200 98 Q80 68 0 128 Z" fill="#3f1f5c" stroke="#14092b" stroke-width="6"/>
        <path d="M0 128 Q120 88 224 138 Q214 340 200 540 L0 540 Z" fill="#4a2d73" stroke="#14092b" stroke-width="6"/>
        <path d="M960 118 L960 540 L780 540 Q806 300 882 188 Z" fill="#4a2d73" stroke="#14092b" stroke-width="6"/>
        <!-- cristales mágicos -->
        <g stroke="#14092b" stroke-width="4" stroke-linejoin="round">
          <path d="M120 300 L136 268 L152 302 L136 316 Z" fill="#d84fd8"/>
          <path d="M856 320 L872 284 L888 322 L872 338 Z" fill="#d84fd8"/>
        </g>
        <!-- estalactitas chorreantes -->
        <g id="g-estalactitas" stroke="#14092b" stroke-width="5" stroke-linejoin="round">
          <path d="M296 56 L326 58 Q322 110 311 152 Q302 108 296 56 Z" fill="#5b2f7e"/>
          <path d="M416 36 L452 38 Q446 116 434 172 Q422 112 416 36 Z" fill="#5b2f7e"/>
          <path d="M556 50 L584 52 Q580 98 570 132 Q562 96 556 50 Z" fill="#5b2f7e"/>
          <path d="M656 66 L690 68 Q684 140 673 192 Q662 136 656 66 Z" fill="#5b2f7e"/>
          <circle cx="434" cy="184" r="5" fill="#8ef26f" stroke-width="3" class="anim-bob"/>
        </g>
        <!-- suelo -->
        <path d="M0 458 Q240 428 480 448 Q720 470 960 438 L960 540 L0 540 Z" fill="#2c1b4d" stroke="#14092b" stroke-width="6"/>
        <!-- poza verde neón -->
        <g id="g-poza">
          <ellipse cx="430" cy="430" rx="194" ry="48" fill="#123a26" stroke="#14092b" stroke-width="6"/>
          <ellipse cx="430" cy="423" rx="172" ry="39" fill="#2c7a3f"/>
          <ellipse cx="430" cy="420" rx="122" ry="27" fill="#52d053" opacity="0.6" class="anim-glow"/>
          <ellipse cx="430" cy="419" rx="62" ry="14" fill="#8ef26f" opacity="0.6"/>
          <path d="M300 428 q16 -8 32 0 M500 434 q16 -8 32 0" stroke="#8ef26f" stroke-width="3" fill="none" opacity="0.7"/>
          <circle cx="430" cy="380" r="140" fill="#52d053" opacity="0.07"/>
        </g>
        <!-- roca seta de la sirena -->
        <path d="M352 434 Q368 386 430 392 Q486 396 494 432 Q430 450 352 434 Z" fill="#5b3f7e" stroke="#14092b" stroke-width="6"/>
        <!-- sirena cartoon -->
        <g id="g-sirena" class="anim-bob" stroke="#14092b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
          <path d="M428 318 Q394 324 390 358 Q386 394 402 416 Q418 424 421 412 Q410 380 415 352 Q419 334 432 330 Z" fill="#d84fd8"/>
          <path d="M432 400 Q470 390 496 408 Q516 422 502 432 Q468 424 440 420 Z" fill="#1c8f84"/>
          <path d="M496 408 Q522 392 528 374 Q536 400 514 420 Q504 426 494 420 Z" fill="#2fd4c8"/>
          <path d="M420 364 Q430 356 440 364 L438 402 Q429 408 421 402 Z" fill="#f2b98a"/>
          <path d="M419 368 Q430 374 441 368 L440 379 Q430 384 420 379 Z" fill="#d84fd8" stroke-width="4"/>
          <path d="M438 368 Q454 360 454 346" fill="none" stroke-width="6"/>
          <circle cx="454" cy="344" r="5" fill="#f2b98a" stroke-width="4"/>
          <circle cx="430" cy="342" r="16" fill="#f2b98a"/>
          <path d="M446 334 Q458 344 454 366 Q452 378 444 386 Q450 366 443 352 Z" fill="#d84fd8" stroke-width="4"/>
          <path d="M413 336 Q417 318 434 318 Q451 320 447 336 Q442 326 431 326 Q419 326 413 336 Z" fill="#d84fd8" stroke-width="4"/>
          <circle cx="425" cy="342" r="4.5" fill="#fff"/>
          <circle cx="437" cy="342" r="4" fill="#fff"/>
          <circle cx="426" cy="343" r="2" fill="#14092b" stroke="none"/>
          <circle cx="438" cy="343" r="1.8" fill="#14092b" stroke="none"/>
          <path d="M425 353 Q431 357 437 353" fill="none" stroke-width="3"/>
        </g>
        <!-- farero hipnotizado, ojos en espiral -->
        <g id="g-farero" class="anim-bob" stroke="#14092b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
          <path d="M688 424 Q686 440 687 452 M712 424 Q714 440 713 452" fill="none" stroke-width="8"/>
          <ellipse cx="683" cy="455" rx="11" ry="5.5" fill="#14092b"/>
          <ellipse cx="717" cy="455" rx="11" ry="5.5" fill="#14092b"/>
          <path d="M680 374 Q700 362 720 374 Q734 400 722 426 Q700 436 678 426 Q666 400 680 374 Z" fill="#2456a8"/>
          <circle cx="700" cy="394" r="3" fill="#ffd23e" stroke="none"/>
          <circle cx="700" cy="408" r="3" fill="#ffd23e" stroke="none"/>
          <path d="M678 382 Q664 398 669 416" fill="none" stroke-width="7"/>
          <path d="M722 382 Q736 398 731 416" fill="none" stroke-width="7"/>
          <circle cx="669" cy="419" r="5.5" fill="#f2b98a" stroke-width="4"/>
          <circle cx="731" cy="419" r="5.5" fill="#f2b98a" stroke-width="4"/>
          <circle cx="700" cy="348" r="19" fill="#f2b98a"/>
          <path d="M683 355 Q684 382 700 384 Q716 382 717 355 Q710 367 700 367 Q690 367 683 355 Z" fill="#f3ecff" stroke-width="4"/>
          <path d="M686 341 a5.5 5.5 0 1 1 8 5.5 a3.2 3.2 0 1 0 -4 -4" fill="none" stroke-width="3"/>
          <path d="M704 341 a5.5 5.5 0 1 1 8 5.5 a3.2 3.2 0 1 0 -4 -4" fill="none" stroke-width="3"/>
          <path d="M680 334 Q700 320 720 334 L717 325 Q700 315 683 325 Z" fill="#2456a8"/>
          <path d="M740 326 q5 -16 -1 -24 m1 26 l11 -6 m-12 -18 a4 4 0 1 1 -1 8" fill="none" stroke="#8ef26f" stroke-width="4"/>
          <path d="M658 310 q-5 -16 1 -24 m-1 26 l-11 -6 m12 -20 a4 4 0 1 0 1 8" fill="none" stroke="#8ef26f" stroke-width="4"/>
        </g>
        <!-- luz cálida de la entrada -->
        <circle cx="110" cy="470" r="86" fill="#ffd23e" opacity="0.10"/>
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
