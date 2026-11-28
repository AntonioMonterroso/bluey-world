import { rng, shuffle } from "./game/engine";

// Más de Mochito: la granja, la noche de estrellas, la piscina y lavar el carro,
// y la lógica de cuatro juegos (semillitas, cuadritos deslizantes, apaga las luces y salta fichas). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];

// ── Visitar la granja ───────────────────────────────────────────────

export const FARM_FOODS = { maiz: "Maíz", pasto: "Pasto", zanahoria: "Zanahorias", manzana: "Manzanas", hojas: "Hojas de lechuga" } as const;
export type FarmFood = keyof typeof FARM_FOODS;
export const FARM_FOOD_IDS = Object.keys(FARM_FOODS) as FarmFood[];
export const ANIMALS = [
  { id: "gallina", name: "La gallina", likes: ["maiz", "hojas"], color: "#c8553d" },
  { id: "vaca", name: "La vaca", likes: ["pasto", "manzana"], color: "#3a3330" },
  { id: "cabrita", name: "La cabrita", likes: ["hojas", "zanahoria"], color: "#d9c7a7" },
  { id: "cerdito", name: "El cerdito", likes: ["manzana", "maiz"], color: "#f2a7a0" },
  { id: "caballo", name: "El caballo", likes: ["zanahoria", "pasto"], color: "#8a5a2e" },
] as const satisfies readonly { id: string; name: string; likes: readonly FarmFood[]; color: string }[];
export type AnimalId = (typeof ANIMALS)[number]["id"];
export const FARM_ANIMALS = 4;
export const NESTS = 6;
export const MILK_TAPS = 10;
export const FARM_COINS = 4;
export const FARM_PERFECT_COINS = 2;
/** Los animales que piden comida hoy y lo que cada uno quiere. */
export function farmOf(day: string) {
  const r = rng(`granja:${day}`);
  return shuffle([...ANIMALS], r).slice(0, FARM_ANIMALS).map((a) => ({ id: a.id as AnimalId, name: a.name, color: a.color, wants: pick(a.likes, r) as FarmFood }));
}
/** En qué nidos hay huevo hoy (dos o tres) y si alguno es dorado. */
export function eggsOf(day: string) {
  const r = rng(`huevos:${day}`);
  const nests = shuffle(Array.from({ length: NESTS }, (_, i) => i), r).slice(0, r() < 0.5 ? 2 : 3).sort((a, b) => a - b);
  const golden = r() < 0.15 ? nests[0] : null;
  return { nests, golden };
}
export interface Farm { last?: string; visits?: number; eggs?: number; golden?: number; perfect?: number }

// ── Noche de estrellas ──────────────────────────────────────────────

