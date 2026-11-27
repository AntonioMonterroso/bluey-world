import { dayKey, rng } from "./game/engine";

// La vida diaria de Mochito: su cumpleaños, cómo se viste en fiestas, su diario, el regalo del día y cuando duerme.
// Lógica pura.

const pad = (n: number) => String(n).padStart(2, "0");
const mdOf = (ms: number) => { const d = new Date(ms); return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const DAY = 86_400_000;
const dayMs = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };

// ── Cumpleaños ──────────────────────────────────────────────────────

/** El cumpleaños de Mochito es el día que llegó (el primer día que lo cuidaste). Cumple a partir del primer año. */
export function mochitoBirthday(days: string[] | undefined, now: number) {
  const first = days?.length ? [...days].sort()[0] : null;
  if (!first) return null;
  const born = new Date(dayMs(first));
  const today = new Date(now);
  const md = `${pad(born.getMonth() + 1)}-${pad(born.getDate())}`;
  const age = today.getFullYear() - born.getFullYear();
  return { md, since: first, isToday: mdOf(now) === md && age >= 1, age };
}

export const BIRTHDAY_GIFT = { coins: 25, xp: 20 };

export const MOCHITO_BDAY_LINES = [
  "¡Hoy es mi cumpleaños! ¿Me cantas las mañanitas?",
  "Cumplo años contigo. Es el mejor regalo.",
  "Me puse mi gorrito de fiesta. ¿Cómo me veo?",
  "Un año más de cariños, paseos y galletas. ¡Guau!",
  "Pide un deseo conmigo. Yo pido más paseos.",
];

// ── Fiestas: cómo se viste solo ─────────────────────────────────────

export type Festive = "cumple" | "navidad" | "anio" | "carino" | "halloween" | "patria";

/** Qué se pone hoy: su cumpleaños gana; si no, la fiesta del calendario. */
export function festiveOf(now: number, mochitoBdayToday = false): Festive | null {
  if (mochitoBdayToday) return "cumple";
  const d = new Date(now);
  const m = d.getMonth() + 1, day = d.getDate();
  if (m === 12 && day >= 20 && day <= 26) return "navidad";
  if ((m === 12 && day === 31) || (m === 1 && day === 1)) return "anio";
  if (m === 2 && day === 14) return "carino";
  if ((m === 10 && day >= 28) || (m === 11 && day <= 2)) return "halloween";
  if (m === 9 && (day === 14 || day === 15)) return "patria";
  return null;
}

export const FESTIVE_NAME: Record<Festive, string> = {
  cumple: "su gorrito de cumpleaños",
  navidad: "su gorro navideño",
  anio: "su gorrito de año nuevo",
  carino: "su diadema de corazón",
  halloween: "su sombrero de brujito",
  patria: "su pañoleta azul y blanco",
};

// ── Diario de Mochito ───────────────────────────────────────────────

export interface LogDay { d: string; e: string[] }
export const LOG_DAYS = 60;
export const LOG_PER_DAY = 8;

/** Agrega un recuerdo al día (sin repetirlo) y guarda solo los últimos días. */
export function appendLog(log: LogDay[] | undefined, now: number, line: string): LogDay[] {
  const d = dayKey(now);
  const list = [...(log ?? [])];
  const i = list.findIndex((x) => x.d === d);
  if (i >= 0) {
    if (list[i].e.includes(line) || list[i].e.length >= LOG_PER_DAY) return list;
    list[i] = { d, e: [...list[i].e, line] };
  } else list.push({ d, e: [line] });
  return list.sort((a, b) => a.d.localeCompare(b.d)).slice(-LOG_DAYS);
}

export type LogEvent =
  | { kind: "pet" } | { kind: "treat" } | { kind: "bath" } | { kind: "photo" } | { kind: "gift"; coins: number }
  | { kind: "walk"; friend?: string; newFriend?: boolean; weather?: string } | { kind: "game"; game?: string }
  | { kind: "trick"; name: string } | { kind: "medal"; name: string } | { kind: "level"; level: number }
  | { kind: "thing"; name: string } | { kind: "birthday"; age: number } | { kind: "missions" } | { kind: "cooked"; recipe: string } | { kind: "sticker"; name: string }
  | { kind: "vet"; ailment?: string } | { kind: "story"; title: string } | { kind: "show"; place: string; ribbon: string } | { kind: "painting" }
  | { kind: "groom"; style: string } | { kind: "trip"; place: string; souvenir: string } | { kind: "party"; what: string; friends: string[] } | { kind: "harvest"; what: string } | { kind: "gave"; what: string; to?: string }
  | { kind: "street"; treasure?: string; neighbor?: string } | { kind: "school"; course: string; diploma: boolean } | { kind: "bake"; recipe: string; count: number };

