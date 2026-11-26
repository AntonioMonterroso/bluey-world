// Mochito: el perrito que siempre acompaña a tu personaje. Lógica pura.

import { extraLine, type SayContext } from "./mochito-lines";
import { cleanOf } from "./mochito-play";

export const MOCHITO_APPEAL = 3; // en el local saluda a los clientes

const MANANA = [
  "¡Buenos días! Ya moví la cola tres veces esperándote.",
  "¿Desayunaste? Nadie hornea bien con la panza vacía.",
  "Mañana fresquita, perfecta para hornear pan.",
  "Abrí un ojo, olí café y me desperté de un brinco.",
  "Hoy va a salir algo rico, lo presiento en el hocico.",
  "Buenos días. Hoy toca empezar con calma, sin correr.",
  "¿Qué horneamos primero: algo dulce o algo salado?",
  "El sol ya salió y yo ya estoy listo para ayudarte.",
  "Una mañana con olor a canela es una mañana bonita.",
  "¡Guau! Llegaste. Ya era hora de empezar el día.",
  "Antes de prender el horno, un vaso de agua para ti.",
  "Hoy puede ser un buen día para probar una receta nueva.",
  "Revisa la despensa, a ver si nos falta algo para hoy.",
  "Buenos días. Te guardé el mejor lugar de la cocina.",
  "Primero café, luego harina. Así funciona el mundo.",
  "Desperté con ganas de pan dulce. ¿Y tú?",
  "Si hoy hay pedidos, empecemos por el que se entrega primero.",
  "Buenos días. Que te vaya tan bien como a un perrito con hueso.",
  "La mañana es buena para batir: el brazo está fresco.",
  "Ya estiré las patitas. Ahora sí, a trabajar.",
];

const TARDE = [
  "¡Buenas tardes! ¿Un cafecito con galleta?",
  "La tarde es perfecta para decorar con calma.",
  "¿Ya almorzaste? No vale solo probar betún.",
  "Hora de la siesta… para mí. Tú sigue, que vas muy bien.",
  "Si el pastel ya se enfrió, es hora de rellenarlo.",
  "La tarde se pasa rápido cuando hay algo en el horno.",
  "¿Revisamos cómo va el día en el local?",
  "Un pedazo de pastel a media tarde no le hace daño a nadie.",
  "Buenas tardes. Llevas mucho rato de pie; siéntate un ratito.",
  "La luz de la tarde es buena para tomarle foto a tus postres.",
  "¿Ya anotaste lo que gastaste hoy? Mejor ahorita que en la noche.",
  "Tarde tranquila, horno calientito, perrito contento.",
  "Si hace calor, la mantequilla se derrite rápido. Guárdala en frío.",
  "Buenas tardes. ¿Qué tal si preparamos algo para la cena?",
  "Ya casi termina el día y has hecho un montón.",
  "Hora de lavar trastes… yo te acompaño mirando.",
  "Esta tarde huele a vainilla. Mi olor favorito.",
  "¿Un descanso de cinco minutos? Yo los cuento.",
  "Buenas tardes. Tus clientes ya te extrañan en el local.",
  "Las tardes son para merendar y planear el postre de mañana.",
];

const NOCHE = [
  "Ya es de noche, no te desveles mucho.",
  "¿Me cuentas tu día en el diario?",
  "Buenas noches. Hoy trabajaste bonito.",
  "Deja la masa reposando y descansa tú también.",
  "Antes de dormir, revisa que el horno esté apagado.",
  "Mañana seguimos. La cocina no se va a ningún lado.",
  "Las estrellas salieron y yo ya bostecé dos veces.",
  "Un vasito de leche tibia y a la cama.",
  "Si algo no salió hoy, mañana sale mejor.",
  "Buenas noches. Gracias por llevarme contigo todo el día.",
  "La noche es para soñar ideas nuevas, no para hornear hasta tarde.",
  "¿Ya dejaste listo lo de mañana? Así no hay prisa al despertar.",
  "Shhh… ya es muy tarde. A dormir, ¿sí?",
  "Yo cuido la cocina mientras duermes.",
  "Hoy fue un buen día. ¿Lo anotamos antes de dormir?",
  "Apaga la luz, que yo ya tengo mi cobija.",
  "Mañana te espero con la cola moviéndose.",
  "Dormir bien también es parte de una buena receta.",
  "Buenas noches. Sueña con pasteles de tres pisos.",
  "Si te quedaste con hambre, que sea algo ligerito.",
];

