import { dayKey, rng, shuffle } from "./game/engine";

// Más de Mochito: cepillarle los dientes, la casita del árbol, la feria del mes y el cumpleaños de sus amigos,
// y la lógica de cuatro juegos (cuatro en línea, sumas con huesos, escaleras y resbaladillas, piedra-papel-tijera). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];
const DAY = 86_400_000;
const dayMs = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
const yesterday = (now: number) => dayKey(dayMs(dayKey(now)) - DAY / 2);

// ── Cepillarle los dientes ──────────────────────────────────────────

export const TEETH_ZONES = [
  { id: "izq", name: "Los de la izquierda" }, { id: "frente", name: "Los de enfrente" }, { id: "der", name: "Los de la derecha" },
] as const;
export const BRUSH_STROKES = 6;
export const TEETH_COINS = 2;
export const TEETH_STREAK = 7;
export const TEETH_STREAK_COINS = 10;
export interface Teeth { last?: string; streak?: number; best?: number }
/** Cómo queda la racha si hoy le cepillas: sigue si fue ayer, empieza de nuevo si no. */
export function teethNext(t: Teeth | undefined, now: number): Teeth {
  const d = dayKey(now);
  if (t?.last === d) return t;
  const streak = t?.last === yesterday(now) ? (t.streak ?? 0) + 1 : 1;
  return { last: d, streak, best: Math.max(t?.best ?? 0, streak) };
}
export const teethDone = (t: Teeth | undefined, now: number) => t?.last === dayKey(now);

// ── Casita del árbol ────────────────────────────────────────────────

export type Mat = "tablas" | "clavos" | "cuerda" | "pintura";
export const MATS: Record<Mat, string> = { tablas: "Tablas", clavos: "Clavos", cuerda: "Cuerda", pintura: "Pintura" };
export const MAT_IDS = Object.keys(MATS) as Mat[];
export const TREE_PARTS = [
  { id: "piso", name: "El piso", need: { tablas: 3, clavos: 2 } },
  { id: "escalera", name: "La escalera", need: { tablas: 2, cuerda: 1 } },
  { id: "paredes", name: "Las paredes", need: { tablas: 4, clavos: 3 } },
  { id: "techo", name: "El techo", need: { tablas: 3, clavos: 2, pintura: 1 } },
  { id: "ventana", name: "La ventana", need: { tablas: 1, pintura: 1 } },
  { id: "columpio", name: "El columpio", need: { tablas: 1, cuerda: 2 } },
  { id: "bandera", name: "La banderita", need: { cuerda: 1, pintura: 1 } },
] as const satisfies readonly { id: string; name: string; need: Partial<Record<Mat, number>> }[];
export type TreePart = (typeof TREE_PARTS)[number]["id"];
export const TREE_PART_COINS = 5;
export const TREE_DONE_COINS = 20;
export interface TreeHouse { built?: string[]; mats?: Partial<Record<Mat, number>>; gathered?: string; builtDay?: string }
/** Lo que encuentran al juntar materiales ese día (siempre lo mismo ese día). */
export function gatherOf(day: string): Partial<Record<Mat, number>> {
  const r = rng(`arbol:${day}`);
  return { tablas: 3 + Math.floor(r() * 3), clavos: 2 + Math.floor(r() * 2), cuerda: r() < 0.6 ? 1 : 0, pintura: r() < 0.5 ? 1 : 0 };
}
export const nextPart = (t?: TreeHouse) => TREE_PARTS.find((p) => !(t?.built ?? []).includes(p.id)) ?? null;
export const canBuild = (t: TreeHouse | undefined, part: (typeof TREE_PARTS)[number]) =>
  (Object.entries(part.need) as [Mat, number][]).every(([m, n]) => (t?.mats?.[m] ?? 0) >= n);
export const addMats = (a: Partial<Record<Mat, number>> = {}, b: Partial<Record<Mat, number>>, sign = 1) =>
  Object.fromEntries(MAT_IDS.map((m) => [m, Math.max(0, (a[m] ?? 0) + sign * (b[m] ?? 0))])) as Record<Mat, number>;

// ── Feria del mes ───────────────────────────────────────────────────

