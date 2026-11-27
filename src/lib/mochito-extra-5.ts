import { rng, shuffle } from "./game/engine";

// Aún más de Mochito: la guardería de cachorritos, el teatro de títeres, limpiar el parque y el taller de juguetes,
// y la lógica de cuatro juegos (topos del jardín, dominó, damas y junta los huesos). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];

// ── Guardería de cachorritos ────────────────────────────────────────

export type Want = "comer" | "agua" | "jugar" | "abrazo" | "dormir";
export const WANTS: Record<Want, { name: string; did: string }> = {
  comer: { name: "Comida", did: "comió sus croquetitas" },
  agua: { name: "Agua", did: "tomó agüita" },
  jugar: { name: "Jugar", did: "jugó con la pelotita" },
  abrazo: { name: "Abrazo", did: "recibió un abrazo" },
  dormir: { name: "Dormir", did: "se quedó dormido" },
};
export const WANT_IDS = Object.keys(WANTS) as Want[];
export const PUPPY_NAMES = ["Bolita", "Pelusa", "Tito", "Mimí", "Canelita", "Chato", "Perla", "Coco", "Lucky", "Manchas"];
export const PUPPY_COATS = ["#f2d4a4", "#c98b4a", "#ffffff", "#8a6a55", "#e9c48f", "#3d3a4a", "#d9a066"];
export const DAYCARE_PUPPIES = 3;
export const DAYCARE_COINS = 2;
export const DAYCARE_PERFECT = 3;
export interface Puppy { name: string; coat: string; wants: Want[] }
/** Los cachorritos del día: cada uno pide tres cosas en su orden y al final siempre quiere dormir. */
export function daycareOf(day: string): Puppy[] {
  const r = rng(`guarderia:${day}`);
  const names = shuffle(PUPPY_NAMES, r).slice(0, DAYCARE_PUPPIES);
  return names.map((name) => ({ name, coat: pick(PUPPY_COATS, r), wants: [...shuffle(WANT_IDS.filter((w) => w !== "dormir"), r).slice(0, 2), "dormir"] }));
}
export interface Daycare { last?: string; perfect?: number }

// ── Teatro de títeres ───────────────────────────────────────────────

export const STAGES = { bosque: "el bosque encantado", castillo: "un castillo", mar: "el fondo del mar", espacio: "el espacio" } as const;
export type Stage = keyof typeof STAGES;
export const PROBLEMS = {
  tesoro: "perdieron un tesoro", tormenta: "llegó una tormenta", dragon: "apareció un dragón que no tenía amigos", fiesta: "querían hacer una fiesta sorpresa",
} as const;
export type Problem = keyof typeof PROBLEMS;
export const ENDINGS = { feliz: "Final feliz", chistoso: "Final chistoso", cancion: "Final con canción" } as const;
export type Ending = keyof typeof ENDINGS;
/** El guion de la obra: cuatro escenas según lo que elegiste. */
export function playScript(stage: Stage, cast: string[], problem: Problem, ending: Ending): string[] {
  const [a, b] = [cast[0] ?? "Mochito", cast[1] ?? "su amigo"];
  const both = `${a} y ${b}`;
  const start = `Había una vez, en ${STAGES[stage]}, dos amigos: ${both}.`;
  const mid: Record<Problem, string> = {
    tesoro: `Un día ${PROBLEMS.tesoro}: ¡el hueso dorado de ${a} ya no estaba!`,
    tormenta: `De pronto ${PROBLEMS.tormenta} y el viento se llevó el sombrero de ${b}.`,
    dragon: `Entonces ${PROBLEMS.dragon}. Todos tenían miedo… menos ${a}.`,
    fiesta: `${both} ${PROBLEMS.fiesta} para todos sus vecinos.`,
  };
  const turn: Record<Problem, string> = {
    tesoro: `${b} siguió las huellas con su nariz hasta encontrarlo debajo de una piedra.`,
    tormenta: `${a} corrió y corrió hasta atrapar el sombrero en el aire.`,
    dragon: `${a} le ofreció una galleta al dragón y le preguntó si quería jugar.`,
    fiesta: `Colgaron globos, hornearon pastel y se escondieron detrás de una cortina.`,
  };
  const end: Record<Ending, string> = {
    feliz: "Y desde ese día fueron más amigos que nunca. Fin.",
    chistoso: `Y ${b} se resbaló con una cáscara de plátano… ¡pero cayó justo en una almohada! Fin.`,
    cancion: "Y todos cantaron juntos hasta que salió la luna. ¡Fin!",
  };
  return [start, mid[problem], turn[problem], end[ending]];
}
export const PLAY_COINS = 5;
export interface Theater { last?: string; plays?: { d: string; title: string }[] }
export const playTitle = (stage: Stage, problem: Problem) => ({
  tesoro: "El tesoro perdido", tormenta: "La gran tormenta", dragon: "El dragón sin amigos", fiesta: "La fiesta sorpresa",
}[problem] + ` en ${STAGES[stage]}`);

