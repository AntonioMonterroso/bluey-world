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
  | { kind: "walk"; friend?: string; newFriend?: boolean } | { kind: "game"; game?: string }
  | { kind: "trick"; name: string } | { kind: "medal"; name: string } | { kind: "level"; level: number }
  | { kind: "thing"; name: string } | { kind: "birthday"; age: number };

/** Cómo lo cuenta Mochito en su diario (en primera persona). */
export function logLine(ev: LogEvent): string {
  switch (ev.kind) {
    case "pet": return "Me diste muchos cariños.";
    case "treat": return "Comí galletas riquísimas.";
    case "bath": return "Me bañaste con burbujas y quedé limpiecito.";
    case "photo": return "Nos tomamos fotos. Salí guapísimo.";
    case "gift": return `Abrí mi regalo del día: ${ev.coins} monedas.`;
    case "walk": return ev.friend ? (ev.newFriend ? `Salimos de paseo y me hice amigo de ${ev.friend}.` : `Salimos de paseo y vi a ${ev.friend}.`) : "Salimos de paseo al parque.";
    case "game": return ev.game ? `Jugamos «${ev.game}».` : "Jugamos un rato juntos.";
    case "trick": return `Aprendí un truco nuevo: ${ev.name.toLowerCase()}.`;
    case "medal": return `Gané la medalla «${ev.name}».`;
    case "level": return `¡Subí al nivel ${ev.level}!`;
    case "thing": return `Estrené ${ev.name.toLowerCase()}.`;
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