export const fairKey = (now: number) => dayKey(now).slice(0, 7);
export const FAIR_COINS = 10;
export const FAIR_SHOTS = 3;
export const COTTON_SPINS = 5;
export const PRIZES = {
  grande: ["Un oso gigante", "Un unicornio grande", "Un dinosaurio gigante", "Un perro de peluche enorme"],
  chico: ["Un patito de hule", "Una jirafita", "Un pulpo de colores", "Una ranita"],
  consuelo: ["Un llavero de huesito", "Un silbato", "Una calcomanía brillante"],
} as const;
/** El premio según cuántos tiros dio en el blanco. */
export function fairPrize(hits: number, key: string) {
  const size = hits >= FAIR_SHOTS ? "grande" : hits >= 1 ? "chico" : "consuelo";
  return { size, name: pick(PRIZES[size], rng(`feria:${key}:${hits}`)) } as { size: keyof typeof PRIZES; name: string };
}
export interface Fair { last?: string; prizes?: string[]; big?: number }
/** ¿Le pegó al blanco? El blanco va y viene; la mira está en el centro. */
export const fairHit = (target: number, tol: number) => Math.abs(target - 0.5) <= tol;
export const fairTol = (l: Lvl) => (l === "facil" ? 0.12 : l === "dificil" ? 0.06 : 0.09);

// ── Cumpleaños de sus amigos ────────────────────────────────────────

/** Mes-día del cumpleaños de cada perrito del parque, su regalo favorito y una pista. */
export const FRIEND_BDAYS: Record<string, { md: string; likes: Gift; hint: string }> = {
  panque: { md: "01-14", likes: "galletas", hint: "Todo lo que huele a vainilla le encanta." },
  canela: { md: "02-27", likes: "pelota", hint: "Nunca se cansa de correr detrás de algo." },
  pimienta: { md: "04-09", likes: "silbato", hint: "Cuida el parque y quiere avisar si hay peligro." },
  chispa: { md: "05-22", likes: "pelota", hint: "Corre más rápido que el viento… detrás de algo redondo." },
  nube: { md: "07-03", likes: "cobija", hint: "Se duerme bajo los árboles y le da frío." },
  tamal: { md: "08-18", likes: "galletas", hint: "Siempre pregunta si tienes algo de comer." },
  rayo: { md: "10-05", likes: "pelota", hint: "¡Una pelota! ¿Dónde? ¿Dónde?" },
  luna: { md: "11-29", likes: "estrellas", hint: "De noche mira las estrellas." },
};
export const GIFTS = {
  pelota: "Una pelota nueva", galletas: "Una bolsita de galletas", cobija: "Una cobijita suave", silbato: "Un silbato", estrellas: "Estrellas que brillan en la oscuridad", collar: "Un collar con su nombre",
} as const;
export type Gift = keyof typeof GIFTS;
export const GIFT_IDS = Object.keys(GIFTS) as Gift[];
export const BDAY_LATE = 6;
export const BDAY_COINS = 6;
export const BDAY_FAV_COINS = 4;
/** Cumpleaños que se pueden festejar hoy (el mismo día o hasta 6 días después) y que aún no se festejaron este año. */
export function friendBdays(now: number, done: Record<string, number> = {}) {
  const today = dayMs(dayKey(now));
  const year = new Date(now).getFullYear();
  const out: { id: string; late: number; year: number }[] = [];
  for (const [id, b] of Object.entries(FRIEND_BDAYS)) {
    for (const y of [year, year - 1]) {
      const late = Math.round((today - dayMs(`${y}-${b.md}`)) / DAY);
      if (late >= 0 && late <= BDAY_LATE && done[id] !== y) out.push({ id, late, year: y });
    }
  }
  return out;
}
/** El siguiente cumpleaños que viene (para decir cuánto falta). */
export function nextFriendBday(now: number, done: Record<string, number> = {}) {
  const today = dayMs(dayKey(now));
  const year = new Date(now).getFullYear();
  return Object.entries(FRIEND_BDAYS).map(([id, b]) => {
    let t = dayMs(`${year}-${b.md}`);
    if (t < today || (t === today && done[id] === year)) t = dayMs(`${year + 1}-${b.md}`);
    return { id, days: Math.round((t - today) / DAY) };
  }).sort((a, b) => a.days - b.days)[0];
}

// ── Cuatro en línea ─────────────────────────────────────────────────