export const MOON_PHASES = ["Luna nueva", "Luna creciente", "Cuarto creciente", "Luna casi llena que crece", "Luna llena", "Luna casi llena que se achica", "Cuarto menguante", "Luna menguante"] as const;
const SYNODIC = 29.530588853;
const NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14);
/** La edad de la luna en días (0 = nueva, ~14.8 = llena). */
export const moonAge = (now: number) => ((((now - NEW_MOON_2000) / 86_400_000) % SYNODIC) + SYNODIC) % SYNODIC;
/** Qué luna se ve hoy, de 0 (nueva) a 7. */
export const moonPhase = (now: number) => Math.round((moonAge(now) / SYNODIC) * 8) % 8;
/** Cuánto de la luna está iluminado (0 a 1) y si crece. */
export function moonLit(now: number) {
  const f = moonAge(now) / SYNODIC;
  return { lit: (1 - Math.cos(f * 2 * Math.PI)) / 2, waxing: f < 0.5 };
}
export const SKY_THINGS = {
  marte: { name: "Marte", note: "el planeta rojo", color: "#d0603d" },
  jupiter: { name: "Júpiter", note: "el planeta más grande, con rayas", color: "#d9b58c" },
  saturno: { name: "Saturno", note: "el de los anillos", color: "#e6cf8f" },
  venus: { name: "Venus", note: "el más brillante", color: "#fff3c4" },
  cometa: { name: "Un cometa", note: "con su cola larga", color: "#cfe8ff" },
  satelite: { name: "Un satélite", note: "que cruza despacito", color: "#c9d1dc" },
} as const;
export type SkyThing = keyof typeof SKY_THINGS;
export const SKY_IDS = Object.keys(SKY_THINGS) as SkyThing[];
/** El nombre para usarlo dentro de una frase: «un cometa», pero «Saturno». */
export const skyName = (id: SkyThing) => (id === "cometa" || id === "satelite" ? SKY_THINGS[id].name.toLowerCase() : SKY_THINGS[id].name);
export const SKY_W = 100, SKY_H = 60, LENS_R = 12;
export const SKY_FIND = 3;
/** Las tres cosas escondidas en el cielo de hoy y dónde están. */
export function skyOf(day: string) {
  const r = rng(`cielo:${day}`);
  const out: { id: SkyThing; x: number; y: number }[] = [];
  for (const id of shuffle([...SKY_IDS], r).slice(0, SKY_FIND)) {
    let x = 0, y = 0;
    for (let k = 0; k < 30; k++) {
      x = 10 + r() * (SKY_W - 20); y = 8 + r() * (SKY_H - 16);
      if (out.every((o) => Math.hypot(o.x - x, o.y - y) > 26)) break;
    }
    out.push({ id, x: Math.round(x), y: Math.round(y) });
  }
  return out;
}
export const inLens = (lens: { x: number; y: number }, p: { x: number; y: number }) => Math.hypot(lens.x - p.x, lens.y - p.y) <= LENS_R - 2;
export const SHOOTING_MS = 12_000;
export interface Shooting { id: number; at: number; x: number; y: number; dur: number }
/** Las estrellas fugaces de la noche: cruzan el cielo de vez en cuando. */
export function shootingOf(day: string): Shooting[] {
  const r = rng(`fugaces:${day}`);
  return Array.from({ length: 6 }, (_, id) => ({ id, at: 600 + id * 1800 + Math.round(r() * 500), x: 10 + Math.round(r() * 60), y: 6 + Math.round(r() * 22), dur: 1500 + Math.round(r() * 400) }));
}
export const STARS_COINS = 3;
export const WISH_COIN = 1;
export interface SkyBook { last?: string; nights?: number; seen?: Partial<Record<SkyThing, number>>; wishes?: number; moons?: number[] }

// ── Ir a la piscina ─────────────────────────────────────────────────

export const FLOATIES = { pato: "Flotador de patito", dona: "Dona de colores", sandia: "Sandía inflable" } as const;
export type Floatie = keyof typeof FLOATIES;
export const RINGS = 6;
export const POOL_START = { x: 50, y: 4 };
export interface Ring { id: number; x: number; y: number; color: string }
const RING_COLORS = ["#d6453d", "#f6c744", "#4a9a5b", "#3f74c4", "#8a63c9", "#f08a24"];
/** Los aros del fondo de hoy (en una piscina de 100×60; más abajo, más hondo). */
export function ringsOf(day: string): Ring[] {
  const r = rng(`aros:${day}`);
  return Array.from({ length: RINGS }, (_, id) => ({ id, x: 8 + Math.round(r() * 84), y: 18 + Math.round(r() * 36), color: RING_COLORS[id] }));
}
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
/** Cuánto aire cuesta nadar de un lugar a otro: lo hondo cuesta un poco más. */
export const swimCost = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.round(dist(a, b) * 0.9 + Math.max(0, b.y - a.y) * 0.3);
/** El aire que tienes: alcanza si vas al aro más cercano cada vez, con un poquito de sobra. */
export function poolAir(rings: Ring[]) {
  let at: { x: number; y: number } = POOL_START, cost = 0;
  const left = [...rings];
  while (left.length) {
    left.sort((a, b) => swimCost(at, a) - swimCost(at, b));
    const n = left.shift()!;
    cost += swimCost(at, n); at = n;
  }
  return Math.ceil(cost * 1.1);
}
/** Qué tan bonito fue el clavado: 3 si tocaste justo arriba. */
export const diveStars = (pos: number) => (Math.abs(pos - 0.5) < 0.08 ? 3 : Math.abs(pos - 0.5) < 0.2 ? 2 : 1);
/** Dónde va la marca del trampolín (sube y baja, de 0 a 1). */
export const boardPos = (t: number, period = 1400) => { const f = (t % period) / period; return f < 0.5 ? f * 2 : 2 - f * 2; };
export const poolCoins = (rings: number, stars: number) => 2 + rings + (stars === 3 ? 1 : 0);
export interface Pool { last?: string; swims?: number; best?: number; allRings?: number; floatie?: Floatie }

