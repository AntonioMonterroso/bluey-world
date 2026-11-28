import { rng, shuffle } from "./game/engine";

// Más de Mochito: el zoológico, el cine, la estación de bomberos y el paseo en globo,
// y la lógica de cuatro juegos (toma palitos, une los colores, ¿mayor o menor? y torre de discos). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];

// ── Visitar el zoológico ────────────────────────────────────────────

export const HABITATS = {
  selva: { name: "Selva", color: "#3f8a4a" },
  sabana: { name: "Sabana", color: "#d9a54c" },
  agua: { name: "Río y lago", color: "#3f8fc4" },
  frio: { name: "Hielo", color: "#a9d4ea" },
} as const;
export type Habitat = keyof typeof HABITATS;
export const HABITAT_IDS = Object.keys(HABITATS) as Habitat[];
export const ZOO_ANIMALS = [
  { id: "mono", name: "Mono", home: "selva", color: "#8a5a2e", fact: "Usa la cola como una mano extra para colgarse." },
  { id: "tucan", name: "Tucán", home: "selva", color: "#f08a24", fact: "Su pico es grandote pero muy liviano, casi hueco." },
  { id: "jaguar", name: "Jaguar", home: "selva", color: "#e0a030", fact: "Le gusta nadar, al revés de casi todos los gatos." },
  { id: "jirafa", name: "Jirafa", home: "sabana", color: "#e6b85c", fact: "Su lengua es morada y mide casi medio metro." },
  { id: "leon", name: "León", home: "sabana", color: "#c98b3a", fact: "Su rugido se oye a 8 kilómetros." },
  { id: "cebra", name: "Cebra", home: "sabana", color: "#3a3330", fact: "No hay dos cebras con las mismas rayas." },
  { id: "hipopotamo", name: "Hipopótamo", home: "agua", color: "#8f7f8f", fact: "Pasa casi todo el día dentro del agua para no asolearse." },
  { id: "cocodrilo", name: "Cocodrilo", home: "agua", color: "#4f7a3a", fact: "Sus ojos están arriba para ver mientras se esconde en el agua." },
  { id: "flamenco", name: "Flamenco", home: "agua", color: "#ef8fa6", fact: "Es rosado por lo que come: camarones chiquitos." },
  { id: "pinguino", name: "Pingüino", home: "frio", color: "#2b2622", fact: "No vuela, pero nada rapidísimo." },
  { id: "osopolar", name: "Oso polar", home: "frio", color: "#f2efe6", fact: "Debajo del pelo blanco, su piel es negra." },
  { id: "foca", name: "Foca", home: "frio", color: "#8a9aa8", fact: "Puede dormir flotando en el agua." },
] as const satisfies readonly { id: string; name: string; home: Habitat; color: string; fact: string }[];
export type ZooAnimal = (typeof ZOO_ANIMALS)[number]["id"];
export const ZOO_TODAY = 5;
export const ZOO_COINS = 4;
/** Los cinco animales de hoy: primero los que todavía no están en el álbum. */
export function zooOf(day: string, seen: string[]) {
  const r = rng(`zoo:${day}`);
  const fresh = shuffle(ZOO_ANIMALS.filter((a) => !seen.includes(a.id)), r);
  const old = shuffle(ZOO_ANIMALS.filter((a) => seen.includes(a.id)), r);
  return [...fresh, ...old].slice(0, ZOO_TODAY);
}
export interface Zoo { last?: string; visits?: number; seen?: Partial<Record<ZooAnimal, number>> }

// ── Ir al cine ──────────────────────────────────────────────────────

