import type { Chapter } from "./types";

// Historias del barrio: capítulos cortos con un vecino como protagonista. Cada una enseña una parte de la app.
// Se abren al terminar un capítulo de la historia principal ("after"). Numeradas desde 101.

export const BARRIO: Chapter[] = [
  {
    n: 101, act: 1, kind: "barrio", after: 2, who: "bingo", title: "La despensa misteriosa", blurb: "Bluey y Bingo juegan a detectives entre tus frascos.",
    reward: { xp: 40, coins: 30 },
    nodes: [
      { k: "say", who: "bingo", text: "¡Detective Bingo reportándose! Alguien escondió la harina. O se la comió un fantasma muy blanco.", stage: ["bingo", "bluey", "yo"] },
      { k: "say", who: "bluey", text: "Yo soy la detective Bluey. Nuestra pregunta es: ¿qué hay en esta cocina? Nadie lo sabe. Ni la cocina.", stage: ["bluey", "bingo", "yo"] },
      { k: "say", who: "yo", text: "Para eso existe la despensa: anoto lo que tengo y cuándo se vence. Así nadie esconde nada." },
      { k: "task", id: "pantry", text: "Anota algo de tu cocina en la Despensa (con su fecha de vencimiento, si la tiene).", href: "/mi-cocina/despensa", cta: "Abrir la Despensa" },
      { k: "say", who: "bingo", text: "¡Caso resuelto! La harina estaba en el estante. El fantasma era yo, con harina en la cara.", stage: ["bingo", "bluey", "yo"] },
      { k: "say", who: "bluey", text: "La despensa también te dice qué puedes cocinar hoy con lo que tienes. Eso es magia de detective.", stage: ["bluey", "bingo", "yo"] },
    ],
  },
  {
    n: 102, act: 1, kind: "barrio", after: 3, who: "muffin", title: "El cumpleaños de Muffin", blurb: "Tu primer pedido de verdad, con fecha y anticipo.",
    reward: { xp: 50, coins: 35 },
    nodes: [
      { k: "say", who: "muffin", text: "{nombre}, mi cumpleaños es en una semana. Quiero una torta. Grande. Con chispas. Y que diga MUFFIN en mayúsculas.", stage: ["muffin", "yo"] },
      { k: "say", who: "socks", text: "Su mamá dice que paga la mitad ahora y la mitad cuando la entregues. Yo solo vine a ver la torta.", stage: ["socks", "muffin", "yo"] },
      { k: "say", who: "yo", text: "Para que no se me olvide nada, lo anoto como pedido: para quién, qué lleva, cuándo se entrega y cuánto ya me dieron." },
      { k: "task", id: "order", text: "Anota un pedido (real o de práctica) en Pedidos: cliente, fecha, precio y anticipo.", href: "/mi-cocina", cta: "Abrir Pedidos" },
      {
        k: "choice", who: "muffin", prompt: "¿Y qué decoración lleva?",
        options: [
          { label: "Chispas de todos los colores", flag: ["muffin", "chispas"], reply: [{ k: "say", who: "muffin", text: "¡SÍ! Que parezca que explotó un arcoíris. Uno educado.", stage: ["muffin", "yo"] }] },
          { label: "Su nombre en letras de chocolate", flag: ["muffin", "nombre"], reply: [{ k: "say", who: "muffin", text: "Con mayúsculas. Y un signo de exclamación. MUFFIN!", stage: ["muffin", "yo"] }] },
        ],
      },
      { k: "say", who: "narrador", text: "El pedido quedó anotado con su fecha. El día antes, Pedidos le recordó a {nombre} que había una torta por hacer. Muffin no tuvo que recordárselo cada hora. Solo cada dos." },
    ],
  },
  {
    n: 103, act: 1, kind: "barrio", after: 4, who: "chilli", title: "La alcancía de Chilli", blurb: "Ahorrar para algo que de verdad quieres.",
    reward: { xp: 50, coins: 35 },
    nodes: [
      { k: "say", who: "chilli", text: "Te vi mirando batidoras por la ventana de la tienda. Con cara de enamorada.", stage: ["chilli", "yo"] },
      { k: "say", who: "yo", text: "Es que cuesta bastante. Algún día..." },
      { k: "say", who: "chilli", text: "«Algún día» no tiene fecha. Una meta sí. Ponle nombre, cuánto cuesta y abona aunque sea un poquito. Ver la barra subir da gusto.", stage: ["chilli", "yo"] },
      { k: "task", id: "goal", text: "Crea una meta de ahorro y abónale algo de dinero.", href: "/dinero/metas", cta: "Abrir Metas" },
      { k: "say", who: "chilli", text: "Ahí está. Ya no es «algún día»: es tu meta, con su barrita. Y cada abono cuenta.", stage: ["chilli", "yo"] },
    ],
  },
  {
    n: 104, act: 1, kind: "barrio", after: 4, who: "mackenzie", title: "Cartas que vuelven cada mes", blurb: "La luz, el internet y la renta: que no te tomen por sorpresa.",
    reward: { xp: 50, coins: 35 },
    nodes: [
      { k: "say", who: "mackenzie", text: "Reparto de sobres. Este es de la luz. Este también es de la luz, pero del mes pasado. Ups.", stage: ["mackenzie", "yo"] },
      { k: "say", who: "yo", text: "¡Se me había olvidado! Siempre llegan el mismo día y siempre me sorprenden." },
      { k: "say", who: "mackenzie", text: "Lo que se repite se anota una vez. Después te avisa solo. Así trabajo yo: misma ruta, cero sorpresas.", stage: ["mackenzie", "yo"] },
      { k: "task", id: "recurring", text: "Anota un pago fijo (luz, internet, renta…) en Pagos fijos.", href: "/dinero/recurrentes", cta: "Abrir Pagos fijos" },
      { k: "say", who: "narrador", text: "Desde ese día, los sobres de Mackenzie llegaron igual, pero {nombre} ya los esperaba con una sonrisa. Y con el dinero apartado." },
    ],
  },
  {
    n: 105, act: 1, kind: "barrio", after: 5, who: "bandit", title: "La parrilla secreta de Bandit", blurb: "¿Dulce o salado? ¿Por qué no los dos?",
    reward: { xp: 60, coins: 40 },
    nodes: [
      { k: "say", who: "bandit", text: "Tengo una idea revolucionaria. Postre... a la parrilla. Piña asada con canela. Nadie lo vio venir.", stage: ["bandit", "yo"] },
      { k: "say", who: "yo", text: "Bandit, eso existe desde hace años." },
      { k: "say", who: "bandit", text: "Nadie EN ESTA CUADRA lo vio venir. Hagamos un postre nuevo hoy. Uno que no hayas probado nunca.", stage: ["bandit", "yo"] },
      { k: "task", id: "cook", text: "Cocina una receta (mejor si es una que nunca habías hecho).", href: "/cocinar", cta: "Ir a cocinar" },
      {
        k: "choice", who: "bandit", prompt: "¿Cómo quedó?",
        options: [
          { label: "¡Delicioso!", flag: ["parrilla", "rico"], reply: [{ k: "say", who: "bandit", text: "Lo sabía. Somos genios. Yo más, pero tú también.", stage: ["bandit", "yo"] }] },
          { label: "Raro, pero aprendí algo", flag: ["parrilla", "raro"], reply: [{ k: "say", who: "bandit", text: "Así empiezan todas las grandes recetas: con una cara de «mmm... casi».", stage: ["bandit", "yo"] }] },
        ],
      },
      { k: "say", who: "narrador", text: "Esa noche, en el diario de {nombre} apareció una receta nueva. Y una mancha de carbón." },
    ],
  },
  {
    n: 106, act: 2, kind: "barrio", after: 7, who: "coco", title: "El desfile de Coco", blurb: "La moda también se hornea: arma tu mejor look.",
    reward: { xp: 60, coins: 45 },
    nodes: [
      { k: "say", who: "coco", text: "Querida, este sábado hay desfile en mi boutique. Y tú vas a desfilar. No es una pregunta.", stage: ["coco", "yo"] },
      { k: "say", who: "yo", text: "¿Yo? ¡Pero si siempre ando con harina en el delantal!" },
      { k: "say", who: "coco", text: "La harina es un accesorio si la llevas con confianza. Ponte por lo menos tres prendas. Y acomódalas bien: arrástralas, agrándalas, gíralas. Que te queden perfectas.", stage: ["coco", "yo"] },
      { k: "task", id: "outfit", text: "Ponle al menos tres prendas a tu personaje en el Vestuario.", href: "/vestuario", cta: "Abrir el Vestuario" },
      { k: "say", who: "coco", text: "¡Divina! Guarda ese look. Un buen look merece un nombre, como una buena receta.", stage: ["coco", "yo"] },
      { k: "say", who: "narrador", text: "{nombre} desfiló entre aplausos. Coco lloró un poquito. Dijo que era el rímel." },
    ],
  },
  {
    n: 107, act: 2, kind: "barrio", after: 8, who: "judo", title: "El cuaderno de Judo", blurb: "Lo que anotas hoy es lo que mejoras mañana.",
    reward: { xp: 60, coins: 45 },
    nodes: [
      { k: "say", who: "judo", text: "Una pastelera profesional anota todo: qué salió bien, qué salió mal, qué cambiaría. Yo tengo once cuadernos.", stage: ["judo", "yo"] },
      { k: "say", who: "yo", text: "Yo solo me acuerdo... a veces." },
      { k: "say", who: "judo", text: "La memoria es buena. El cuaderno es mejor. En tu Diario de postres, escribe una nota o «qué cambiaría» de algo que cocinaste.", stage: ["judo", "yo"] },
      { k: "task", id: "diary", text: "Escribe una nota (o «qué cambiaría», o agrega una foto) en el Diario de postres.", href: "/mi-cocina/diario", cta: "Abrir el Diario" },
      { k: "say", who: "judo", text: "Perfecto. La próxima vez que hagas esa receta, vas a saber exactamente qué ajustar. Eso se llama mejorar. Oficialmente.", stage: ["judo", "yo"] },
    ],
  },
];