const listOf = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} y ${a[a.length - 1]}`);

/** Cómo lo cuenta Mochito en su diario (en primera persona). */
export function logLine(ev: LogEvent): string {
  switch (ev.kind) {
    case "pet": return "Me diste muchos cariños.";
    case "treat": return "Comí galletas riquísimas.";
    case "bath": return "Me bañaste con burbujas y quedé limpiecito.";
    case "photo": return "Nos tomamos fotos. Salí guapísimo.";
    case "gift": return `Abrí mi regalo del día: ${ev.coins} monedas.`;
    case "walk": if (ev.weather) return `${ev.weather}${ev.friend ? (ev.newFriend ? ` Y me hice amigo de ${ev.friend}.` : ` Vi a ${ev.friend}.`) : ""}`;
      return ev.friend ? (ev.newFriend ? `Salimos de paseo y me hice amigo de ${ev.friend}.` : `Salimos de paseo y vi a ${ev.friend}.`) : "Salimos de paseo al parque.";
    case "game": return ev.game ? `Jugamos «${ev.game}».` : "Jugamos un rato juntos.";
    case "trick": return `Aprendí un truco nuevo: ${ev.name.toLowerCase()}.`;
    case "medal": return `Gané la medalla «${ev.name}».`;
    case "level": return `¡Subí al nivel ${ev.level}!`;
    case "thing": return `Estrené ${ev.name.toLowerCase()}.`;
    case "sticker": return `Gané una pegatina para mi álbum: ${ev.name}.`;
    case "cooked": return `Te acompañé a cocinar ${ev.recipe}. Olía delicioso.`;
    case "missions": return "¡Cumplimos las tres misiones del día!";
    case "vet": return ev.ailment ? `Fui al veterinario porque ${ev.ailment.toLowerCase()}. La doctora Pimienta me curó.` : "Fui a mi chequeo con la doctora Pimienta. ¡Estoy sanísimo!";
    case "story": return `Me leíste «${ev.title}» y me dormí abrazando mi juguete.`;
    case "show": return `Fui al concurso de perritos y gané el ${ev.ribbon.toLowerCase()} (${ev.place.toLowerCase()}).`;
    case "painting": return "Me pintaste de colores. ¡Quedé en mi álbum!";
    case "groom": return `Fui a la peluquería y me peinaron con ${ev.style.toLowerCase()}. ¡Quedé guapísimo!`;
    case "trip": return `Nos fuimos de viaje ${ev.place} y traje un recuerdo: ${ev.souvenir.toLowerCase()}.`;
    case "party": return `¡Me hiciste mi fiesta de ${ev.what}!${ev.friends.length ? ` Vinieron ${listOf(ev.friends)}.` : ""}`;
    case "harvest": return `Cosechamos ${ev.what} en mi jardín.`;
    case "street": return `Paseamos con correa por la colonia${ev.neighbor ? ` y saludamos ${ev.neighbor.toLowerCase().startsWith("el ") ? `al ${ev.neighbor.toLowerCase().slice(3)}` : `a ${ev.neighbor.toLowerCase()}`}` : ""}.${ev.treasure ? ` Me traje un tesoro: ${ev.treasure.toLowerCase()}.` : ""}`;
    case "school": return ev.diploma ? `¡Me gradué en «${ev.course}»! Ya tengo mi diploma.` : `Fui a la escuela de perritos: pasé una clase de «${ev.course}».`;
    case "bake": return `Me horneaste ${ev.count} ${ev.recipe.toLowerCase()}. ¡Toda la casa olía rico!`;
    case "gave": return ev.to ? `Le regalamos ${ev.what} a ${ev.to}. Se puso feliz.` : `Me diste ${ev.what} de mi jardín. ¡Qué rico!`;
    case "birthday": return `¡Cumplí ${ev.age} ${ev.age === 1 ? "año" : "años"}! Hubo pastel y regalo.`;
  }
}

/** Título bonito del día del diario. */
export function logDayTitle(d: string, now: number) {
  const diff = Math.round((dayMs(dayKey(now)) - dayMs(d)) / DAY);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return new Date(dayMs(d)).toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" });
}

// ── Regalo del día ──────────────────────────────────────────────────

export interface GiftState { day?: string; streak?: number }

/** ¿Ya abriste el regalo de hoy? */
export const giftOpened = (g: GiftState | undefined, now: number) => g?.day === dayKey(now);

/** La racha nueva al abrir hoy: sigue si ayer también lo abriste, si no empieza en 1. */
export function nextStreak(g: GiftState | undefined, now: number) {
  if (!g?.day) return 1;
  const diff = Math.round((dayMs(dayKey(now)) - dayMs(g.day)) / DAY);
  if (diff === 0) return g.streak ?? 1;
  return diff === 1 ? (g.streak ?? 0) + 1 : 1;
}

/** Monedas del regalo según la racha: crece cada día y da bonos a los 7 y 30 días. */
export function giftFor(streak: number) {
  const base = Math.min(10, 2 + streak);
  const bonus = streak % 30 === 0 ? 60 : streak % 7 === 0 ? 20 : 0;
  return { coins: base + bonus, bonus };
}

// ── Duerme de noche ─────────────────────────────────────────────────

export const isNight = (now: number) => { const h = new Date(now).getHours(); return h >= 22 || h < 6; };
export const isMorning = (now: number) => { const h = new Date(now).getHours(); return h >= 6 && h < 11; };

export const SLEEPY_LINES = [
  "Mmm… cinco minutitos más…",
  "Zzz… soñaba con un pastel gigante…",
  "¿Ya es de día? Ah, no. Buenas noches otra vez.",
  "Te quiero… zzz…",
  "Estaba persiguiendo una pelota en mis sueños.",
  "Shhh… las galletas están durmiendo también.",
  "Apaga la luz, que mañana horneamos temprano.",
  "Ronco bajito, prometido.",
  "Me despertaste, pero no me enojo. Eres tú.",
  "Soñé que paseábamos por la luna.",
];

export const MORNING_GREET = [
  "¡Buenos días! Dormí como un tronco.",
  "¡Ya amaneció! ¿Qué hacemos hoy?",
  "Buenos días. Soñé contigo y con galletas.",
  "¡Despierto y con energía! Vamos por el día.",
  "Buenos días. ¿Desayunamos juntos?",
  "Estiré las patitas y ya estoy listo.",
];

/** Una frase de sueño o de buenos días (sale de la fecha y de cuántas veces lo has tocado). */
export const sleepyLine = (n: number) => SLEEPY_LINES[n % SLEEPY_LINES.length];
export const morningLine = (now: number) => MORNING_GREET[Math.floor(rng(`buenosdias:${dayKey(now)}`)() * MORNING_GREET.length)];

// ── Cocina para Mochito ─────────────────────────────────────────────

export interface DogRecipe { name: string; steps: string[] }

export const DOG_RECIPES: DogRecipe[] = [
  { name: "Galletas de zanahoria", steps: ["Harina de avena", "Zanahoria rallada", "Huevo", "Hornear"] },
  { name: "Galletas de manzana", steps: ["Harina de avena", "Manzana sin semillas", "Agua", "Hornear"] },
  { name: "Bocaditos de pollo", steps: ["Pollo cocido", "Arroz", "Huevo", "Hornear"] },
  { name: "Galletas de calabaza", steps: ["Calabaza cocida", "Harina de avena", "Huevo", "Hornear"] },
  { name: "Premios de plátano", steps: ["Plátano", "Harina de avena", "Agua", "Hornear"] },
  { name: "Huesitos de camote", steps: ["Camote cocido", "Harina de avena", "Huevo", "Hornear"] },
];

export const DOG_SAFE_EXTRA = ["Arroz", "Agua", "Pollo cocido", "Plátano", "Zanahoria rallada", "Calabaza cocida"];
export const DOG_UNSAFE = ["Chocolate", "Uvas", "Cebolla", "Sal", "Ajo", "Pasas"];
export const COOK_ROUNDS = 3;
export const cookMs = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 26_000 : l === "dificil" ? 14_000 : 20_000);

/** Una receta con sus pasos y los ingredientes que salen en la mesa (incluye trampas que no son para perros). */
export function cookRound(rnd: () => number, l: "facil" | "normal" | "dificil") {
  const recipe = DOG_RECIPES[Math.floor(rnd() * DOG_RECIPES.length)];
  const traps = l === "facil" ? 2 : l === "dificil" ? 4 : 3;
  const pool = [...DOG_UNSAFE];
  const bad: string[] = [];
  for (let i = 0; i < traps; i++) bad.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  const extra = DOG_SAFE_EXTRA.filter((x) => !recipe.steps.includes(x));
  const decoy = l === "facil" ? [] : [extra[Math.floor(rnd() * extra.length)]];
  const table = [...new Set([...recipe.steps, ...bad, ...decoy])];
  for (let i = table.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [table[i], table[j]] = [table[j], table[i]]; }
  return { recipe, table };
}

/** Puntaje de una receta: completa vale 0.7 y lo rápido el resto; cada error resta y lo peligroso resta más. */
export function cookScore(done: boolean, leftMs: number, totalMs: number, misses: number, unsafe: number) {
  if (!done) return 0;
  return Math.max(0.2, Math.min(1, 0.7 + 0.3 * (leftMs / totalMs) - misses * 0.08 - unsafe * 0.2));
}

// ── Memoria de Mochito ──────────────────────────────────────────────

export const MOCHITO_POSES = ["feliz", "girado", "sentado", "saltando", "dormido", "fiesta"] as const;
export type MemoCard = { id: number; face: string };
export const memoPairs = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 4 : l === "dificil" ? 8 : 6);

/** Las parejas: poses de Mochito y sus amigos del parque, revueltas. */
export function memoDeck(rnd: () => number, pairs: number, friendIds: string[]): MemoCard[] {
  const faces = [...MOCHITO_POSES.map((p) => `pose:${p}`), ...friendIds.map((f) => `amigo:${f}`)];
  const chosen: string[] = [];
  const pool = [...faces];
  while (chosen.length < pairs && pool.length) chosen.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  const cards = [...chosen, ...chosen].map((face, id) => ({ id, face }));
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}
/** Puntaje: menos intentos de más, mejor. */
export const memoScore = (pairs: number, tries: number) => Math.max(0, Math.min(1, 1 - Math.max(0, tries - pairs) / (pairs * 2)));

// ── Te acompaña a cocinar ───────────────────────────────────────────

const STEP_HINTS: [RegExp, string[]][] = [
  [/horn|precalient/i, ["Cuidado con el horno caliente. Usa guantes, ¿sí?", "¡Al horno! Yo vigilo desde aquí."]],
  [/bat[ei]|mezcl|incorpor/i, ["¡Bate, bate! Que quede suavecito.", "Mezcla con calma, sin prisa."]],
  [/refriger|enfri|repos/i, ["Ahora toca esperar. La paciencia también cocina.", "Mientras reposa, ¿un vasito de agua?"]],
  [/derrit|fuego|hierv|sart|olla/i, ["Fuego bajito, que no se queme.", "Ojo con el fuego. Yo me quedo lejos."]],
  [/decor|crema|glase|betún|betun/i, ["¡La parte bonita! Decóralo con cariño.", "Eso va a quedar precioso."]],
  [/cort|pic|ralla/i, ["Cuidado con los dedos al cortar.", "Despacito con el cuchillo."]],
  [/huevo/i, ["Los huevos de uno en uno, para que no se corte.", "Si cae cascarita, sácala con otra cáscara."]],
  [/harin|tamiz|cern/i, ["La harina cernida queda más esponjosa.", "¡Achís! La harina me hace estornudar."]],
];

/** Lo que te dice Mochito en cada paso de la receta. */
export function cookBuddyLine(text: string, step: number, total: number) {
  const hint = STEP_HINTS.find(([re]) => re.test(text));
  if (hint) return hint[1][step % hint[1].length];
  if (step === 0) return "¡Empezamos! Yo te acompaño paso a paso.";
  if (step === total - 1) return "¡Último paso! Ya casi lo logramos.";
  if (step >= Math.floor(total / 2)) return "Vamos a la mitad. ¡Lo estás haciendo muy bien!";
  return ["Muy bien. Sigue así.", "Huele rico desde aquí.", "Tú puedes. Yo te echo porras."][step % 3];
}

export const COOK_DONE_LINES = [
  "¡Lo lograste! Quedó precioso. ¿Me guardas una probadita?",
  "¡Receta terminada! Eres la mejor cocinera del mundo.",
  "¡Guau! Eso huele delicioso. Estoy muy orgulloso.",
];

// ── Busca el hueso ──────────────────────────────────────────────────

export const BONE_ROUNDS = 3;
export const boneSize = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 4 : l === "dificil" ? 6 : 5);
export const boneDigs = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 8 : l === "dificil" ? 7 : 7);
/** Dónde está el hueso en una cuadrícula de `size`×`size`. */
export const boneAt = (rnd: () => number, size: number) => ({ r: Math.floor(rnd() * size), c: Math.floor(rnd() * size) });
/** Distancia en pasos (diagonal cuenta como uno). */
export const boneDist = (a: { r: number; c: number }, b: { r: number; c: number }) => Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
export type Heat = "aqui" | "ardiendo" | "caliente" | "tibio" | "frio" | "congelado";
export function heatOf(dist: number): Heat {
  return dist === 0 ? "aqui" : dist === 1 ? "ardiendo" : dist === 2 ? "caliente" : dist === 3 ? "tibio" : dist === 4 ? "frio" : "congelado";
}
export const HEAT_LABEL: Record<Heat, string> = { aqui: "¡Aquí está!", ardiendo: "¡Muy caliente!", caliente: "Caliente", tibio: "Tibio", frio: "Frío", congelado: "¡Congelado!" };
export const HEAT_SAYS: Record<Heat, string> = {
  aqui: "¡Lo encontraste! ¡Mi hueso!",
  ardiendo: "¡Snif, snif! Está justo al ladito.",
  caliente: "Huele fuerte por aquí. Ya casi.",
  tibio: "Algo huele, pero todavía lejos.",
  frio: "Mmm, por aquí no huele a hueso.",
  congelado: "Brrr, ni rastro del hueso por acá.",
};
/** Puntaje de una ronda: encontrarlo vale 0.4 y con menos hoyos, más. */
export function boneScore(found: boolean, digs: number, max: number) {
  if (!found) return 0;
  return Math.max(0.4, Math.min(1, 0.4 + 0.6 * (1 - (digs - 1) / Math.max(1, max - 1))));
}

// ── Ritmo de Mochito ────────────────────────────────────────────────

export const RHYTHM_TRAVEL = 1600; // ms que tarda una patita en llegar a la línea
export const RHYTHM_PERFECT = 110;
export const RHYTHM_GOOD = 230;
export const rhythmBeat = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 900 : l === "dificil" ? 520 : 700);
/** Las patitas de la canción: 24 tiempos, a veces se salta uno. Devuelve en qué ms llega cada una. */
export function rhythmSong(rnd: () => number, l: "facil" | "normal" | "dificil", beats = 24) {
  const beat = rhythmBeat(l);
  const out: number[] = [];
  for (let i = 0; i < beats; i++) if (i < 2 || rnd() > 0.18) out.push(1200 + i * beat);
  return out;
}
export type Judge = "perfect" | "good" | "miss";
export const judge = (delta: number): Judge => (Math.abs(delta) <= RHYTHM_PERFECT ? "perfect" : Math.abs(delta) <= RHYTHM_GOOD ? "good" : "miss");
export const rhythmScore = (perfect: number, good: number, total: number) => (total ? Math.min(1, (perfect + good * 0.6) / total) : 0);

// ── Atrapa burbujas ─────────────────────────────────────────────────

export const BUBBLE_MS = 30_000;
export const bubbleSpec = (l: "facil" | "normal" | "dificil") => (l === "facil" ? { every: 900, speed: 0.16, gold: 0.15 } : l === "dificil" ? { every: 520, speed: 0.3, gold: 0.1 } : { every: 700, speed: 0.22, gold: 0.12 });
export const BUBBLE_POINTS = { normal: 1, gold: 3 };
/** Puntaje: lo que reventaste contra lo que salió. */
export const bubbleScore = (got: number, possible: number) => (possible > 0 ? Math.max(0, Math.min(1, got / possible / 0.8)) : 0);

// ── Lotería de Mochito ──────────────────────────────────────────────

export interface LoteriaCard { id: string; name: string; verse: string }

export const LOTERIA: LoteriaCard[] = [
  { id: "pose:feliz", name: "Mochito", verse: "El que mueve la colita: ¡Mochito!" },
  { id: "pose:dormido", name: "El dormilón", verse: "Cierra los ojos y ronca bajito: ¡el dormilón!" },
  { id: "pose:fiesta", name: "El fiestero", verse: "Con gorrito y serpentina: ¡el fiestero!" },
  { id: "pose:saltando", name: "El brincón", verse: "Salta y salta sin parar: ¡el brincón!" },
  { id: "pose:sentado", name: "El obediente", verse: "Se sienta cuando le dicen: ¡el obediente!" },
  { id: "pose:girado", name: "El curioso", verse: "Todo lo quiere oler: ¡el curioso!" },
  { id: "amigo:panque", name: "Panqué", verse: "Huele a vainilla: ¡Panqué!" },
  { id: "amigo:canela", name: "Canela", verse: "Se persigue la cola: ¡Canela!" },
  { id: "amigo:pimienta", name: "Pimienta", verse: "Cuida todo el parque: ¡Pimienta!" },
  { id: "amigo:chispa", name: "Chispa", verse: "Más rápida que el viento: ¡Chispa!" },
  { id: "amigo:nube", name: "Nube", verse: "Blanquita y dormilona: ¡Nube!" },
  { id: "amigo:tamal", name: "Tamal", verse: "Siempre pregunta si hay comida: ¡Tamal!" },
  { id: "amigo:rayo", name: "Rayo", verse: "Ve una pelota y sale corriendo: ¡Rayo!" },
  { id: "amigo:luna", name: "Luna", verse: "Le gustan las estrellas: ¡Luna!" },
  { id: "pet:cama-nube", name: "La cama", verse: "Suavecita como algodón: ¡la cama!" },
  { id: "pet:plato", name: "El platito", verse: "Nunca lo deja con nada: ¡el platito!" },
  { id: "pet:pelota", name: "La pelota", verse: "Redonda y saltarina: ¡la pelota!" },
  { id: "pet:cuerda", name: "La cuerda", verse: "Tira tú, que yo tiro: ¡la cuerda!" },
  { id: "pet:hueso", name: "El hueso", verse: "Lo esconde en el jardín: ¡el hueso!" },
  { id: "pet:peluche", name: "El peluche", verse: "Su amigo de las siestas: ¡el peluche!" },
  { id: "pet:cama-rey", name: "La cama de rey", verse: "Para el rey de la casa: ¡la cama de rey!" },
  { id: "pet:plato-hueso", name: "El plato de hueso", verse: "Con su huesito pintado: ¡el plato de hueso!" },
  { id: "pet:cama-corazon", name: "La cama de corazón", verse: "Hecha con puro cariño: ¡la cama de corazón!" },
  { id: "icon:galleta", name: "La galleta", verse: "Crujiente y sin chocolate: ¡la galleta!" },
];

export const LOTERIA_BOARD = 16;
export const loteriaEvery = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 3800 : l === "dificil" ? 2100 : 2900);

/** Tu tabla (16 cartas) y el orden en que Mochito las canta (todas, revueltas). */
export function loteriaGame(rnd: () => number) {
  const deck = [...LOTERIA];
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const pool = [...LOTERIA];
  const board: LoteriaCard[] = [];
  for (let i = 0; i < LOTERIA_BOARD; i++) board.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return { board, calls: deck };
}
/** Puntaje: casillas bien marcadas; llenar la tabla da todo, cada error resta un poco. */
export const loteriaScore = (marked: number, wrong: number) => Math.max(0, Math.min(1, marked / LOTERIA_BOARD - wrong * 0.05));