// ── Limpiar el parque ───────────────────────────────────────────────

export type Bin = "papel" | "plastico" | "vidrio" | "organico";
export const BINS: Record<Bin, { name: string; color: string }> = {
  papel: { name: "Papel", color: "#3f74c4" }, plastico: { name: "Plástico", color: "#e3a72f" }, vidrio: { name: "Vidrio", color: "#4a9a5b" }, organico: { name: "Orgánico", color: "#8a5a2e" },
};
export const BIN_IDS = Object.keys(BINS) as Bin[];
export const TRASH = [
  { id: "periodico", name: "Periódico", bin: "papel" }, { id: "caja", name: "Caja de cartón", bin: "papel" }, { id: "hoja", name: "Hoja de cuaderno", bin: "papel" },
  { id: "botella", name: "Botella de plástico", bin: "plastico" }, { id: "bolsa", name: "Bolsa de plástico", bin: "plastico" }, { id: "vaso", name: "Vasito de yogur", bin: "plastico" },
  { id: "frasco", name: "Frasco de vidrio", bin: "vidrio" }, { id: "botellav", name: "Botella de vidrio", bin: "vidrio" },
  { id: "platano", name: "Cáscara de plátano", bin: "organico" }, { id: "manzana", name: "Manzana mordida", bin: "organico" }, { id: "hojas", name: "Hojas secas", bin: "organico" },
] as const satisfies readonly { id: string; name: string; bin: Bin }[];
export type Trash = (typeof TRASH)[number]["id"];
export const TRASH_COUNT = 8;
/** La basura del día: ocho cosas, con al menos una de cada bote, en lugares del parque. */
export function trashOf(day: string) {
  const r = rng(`parque:${day}`);
  const one = BIN_IDS.map((b) => pick(TRASH.filter((t) => t.bin === b), r));
  const rest = shuffle([...TRASH], r).filter((t) => !one.includes(t)).slice(0, TRASH_COUNT - one.length);
  return shuffle([...one, ...rest], r).map((t, i) => ({ ...t, x: 0.1 + ((i % 4) * 0.8) / 3 + (r() - 0.5) * 0.08, y: 0.35 + Math.floor(i / 4) * 0.3 + (r() - 0.5) * 0.08 }));
}
export interface Clean { last?: string; total?: number }

// ── Taller de juguetes ──────────────────────────────────────────────