// ── Lavar el carro ──────────────────────────────────────────────────

export type CarTool = "manguera" | "jabon" | "esponja" | "toalla";
export const CAR_TOOLS: Record<CarTool, string> = { manguera: "Manguera", jabon: "Jabón", esponja: "Esponja", toalla: "Toalla" };
export const CAR_ZONES = 6;
export const SCRUBS = 3;
/** Cada parte del carro: 0 sucia, 1 mojada, 2 con jabón, 3 enjuagada, 4 seca. `spot` = tallones que le faltan a la mancha. */
export interface Zone { s: 0 | 1 | 2 | 3 | 4; spot: number }
export const CAR_COINS = 6;
export const CAR_PERFECT = 2;
export function carOf(day: string): Zone[] {
  const r = rng(`carro:${day}`);
  const spots = shuffle(Array.from({ length: CAR_ZONES }, (_, i) => i), r).slice(0, 2 + Math.floor(r() * 2));
  return Array.from({ length: CAR_ZONES }, (_, i) => ({ s: 0, spot: spots.includes(i) ? SCRUBS : 0 }));
}
/** Usar una herramienta en una parte del carro: dice si estaba bien y qué falta si no. */
export function washApply(zones: Zone[], tool: CarTool, i: number): { zones: Zone[]; ok: boolean; msg: string } {
  const z = zones[i];
  const set = (nz: Zone, msg: string) => ({ zones: zones.map((x, k) => (k === i ? nz : x)), ok: true, msg });
  const no = (msg: string) => ({ zones, ok: false, msg });
  if (tool === "manguera") {
    if (z.s === 0) return set({ ...z, s: 1 }, "¡Mojadito!");
    if (z.s === 2) return z.spot ? no("Esa mancha sigue ahí. Tállala con la esponja antes de enjuagar.") : set({ ...z, s: 3 }, "¡Enjuagado!");
    if (z.s === 1) return no("Ya está mojado. Ahora le toca jabón.");
    return no(z.s === 3 ? "Ya está enjuagado. Ahora sécalo con la toalla." : "¡Ya está seco y brillante!");
  }
  if (tool === "jabon") {
    if (z.s === 1) return set({ ...z, s: 2 }, "¡Espumita!");
    return no(z.s === 0 ? "Primero hay que mojarlo con la manguera." : z.s === 2 ? "Ya tiene jabón." : "Ya pasó el jabón por aquí.");
  }
  if (tool === "esponja") {
    if (z.s === 2 && z.spot) return set({ ...z, spot: z.spot - 1 }, z.spot > 1 ? "Tallando…" : "¡Se quitó la mancha!");
    if (z.s === 2) return no("Aquí no hay mancha. Ya se puede enjuagar.");
    return no(z.s < 2 ? "La esponja va con jabón. Primero moja y enjabona." : "Ya está limpio.");
  }
  if (z.s === 3) return set({ ...z, s: 4 }, "¡Brilla!");
  return no(z.s === 4 ? "Ya está seco." : "Todavía no. Primero lávalo y enjuágalo.");
}
export const carDone = (zones: Zone[]) => zones.every((z) => z.s === 4);
export interface CarWash { last?: string; washes?: number; perfect?: number }

// ── Semillitas ──────────────────────────────────────────────────────

