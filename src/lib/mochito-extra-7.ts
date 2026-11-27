import { rng, shuffle } from "./game/engine";

// Más de Mochito: ir al mercado, excavar fósiles, picnic en el parque y la carrera de carritos,
// y la lógica de cuatro juegos (voltea fichas, adivina los colores, tuberías de agua y dibujo escondido). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];

// ── Ir al mercado ───────────────────────────────────────────────────

export const STALLS = {
  fruta: { name: "Frutería", color: "#e3893a" },
  verdura: { name: "Verdulería", color: "#4a9a5b" },
  pan: { name: "Panadería", color: "#b9854c" },
  lacteos: { name: "Lácteos", color: "#3f74c4" },
} as const;
export type Stall = keyof typeof STALLS;
export const STALL_IDS = Object.keys(STALLS) as Stall[];
export const GOODS = [
  { id: "manzana", name: "Manzanas", stall: "fruta", price: 3 }, { id: "platano", name: "Plátanos", stall: "fruta", price: 2 },
  { id: "naranja", name: "Naranjas", stall: "fruta", price: 2 }, { id: "sandia", name: "Sandía", stall: "fruta", price: 8 },
  { id: "zanahoria", name: "Zanahorias", stall: "verdura", price: 2 }, { id: "tomate", name: "Tomates", stall: "verdura", price: 3 },
  { id: "elote", name: "Elotes", stall: "verdura", price: 4 }, { id: "aguacate", name: "Aguacates", stall: "verdura", price: 5 },
  { id: "pandulce", name: "Pan dulce", stall: "pan", price: 2 }, { id: "tortillas", name: "Tortillas", stall: "pan", price: 4 },
  { id: "pastel", name: "Pastel", stall: "pan", price: 9 }, { id: "galletas", name: "Galletas", stall: "pan", price: 3 },
  { id: "leche", name: "Leche", stall: "lacteos", price: 5 }, { id: "queso", name: "Queso", stall: "lacteos", price: 6 },
  { id: "yogur", name: "Yogur", stall: "lacteos", price: 3 }, { id: "huevos", name: "Huevos", stall: "lacteos", price: 7 },
] as const satisfies readonly { id: string; name: string; stall: Stall; price: number }[];
export type Good = (typeof GOODS)[number];
export const MARKET_ITEMS = 4;
export const PAY_COINS = [1, 2, 5, 10, 20] as const;
export const MARKET_COINS = 5;
export const CHANGE_BONUS = 2;
/** La lista de compras del día: cuatro cosas distintas. */
export const marketOf = (day: string): Good[] => shuffle([...GOODS], rng(`mercado:${day}`)).slice(0, MARKET_ITEMS);
export const marketTotal = (list: readonly Good[]) => list.reduce((a, g) => a + g.price, 0);
/** Tres opciones de vuelto (una es la buena), siempre en el mismo orden ese día. */
export function changeOptions(day: string, change: number): number[] {
  const r = rng(`vuelto:${day}:${change}`);
  const wrong = shuffle([change + 1, change + 2, change - 1, change - 2].filter((x) => x >= 0 && x !== change), r).slice(0, 2);
  return shuffle([change, ...wrong], r);
}
export interface Market { last?: string; trips?: number; exact?: number }

// ── Excavar fósiles ─────────────────────────────────────────────────