// Ánimo, cocina, repostería, dinero, el local, travesuras y descanso: a cualquier hora.
const ALWAYS = [
  "¡Me encanta acompañarte!",
  "Estoy orgulloso de ti. Ahí está, ya lo dije.",
  "No tiene que quedar perfecto. Tiene que llevar cariño.",
  "Si hoy hay cansancio, vamos más despacio.",
  "Eres mi persona favorita en todo el mundo.",
  "Cada postre tuyo lleva un pedacito de tu corazón.",
  "Un mal día no borra todo lo bueno que haces.",
  "Aquí estoy. Siempre.",
  "Vas mejor de lo que crees.",
  "Respira hondo. Ya lo resolvemos juntos.",
  "Lo que hoy cuesta, mañana sale solito.",
  "Tú puedes con esto y con más.",
  "Me gusta verte sonreír cuando algo sale del horno.",
  "Si nadie te lo dijo hoy: lo estás haciendo muy bien.",
  "Un abrazo de perrito cura casi todo.",
  "Equivocarse también es aprender a hornear.",
  "Intentar cosas nuevas es de valientes.",
  "No compares tu pastel con el de nadie. El tuyo tiene tu sazón.",
  "Me quedo aquí a tu lado, pase lo que pase.",
  "Hoy te mereces algo dulce. Y no lo digo solo por mí.",
  "Lava la fruta antes de cortarla, ¡guau!",
  "La mantequilla a temperatura ambiente se bate mejor.",
  "Precalienta el horno antes de meter la mezcla.",
  "Tamiza la harina y te queda más esponjoso.",
  "No abras el horno los primeros minutos, que se baja el pastel.",
  "Mide con báscula y el resultado sale igualito cada vez.",
  "Los huevos a temperatura ambiente se integran mejor.",
  "Si el palillo sale limpio del centro, el pastel ya está.",
  "Engrasa y enharina el molde, y el pastel sale sin pegarse.",
  "Una pizca de sal hace que lo dulce sepa más rico.",
  "Deja enfriar el pastel antes de cubrirlo, o el betún se derrite.",
  "Bate las claras en un tazón limpio y seco.",
  "¿A punto de nieve? Voltea el tazón: no se debe caer.",
  "Lee toda la receta antes de empezar. Así no hay sorpresas.",
  "Ten todo medido antes de prender la batidora.",
  "El chocolate se derrite mejor a fuego bajo o a baño María.",
  "La masa de galletas mejora si reposa un rato en frío.",
  "No batas de más la mezcla con harina, o queda dura.",
  "Gira el molde a la mitad del horneado si tu horno calienta disparejo.",
  "Usa el temporizador. Hasta los mejores se olvidan.",
  "Primero una capa delgada de betún y luego la bonita. Así no salen migas.",
  "Las fresas frescas encima siempre se ven elegantes.",
  "Un poquito de azúcar glass hace milagros.",
  "Para decorar: la manga inclinada y la presión pareja.",
  "Los colores pastel combinan con todo.",
  "Un pastel sencillo y bien hecho le gana a uno complicado.",
  "Prueba la decoración primero en un plato.",
  "Si te sobra betún, guárdalo para unas galletitas.",
  "Las chispas de colores alegran cualquier cupcake.",
  "El pastel más bonito es el que se come con gusto.",
  "Hoy tengo antojo de ver un pastel de tres leches.",
  "¿Y si esta semana probamos algo con chocolate?",
  "Una flor comestible y listo: pastel de revista.",
  "Enfría el pastel antes de cortarlo para que salga parejo.",
  "El caramelo se quema rápido. No le quites el ojo.",
  "Tus cupcakes huelen tan bien que ya estoy moviendo la cola.",
  "Tómale foto a tu postre antes de que alguien (yo) lo pruebe.",
  "Un buen relleno es la sorpresa del pastel.",
  "Lo que hoy decoras, mañana alguien lo disfruta.",
  "Si sale feo, igual sabe rico. ¡Guau!",
  "Anota tus gastos y yo cuido las monedas.",
  "Lo que no se anota, se olvida.",
  "Antes de ir al súper, haz la lista. Así gastas menos.",
  "Si la mantequilla subió, revisa el precio de tus postres.",
  "Un poquito ahorrado cada semana suma un montón.",
  "Cobra lo justo por tu trabajo. Tus horas también valen.",
  "¿Ya revisaste tus pagos fijos de este mes?",
  "Comprar en cantidad a veces sale más barato. A veces.",
  "Guarda los recibos, que luego sirven.",
  "Primero lo que hay que pagar, luego los gustitos.",
  "Un postre bien calculado deja ganancia.",
  "No olvides contar el gas y la luz en el costo.",
  "Si un ingrediente está caro, busca uno que lo reemplace.",
  "Tu meta de ahorro está más cerca de lo que crees.",
  "Una oferta solo es oferta si ya lo ibas a necesitar.",
  "Anotar aburre, pero ver tus números al final del mes da gusto.",
  "Yo ahorro huesitos. Tú ahorra quetzales.",
  "Revisa cuánto te queda libre antes de comprar algo grande.",
  "Un anticipo en cada pedido te quita preocupaciones.",
  "Hoy no gastaste de más. ¡Eso merece una galleta!",
  "Ya saludé a los clientes de la entrada.",
  "Los clientes vuelven cuando los atienden con cariño.",
  "¿Llenamos la vitrina antes de abrir?",
  "Una pegatina nueva en la pared y el local se ve distinto.",
  "Hoy llegó un cliente que olía a galleta. Me cayó bien.",
  "Si el local se ve bonito, las propinas suben.",
  "Yo me quedo en la puerta moviendo la cola. Es mi trabajo.",
  "Tu equipo trabaja mejor si también descansa.",
  "Una flor en el mostrador alegra a todos.",
  "Los niños siempre se paran a verme por el vidrio.",
  "¿Probamos un postre nuevo en el menú?",
  "Hoy el local huele tan bien que la gente entra solita.",
  "Un buen letrero hace que la gente voltee a ver.",
  "Atender rápido también es atender bonito.",
  "Cuando cierres, cuenta lo que vendiste. Me gusta saberlo.",
  "Los clientes de siempre merecen un detalle de vez en cuando.",
  "Decorar para la temporada hace que todo se sienta especial.",
  "Si un cliente se va contento, ya ganamos.",
  "Prometo no comerme nada de la vitrina. Casi nada.",
  "Abrimos con alegría y cerramos con la caja contenta.",
  "Yo pruebo lo que se caiga, prometido.",
  "No fui yo el que se comió la galleta. Bueno, tal vez sí.",
  "Si me rascas detrás de la oreja, te doy suerte en la cocina.",
  "Tengo un hueso escondido en la despensa. Es secreto.",
  "¿Eso que huele es pollo? Ah, no, es pastel. También me gusta.",
  "Cuando suena el horno me persigo la cola. No sé por qué.",
  "Le ladré a la batidora. Me asustó un poquito.",
  "Vi una miga en el piso y la rescaté. De nada.",
  "Mi receta favorita: cualquiera que lleve algo que se caiga.",
  "Soy experto en probar betún con la mirada.",
  "Hoy aprendí a sentarme. Mañana aprendo a decorar.",
  "Si me pones un gorrito de chef, prometo portarme bien.",
  "Sonó el temporizador y yo ya estaba listo para comer.",
  "Me escondí debajo de la mesa, pero mi cola me delató.",
  "¿Me das una probadita? Solo una. Bueno, dos.",
  "Las cucharas de madera son para cocinar, no para morder. Ya lo sé.",
  "Hice guardia toda la mañana. No pasó nada: misión cumplida.",
  "Si el pastel sale bien, bailo. Si sale mal, también.",
  "Una oreja escucha recetas; la otra escucha «¿quién quiere premio?».",
  "¡Guau! Eso era todo lo que quería decir.",
  "Un descansito también cuenta. Toma agua.",
  "Estira la espalda, que llevas rato inclinándote sobre la mesa.",
  "Las manos cansadas también necesitan pausa.",
  "¿Comiste algo de verdad hoy, aparte de probar mezclas?",
  "Cuidado con el horno caliente. Usa guantes.",
  "Sal un ratito a tomar aire. Yo te espero.",
  "Sentarte cinco minutos no atrasa nada.",
  "Si te duele la cabeza, primero agua y descanso.",
  "Una caminata corta despeja la mente.",
  "Lávate las manos antes de cocinar. Yo me lavo las patitas.",
  "Pon música bonita mientras trabajas.",
  "Dormir temprano hace que todo salga mejor mañana.",
  "No cargues con todo. Pide ayuda si hace falta.",
  "Respira: inhala vainilla, exhala estrés.",
  "Ventila la cocina cuando el horno lleva rato prendido.",
  "Hoy merece una pausa con algo rico y sin prisa.",
  "Cuida tus ojos: descansa un rato de la pantalla.",
  "Una fruta también es un postre. Uno muy sano.",
  "Platicar con alguien que quieres también es descansar.",
  "Si hoy no hay energía, hoy se descansa. Mañana seguimos.",
];