/** 14 hoyitos: 0-5 los tuyos, 6 tu granero, 7-12 los de Mochito, 13 su granero. Se reparte al revés del reloj. */
export type Mk = number[];
export const MK_MINE = 6, MK_HIS = 13;
export const mkSeeds = (l: Lvl) => (l === "facil" ? 3 : 4);
export const mkInit = (seeds: number): Mk => Array.from({ length: 14 }, (_, i) => (i === MK_MINE || i === MK_HIS ? 0 : seeds));
const mkOwn = (side: "y" | "m") => (side === "y" ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
export const mkMoves = (b: Mk, side: "y" | "m") => mkOwn(side).filter((i) => b[i] > 0);
/** Toma las semillas del hoyito `i` y repártelas. Si la última cae en tu granero, otra vez te toca; si cae en un hoyito tuyo vacío, te llevas las de enfrente. */
export function mkSow(b: Mk, i: number, side: "y" | "m"): { b: Mk; again: boolean; took: number } {
  const out = [...b];
  let n = out[i], at = i;
  out[i] = 0;
  const skip = side === "y" ? MK_HIS : MK_MINE, store = side === "y" ? MK_MINE : MK_HIS;
  while (n > 0) { at = (at + 1) % 14; if (at === skip) continue; out[at]++; n--; }
  let took = 0;
  if (at !== store && mkOwn(side).includes(at) && out[at] === 1 && out[12 - at] > 0) {
    took = out[12 - at] + 1;
    out[store] += took; out[at] = 0; out[12 - at] = 0;
  }
  return { b: mkFinish(out), again: at === store, took };
}
/** Si un lado quedó vacío, cada quien guarda lo que le queda. */
export function mkFinish(b: Mk): Mk {
  const y = mkOwn("y").reduce((a, i) => a + b[i], 0), m = mkOwn("m").reduce((a, i) => a + b[i], 0);
  if (y && m) return b;
  const out = [...b];
  for (const i of [...mkOwn("y"), ...mkOwn("m")]) out[i] = 0;
  out[MK_MINE] += y; out[MK_HIS] += m;
  return out;
}
export const mkOver = (b: Mk) => !mkMoves(b, "y").length || !mkMoves(b, "m").length;
function mkSearch(b: Mk, side: "y" | "m", depth: number): number {
  if (!depth || mkOver(b)) return b[MK_HIS] - b[MK_MINE];
  const vals = mkMoves(b, side).map((i) => { const r = mkSow(b, i, side); return mkSearch(r.b, r.again ? side : side === "y" ? "m" : "y", depth - 1); });
  return side === "m" ? Math.max(...vals) : Math.min(...vals);
}
/** Qué hoyito toma Mochito: al azar en fácil, el que más le da en normal, pensando varias jugadas en difícil. */
export function mkMove(rnd: () => number, b: Mk, l: Lvl): number | null {
  const moves = mkMoves(b, "m");
  if (!moves.length) return null;
  if (l === "facil") return pick(moves, rnd);
  const score = (i: number) => {
    const r = mkSow(b, i, "m");
    if (l === "normal") return r.b[MK_HIS] - b[MK_HIS] + (r.again ? 2 : 0);
    return mkSearch(r.b, r.again ? "m" : "y", 4);
  };
  const best = Math.max(...moves.map(score));
  return pick(moves.filter((i) => score(i) === best), rnd);
}
export const mkScore = (mine: number, his: number) => (mine > his ? 1 : clamp01(0.15 + (mine / Math.max(1, mine + his)) * 0.8));

// ── Cuadritos deslizantes ───────────────────────────────────────────

export const slideSize = (l: Lvl) => (l === "facil" ? 3 : l === "normal" ? 4 : 5);
const slideSteps = (n: number) => (n === 3 ? 40 : n === 4 ? 90 : 160);
const nbrs = (i: number, n: number) => { const r = Math.floor(i / n), c = i % n; return [r > 0 ? i - n : -1, c < n - 1 ? i + 1 : -1, r < n - 1 ? i + n : -1, c > 0 ? i - 1 : -1].filter((x) => x >= 0); };
/** Los cuadritos en orden, con el hueco (0) al final. */
export const slideSolved = (n: number) => Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1));
/** Revuelve moviendo el hueco al azar: así siempre se puede resolver. */
export function slideMake(rnd: () => number, n: number): number[] {
  let b = slideSolved(n), prev = -1;
  for (let k = 0; k < slideSteps(n); k++) {
    const e = b.indexOf(0);
    const opts = nbrs(e, n).filter((x) => x !== prev);
    const j = pick(opts, rnd);
    b = slideMove(b, n, j) ?? b; prev = e;
  }
  if (slideDone(b)) return slideMake(rnd, n);
  return b;
}
/** Mueve el cuadrito `i` al hueco si está al lado; si no, nada. */
export function slideMove(b: number[], n: number, i: number): number[] | null {
  const e = b.indexOf(0);
  if (!nbrs(e, n).includes(i)) return null;
  const out = [...b];
  out[e] = out[i]; out[i] = 0;
  return out;
}
export const slideDone = (b: number[]) => b.every((v, i) => (i === b.length - 1 ? v === 0 : v === i + 1));
export const slideScore = (moves: number, n: number) => clamp01(1.15 - moves / (slideSteps(n) * 2.2));