export const C4_COLS = 7;
export const C4_ROWS = 6;
export type C4 = ("" | "Y" | "M")[];
export const c4Empty = (): C4 => Array(C4_COLS * C4_ROWS).fill("");
/** La fila donde cae la ficha en esa columna (abajo es la fila 5), o -1 si está llena. */
export function c4Row(b: C4, col: number) {
  for (let r = C4_ROWS - 1; r >= 0; r--) if (!b[r * C4_COLS + col]) return r;
  return -1;
}
export function c4Drop(b: C4, col: number, who: "Y" | "M"): C4 | null {
  const r = c4Row(b, col);
  if (r < 0) return null;
  const n = [...b]; n[r * C4_COLS + col] = who;
  return n;
}
export function c4Winner(b: C4): { who: "Y" | "M"; cells: number[] } | "empate" | null {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < C4_ROWS; r++) for (let c = 0; c < C4_COLS; c++) {
    const w = b[r * C4_COLS + c];
    if (!w) continue;
    for (const [dr, dc] of dirs) {
      const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
      if (cells.every(([rr, cc]) => rr >= 0 && rr < C4_ROWS && cc >= 0 && cc < C4_COLS && b[rr * C4_COLS + cc] === w)) return { who: w, cells: cells.map(([rr, cc]) => rr * C4_COLS + cc) };
    }
  }
  return b.every(Boolean) ? "empate" : null;
}
function c4Heur(b: C4): number {
  let s = 0;
  for (let r = 0; r < C4_ROWS; r++) if (b[r * C4_COLS + 3] === "M") s += 3; else if (b[r * C4_COLS + 3] === "Y") s -= 3;
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < C4_ROWS; r++) for (let c = 0; c < C4_COLS; c++) for (const [dr, dc] of dirs) {
    const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
    if (!cells.every(([rr, cc]) => rr >= 0 && rr < C4_ROWS && cc >= 0 && cc < C4_COLS)) continue;
    const v = cells.map(([rr, cc]) => b[rr * C4_COLS + cc]);
    const m = v.filter((x) => x === "M").length, y = v.filter((x) => x === "Y").length;
    if (m && !y) s += m === 3 ? 6 : m === 2 ? 2 : 0;
    if (y && !m) s -= y === 3 ? 8 : y === 2 ? 2 : 0;
  }
  return s;
}
function c4Search(b: C4, depth: number, turn: "Y" | "M", alpha: number, beta: number): number {
  const w = c4Winner(b);
  if (w === "empate") return 0;
  if (w) return w.who === "M" ? 1000 + depth : -1000 - depth;
  if (depth === 0) return c4Heur(b);
  const order = [3, 2, 4, 1, 5, 0, 6];
  if (turn === "M") {
    let best = -Infinity;
    for (const c of order) { const n = c4Drop(b, c, "M"); if (!n) continue; best = Math.max(best, c4Search(n, depth - 1, "Y", alpha, beta)); alpha = Math.max(alpha, best); if (alpha >= beta) break; }
    return best;
  }
  let best = Infinity;
  for (const c of order) { const n = c4Drop(b, c, "Y"); if (!n) continue; best = Math.min(best, c4Search(n, depth - 1, "M", alpha, beta)); beta = Math.min(beta, best); if (alpha >= beta) break; }
  return best;
}
/** Jugada de Mochito: gana si puede, tapa si debe; en fácil se distrae y en difícil piensa más adelante. */
export function c4Move(rnd: () => number, b: C4, l: Lvl): number {
  const cols = [0, 1, 2, 3, 4, 5, 6].filter((c) => c4Row(b, c) >= 0);
  const win = cols.find((c) => { const w = c4Winner(c4Drop(b, c, "M")!); return w && w !== "empate"; });
  if (win !== undefined && (l !== "facil" || rnd() < 0.7)) return win;
  const block = cols.find((c) => { const w = c4Winner(c4Drop(b, c, "Y")!); return w && w !== "empate"; });
  if (block !== undefined && (l === "dificil" || rnd() < (l === "normal" ? 0.85 : 0.45))) return block;
  if (l === "facil" && rnd() < 0.6) return pick(cols, rnd);
  const depth = l === "dificil" ? 5 : 2;
  let best = -Infinity, at = cols[0];
  for (const c of shuffle(cols, rnd)) {
    const s = c4Search(c4Drop(b, c, "M")!, depth, "Y", -Infinity, Infinity) - Math.abs(3 - c) * 0.5;
    if (s > best) { best = s; at = c; }
  }
  return at;
}
export const C4_GAMES = 3;

// ── Sumas con huesos ────────────────────────────────────────────────