export const MOVIES = [
  {
    id: "hueso", name: "El hueso perdido", color: "#c98b3a",
    scenes: ["Lalo, un perrito café, entierra su hueso favorito junto al árbol de mangos.", "Llueve toda la noche y en la mañana el jardín parece otro: Lalo no encuentra el árbol.", "Una ardilla le enseña a seguir el olor. ¡El hueso estaba junto al columpio rojo!"],
    quiz: [{ q: "¿Dónde enterró Lalo el hueso?", a: ["Junto al árbol de mangos", "Debajo de la cama", "En la playa"], ok: 0 }, { q: "¿Quién le ayudó a encontrarlo?", a: ["Un gato", "Una ardilla", "Un pez"], ok: 1 }],
  },
  {
    id: "nave", name: "La nave de cartón", color: "#5b7bb8",
    scenes: ["Dos hermanas arman una nave con una caja grande, cinta y tres botones pintados.", "Cuentan «tres, dos, uno» y la caja «despega» hasta la Luna del cuarto.", "Allá encuentran un planeta de almohadas y regresan justo a tiempo para cenar."],
    quiz: [{ q: "¿Con qué hicieron la nave?", a: ["Con madera", "Con una caja", "Con hielo"], ok: 1 }, { q: "¿Cómo era el planeta que encontraron?", a: ["De almohadas", "De chocolate", "De piedras"], ok: 0 }],
  },
  {
    id: "dragon", name: "El dragón con hipo", color: "#4a9a5b",
    scenes: ["Un dragón verde quiere echar fuego, pero cada vez que lo intenta le da hipo.", "Prueba aguantar la respiración, pararse de cabeza y beber agua al revés.", "Al final se ríe tanto con un chiste que el hipo se va… ¡y sale una burbuja de fuego!"],
    quiz: [{ q: "¿Qué le pasaba al dragón?", a: ["Tenía hipo", "Tenía sueño", "Tenía frío"], ok: 0 }, { q: "¿Qué le quitó el hipo?", a: ["Un vaso de leche", "Un chiste", "Una siesta"], ok: 1 }],
  },
  {
    id: "lluvia", name: "Carrera bajo la lluvia", color: "#3f8fc4",
    scenes: ["Tres caracoles hacen una carrera hasta la hoja más grande del jardín.", "Empieza a llover y el camino se vuelve un río chiquito.", "El caracol más lento usa una hoja de barco y llega primero."],
    quiz: [{ q: "¿Cuántos caracoles corrieron?", a: ["Dos", "Tres", "Cinco"], ok: 1 }, { q: "¿Cómo ganó el más lento?", a: ["Usó una hoja de barco", "Hizo trampa", "Corrió más rápido"], ok: 0 }],
  },
] as const;
export type MovieId = (typeof MOVIES)[number]["id"];
export const CINEMA_ROWS = ["A", "B", "C", "D", "E"] as const;
export const CINEMA_COLS = 6;
export const TICKET_PRICE = 3;
export const CINEMA_COINS = 4;
export const QUIZ_COIN = 1;
/** La cartelera de hoy (tres películas) y el asiento que te toca. */
export function cinemaOf(day: string) {
  const r = rng(`cine:${day}`);
  const billboard = shuffle([...MOVIES], r).slice(0, 3).map((m) => m.id as MovieId);
  return { billboard, row: Math.floor(r() * CINEMA_ROWS.length) % CINEMA_ROWS.length, col: Math.floor(r() * CINEMA_COLS) % CINEMA_COLS };
}
/** Los asientos que ya están ocupados (nunca el tuyo). */
export function takenSeats(day: string, mine: number): number[] {
  const r = rng(`ocupados:${day}`);
  return shuffle(Array.from({ length: CINEMA_ROWS.length * CINEMA_COLS }, (_, i) => i).filter((i) => i !== mine), r).slice(0, 11);
}
export interface Cinema { last?: string; movies?: number; perfect?: number; seen?: string[] }

// ── Estación de bomberos ────────────────────────────────────────────

export const GEAR = { casco: "Casco", chaqueta: "Chaqueta", botas: "Botas", sombrero: "Sombrero de playa", chanclas: "Chanclas", bufanda: "Bufanda" } as const;
export type Gear = keyof typeof GEAR;
export const GEAR_OK: Gear[] = ["casco", "chaqueta", "botas"];
export const FIRE_CELLS = 9;
export const FIRE_MS = 20_000;
export const FIRE_GROW_MS = 3000;
export const FIRE_MAX = 5;
export interface Fire { id: number; at: number; cell: number }
/** Los fuegos de hoy: van apareciendo en distintas ventanas del edificio. */
export function firesOf(day: string): Fire[] {
  const r = rng(`fuegos:${day}`);
  const cells = shuffle(Array.from({ length: FIRE_CELLS }, (_, i) => i), r);
  return cells.slice(0, 6).map((cell, id) => ({ id, at: 400 + id * 2300 + Math.round(r() * 600), cell }));
}
/** Qué tan grande está un fuego: crece solito y el agua lo achica. */
export const fireSize = (f: Fire, t: number, sprays: number) => (t < f.at ? 0 : Math.max(0, Math.min(FIRE_MAX, 2 + Math.floor((t - f.at) / FIRE_GROW_MS)) - sprays));
/** En qué rama está el gatito (de 3 a 6 tramos de escalera). */
export const catOf = (day: string) => 3 + (Math.floor(rng(`gatito:${day}`)() * 4) % 4);
export const FIRE_COINS = 6;
export const FIRE_PERFECT = 3;
export interface FireStation { last?: string; calls?: number; perfect?: number; cats?: number }