export const DINOS = [
  { id: "grandote", name: "Dino Grandote", color: "#c9a27a" },
  { id: "cuellilargo", name: "Cuellilargo", color: "#b7b08f" },
  { id: "trescuernos", name: "Tres Cuernos", color: "#a8927c" },
] as const;
export const DINO_PARTS = ["Cráneo", "Cuello", "Costillas", "Patas de adelante", "Patas de atrás", "Cola"] as const;
export const DIG_SIZE = 5;
export const DIG_LAYERS = 2;
export const DIG_COINS = 4;
export const DINO_DONE_COINS = 10;
/** Dónde está enterrado el fósil de hoy: tres casillas juntas. */
export function digOf(day: string): number[] {
  const r = rng(`fosil:${day}`);
  const down = r() < 0.5;
  const a = Math.floor(r() * (down ? DIG_SIZE : DIG_SIZE - 2)), b = Math.floor(r() * (down ? DIG_SIZE - 2 : DIG_SIZE));
  return down ? [b * DIG_SIZE + a, (b + 1) * DIG_SIZE + a, (b + 2) * DIG_SIZE + a] : [b * DIG_SIZE + a, b * DIG_SIZE + a + 1, b * DIG_SIZE + a + 2];
}
/** Qué dinosaurio y qué parte toca, según cuántas piezas llevas. */
export function nextPart(found: number) {
  const d = Math.floor(found / DINO_PARTS.length);
  return { dino: d < DINOS.length ? DINOS[d] : null, part: found % DINO_PARTS.length, done: d >= DINOS.length };
}
export const digCoins = (cracks: number) => Math.max(1, DIG_COINS - cracks);
export interface Dig { last?: string; found?: number; careful?: number }

// ── Picnic en el parque ─────────────────────────────────────────────

export const PICNIC_FOODS = { sandwich: "Sándwiches", fruta: "Fruta picada", jugo: "Jugo de naranja", pastel: "Pastelito", galletas: "Galletas", sandia: "Sandía" } as const;
export type PicnicFood = keyof typeof PICNIC_FOODS;
export const BASKET = 4;
export const PICNIC_MS = 24_000;
export const ANT_REACH = 0.22;
export interface Ant { id: number; at: number; angle: number; dur: number }
/** Las hormigas del día: salen de la orilla y caminan hacia el mantel. */
export function antsOf(day: string): Ant[] {
  const r = rng(`hormigas:${day}`);
  return Array.from({ length: 14 }, (_, id) => ({ id, at: 800 + id * 1450 + Math.round(r() * 500), angle: r() * Math.PI * 2, dur: 4200 + Math.round(r() * 1800) }));
}
/** Dónde va una hormiga (0 = en la orilla, 1 = llegó al mantel). */
export const antProgress = (a: Ant, t: number) => clamp01((t - a.at) / a.dur);
export function antPos(a: Ant, t: number) {
  const k = 1 - antProgress(a, t) * (1 - ANT_REACH);
  return { x: 0.5 + Math.cos(a.angle) * 0.48 * k, y: 0.5 + Math.sin(a.angle) * 0.46 * k };
}
export const picnicCoins = (left: number) => 2 + left;
export const PICNIC_HEART = 1;
export interface Picnic { last?: string; perfect?: number; total?: number }

// ── Carrera de carritos ─────────────────────────────────────────────

export const WHEELS = {
  chicas: { name: "Ruedas chicas", push: 0.9, hit: 0.6, note: "Se pegan menos con las piedras" },
  medianas: { name: "Ruedas medianas", push: 1, hit: 1, note: "Un poco de todo" },
  grandes: { name: "Ruedas grandes", push: 1.15, hit: 1.4, note: "Más rápidas, pero cada piedra cuesta más" },
} as const;
export type Wheel = keyof typeof WHEELS;
export const CART_COLORS = ["#d6453d", "#3f74c4", "#f6c744", "#4a9a5b", "#8a63c9"] as const;
export const PUSH_MS = 3000;
export const RACE_MS = 12_000;
export const ROCK_FALL = 1600;
export const LANES = 3;
export interface Rock { id: number; at: number; lane: number }
/** Las piedras del camino esta semana: una a la vez, en un carril. */
export function rocksOf(week: string): Rock[] {
  const r = rng(`piedras:${week}`);
  return Array.from({ length: 11 }, (_, id) => ({ id, at: 900 + id * 950 + Math.round(r() * 200), lane: Math.floor(r() * LANES) % LANES }));
}
/** El tiempo de bajada: empujar fuerte ayuda y cada piedra lo hace más lento. */
export function raceTime(taps: number, hits: number, wheel: Wheel) {
  const w = WHEELS[wheel];
  return Math.round((24 - Math.min(taps, 24) * 0.2 * w.push + hits * 1.2 * w.hit) * 10) / 10;
}
/** Los rivales de la semana: tres perritos con su tiempo. */
export function rivalsOf(week: string, friendIds: string[]) {
  const r = rng(`rivales:${week}`);
  return shuffle([...friendIds], r).slice(0, 3).map((id, k) => ({ id, time: Math.round((19.6 + k * 1.3 + r() * 1.2) * 10) / 10 }));
}
export const RACE_COINS = [10, 6, 4, 2] as const;
export interface Derby { week?: string; races?: number; wins?: number; best?: number; cart?: { wheel: Wheel; color: string; num: number } }

