import { rng, shuffle } from "./game/engine";

// Más de Mochito: volar barrilete, día de playa, pijamada y ayudar en casa,
// y la lógica de cuatro juegos (sudoku de huellitas, puntos y cajitas, barquitos escondidos y gusanito comelón). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];

// ── Volar barrilete ─────────────────────────────────────────────────

export const KITE_COLORS = [
  { n: "Rojo", h: "#d6453d" }, { n: "Amarillo", h: "#f6c744" }, { n: "Azul", h: "#3f74c4" }, { n: "Verde", h: "#4a9a5b" }, { n: "Morado", h: "#8a63c9" }, { n: "Rosado", h: "#e27aa3" },
] as const;
export type Tail = "corta" | "larga";
export const TAILS: Record<Tail, { name: string; good: number; gain: number }> = {
  corta: { name: "Cola corta", good: 0.75, gain: 18 },
  larga: { name: "Cola larga", good: 0.6, gain: 13 },
};
export const KITE_TRIES = 8;
export const KITE_FALL = 6;
/** La fuerza del viento (0 a 1) a cada momento: sube y baja como ráfagas. Cada día sopla distinto. */
export function windAt(day: string, ms: number) {
  const r = rng(`viento:${day}`);
  const a = 0.0011 + r() * 0.0006, b = 0.0027 + r() * 0.0008, p = r() * 6;
  return clamp01(0.5 + 0.34 * Math.sin(ms * a + p) + 0.16 * Math.sin(ms * b + p * 2));
}
/** Cuánto sube (o baja) el barrilete si sueltas hilo con ese viento. */
export function kiteGain(wind: number, tail: Tail) {
  const t = TAILS[tail];
  if (wind >= t.good) return Math.round(t.gain * (0.8 + (wind - t.good) / (1 - t.good) * 0.4));
  if (wind >= t.good - 0.25) return 4;
  return -KITE_FALL;
}
export const kiteCoins = (height: number) => Math.min(10, Math.floor(height / 12));
export interface Kite { last?: string; best?: number; flights?: number }

// ── Día de playa ────────────────────────────────────────────────────

export const CASTLE = {
  base: { cuadrada: "Cuadrada", redonda: "Redonda" },
  torres: { 1: "Una torre", 2: "Dos torres", 3: "Tres torres" },
  extra: { bandera: "Banderita", foso: "Foso con agua", conchas: "Adornos de conchas" },
} as const;
export type CastleBase = keyof typeof CASTLE.base;
export type CastleExtra = keyof typeof CASTLE.extra;
export const SHELLS = {
  almeja: { name: "Almeja", rare: false, color: "#f2d4c4" },
  caracol: { name: "Caracol", rare: false, color: "#e9c48f" },
  abanico: { name: "Concha abanico", rare: false, color: "#f6a98a" },
  piedra: { name: "Piedrita lisa", rare: false, color: "#b9b3ac" },
  estrella: { name: "Estrella de mar", rare: true, color: "#f08a24" },
  perla: { name: "Concha con perla", rare: true, color: "#f1e9ff" },
} as const;
export type Shell = keyof typeof SHELLS;
export const SHELL_IDS = Object.keys(SHELLS) as Shell[];
export const WAVES = 3;
export const SHELLS_PER_WAVE = 4;
export const WAVE_MS = 5000;
export const RARE_COINS = 3;
/** Lo que deja el mar en cada ola: cuatro cosas por ola, y en todo el día al menos una rara. */
export function beachOf(day: string) {
  const r = rng(`playa:${day}`);
  const common = SHELL_IDS.filter((s) => !SHELLS[s].rare);
  const rare = SHELL_IDS.filter((s) => SHELLS[s].rare);
  const lucky = Math.floor(r() * WAVES * SHELLS_PER_WAVE);
  return Array.from({ length: WAVES }, (_, w) =>
    Array.from({ length: SHELLS_PER_WAVE }, (_, i) => {
      const n = w * SHELLS_PER_WAVE + i;
      const kind: Shell = n === lucky ? pick(rare, r) : r() < 0.08 ? pick(rare, r) : pick(common, r);
      return { id: `${w}-${i}`, kind, x: 0.1 + (i * 0.8) / (SHELLS_PER_WAVE - 1) + (r() - 0.5) * 0.08, y: 0.55 + r() * 0.3 };
    }),
  );
}
export const beachCoins = (found: Shell[]) => found.length + found.filter((s) => SHELLS[s].rare).length * RARE_COINS;
export interface Beach { last?: string; shells?: Partial<Record<Shell, number>>; castles?: number }

