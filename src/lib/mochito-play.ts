import { dayKey, rng } from "./game/engine";

// Lo que Mochito va ganando contigo: nivel, trucos, medallas y su paseo del día. Lógica pura.

export interface MochitoStats {
  xp: number;
  pets: number;
  treats: number;
  games: number;
  walks: number;
  days: string[]; // días en que lo cuidaste
  walk_day?: string; // último día que salió de paseo
  xp_day?: string;
  xp_today?: number;
}

export type CareKind = "pet" | "treat" | "game" | "walk" | "trick";

export const EMPTY_STATS: MochitoStats = { xp: 0, pets: 0, treats: 0, games: 0, walks: 0, days: [] };

export const CARE_XP: Record<CareKind, number> = { pet: 2, treat: 4, game: 6, walk: 8, trick: 10 };
/** Tope de experiencia por día con cariños, galletas y juegos (el paseo y los trucos no cuentan). */
export const DAILY_XP = 40;
export const PET_XP_EVERY_MS = 5 * 60_000;

/** Suma lo que hiciste con Mochito. `lastPet` evita que acariciarlo sin parar suba el nivel de golpe. */
export function applyCare(stats: MochitoStats | undefined, kind: CareKind, now: number, lastPet?: number): MochitoStats {
  const s: MochitoStats = { ...EMPTY_STATS, ...stats, days: [...(stats?.days ?? [])] };
  const day = dayKey(now);
  if (!s.days.includes(day)) s.days = [...s.days, day].slice(-400);
  if (kind === "pet") s.pets++;
  if (kind === "treat") s.treats++;
  if (kind === "game") s.games++;
  if (kind === "walk") { s.walks++; s.walk_day = day; }

  let gain = CARE_XP[kind];
  if (kind === "pet" && lastPet && now - lastPet < PET_XP_EVERY_MS) gain = 0;
  if (kind === "pet" || kind === "treat" || kind === "game") {
    const today = s.xp_day === day ? (s.xp_today ?? 0) : 0;
    gain = Math.max(0, Math.min(gain, DAILY_XP - today));
    s.xp_day = day;
    s.xp_today = today + gain;
  }
  s.xp += gain;
  return s;
}

// ── Nivel ───────────────────────────────────────────────────────────

export const MAX_LEVEL = 15;
/** Experiencia total para llegar a un nivel: 0, 10, 30, 60, 100… */
export const xpForLevel = (level: number) => (5 * (level - 1) * level);

export function mochitoLevel(xp: number) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  const from = xpForLevel(level);
  const to = level < MAX_LEVEL ? xpForLevel(level + 1) : from;
  return { level, have: xp - from, need: to - from, max: level >= MAX_LEVEL };
}

// ── Trucos ──────────────────────────────────────────────────────────

export interface Trick { id: string; name: string; level: number; says: string }

export const TRICKS: Trick[] = [
  { id: "sentarse", name: "Sentarse", level: 1, says: "¡Sentado! ¿Lo hice bien?" },
  { id: "pata", name: "Dar la pata", level: 2, says: "Toma mi patita. ¡Somos amigos!" },
  { id: "girar", name: "Girar", level: 3, says: "¡Vuelta y vuelta! Me mareé un poquito." },
  { id: "saltar", name: "Saltar", level: 5, says: "¡Brinco alto como un panqué que sube!" },
  { id: "rodar", name: "Rodar", level: 7, says: "¡Rodé como una dona!" },
  { id: "muerto", name: "Hacerse el dormido", level: 9, says: "Zzz… ¡Ja! Era broma." },
  { id: "bailar", name: "Bailar", level: 12, says: "¡A bailar! Esta canción me encanta." },
];

export const TEACH_TRIES = 3;

export const trickReady = (t: Trick, level: number) => level >= t.level;

// ── Medallas ────────────────────────────────────────────────────────

export interface MedalInput { stats: MochitoStats; tricks: string[]; level: number; things: number }
export interface Medal { id: string; name: string; desc: string; coins: number; check: (m: MedalInput) => boolean }

export const MEDALS: Medal[] = [
  { id: "carino-1", name: "Primer cariño", desc: "Acaricia a Mochito por primera vez.", coins: 5, check: (m) => m.stats.pets >= 1 },
  { id: "carino-50", name: "Mejores amigos", desc: "Dale 50 cariños.", coins: 10, check: (m) => m.stats.pets >= 50 },
  { id: "galleta-25", name: "Panza contenta", desc: "Dale 25 galletas.", coins: 10, check: (m) => m.stats.treats >= 25 },
  { id: "galleta-100", name: "Chef de Mochito", desc: "Dale 100 galletas.", coins: 20, check: (m) => m.stats.treats >= 100 },
  { id: "dias-7", name: "Una semana juntos", desc: "Cuídalo 7 días distintos.", coins: 15, check: (m) => m.stats.days.length >= 7 },
  { id: "dias-30", name: "Un mes juntos", desc: "Cuídalo 30 días distintos.", coins: 30, check: (m) => m.stats.days.length >= 30 },
  { id: "paseo-1", name: "Primer paseo", desc: "Sácalo a pasear.", coins: 5, check: (m) => m.stats.walks >= 1 },
  { id: "paseo-10", name: "Explorador", desc: "Sácalo a pasear 10 veces.", coins: 15, check: (m) => m.stats.walks >= 10 },
  { id: "juego-10", name: "Compañero de juegos", desc: "Juega 10 partidas con él.", coins: 10, check: (m) => m.stats.games >= 10 },
  { id: "truco-1", name: "Primer truco", desc: "Enséñale un truco.", coins: 5, check: (m) => m.tricks.length >= 1 },
  { id: "truco-todos", name: "Perrito de circo", desc: "Enséñale todos los trucos.", coins: 25, check: (m) => TRICKS.every((t) => m.tricks.includes(t.id)) },
  { id: "nivel-5", name: "Nivel 5", desc: "Lleva a Mochito al nivel 5.", coins: 10, check: (m) => m.level >= 5 },
  { id: "nivel-10", name: "Nivel 10", desc: "Lleva a Mochito al nivel 10.", coins: 20, check: (m) => m.level >= 10 },
  { id: "casita", name: "Su casita", desc: "Ponle cama, platito y juguete.", coins: 10, check: (m) => m.things >= 3 },
];