export const SUMS_ROUNDS = 6;
export interface SumsRound { start: number; target: number; steps: number[] }
export function sumsRound(rnd: () => number, l: Lvl): SumsRound {
  if (l === "facil") return { start: 0, target: 3 + Math.floor(rnd() * 8), steps: [1, 2, 3] };
  if (l === "normal") return { start: 0, target: 8 + Math.floor(rnd() * 13), steps: [2, 3, 5] };
  const start = 8 + Math.floor(rnd() * 13);
  let target = start;
  while (target === start) target = 3 + Math.floor(rnd() * 25);
  return { start, target, steps: [3, 5, -2, -4] };
}
/** La menor cantidad de pasos para llegar exacto (búsqueda a lo ancho). */
export function sumsBest(r: SumsRound): number {
  const seen = new Map<number, number>([[r.start, 0]]);
  const q = [r.start];
  while (q.length) {
    const v = q.shift()!;
    const d = seen.get(v)!;
    if (v === r.target) return d;
    for (const s of r.steps) {
      const n = v + s;
      if (n < 0 || n > 60 || seen.has(n)) continue;
      seen.set(n, d + 1); q.push(n);
    }
  }
  return Infinity;
}
/** Por ronda: llegar exacto vale; con más pasos que los necesarios vale un poco menos. */
export const sumsPoints = (solved: boolean, moves: number, best: number) => (solved ? clamp01(0.5 + 0.5 * (best / Math.max(best, moves))) : 0);

// ── Escaleras y resbaladillas ───────────────────────────────────────

export interface Ladders { size: number; jumps: Record<number, number> }
export function laddersBoard(l: Lvl): Ladders {
  if (l === "facil") return { size: 25, jumps: { 3: 11, 6: 17, 9: 18, 14: 4, 20: 24, 22: 13 } };
  if (l === "dificil") return { size: 36, jumps: { 2: 15, 7: 13, 11: 26, 19: 8, 22: 29, 25: 5, 31: 20, 34: 12, 27: 33 } };
  return { size: 30, jumps: { 3: 13, 8: 21, 11: 2, 17: 26, 19: 9, 24: 16, 27: 29 } };
}
/** Un turno: avanza lo que sale en el dado (sin pasarse de la meta: rebota) y luego sube o resbala. */
export function laddersMove(pos: number, roll: number, b: Ladders) {
  let to = pos + roll;
  if (to > b.size) to = b.size - (to - b.size);
  const jump = b.jumps[to];
  return { land: to, to: jump ?? to, kind: jump === undefined ? null : jump > to ? "escalera" : "resbaladilla" } as { land: number; to: number; kind: "escalera" | "resbaladilla" | null };
}
export const laddersScore = (won: boolean, pos: number, size: number) => (won ? 1 : clamp01(0.2 + 0.5 * (pos / size)));

// ── Piedra, papel o tijera ──────────────────────────────────────────

export type Rps = "piedra" | "papel" | "tijera";
export const RPS: Rps[] = ["piedra", "papel", "tijera"];
const BEATS: Record<Rps, Rps> = { piedra: "tijera", papel: "piedra", tijera: "papel" };
export const rpsWin = (a: Rps, b: Rps): 1 | 0 | -1 => (a === b ? 0 : BEATS[a] === b ? 1 : -1);
export const RPS_TO = 3;
/** Su maña: en fácil casi siempre saca lo mismo; en normal repite lo que le funcionó; en difícil copia lo que tú sacas más. */
export function rpsMochito(rnd: () => number, l: Lvl, fav: Rps, mine: Rps[], his: Rps[], lastResult: 1 | 0 | -1 | null): Rps {
  if (l === "facil") return rnd() < 0.65 ? fav : pick(RPS, rnd);
  if (l === "normal") {
    if (his.length && lastResult === -1 && rnd() < 0.7) return his[his.length - 1];
    return rnd() < 0.45 ? fav : pick(RPS, rnd);
  }
  if (mine.length >= 2 && rnd() < 0.6) {
    const counts = RPS.map((r) => mine.filter((x) => x === r).length);
    const most = RPS[counts.indexOf(Math.max(...counts))];
    return (Object.keys(BEATS) as Rps[]).find((k) => BEATS[k] === most)!;
  }
  return pick(RPS, rnd);
}
export const rpsScore = (won: number, lost: number) => (won >= RPS_TO ? clamp01(0.7 + 0.1 * (RPS_TO - lost)) : clamp01(0.15 + won * 0.15));