// ── Pijamada ────────────────────────────────────────────────────────

export const SHEETS = [{ n: "Azul", h: "#7aa6e0" }, { n: "Amarilla", h: "#f6d77a" }, { n: "Verde", h: "#9fdcb4" }, { n: "Rosada", h: "#f2b6cc" }] as const;
export const FORT_THINGS = { almohadas: "Almohadas", lucecitas: "Lucecitas", cobijas: "Cobijas", peluches: "Peluches", banderines: "Banderines" } as const;
export type FortThing = keyof typeof FORT_THINGS;
export const FORT_PICK = 3;
export const SNACKS = { palomitas: "palomitas", chocolate: "chocolate caliente", galletas: "galletas de avena" } as const;
export type Snack = keyof typeof SNACKS;
export const SHADOWS = { monstruo: "un monstruo con cuernos", fantasma: "un fantasma que flotaba", arana: "una araña gigante" } as const;
export type Shadow = keyof typeof SHADOWS;
/** El cuento de linterna: da un poquito de miedo, pero al final todo es de risa. */
export function shadowStory(shadow: Shadow, friend: string): string[] {
  const reveal: Record<Shadow, string> = {
    monstruo: "Era Mochito con dos calcetines en las orejas.",
    fantasma: `Era ${friend} tapado con una sábana, ¡buscando las galletas!`,
    arana: "Era la mano de Mochito haciendo sombras con la linterna.",
  };
  return [
    "Apagaron la luz. Solo quedó encendida la linterna.",
    `De pronto, en la pared de la casita apareció ${SHADOWS[shadow]}…`,
    `${friend} se escondió debajo de la cobija. Mochito tragó saliva y alumbró despacito…`,
    reveal[shadow],
    "Se rieron tanto que les dio hipo. Y luego, poquito a poco, se quedaron dormidos.",
  ];
}
export const SLEEP_COINS = 6;
export const SLEEP_HEARTS = 2;
export interface Sleepover { last?: string; friends?: Record<string, number> }

// ── Ayudar en casa ──────────────────────────────────────────────────

export type ChoreKind = "orden" | "toques" | "parejas";
export interface Chore { name: string; kind: ChoreKind; items: string[]; taps?: number; hint: string; did: string }
export const CHORES = {
  cama: { name: "Tender la cama", kind: "orden", items: ["Sábana", "Cobija", "Almohada", "Peluche"], hint: "Primero la sábana, luego la cobija, la almohada y el peluche encima.", did: "tendimos la cama" },
  regar: { name: "Regar las plantas", kind: "toques", items: ["Helecho", "Cactus", "Margarita"], taps: 3, hint: "Dale tres chorritos de agua a cada maceta.", did: "regamos las plantas" },
  platos: { name: "Lavar los platos", kind: "toques", items: ["Plato hondo", "Plato plano", "Taza", "Vaso"], taps: 3, hint: "Talla cada uno tres veces hasta que brille.", did: "lavamos los platos" },
  juguetes: { name: "Guardar los juguetes", kind: "orden", items: ["Pelota", "Bloques", "Carrito", "Osito", "Cuerda"], hint: "Guárdalos en la caja, del más grande al más chiquito: pelota, bloques, carrito, osito y cuerda.", did: "guardamos los juguetes" },
  ropa: { name: "Doblar la ropa", kind: "parejas", items: ["Rojo", "Azul", "Amarillo", "Verde"], hint: "Junta los calcetines del mismo color.", did: "juntamos los calcetines" },
  basura: { name: "Sacar la basura", kind: "orden", items: ["Cerrar la bolsa", "Llevarla a la puerta", "Ponerla en el bote"], hint: "Ciérrala, llévala a la puerta y échala al bote de afuera.", did: "sacamos la basura" },
} as const satisfies Record<string, Chore>;
export type ChoreId = keyof typeof CHORES;
export const CHORE_IDS = Object.keys(CHORES) as ChoreId[];
export const CHORES_PER_DAY = 4;
export const CHORE_COIN = 1;
export const CHORES_ALL_COINS = 4;
/** Las tareas del día: cuatro de seis, siempre en el mismo orden ese día. */
export const choresOf = (day: string): ChoreId[] => shuffle([...CHORE_IDS], rng(`casa:${day}`)).slice(0, CHORES_PER_DAY);
/** Los calcetines revueltos para la tarea de doblar ropa (dos de cada color). */
export const socksOf = (day: string) => shuffle(CHORES.ropa.items.flatMap((c) => [c, c]), rng(`calcetines:${day}`));
export interface Chores { day?: string; done?: ChoreId[]; stars?: number }