const BY_TIME: [number, number, string[]][] = [
  [5, 12, MANANA],
  [12, 19, TARDE],
  [19, 24, NOCHE],
  [0, 5, NOCHE],
];

export const MOCHITO_LINES = { MANANA, TARDE, NOCHE, ALWAYS };

/** Una frase de Mochito según la hora; `pick` (0 a 1) elige cuál. */
export function mochitoLine(hour: number, pick: number) {
  const timed = BY_TIME.find(([a, b]) => hour >= a && hour < b)?.[2] ?? [];
  const all = [...timed, ...ALWAYS];
  return all[Math.min(all.length - 1, Math.floor(pick * all.length))];
}

// ── Cómo está Mochito ───────────────────────────────────────────────

export interface MochitoCare { fed?: number; petted?: number; played?: number; washed?: number; muddy?: boolean }
export type MochitoMood = "sueno" | "hambre" | "sucio" | "aburrido" | "feliz" | "contento";

const HOUR = 3_600_000;
const level = (since: number | undefined, now: number, hoursToEmpty: number) =>
  since ? Math.max(0, Math.min(100, Math.round(100 - ((now - since) / HOUR / hoursToEmpty) * 100))) : 0;

export const FEED_EVERY_H = 3; // antes de esto ya está lleno

/** Barriga, cariño y diversión (0 a 100) y su ánimo según la hora y lo que has hecho con él. */
export function mochitoState(care: MochitoCare | undefined, now: number) {
  const c = care ?? {};
  const belly = level(c.fed, now, 10);
  const love = level(c.petted, now, 12);
  const fun = level(c.played, now, 24);
  const clean = cleanOf(c, now);
  const hour = new Date(now).getHours();
  const mood: MochitoMood =
    hour >= 22 || hour < 6 ? "sueno"
    : belly < 30 ? "hambre"
    : clean < 15 ? "sucio"
    : fun < 25 ? "aburrido"
    : love >= 50 && belly >= 50 ? "feliz"
    : "contento";
  const full = !!c.fed && now - c.fed < FEED_EVERY_H * HOUR;
  return { belly, love, fun, clean, mood, full };
}