export type Toy = "peluche" | "carrito" | "pelota" | "robot";
export const TOYS: Record<Toy, { name: string; broken: string; steps: string[] }> = {
  peluche: { name: "Osito de peluche", broken: "se le descosió el brazo", steps: ["Coser el brazo", "Ponerle un moño"] },
  carrito: { name: "Carrito de madera", broken: "se le cayó una rueda", steps: ["Elegir la rueda del tamaño correcto", "Apretar los tornillos"] },
  pelota: { name: "Pelota", broken: "tiene un hoyito y se desinfló", steps: ["Ponerle un parche", "Inflarla"] },
  robot: { name: "Robot de juguete", broken: "ya no prende", steps: ["Poner las pilas al derecho", "Pintar la antena"] },
};
export const TOY_IDS = Object.keys(TOYS) as Toy[];
export const STITCHES = 5;
export const SCREWS = 3;
export const PUMP_MS = 1600;
export const WORKSHOP_COINS = 4;
/** El encargo del día: qué amigo trae qué juguete (de los perritos que conoces). */
export function workshopOf(day: string, friendIds: string[]) {
  const r = rng(`taller:${day}`);
  return { from: pick(friendIds, r), toy: pick(TOY_IDS, r), wheel: Math.floor(r() * 3) % 3, plus: r() < 0.5 };
}
export interface Workshop { last?: string; fixed?: Record<string, number> }

// ── Topos del jardín ────────────────────────────────────────────────

export interface Pop { at: number; hole: number; stay: number; kind: "topo" | "dorado" | "mochito" }
export const MOLES_MS = 30_000;
export const molesSpec = (l: Lvl) => (l === "facil" ? { holes: 6, every: 900, stay: 1300, mochito: 0.1 } : l === "dificil" ? { holes: 9, every: 520, stay: 750, mochito: 0.2 } : { holes: 9, every: 700, stay: 1000, mochito: 0.15 });
/** Cuándo y dónde sale cada topo (nunca dos en el mismo hoyo a la vez). */
export function molesPlan(rnd: () => number, l: Lvl): Pop[] {
  const s = molesSpec(l);
  const out: Pop[] = [];
  const busy = Array(s.holes).fill(0);
  for (let t = 600; t < MOLES_MS - s.stay; t += s.every * (0.7 + rnd() * 0.6)) {
    const free = busy.map((b, i) => (b <= t ? i : -1)).filter((i) => i >= 0);
    if (!free.length) continue;
    const hole = pick(free, rnd);
    const r = rnd();
    const kind = r < s.mochito ? "mochito" : r < s.mochito + 0.08 ? "dorado" : "topo";
    const stay = s.stay * (kind === "dorado" ? 0.7 : 1);
    busy[hole] = t + stay + 150;
    out.push({ at: Math.round(t), hole, stay: Math.round(stay), kind });
  }
  return out;
}
export const molePoints = (k: Pop["kind"]) => (k === "dorado" ? 3 : k === "topo" ? 1 : -2);
export const molesScore = (points: number, plan: Pop[]) => {
  const max = plan.reduce((a, p) => a + Math.max(0, molePoints(p.kind)), 0);
  return max ? clamp01(points / (max * 0.8)) : 0;
};

// ── Dominó ──────────────────────────────────────────────────────────

export type Tile = [number, number];
export const domMax = (l: Lvl) => (l === "facil" ? 4 : 6);
export const domHand = (l: Lvl) => (l === "facil" ? 5 : 7);
export function domSet(max: number): Tile[] {
  const out: Tile[] = [];
  for (let a = 0; a <= max; a++) for (let b = a; b <= max; b++) out.push([a, b]);
  return out;
}
export function domDeal(rnd: () => number, l: Lvl) {
  const all = shuffle(domSet(domMax(l)), rnd);
  const n = domHand(l);
  return { me: all.slice(0, n), him: all.slice(n, n * 2), pile: all.slice(n * 2) };
}
/** Los extremos libres de la fila (o null si está vacía). */
export const domEnds = (line: Tile[]): [number, number] | null => (line.length ? [line[0][0], line[line.length - 1][1]] : null);
/** Por qué lados se puede poner la ficha. */
export function domSides(t: Tile, line: Tile[]): ("izq" | "der")[] {
  const e = domEnds(line);
  if (!e) return ["der"];
  const out: ("izq" | "der")[] = [];
  if (t[0] === e[0] || t[1] === e[0]) out.push("izq");
  if (t[0] === e[1] || t[1] === e[1]) out.push("der");
  return out;
}
/** Pone la ficha (volteándola si hace falta para que coincida). */
export function domPlace(line: Tile[], t: Tile, side: "izq" | "der"): Tile[] {
  const e = domEnds(line);
  if (!e) return [t];
  if (side === "izq") return [t[1] === e[0] ? t : [t[1], t[0]], ...line];
  return [...line, t[0] === e[1] ? t : [t[1], t[0]]];
}
export const domPips = (h: Tile[]) => h.reduce((a, t) => a + t[0] + t[1], 0);
/** Jugada de Mochito: en fácil la primera que encuentra; si no, suelta primero las fichas que más pesan. */
export function domMove(hand: Tile[], line: Tile[], l: Lvl): { i: number; side: "izq" | "der" } | null {
  const opts = hand.flatMap((t, i) => domSides(t, line).map((side) => ({ i, side, w: t[0] + t[1] + (t[0] === t[1] ? 3 : 0) })));
  if (!opts.length) return null;
  if (l === "facil") return opts[0];
  return opts.sort((a, b) => b.w - a.w)[0];
}