// ── Apaga las luces ─────────────────────────────────────────────────

export const lightsSize = (l: Lvl) => (l === "facil" ? 3 : l === "normal" ? 4 : 5);
const lightsPresses = (n: number) => (n === 3 ? 3 : n === 4 ? 5 : 8);
/** Tocar una luz cambia ella y las de arriba, abajo y a los lados. */
export function lightsPress(b: boolean[], n: number, i: number): boolean[] {
  const out = [...b];
  for (const j of [i, ...nbrs(i, n)]) out[j] = !out[j];
  return out;
}
/** Prende luces tocando casillas al azar desde todo apagado: así siempre se pueden apagar. */
export function lightsMake(rnd: () => number, n: number) {
  const k = lightsPresses(n);
  const taps = shuffle(Array.from({ length: n * n }, (_, i) => i), rnd).slice(0, k);
  let b: boolean[] = Array(n * n).fill(false);
  for (const t of taps) b = lightsPress(b, n, t);
  if (b.every((x) => !x)) return lightsMake(rnd, n);
  return { b, taps, k };
}
export const lightsOff = (b: boolean[]) => b.every((x) => !x);
export const lightsScore = (moves: number, k: number) => clamp01(1 - Math.max(0, moves - k) / (k * 3));

// ── Salta fichas ────────────────────────────────────────────────────

const CROSS = ["..###..", "..###..", "#######", "#######", "#######", "..###..", "..###.."];
export const PEG_N = 7;
/** Las casillas del tablero en cruz. */
export const pegHoles = (): boolean[] => CROSS.flatMap((row) => [...row].map((ch) => ch === "#"));
const pegCount = (l: Lvl) => (l === "facil" ? 6 : l === "normal" ? 10 : 16);
export interface PegJump { from: number; over: number; to: number }
const DIR4 = [[-1, 0], [0, 1], [1, 0], [0, -1]];
/** Los saltos posibles: una ficha brinca a otra pegada y cae en un hueco vacío. */
export function pegJumps(b: boolean[]): PegJump[] {
  const holes = pegHoles();
  const out: PegJump[] = [];
  b.forEach((on, i) => {
    if (!on) return;
    const r = Math.floor(i / PEG_N), c = i % PEG_N;
    for (const [dr, dc] of DIR4) {
      const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
      if (r2 < 0 || c2 < 0 || r2 >= PEG_N || c2 >= PEG_N) continue;
      const over = r1 * PEG_N + c1, to = r2 * PEG_N + c2;
      if (holes[to] && b[over] && !b[to]) out.push({ from: i, over, to });
    }
  });
  return out;
}
export function pegApply(b: boolean[], j: PegJump): boolean[] {
  const out = [...b];
  out[j.from] = false; out[j.over] = false; out[j.to] = true;
  return out;
}
/** Arma el tablero desde el final (una sola ficha) deshaciendo saltos: así siempre se puede dejar una. */
export function pegMake(rnd: () => number, l: Lvl): boolean[] {
  const holes = pegHoles();
  const want = pegCount(l);
  for (let tries = 0; tries < 50; tries++) {
    let b: boolean[] = holes.map(() => false);
    const cells = holes.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);
    b[pick(cells, rnd)] = true;
    for (let k = 1; k < want; k++) {
      const back: PegJump[] = [];
      b.forEach((on, to) => {
        if (!on) return;
        const r = Math.floor(to / PEG_N), c = to % PEG_N;
        for (const [dr, dc] of DIR4) {
          const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
          if (r2 < 0 || c2 < 0 || r2 >= PEG_N || c2 >= PEG_N) continue;
          const over = r1 * PEG_N + c1, from = r2 * PEG_N + c2;
          if (holes[over] && holes[from] && !b[over] && !b[from]) back.push({ from, over, to });
        }
      });
      if (!back.length) break;
      const j = pick(back, rnd);
      b = [...b]; b[j.to] = false; b[j.over] = true; b[j.from] = true;
    }
    if (b.filter(Boolean).length === want && pegJumps(b).length) return b;
  }
  return pegMake(rnd, "facil");
}
export const pegLeft = (b: boolean[]) => b.filter(Boolean).length;
export const pegScore = (left: number) => (left <= 1 ? 1 : clamp01(0.85 - (left - 2) * 0.12));