// ── Voltea fichas ───────────────────────────────────────────────────

export type Rv = ("" | "y" | "m")[];
export const rvSize = (l: Lvl) => (l === "facil" ? 6 : 8);
export function rvInit(n: number): Rv {
  const b: Rv = Array(n * n).fill("");
  const h = n / 2;
  b[(h - 1) * n + h - 1] = "m"; b[h * n + h] = "m"; b[(h - 1) * n + h] = "y"; b[h * n + h - 1] = "y";
  return b;
}
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
/** Las fichas que se voltean si `side` pone en `i`. */
export function rvFlips(b: Rv, n: number, i: number, side: "y" | "m"): number[] {
  if (b[i]) return [];
  const other = side === "y" ? "m" : "y";
  const r0 = Math.floor(i / n), c0 = i % n;
  const out: number[] = [];
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let r = r0 + dr, c = c0 + dc;
    while (r >= 0 && c >= 0 && r < n && c < n && b[r * n + c] === other) { line.push(r * n + c); r += dr; c += dc; }
    if (line.length && r >= 0 && c >= 0 && r < n && c < n && b[r * n + c] === side) out.push(...line);
  }
  return out;
}
export const rvMoves = (b: Rv, n: number, side: "y" | "m") => b.map((_, i) => i).filter((i) => rvFlips(b, n, i, side).length > 0);
export function rvApply(b: Rv, n: number, i: number, side: "y" | "m"): Rv {
  const f = rvFlips(b, n, i, side);
  const out = [...b];
  out[i] = side;
  for (const x of f) out[x] = side;
  return out;
}
export const rvCount = (b: Rv, side: "y" | "m") => b.filter((x) => x === side).length;
function rvWeight(n: number, i: number) {
  const r = Math.floor(i / n), c = i % n, e = n - 1;
  const corner = (r === 0 || r === e) && (c === 0 || c === e);
  const nearCorner = (r <= 1 || r >= e - 1) && (c <= 1 || c >= e - 1) && !corner;
  const edge = r === 0 || c === 0 || r === e || c === e;
  return corner ? 25 : nearCorner ? -8 : edge ? 5 : 1;
}
function rvEval(b: Rv, n: number) {
  let s = 0;
  b.forEach((x, i) => { if (x === "m") s += rvWeight(n, i); else if (x === "y") s -= rvWeight(n, i); });
  return s + (rvMoves(b, n, "m").length - rvMoves(b, n, "y").length) * 2;
}
function rvSearch(b: Rv, n: number, depth: number, side: "y" | "m"): number {
  const moves = rvMoves(b, n, side);
  if (!depth) return rvEval(b, n);
  if (!moves.length) {
    const other = side === "y" ? "m" : "y";
    if (!rvMoves(b, n, other).length) return (rvCount(b, "m") - rvCount(b, "y")) * 100;
    return rvSearch(b, n, depth - 1, other);
  }
  const vals = moves.map((i) => rvSearch(rvApply(b, n, i, side), n, depth - 1, side === "y" ? "m" : "y"));
  return side === "m" ? Math.max(...vals) : Math.min(...vals);
}
/** Dónde pone Mochito: al azar en fácil, buscando esquinas y muchas fichas en normal, pensando tres jugadas en difícil. */
export function rvMove(rnd: () => number, b: Rv, n: number, l: Lvl): number | null {
  const moves = rvMoves(b, n, "m");
  if (!moves.length) return null;
  if (l === "facil") return pick(moves, rnd);
  const score = (i: number) => (l === "normal" ? rvFlips(b, n, i, "m").length + rvWeight(n, i) : rvSearch(rvApply(b, n, i, "m"), n, 2, "y"));
  const best = Math.max(...moves.map(score));
  return pick(moves.filter((i) => score(i) === best), rnd);
}
export const rvScore = (mine: number, his: number) => (mine > his ? 1 : clamp01(0.15 + (mine / Math.max(1, mine + his)) * 0.8));