// ── Damas ───────────────────────────────────────────────────────────

/** Casillas: "" vacía; "h"/"H" huesos (tú, H = reina); "p"/"P" pelotas (Mochito). Tú empiezas abajo. */
export type Dm = ("" | "h" | "H" | "p" | "P")[];
export interface DmMove { from: number; to: number; cap?: number }
export function dmInit(): Dm {
  const b: Dm = Array(64).fill("");
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((r + c) % 2 === 0) continue;
    if (r < 3) b[r * 8 + c] = "p";
    if (r > 4) b[r * 8 + c] = "h";
  }
  return b;
}
const mine = (p: string, side: "h" | "p") => p.toLowerCase() === side;
/** Movimientos de una pieza: un paso en diagonal hacia adelante (la reina para atrás también) o saltar una pieza del otro. */
export function dmPieceMoves(b: Dm, i: number): DmMove[] {
  const p = b[i];
  if (!p) return [];
  const side = p.toLowerCase() as "h" | "p";
  const king = p === p.toUpperCase();
  const dirs = king ? [-1, 1] : side === "h" ? [-1] : [1];
  const r = Math.floor(i / 8), c = i % 8;
  const out: DmMove[] = [];
  for (const dr of dirs) for (const dc of [-1, 1]) {
    const r1 = r + dr, c1 = c + dc;
    if (r1 < 0 || r1 > 7 || c1 < 0 || c1 > 7) continue;
    const j = r1 * 8 + c1;
    if (!b[j]) { out.push({ from: i, to: j }); continue; }
    if (mine(b[j], side)) continue;
    const r2 = r1 + dr, c2 = c1 + dc;
    if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7 || b[r2 * 8 + c2]) continue;
    out.push({ from: i, to: r2 * 8 + c2, cap: j });
  }
  return out;
}
export const dmMoves = (b: Dm, side: "h" | "p") => b.flatMap((p, i) => (p && mine(p, side) ? dmPieceMoves(b, i) : []));
export function dmApply(b: Dm, m: DmMove): Dm {
  const n = [...b];
  let p = n[m.from];
  n[m.from] = "";
  if (m.cap !== undefined) n[m.cap] = "";
  const row = Math.floor(m.to / 8);
  if (p === "h" && row === 0) p = "H";
  if (p === "p" && row === 7) p = "P";
  n[m.to] = p;
  return n;
}
/** Después de comer, ¿esa pieza puede seguir comiendo? */
export const dmMoreJumps = (b: Dm, at: number) => dmPieceMoves(b, at).filter((m) => m.cap !== undefined);
export const dmCount = (b: Dm, side: "h" | "p") => b.filter((p) => p && mine(p, side)).length;
export function dmWinner(b: Dm, toMove: "h" | "p"): "h" | "p" | null {
  if (!dmCount(b, "p")) return "h";
  if (!dmCount(b, "h")) return "p";
  if (!dmMoves(b, toMove).length) return toMove === "h" ? "p" : "h";
  return null;
}
const dmEval = (b: Dm) => b.reduce((a, p) => a + (p === "p" ? 1 : p === "P" ? 2.5 : p === "h" ? -1 : p === "H" ? -2.5 : 0), 0);
function dmSearch(b: Dm, depth: number, side: "h" | "p", alpha: number, beta: number): number {
  const w = dmWinner(b, side);
  if (w) return w === "p" ? 100 + depth : -100 - depth;
  if (depth === 0) return dmEval(b);
  const moves = dmMoves(b, side);
  if (side === "p") {
    let best = -Infinity;
    for (const m of moves) { best = Math.max(best, dmSearch(dmApply(b, m), depth - 1, "h", alpha, beta)); alpha = Math.max(alpha, best); if (alpha >= beta) break; }
    return best;
  }
  let best = Infinity;
  for (const m of moves) { best = Math.min(best, dmSearch(dmApply(b, m), depth - 1, "p", alpha, beta)); beta = Math.min(beta, best); if (alpha >= beta) break; }
  return best;
}
/** Jugada de Mochito (pelotas). Si se le da la oportunidad de comer, en normal y difícil no la deja pasar. */
export function dmMove(rnd: () => number, b: Dm, l: Lvl): DmMove | null {
  const moves = dmMoves(b, "p");
  if (!moves.length) return null;
  const caps = moves.filter((m) => m.cap !== undefined);
  if (l === "facil") return caps.length && rnd() < 0.5 ? pick(caps, rnd) : pick(moves, rnd);
  if (l === "normal") {
    if (caps.length) return pick(caps, rnd);
    const safe = moves.filter((m) => !dmMoves(dmApply(b, m), "h").some((x) => x.cap === m.to));
    return pick(safe.length ? safe : moves, rnd);
  }
  let best = -Infinity, at = moves[0];
  for (const m of shuffle(moves, rnd)) {
    const s = dmSearch(dmApply(b, m), 3, "h", -Infinity, Infinity) + (m.cap !== undefined ? 0.1 : 0);
    if (s > best) { best = s; at = m; }
  }
  return at;
}
export const dmScore = (won: boolean, captured: number) => (won ? 1 : clamp01(0.15 + (captured / 12) * 0.6));