// ── Paseo en globo ──────────────────────────────────────────────────

export const PLACES_UP = {
  escuela: { name: "La escuela", level: 1, color: "#d6453d" },
  lago: { name: "El lago", level: 1, color: "#3f8fc4" },
  mercado: { name: "El mercado", level: 1, color: "#f08a24" },
  iglesia: { name: "La iglesia", level: 2, color: "#f2efe6" },
  estadio: { name: "El estadio", level: 2, color: "#4a9a5b" },
  molino: { name: "El molino", level: 2, color: "#b9854c" },
  cerro: { name: "El cerro", level: 3, color: "#6b7b4a" },
  antena: { name: "La antena de radio", level: 3, color: "#9aa3ad" },
} as const;
export type PlaceUp = keyof typeof PLACES_UP;
export const PLACE_UP_IDS = Object.keys(PLACES_UP) as PlaceUp[];
export const LEVELS_UP = 4;
export const FLIGHT_MS = 36_000;
export const SPOT_W = 0.05;
/** El mapa de hoy: los ocho lugares en fila (de 0 a 1) y los tres que hay que fotografiar. */
export function flightOf(day: string) {
  const r = rng(`globo:${day}`);
  const order = shuffle([...PLACE_UP_IDS], r);
  const map = order.map((id, k) => ({ id, x: 0.1 + k * 0.11 }));
  const goals = shuffle([...order], r).slice(0, 3);
  const birds = Array.from({ length: 3 }, (_, k) => ({ x: 0.2 + k * 0.27 + r() * 0.05, level: 2 + (Math.floor(r() * 2) % 2) }));
  return { map, goals, birds };
}
/** Qué lugar queda justo debajo del globo, si hay alguno. */
export const underBalloon = (map: { id: PlaceUp; x: number }[], x: number) => map.find((p) => Math.abs(p.x - x) <= SPOT_W) ?? null;
export const BALLOON_COINS = 4;
export const PHOTO_COINS = 2;
export interface Balloon { last?: string; flights?: number; photos?: Partial<Record<PlaceUp, number>> }

// ── Toma palitos ────────────────────────────────────────────────────

export const sticksStart = (l: Lvl) => (l === "facil" ? 12 : l === "normal" ? 16 : 22);
/** Cuántos palitos toma Mochito: al azar en fácil, con el truco a veces en normal y siempre en difícil (deja 1, 5, 9, 13…). */
export function sticksMove(rnd: () => number, n: number, l: Lvl): number {
  const max = Math.min(3, n);
  const smart = (n - 1) % 4;
  const useTrick = l === "dificil" || (l === "normal" && rnd() < 0.5);
  if (useTrick && smart >= 1 && smart <= max) return smart;
  return 1 + (Math.floor(rnd() * max) % max);
}

// ── Une los colores ─────────────────────────────────────────────────