// ── Sudoku de huellitas ─────────────────────────────────────────────

export interface Sudoku { size: number; bw: number; bh: number; solution: number[]; puzzle: number[] }
export const sudokuSpec = (l: Lvl) => (l === "facil" ? { size: 4, bw: 2, bh: 2, givens: 9 } : l === "normal" ? { size: 4, bw: 2, bh: 2, givens: 6 } : { size: 6, bw: 3, bh: 2, givens: 16 });
/** Un sudoku resuelto y revuelto (con símbolos 1..n), y cuáles casillas se dejan a la vista. */
export function sudokuMake(rnd: () => number, l: Lvl): Sudoku {
  const { size, bw, bh, givens } = sudokuSpec(l);
  const base = (r: number, c: number) => ((r % bh) * bw + Math.floor(r / bh) + c) % size;
  const bands = shuffle(Array.from({ length: size / bh }, (_, i) => i), rnd);
  const rows = bands.flatMap((b) => shuffle(Array.from({ length: bh }, (_, i) => b * bh + i), rnd));
  const stacks = shuffle(Array.from({ length: size / bw }, (_, i) => i), rnd);
  const cols = stacks.flatMap((s) => shuffle(Array.from({ length: bw }, (_, i) => s * bw + i), rnd));
  const sym = shuffle(Array.from({ length: size }, (_, i) => i + 1), rnd);
  const solution = rows.flatMap((r) => cols.map((c) => sym[base(r, c)]));
  const keep = new Set(shuffle(Array.from({ length: size * size }, (_, i) => i), rnd).slice(0, givens));
  return { size, bw, bh, solution, puzzle: solution.map((v, i) => (keep.has(i) ? v : 0)) };
}
/** Las casillas que chocan con poner `v` en `i` (misma fila, columna o cuadro). */
export function sudokuClash(g: number[], s: Pick<Sudoku, "size" | "bw" | "bh">, i: number, v: number): number[] {
  const r = Math.floor(i / s.size), c = i % s.size;
  const br = Math.floor(r / s.bh) * s.bh, bc = Math.floor(c / s.bw) * s.bw;
  return g.flatMap((x, j) => {
    if (j === i || x !== v || !v) return [];
    const rj = Math.floor(j / s.size), cj = j % s.size;
    return rj === r || cj === c || (rj >= br && rj < br + s.bh && cj >= bc && cj < bc + s.bw) ? [j] : [];
  });
}
export const sudokuSolved = (g: number[], s: Pick<Sudoku, "size" | "bw" | "bh">) => g.every((v, i) => v > 0 && sudokuClash(g, s, i, v).length === 0);
export const sudokuScore = (mistakes: number) => clamp01(1 - mistakes * 0.1);

// ── Puntos y cajitas ────────────────────────────────────────────────