export const MOOD_LABEL: Record<MochitoMood, string> = {
  sueno: "Con sueño",
  hambre: "Con hambre",
  sucio: "Sucio",
  aburrido: "Aburrido",
  feliz: "Feliz",
  contento: "Contento",
};

const MOOD_LINES: Record<MochitoMood, string[]> = {
  sueno: ["Mmm… ya me estoy quedando dormido.", "Ya es hora de dormir. ¿Tú también?"],
  hambre: ["Mi pancita hace ruido… ¿me das una galleta?", "Huelo algo rico y yo con hambre."],
  sucio: ["Traigo lodo del paseo. ¿Me bañas?", "Me pica todo. Creo que necesito un baño con burbujas."],
  aburrido: ["¿Jugamos un ratito? Yo atrapo las galletas.", "Estoy aburrido. ¡Juguemos!"],
  feliz: ["¡Estoy feliz de estar contigo!", "Panza llena, corazón contento."],
  contento: ["Aquí estoy, contento a tu lado."],
};

/**
 * Lo que dice al tocarlo: a veces cómo se siente; si no, algo de la fecha, de lo que hiciste hoy,
 * un chiste o ánimo (si hay `ctx`), o una frase según la hora.
 */
export function mochitoSays(mood: MochitoMood, hour: number, pick: number, ctx?: SayContext) {
  if (mood !== "contento" && mood !== "feliz" && pick < (ctx ? 0.3 : 0.5)) {
    const lines = MOOD_LINES[mood];
    const p = pick / (ctx ? 0.3 : 0.5);
    return lines[Math.min(lines.length - 1, Math.floor(p * lines.length))];
  }
  if (ctx) {
    const p = (pick * 7919) % 1;
    return pick < 0.65 ? extraLine(ctx, p) : mochitoLine(hour, p);
  }
  return mochitoLine(hour, pick);
}