export const FLOW_COLORS = ["#d6453d", "#3f74c4", "#f6c744", "#4a9a5b", "#e3893a", "#8a63c9", "#ef7fa6", "#3fb6b0", "#8a5a2e"];
export const flowSpec = (l: Lvl) => (l === "facil" ? { n: 5, pairs: 4 } : l === "normal" ? { n: 6, pairs: 5 } : { n: 7, pairs: 7 });
const flowNbrs = (i: number, n: number) => { const r = Math.floor(i / n), c = i % n; return [r > 0 ? i - n : -1, c < n - 1 ? i + 1 : -1, r < n - 1 ? i + n : -1, c > 0 ? i - 1 : -1].filter((x) => x >= 0); };
export const flowAdj = (a: number, b: number, n: number) => flowNbrs(a, n).includes(b);
/** Un camino que pasa por todas las casillas, revuelto con «mordidas» de una punta, cortado en tramos: cada tramo es un color. */
export function flowMake(rnd: () => number, n: number, pairs: number) {
  let path: number[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push(r * n + (r % 2 ? n - 1 - c : c));
  for (let k = 0; k < n * n * 40; k++) {
    if (rnd() < 0.5) path.reverse();
    const end = path[path.length - 1];
    const opts = flowNbrs(end, n).filter((x) => x !== path[path.length - 2]);
    const j = path.indexOf(pick(opts, rnd));
    path = [...path.slice(0, j + 1), ...path.slice(j + 1).reverse()];
  }
  const total = n * n;
  const cuts: number[] = [];
  const minLen = 3;
  let left = total;
  for (let p = pairs; p > 1; p--) {
    const max = left - minLen * (p - 1);
    const len = Math.max(minLen, Math.min(max, Math.round(left / p + (rnd() - 0.5) * (left / p))));
    cuts.push(len); left -= len;
  }
  cuts.push(left);
  const sol: number[] = Array(total).fill(-1);
  const dots: { color: number; a: number; b: number }[] = [];
  const segs: number[][] = [];
  let at = 0;
  cuts.forEach((len, color) => {
    const seg = path.slice(at, at + len);
    seg.forEach((cell) => { sol[cell] = color; });
    dots.push({ color, a: seg[0], b: seg[seg.length - 1] });
    segs.push(seg);
    at += len;
  });
  return { n, dots, sol, segs };
}
/** ¿Cada color une sus dos puntos con un camino y no queda casilla vacía? */
export function flowDone(paths: number[][], dots: { a: number; b: number }[], n: number) {
  const used = new Set<number>();
  for (let k = 0; k < dots.length; k++) {
    const p = paths[k] ?? [];
    if (p.length < 2) return false;
    const ends = [p[0], p[p.length - 1]];
    if (!(ends.includes(dots[k].a) && ends.includes(dots[k].b))) return false;
    for (let i = 1; i < p.length; i++) if (!flowAdj(p[i - 1], p[i], n)) return false;
    for (const c of p) used.add(c);
  }
  return used.size === n * n;
}
export const flowScore = (resets: number) => clamp01(1 - resets * 0.1);

// ── ¿Mayor o menor? ─────────────────────────────────────────────────

export const hiloSpec = (l: Lvl) => (l === "facil" ? { top: 10, lives: 3, cards: 16 } : l === "normal" ? { top: 13, lives: 2, cards: 20 } : { top: 13, lives: 1, cards: 24 });
/** El mazo de la partida: números del 1 al tope con su palo. */
export function hiloDeck(rnd: () => number, l: Lvl) {
  const s = hiloSpec(l);
  const all = Array.from({ length: s.top * 4 }, (_, i) => ({ v: (i % s.top) + 1, suit: Math.floor(i / s.top) }));
  return shuffle(all, rnd).slice(0, s.cards + 1);
}
/** Acertó si la siguiente es como dijo; si salen iguales, cuenta como acierto. */
export const hiloRight = (a: number, b: number, guess: "mayor" | "menor") => a === b || (guess === "mayor" ? b > a : b < a);
export const hiloScore = (hits: number, cards: number) => clamp01(hits / Math.max(1, cards * 0.75));

// ── Torre de discos ─────────────────────────────────────────────────

export const discsOf = (l: Lvl) => (l === "facil" ? 3 : l === "normal" ? 4 : 5);
/** Tres palos; el primero tiene todos los discos, el más grande abajo. */
export const hanoiInit = (n: number): number[][] => [Array.from({ length: n }, (_, i) => n - i), [], []];
/** Pasa el disco de arriba de un palo a otro, si se puede. */
export function hanoiMove(s: number[][], from: number, to: number): number[][] | null {
  if (from === to || !s[from].length) return null;
  const d = s[from][s[from].length - 1];
  const top = s[to][s[to].length - 1];
  if (top !== undefined && top < d) return null;
  return s.map((p, i) => (i === from ? p.slice(0, -1) : i === to ? [...p, d] : p));
}
export const hanoiDone = (s: number[][], n: number) => s[2].length === n;
export const hanoiMin = (n: number) => 2 ** n - 1;
export const hanoiScore = (moves: number, n: number) => clamp01(0.3 + 0.7 * (hanoiMin(n) / Math.max(hanoiMin(n), moves)));