/** Rayas: "h:r:c" (horizontal, fila r de puntos, entre la columna c y c+1) y "v:r:c" (vertical). */
export const boxesSize = (l: Lvl) => (l === "facil" ? 3 : l === "normal" ? 4 : 5);
export function boxesEdges(n: number): string[] {
  const out: string[] = [];
  for (let r = 0; r <= n; r++) for (let c = 0; c < n; c++) out.push(`h:${r}:${c}`);
  for (let r = 0; r < n; r++) for (let c = 0; c <= n; c++) out.push(`v:${r}:${c}`);
  return out;
}
export const boxSides = (r: number, c: number) => [`h:${r}:${c}`, `h:${r + 1}:${c}`, `v:${r}:${c}`, `v:${r}:${c + 1}`];
/** Las cajitas (r*n+c) que tocan una raya. */
export function boxesOf(n: number, e: string): number[] {
  const [t, rs, cs] = e.split(":");
  const r = +rs, c = +cs;
  const out = t === "h" ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]];
  return out.filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n).map(([a, b]) => a * n + b);
}
/** Las cajitas que se cierran al trazar esta raya. */
export function boxesClosed(n: number, taken: ReadonlySet<string>, e: string): number[] {
  return boxesOf(n, e).filter((b) => boxSides(Math.floor(b / n), b % n).every((s) => s === e || taken.has(s)));
}
const sidesTaken = (n: number, taken: ReadonlySet<string>, b: number) => boxSides(Math.floor(b / n), b % n).filter((s) => taken.has(s)).length;
/** Cuántas cajitas se lleva el otro si le dejas trazar después de esta raya (sigue cerrando mientras pueda). */
function giveaway(n: number, taken: ReadonlySet<string>, e: string): number {
  const t = new Set(taken); t.add(e);
  let got = 0;
  for (;;) {
    const free = boxesEdges(n).filter((x) => !t.has(x));
    const close = free.find((x) => boxesClosed(n, t, x).length > 0);
    if (!close) return got;
    got += boxesClosed(n, t, close).length;
    t.add(close);
  }
}
/** La raya que traza Mochito. */
export function boxesMove(rnd: () => number, n: number, taken: ReadonlySet<string>, l: Lvl): string | null {
  const free = boxesEdges(n).filter((e) => !taken.has(e));
  if (!free.length) return null;
  if (l === "facil" && rnd() < 0.6) return pick(free, rnd);
  const closing = free.filter((e) => boxesClosed(n, taken, e).length > 0);
  if (closing.length) return pick(closing, rnd);
  const safe = free.filter((e) => boxesOf(n, e).every((b) => sidesTaken(n, taken, b) < 2));
  if (safe.length) return pick(safe, rnd);
  if (l !== "dificil") return pick(free, rnd);
  let best = free[0], least = Infinity;
  for (const e of shuffle([...free], rnd)) { const g = giveaway(n, taken, e); if (g < least) { least = g; best = e; } }
  return best;
}
export const boxesScore = (mine: number, total: number) => (mine * 2 > total ? 1 : clamp01(0.2 + (mine / total) * 0.9));

// ── Barquitos escondidos ────────────────────────────────────────────

export const shipsSpec = (l: Lvl) => (l === "facil" ? { size: 6, ships: [3, 2, 2] } : l === "normal" ? { size: 7, ships: [3, 3, 2, 2] } : { size: 8, ships: [4, 3, 3, 2, 2] });
/** Acomoda los barquitos al azar: derechos o parados, sin encimarse ni tocarse. */
export function shipsPlace(rnd: () => number, size: number, ships: number[]): number[][] {
  for (;;) {
    const used = new Set<number>();
    const out: number[][] = [];
    let ok = true;
    for (const len of ships) {
      let placed = false;
      for (let tries = 0; tries < 200 && !placed; tries++) {
        const down = rnd() < 0.5;
        const r = Math.floor(rnd() * (down ? size - len + 1 : size)), c = Math.floor(rnd() * (down ? size : size - len + 1));
        const cells = Array.from({ length: len }, (_, k) => (down ? (r + k) * size + c : r * size + c + k));
        const near = cells.flatMap((x) => [-1, 0, 1].flatMap((dr) => [-1, 0, 1].map((dc) => {
          const rr = Math.floor(x / size) + dr, cc = (x % size) + dc;
          return rr >= 0 && cc >= 0 && rr < size && cc < size ? rr * size + cc : -1;
        })));
        if (near.some((x) => used.has(x))) continue;
        cells.forEach((x) => used.add(x));
        out.push(cells);
        placed = true;
      }
      if (!placed) { ok = false; break; }
    }
    if (ok) return out;
  }
}
export type ShotResult = "agua" | "tocado" | "hundido";
export function shipsShot(ships: number[][], shots: ReadonlySet<number>, cell: number): ShotResult {
  const ship = ships.find((s) => s.includes(cell));
  if (!ship) return "agua";
  return ship.every((x) => x === cell || shots.has(x)) ? "hundido" : "tocado";
}
export const shipsSunk = (ships: number[][], shots: ReadonlySet<number>) => ships.filter((s) => s.every((x) => shots.has(x))).length;
export const shipsAllSunk = (ships: number[][], shots: ReadonlySet<number>) => ships.every((s) => s.every((x) => shots.has(x)));
/** Dónde dispara Mochito: al azar en fácil; en normal y difícil, si tocó un barco busca alrededor. En difícil, además, salta casillas como en un tablero de ajedrez. */
export function shipsAim(rnd: () => number, size: number, ships: number[][], shots: ReadonlySet<number>, l: Lvl): number {
  const free = Array.from({ length: size * size }, (_, i) => i).filter((i) => !shots.has(i));
  if (l === "facil") return pick(free, rnd);
  const open = ships.filter((s) => !s.every((x) => shots.has(x))).flatMap((s) => s.filter((x) => shots.has(x)));
  if (open.length) {
    const line = open.length > 1 ? (Math.floor(open[0] / size) === Math.floor(open[1] / size) ? "h" : "v") : null;
    const cand = open.flatMap((x) => {
      const r = Math.floor(x / size), c = x % size;
      const n: [number, number, "h" | "v"][] = [[r - 1, c, "v"], [r + 1, c, "v"], [r, c - 1, "h"], [r, c + 1, "h"]];
      return n.filter(([rr, cc, d]) => rr >= 0 && cc >= 0 && rr < size && cc < size && (!line || d === line)).map(([rr, cc]) => rr * size + cc);
    }).filter((i) => !shots.has(i));
    if (cand.length) return pick(cand, rnd);
  }
  if (l === "dificil") {
    const par = free.filter((i) => (Math.floor(i / size) + (i % size)) % 2 === 0);
    if (par.length) return pick(par, rnd);
  }
  return pick(free, rnd);
}
export const shipsScore = (won: boolean, sunk: number, total: number) => (won ? 1 : clamp01(0.15 + (sunk / total) * 0.6));