// ── Adivina los colores ─────────────────────────────────────────────

export const codeSpec = (l: Lvl) => (l === "facil" ? { len: 3, colors: 4, repeat: false, tries: 8 } : l === "normal" ? { len: 4, colors: 6, repeat: false, tries: 10 } : { len: 4, colors: 6, repeat: true, tries: 8 });
export function codeMake(rnd: () => number, l: Lvl): number[] {
  const s = codeSpec(l);
  if (!s.repeat) return shuffle(Array.from({ length: s.colors }, (_, i) => i), rnd).slice(0, s.len);
  return Array.from({ length: s.len }, () => Math.floor(rnd() * s.colors) % s.colors);
}
/** Cuántos están en su lugar y cuántos son del color correcto pero en otro lugar. */
export function codeCheck(secret: number[], guess: number[]) {
  let exact = 0;
  const a: Record<number, number> = {}, b: Record<number, number> = {};
  secret.forEach((v, i) => { if (guess[i] === v) exact++; else { a[v] = (a[v] ?? 0) + 1; b[guess[i]] = (b[guess[i]] ?? 0) + 1; } });
  const near = Object.keys(a).reduce((s, k) => s + Math.min(a[+k], b[+k] ?? 0), 0);
  return { exact, near };
}
export const codeScore = (won: boolean, used: number, tries: number) => (won ? clamp01(1 - Math.max(0, used - 3) / (tries * 1.5)) : 0.15);

// ── Tuberías de agua ────────────────────────────────────────────────

/** Cada tubo es una máscara: arriba 1, derecha 2, abajo 4, izquierda 8. */
export const N_ = 1, E_ = 2, S_ = 4, W_ = 8;
export const pipeSize = (l: Lvl) => (l === "facil" ? 4 : l === "normal" ? 5 : 6);
export const rotCw = (m: number, k = 1) => { let x = m; for (let i = 0; i < ((k % 4) + 4) % 4; i++) x = ((x << 1) | (x >> 3)) & 15; return x; };
/** Un laberinto de tubos que conecta todo; la llave entra por la izquierda de la primera casilla y la plantita está a la derecha de la última. */
export function pipesMake(rnd: () => number, n: number) {
  const sol = Array(n * n).fill(0);
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const r = Math.floor(cur / n), c = cur % n;
    const opts = ([[r - 1, c, N_, S_], [r, c + 1, E_, W_], [r + 1, c, S_, N_], [r, c - 1, W_, E_]] as const).filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < n && cc < n && !seen.has(rr * n + cc));
    if (!opts.length) { stack.pop(); continue; }
    const [rr, cc, a, b] = pick(opts, rnd);
    const nx = rr * n + cc;
    sol[cur] |= a; sol[nx] |= b;
    seen.add(nx); stack.push(nx);
  }
  sol[0] |= W_; sol[n * n - 1] |= E_;
  const start = sol.map((m) => rotCw(m, Math.floor(rnd() * 4)));
  const min = start.reduce((a, m, i) => a + [0, 1, 2, 3].find((k) => rotCw(m, k) === sol[i])!, 0);
  return { sol, start, min };
}
/** Las casillas a las que llega el agua desde la llave. */
export function pipesFlow(g: number[], n: number): Set<number> {
  const out = new Set<number>();
  if (!(g[0] & W_)) return out;
  const q = [0];
  out.add(0);
  while (q.length) {
    const i = q.shift()!;
    const r = Math.floor(i / n), c = i % n;
    for (const [rr, cc, a, b] of [[r - 1, c, N_, S_], [r, c + 1, E_, W_], [r + 1, c, S_, N_], [r, c - 1, W_, E_]] as const) {
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
      const j = rr * n + cc;
      if (!out.has(j) && g[i] & a && g[j] & b) { out.add(j); q.push(j); }
    }
  }
  return out;
}
export const pipesDone = (g: number[], n: number) => pipesFlow(g, n).has(n * n - 1) && !!(g[n * n - 1] & E_);
export const pipesScore = (moves: number, min: number) => clamp01(0.4 + 0.6 * (min / Math.max(min, moves)));