// Historias de temporada: aparecen solo durante la fiesta (y se pueden terminar después si ya empezaste). Desde 201.

export const TEMPORADA: Chapter[] = [
  {
    n: 201, act: 1, kind: "temporada", event: "halloween", who: "bingo", title: "Sustos y galletas", blurb: "Halloween en Dulce Villa: disfraces, calabazas y galletas con caritas.",
    reward: { xp: 70, coins: 60 },
    nodes: [
      { k: "say", who: "bingo", text: "¡Buuuu! ¿Te asusté? Soy una galleta fantasma. Muy peligrosa. Y con chispas.", stage: ["bingo", "bluey", "yo"] },
      { k: "say", who: "bluey", text: "Esta semana todo el barrio pide golosinas. Si haces galletas con caritas, vas a ser la más famosa de Halloween.", stage: ["bluey", "bingo", "yo"] },
      {
        k: "choice", who: "bingo", prompt: "¿De qué te disfrazas tú?",
        options: [
          { label: "De bruja pastelera", flag: ["halloween", "bruja"], reply: [{ k: "say", who: "bingo", text: "¡Con escoba de batidor! Doble susto, doble merengue.", stage: ["bingo", "yo"] }] },
          { label: "De calabaza", flag: ["halloween", "calabaza"], reply: [{ k: "say", who: "bingo", text: "¡Redondita y naranja! Si alguien te quiere hacer pie, corres.", stage: ["bingo", "yo"] }] },
          { label: "De fantasma de harina", flag: ["halloween", "fantasma"], reply: [{ k: "say", who: "bingo", text: "¡Como yo! Somos un equipo fantasmal.", stage: ["bingo", "yo"] }] },
        ],
      },
      { k: "task", id: "cook", text: "Cocina algo para Halloween (galletas, cupcakes o lo que se te antoje).", href: "/cocinar", cta: "Ir a cocinar" },
      { k: "say", who: "narrador", text: "Esa noche, una fila de pequeños fantasmas, brujitas y superhéroes tocó la puerta de {local}. Nadie se fue con las manos vacías." },
    ],
  },
  {
    n: 202, act: 1, kind: "temporada", event: "navidad", who: "chilli", title: "La Navidad de Dulce Villa", blurb: "Luces, ponche y el turno más ocupado del año.",
    reward: { xp: 80, coins: 70 },
    nodes: [
      { k: "say", who: "chilli", text: "Diciembre en Dulce Villa huele a canela y a papel de regalo. Y a gente haciendo fila en tu puerta.", stage: ["chilli", "yo"] },
      { k: "say", who: "bandit", text: "Traje luces para el local. Doscientas. Algunas parpadean. Algunas cantan.", stage: ["bandit", "chilli", "yo"] },
      { k: "task", id: "shift", text: "Atiende un turno navideño en Dulce Co.", href: "/jugar/venta", cta: "Abrir el local", skippable: "Hoy no puedo jugar: seguir igual" },
      { k: "say", who: "chilli", text: "Lo mejor de la Navidad no son los regalos. Es ver a todo el barrio junto, compartiendo algo dulce que hiciste tú.", stage: ["chilli", "yo"] },
      { k: "say", who: "narrador", text: "¡Feliz Navidad, {nombre}! Que {local} siga llenándose de risas." },
    ],
  },
  {
    n: 203, act: 1, kind: "temporada", event: "valentin", who: "coco", title: "Corazones de azúcar", blurb: "El Día del Cariño: postres para regalar.",
    reward: { xp: 70, coins: 60 },
    nodes: [
      { k: "say", who: "coco", text: "El Día del Cariño es mi fiesta favorita. Todo rosado. Todo con corazones. Como yo.", stage: ["coco", "yo"] },
      { k: "say", who: "yo", text: "¿Y si este año regalo un postre hecho por mí a alguien que quiero mucho?" },
      { k: "task", id: "cook", text: "Cocina un postre para regalarle a alguien que quieres.", href: "/cocinar", cta: "Ir a cocinar" },
      { k: "say", who: "coco", text: "No hay regalo más bonito que uno que huele a horno. Lo digo yo, que regalo perfumes.", stage: ["coco", "yo"] },
    ],
  },
];