// ── Gusanito comelón ────────────────────────────────────────────────

export type Way = "arriba" | "abajo" | "izq" | "der";
export const WORM_SIZE = 12;
export const wormSpec = (l: Lvl) => (l === "facil" ? { tick: 260, goal: 10 } : l === "normal" ? { tick: 190, goal: 15 } : { tick: 140, goal: 20 });
export interface Worm { body: number[]; way: Way; food: number }
const OPPOSITE: Record<Way, Way> = { arriba: "abajo", abajo: "arriba", izq: "der", der: "izq" };
export const wormCanTurn = (from: Way, to: Way) => OPPOSITE[from] !== to;
export function wormFood(rnd: () => number, body: number[], size = WORM_SIZE) {
  const free = Array.from({ length: size * size }, (_, i) => i).filter((i) => !body.includes(i));
  return free.length ? pick(free, rnd) : -1;
}
export function wormStart(rnd: () => number, size = WORM_SIZE): Worm {
  const mid = Math.floor(size / 2) * size + Math.floor(size / 2);
  const body = [mid, mid - 1, mid - 2];
  return { body, way: "der", food: wormFood(rnd, body, size) };
}
/** Un paso del gusanito: avanza, crece si come y se acaba si choca con la pared o consigo mismo. */
export function wormStep(rnd: () => number, w: Worm, way: Way, size = WORM_SIZE): { worm: Worm; ate: boolean; dead: boolean } {
  const dir = wormCanTurn(w.way, way) ? way : w.way;
  const h = w.body[0], r = Math.floor(h / size), c = h % size;
  const [nr, nc] = dir === "arriba" ? [r - 1, c] : dir === "abajo" ? [r + 1, c] : dir === "izq" ? [r, c - 1] : [r, c + 1];
  if (nr < 0 || nc < 0 || nr >= size || nc >= size) return { worm: { ...w, way: dir }, ate: false, dead: true };
  const head = nr * size + nc;
  const ate = head === w.food;
  const rest = ate ? w.body : w.body.slice(0, -1);
  if (rest.includes(head)) return { worm: { ...w, way: dir }, ate: false, dead: true };
  const body = [head, ...rest];
  return { worm: { body, way: dir, food: ate ? wormFood(rnd, body, size) : w.food }, ate, dead: false };
}
export const wormScore = (eaten: number, goal: number) => clamp01(eaten / goal);