// ── Junta los huesos ────────────────────────────────────────────────

export type Grid = number[];
export type Dir = "arriba" | "abajo" | "izq" | "der";
export const BONE_GOAL = (l: Lvl) => (l === "facil" ? 128 : l === "dificil" ? 512 : 256);
function slideRow(row: number[]) {
  const vals = row.filter(Boolean);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) { out.push(vals[i] * 2); gained += vals[i] * 2; i++; } else out.push(vals[i]);
  }
  while (out.length < 4) out.push(0);
  return { out, gained };
}
/** Desliza todo hacia un lado: los huesos iguales que chocan se juntan en uno del doble. */
export function bonesSlide(g: Grid, dir: Dir): { grid: Grid; moved: boolean; gained: number } {
  const n = [...g];
  let gained = 0;
  for (let k = 0; k < 4; k++) {
    const idx = [0, 1, 2, 3].map((j) => (dir === "izq" ? k * 4 + j : dir === "der" ? k * 4 + 3 - j : dir === "arriba" ? j * 4 + k : (3 - j) * 4 + k));
    const r = slideRow(idx.map((i) => g[i]));
    r.out.forEach((v, j) => { n[idx[j]] = v; });
    gained += r.gained;
  }
  return { grid: n, moved: n.some((v, i) => v !== g[i]), gained };
}
export function bonesAdd(rnd: () => number, g: Grid): Grid {
  const free = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return g;
  const n = [...g];
  n[pick(free, rnd)] = rnd() < 0.9 ? 2 : 4;
  return n;
}
export const bonesStart = (rnd: () => number) => bonesAdd(rnd, bonesAdd(rnd, Array(16).fill(0)));
export const bonesCanMove = (g: Grid) => (["arriba", "abajo", "izq", "der"] as Dir[]).some((d) => bonesSlide(g, d).moved);
export const bonesScore = (max: number, goal: number) => clamp01(Math.log2(Math.max(2, max)) / Math.log2(goal));