// ── Dibujo escondido ────────────────────────────────────────────────

const PICS: Record<Lvl, { name: string; rows: string[] }[]> = {
  facil: [
    { name: "un corazón", rows: [".#.#.", "#####", "#####", ".###.", "..#.."] },
    { name: "una huellita", rows: ["#.#.#", ".....", ".###.", "#####", ".###."] },
    { name: "una casita", rows: ["..#..", ".###.", "#####", "##.##", "##.##"] },
    { name: "una estrella", rows: ["..#..", "#####", ".###.", ".#.#.", "#...#"] },
    { name: "un pescado", rows: [".....", ".##.#", "#####", ".##.#", "....."] },
  ],
  normal: [
    { name: "la cara de un perrito", rows: ["#.....#", "##...##", ".#####.", ".#.#.#.", ".#####.", "..###..", "...#..."] },
    { name: "un hueso", rows: [".......", "##...##", "#######", ".#####.", "#######", "##...##", "......."] },
    { name: "un árbol", rows: ["...#...", "..###..", ".#####.", "..###..", ".#####.", "#######", "...#..."] },
    { name: "una casa", rows: ["...#...", "..###..", ".#####.", "#######", ".#...#.", ".#.#.#.", ".#.#.#."] },
  ],
  dificil: [
    { name: "un corazón grande", rows: [".##....##.", "####..####", "##########", "##########", "##########", ".########.", "..######..", "...####...", "....##....", ".........."] },
    { name: "un hueso grande", rows: ["..........", ".##....##.", "####..####", "##########", ".########.", ".########.", "##########", "####..####", ".##....##.", ".........."] },
    { name: "una casa con ventanas", rows: ["....##....", "...####...", "..######..", ".########.", "##########", ".##....##.", ".##.##.##.", ".##.##.##.", ".##.##.##.", ".########."] },
  ],
};
export const picsOf = (l: Lvl) => PICS[l];
export function picMake(rnd: () => number, l: Lvl) {
  const p = pick(PICS[l], rnd);
  const n = p.rows.length;
  const cells = p.rows.flatMap((row) => [...row].map((ch) => ch === "#"));
  return { name: p.name, n, cells };
}
/** Las pistas: cuántas casillas pintadas seguidas hay en cada fila o columna. */
export function picClues(line: boolean[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const v of line) { if (v) run++; else if (run) { out.push(run); run = 0; } }
  if (run) out.push(run);
  return out.length ? out : [0];
}
export const picRow = (cells: boolean[], n: number, r: number) => cells.slice(r * n, r * n + n);
export const picCol = (cells: boolean[], n: number, c: number) => Array.from({ length: n }, (_, r) => cells[r * n + c]);
export const picScore = (mistakes: number) => clamp01(1 - mistakes * 0.08);