export const actionLine = {
  petted: ["¡Más, más! Justo ahí detrás de la oreja.", "Mmm, qué rico. Te quiero mucho.", "¡Guau! Me encantan tus cariños."],
  fed: ["¡Ñam! Qué rica galleta. Gracias.", "¡Delicioso! Ya tengo energía.", "¡Ñam, ñam! La mejor galleta del mundo."],
  full: ["Ya estoy lleno, gracias. Más tarde me das otra.", "Si como más, ruedo como pelota."],
};

// ── Avisos ──────────────────────────────────────────────────────────

export interface MochitoNews { id: string; text: string; href: string; urgent: boolean }

export interface NewsInput {
  timers: { id: string; label: string; status: "running" | "paused" | "ringing"; end_at: number | null }[];
  payments: { id: string; name: string; amount: number; kind: "gasto" | "ingreso"; next_due: number; active: boolean }[];
  orders: { id: string; client: string; item: string; due: number; status: string }[];
  journal: { at: number }[];
  fmt: (n: number) => string;
}

const DAY = 86_400_000;
const dayStart = (ms: number) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
const daysFrom = (due: number, now: number) => Math.round((dayStart(due) - dayStart(now)) / DAY);
const whenLabel = (n: number) => (n < 0 ? `hace ${-n} ${n === -1 ? "día" : "días"}` : n === 0 ? "hoy" : n === 1 ? "mañana" : `en ${n} días`);

/** Lo que Mochito te recuerda: temporizadores, pagos que vienen, pedidos por entregar y tu diario. */
export function mochitoNews(input: NewsInput, now: number): MochitoNews[] {
  const out: MochitoNews[] = [];

  for (const t of input.timers) {
    const name = t.label || "tu temporizador";
    if (t.status === "ringing") out.push({ id: `t-${t.id}`, text: `¡Ya sonó «${name}»! Ve a ver el horno.`, href: "/temporizadores", urgent: true });
    else if (t.status === "running" && t.end_at) {
      const min = Math.max(1, Math.ceil((t.end_at - now) / 60_000));
      out.push({ id: `t-${t.id}`, text: `A «${name}» le ${min === 1 ? "falta 1 minuto" : `faltan ${min} minutos`}.`, href: "/temporizadores", urgent: false });
    }
  }

  for (const o of input.orders) {
    if (["entregado", "pagado", "cancelado"].includes(o.status)) continue;
    const n = daysFrom(o.due, now);
    if (n > 2) continue;
    const who = o.client ? ` a ${o.client}` : "";
    out.push({
      id: `o-${o.id}`,
      text: n < 0 ? `El pedido «${o.item}»${who} se debía entregar ${whenLabel(n)}.` : `Entregas «${o.item}»${who} ${whenLabel(n)}.`,
      href: "/mi-cocina",
      urgent: n <= 0,
    });
  }

  for (const p of input.payments) {
    if (!p.active) continue;
    const n = daysFrom(p.next_due, now);
    if (n > 3) continue;
    const money = input.fmt(p.amount);
    out.push({
      id: `p-${p.id}`,
      text: p.kind === "gasto"
        ? (n < 0 ? `Se pasó el pago de ${p.name} (${money}), ${whenLabel(n)}.` : `Toca pagar ${p.name} (${money}) ${whenLabel(n)}.`)
        : (n < 0 ? `Ya debías recibir ${p.name} (${money}).` : `Te entra ${p.name} (${money}) ${whenLabel(n)}.`),
      href: "/dinero/recurrentes",
      urgent: p.kind === "gasto" && n <= 0,
    });
  }

  const today = dayStart(now);
  const wroteToday = input.journal.some((e) => e.at >= today);
  if (!wroteToday && new Date(now).getHours() >= 18) {
    out.push({ id: "diario", text: "Todavía no me cuentas cómo te fue hoy.", href: "/diario", urgent: false });
  }

  return out.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}