export const medalEventId = (id: string) => `mochito-medalla:${id}`;
export const earnedMedals = (m: MedalInput) => MEDALS.filter((x) => x.check(m));

// ── Paseo del día ───────────────────────────────────────────────────

export const WALK_LINES = [
  "¡Olí una flor que olía a vainilla!",
  "Vi una ardilla. Ella me vio a mí. Empate.",
  "Saludé a un perrito nuevo. Se llama Panqué.",
  "Encontré un charquito y NO me metí. Bueno, un poquito.",
  "El parque huele a pan recién hecho. ¿Será tu local?",
  "Una señora me dijo que soy muy guapo. Tiene razón.",
  "Perseguí una hoja. Gané yo.",
  "Me senté bajo un árbol a pensar en galletas.",
];

export type WalkFind =
  | { kind: "coins"; coins: number; text: string }
  | { kind: "line"; text: string }
  | { kind: "wear"; text: string; itemId: string; itemName: string };

export const walkedToday = (stats: MochitoStats | undefined, now: number) => stats?.walk_day === dayKey(now);

/** Lo que encuentra en el paseo: sale de la fecha, así no cambia si vuelves a abrirlo. */
export function walkFind(now: number, cheapWear: { id: string; name: string }[]): WalkFind {
  const rnd = rng(`paseo:${dayKey(now)}`);
  const roll = rnd();
  if (roll < 0.2 && cheapWear.length) {
    const it = cheapWear[Math.floor(rnd() * cheapWear.length)];
    return { kind: "wear", itemId: it.id, itemName: it.name, text: `¡Encontré algo para ponernos! Es: ${it.name}.` };
  }
  if (roll < 0.7) {
    const coins = 3 + Math.floor(rnd() * 6);
    return { kind: "coins", coins, text: `¡Encontré ${coins} monedas brillantes debajo de una banca!` };
  }
  return { kind: "line", text: WALK_LINES[Math.floor(rnd() * WALK_LINES.length)] };
}

// ── Atrapa la pelota ────────────────────────────────────────────────

export const FETCH_THROWS = 5;
/** La fuerza sube y baja mientras mantienes presionado (0 a 1 y de regreso). */
export function chargeAt(ms: number, period: number) {
  const t = (ms % period) / period;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}
export const fetchPeriod = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 2200 : l === "dificil" ? 1100 : 1600);
/** Dónde cae la pelota (0 a 1 de la cancha) según la fuerza. */
export const landingOf = (power: number) => 0.2 + Math.max(0, Math.min(1, power)) * 0.72;
/** Dónde está la banderita: más lejos en difícil. */
export function fetchTarget(rnd: () => number, l: "facil" | "normal" | "dificil") {
  const min = l === "dificil" ? 0.55 : 0.35;
  return min + rnd() * (0.92 - min);
}
/** Puntos de un tiro (0 a 1): más cerca de la bandera, más puntos; lejos también suma un poco. */
export function fetchPoints(landing: number, target: number, l: "facil" | "normal" | "dificil" = "normal") {
  const tol = l === "facil" ? 0.3 : l === "dificil" ? 0.16 : 0.22;
  const close = Math.max(0, 1 - Math.abs(landing - target) / tol);
  return Math.round(Math.min(1, close * 0.85 + target * 0.15) * 100) / 100;
}

// ── Escondidas ──────────────────────────────────────────────────────

export const HIDE_SPOTS = ["Vitrina", "Maceta", "Caja", "Horno", "Costal de harina", "Cortina", "Mesa", "Banco", "Carrito", "Canasta"];
export const HIDE_ROUNDS = 5;
export const hideCount = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 4 : l === "dificil" ? 9 : 6);
export const hideMs = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 10_000 : l === "dificil" ? 6_000 : 8_000);

export function hideRound(rnd: () => number, l: "facil" | "normal" | "dificil") {
  const pool = [...HIDE_SPOTS];
  const spots: string[] = [];
  for (let i = 0; i < hideCount(l); i++) spots.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return { spots, at: Math.floor(rnd() * spots.length) };
}

/** Puntaje de una ronda: encontrarlo vale 0.6 y lo rápido el resto; cada error resta un poco. */
export function hideRoundScore(found: boolean, leftMs: number, totalMs: number, misses: number) {
  if (!found) return 0;
  return Math.max(0.3, Math.min(1, 0.6 + 0.4 * (leftMs / totalMs) - misses * 0.1));
}
