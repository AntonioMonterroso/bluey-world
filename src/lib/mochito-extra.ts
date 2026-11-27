import { dayKey, shuffle, weekKey } from "./game/engine";

// Más cosas de Mochito: su jardín, la peluquería, los viajes de fin de semana y su fiesta,
// y la lógica de cuatro juegos (pesca, frisbee, diferencias y sopa de letras). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const DAY = 86_400_000;
const dayMs = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
const daysBetween = (a: string, b: string) => Math.round((dayMs(b) - dayMs(a)) / DAY);

// ── Jardín ──────────────────────────────────────────────────────────

export type Seed = "zanahoria" | "tulipan" | "fresa" | "girasol" | "tomate" | "calabaza";
export interface SeedInfo { name: string; one: string; ready: string; days: number; kind: "comida" | "flor"; color: string; level: number }

export const SEEDS: Record<Seed, SeedInfo> = {
  zanahoria: { name: "Zanahorias", one: "una zanahoria", ready: "¡Zanahorias listas!", days: 2, kind: "comida", color: "#f08a24", level: 1 },
  tulipan: { name: "Tulipanes", one: "un tulipán", ready: "¡Tulipanes listos!", days: 2, kind: "flor", color: "#e2457a", level: 1 },
  fresa: { name: "Fresas", one: "unas fresas", ready: "¡Fresas listas!", days: 3, kind: "comida", color: "#d6453d", level: 2 },
  girasol: { name: "Girasoles", one: "un girasol", ready: "¡Girasoles listos!", days: 3, kind: "flor", color: "#f6c744", level: 3 },
  tomate: { name: "Tomates", one: "un tomate", ready: "¡Tomates listos!", days: 4, kind: "comida", color: "#e0533c", level: 4 },
  calabaza: { name: "Calabazas", one: "una calabaza", ready: "¡Calabazas listas!", days: 5, kind: "comida", color: "#f39a2b", level: 5 },
};
export const SEED_IDS = Object.keys(SEEDS) as Seed[];
export const PLOTS = 4;
export const HARVEST_COINS = 3;

export interface Plot { seed: Seed; planted: string; water: string[] }

/** Cómo va la planta: crece un paso por cada día que la regaste. Sin agua no crece, pero tampoco se seca. */
export function plotGrowth(p: Plot, now: number) {
  const need = SEEDS[p.seed].days;
  const watered = new Set(p.water).size;
  const ready = watered >= need;
  const stage: 0 | 1 | 2 | 3 = ready ? 3 : watered === 0 ? 0 : watered / need < 0.5 ? 1 : 2;
  return { stage, watered: Math.min(watered, need), need, ready, wateredToday: p.water.includes(dayKey(now)) };
}

export const plant = (seed: Seed, now: number): Plot => ({ seed, planted: dayKey(now), water: [] });

/** Riega hoy (una vez al día cuenta). */
export function waterPlot(p: Plot, now: number): Plot {
  const d = dayKey(now);
  return p.water.includes(d) ? p : { ...p, water: [...p.water, d] };
}

/** Las semillas que ya puede sembrar según su nivel. */
export const seedsFor = (level: number) => SEED_IDS.filter((s) => SEEDS[s].level <= level);

// ── Peluquería ──────────────────────────────────────────────────────

export type Hairdo = "copete" | "mono" | "monitos" | "flor" | "colita";
export const HAIRDOS: { id: Hairdo; name: string }[] = [
  { id: "copete", name: "Copete" },
  { id: "mono", name: "Moño" },
  { id: "monitos", name: "Dos moñitos" },
  { id: "flor", name: "Flor" },
  { id: "colita", name: "Lazo en la colita" },
];
export const GROOM_COLORS = ["#f28ab2", "#7cc6f2", "#f6c744", "#8fd17f", "#b99cf0", "#d6453d"];
export const GROOM_DAYS = 3;
export interface Groom { style: Hairdo; color: string; day: string }

/** El peinado le dura unos días. */
export const groomActive = (g: Groom | undefined, now: number): g is Groom => !!g && daysBetween(g.day, dayKey(now)) < GROOM_DAYS;

/** Dónde tiene nudos para cepillar y mechones para cortar (en el lienzo de 100×143 de Mochito). */
export const KNOTS = [{ x: 52, y: 84 }, { x: 40, y: 100 }, { x: 72, y: 96 }, { x: 18, y: 112 }, { x: 16, y: 44 }];
export const TUFTS = [{ x: 62, y: 4 }, { x: 13, y: 56 }, { x: 48, y: 76 }, { x: 10, y: 107 }];

export type GroomStep = "cepillar" | "cortar" | "secar" | "peinar";
export const GROOM_STEPS: { id: GroomStep; name: string; ask: string }[] = [
  { id: "cepillar", name: "Cepillar", ask: "Tiene nuditos. Tócalos con el cepillo hasta que no quede ninguno." },
  { id: "cortar", name: "Cortar", ask: "Unos mechones están muy largos. Córtalos con las tijeras." },
  { id: "secar", name: "Secar", ask: "Mantén presionada la secadora hasta que quede esponjadito." },
  { id: "peinar", name: "Peinar", ask: "¿Qué peinado le hacemos? Elige uno y su color." },
];
export const DRY_MS = 1800;

// ── Viajes de fin de semana ─────────────────────────────────────────

export type Place = "playa" | "lago" | "volcan" | "bosque" | "finca" | "ciudad";
export interface PlaceInfo { name: string; to: string; souvenir: string; sky: string; ground: string; moments: string[] }

export const PLACES: Record<Place, PlaceInfo> = {
  playa: {
    name: "La playa", to: "a la playa", souvenir: "Una conchita", sky: "#bfe4fb", ground: "#4a4a52",
    moments: [
      "Corrí en la arena negra y las olas me hicieron cosquillas en las patas.",
      "Hicimos un castillo de arena. Yo le puse una ramita de bandera.",
      "Vimos el atardecer naranja. Me quedé quietito mirando el mar.",
    ],
  },
  lago: {
    name: "El lago", to: "al lago", souvenir: "Una piedrita lisa", sky: "#cde8f7", ground: "#5e9fd0",
    moments: [
      "Nos subimos a una lancha. ¡El viento me volteaba las orejas!",
      "Alrededor del lago había volcanes. Les ladré para saludarlos.",
      "Unos patos nadaban cerquita. Yo me porté bien y solo los miré.",
    ],
  },
  volcan: {
    name: "El volcán", to: "al volcán", souvenir: "Una piedra de lava", sky: "#d8e2f0", ground: "#6b5a52",
    moments: [
      "Subimos y subimos. Me cansé, pero tú me cargaste un ratito.",
      "Desde arriba las nubes estaban abajo. ¡Parecían algodón!",
      "Tú asaste malvaviscos y yo me comí mi galleta. Qué rico.",
    ],
  },
  bosque: {
    name: "El bosque", to: "al bosque", souvenir: "Una pluma", sky: "#d4ecd6", ground: "#4f8a4f",
    moments: [
      "Una ardilla me miró desde un árbol y salió corriendo.",
      "Encontré hongos, pero no los toqué. Los hongos no se comen.",
      "Tomé agüita fresca de un río. Hacía un ruidito bonito.",
    ],
  },
  finca: {
    name: "La finca de café", to: "a la finca de café", souvenir: "Un grano de café", sky: "#e2efd6", ground: "#7a5a3a",
    moments: [
      "Caminamos entre matas de café con granitos rojos.",
      "Pusieron los granos a secar al sol. Yo no los pisé.",
      "Olía a café por todos lados. Tú tomaste una taza y yo agua.",
    ],
  },
  ciudad: {
    name: "La ciudad antigua", to: "a la ciudad antigua", souvenir: "Una postal", sky: "#f6e2c8", ground: "#c7b299",
    moments: [
      "Las calles eran de piedras. Mis patitas hacían tic, tic, tic.",
      "Vimos un arco amarillo con un reloj. Nos tomamos una foto.",
      "Me senté junto a una fuente y la gente me saludaba.",
    ],
  },
};
export const PLACE_IDS = Object.keys(PLACES) as Place[];
export const TRIP_COINS = 15;

/** Los viajes son sábado o domingo, uno por fin de semana. */
export const isWeekend = (now: number) => { const d = new Date(now).getDay(); return d === 0 || d === 6; };
export const tripKey = (now: number) => weekKey(now);
export function daysToWeekend(now: number) {
  const d = new Date(now).getDay();
  return d === 0 || d === 6 ? 0 : 6 - d;
}

// ── Fiesta ──────────────────────────────────────────────────────────

/** Su fiesta: el cumpleaños (cada año) o su «cumplemés» (cada mes, el mismo día que llegó). */
export function mochitoParty(days: string[] | undefined, now: number): { kind: "cumple"; age: number } | { kind: "mes"; months: number } | null {
  const first = days?.length ? [...days].sort()[0] : null;
  if (!first) return null;
  const born = new Date(dayMs(first));
  const t = new Date(now);
  const months = (t.getFullYear() - born.getFullYear()) * 12 + t.getMonth() - born.getMonth();
  if (months < 1) return null;
  const lastDay = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  const target = Math.min(born.getDate(), lastDay);
  if (t.getDate() !== target) return null;
  return months % 12 === 0 ? { kind: "cumple", age: months / 12 } : { kind: "mes", months };
}

/** Cuántos días faltan para su próxima fiesta. */
export function daysToParty(days: string[] | undefined, now: number) {
  if (!days?.length) return null;
  for (let i = 0; i <= 62; i++) if (mochitoParty(days, now + i * DAY)) return i;
  return null;
}

export const partyId = (now: number) => `mochito-fiesta:${dayKey(now)}`;
export const PARTY_COINS = 20;
export const BALLOONS = [
  { id: "rosa", name: "Rosa y celeste", colors: ["#f28ab2", "#7cc6f2"] },
  { id: "sol", name: "Amarillo y naranja", colors: ["#f6c744", "#f39a2b"] },
  { id: "verde", name: "Verde y blanco", colors: ["#8fd17f", "#ffffff"] },
  { id: "arcoiris", name: "De todos los colores", colors: ["#d6453d", "#f6c744", "#7cc6f2", "#8fd17f"] },
];
export const CAKES = [
  { id: "zanahoria", name: "Pastel de zanahoria", color: "#f39a2b" },
  { id: "pollito", name: "Pastel de pollito", color: "#f3d27a" },
  { id: "calabaza", name: "Pastel de calabaza", color: "#e9893b" },
];
export const TOPPERS = [
  { id: "hueso", name: "Un huesito" },
  { id: "corazon", name: "Un corazón" },
  { id: "patita", name: "Una patita" },
];
export const partyCandles = (p: NonNullable<ReturnType<typeof mochitoParty>>) => Math.min(12, p.kind === "cumple" ? p.age : p.months);

// ── Pesca en el lago ────────────────────────────────────────────────

export type Fish = "chico" | "mediano" | "grande" | "bota";
export const FISH: Record<Fish, { name: string; points: number; color: string }> = {
  chico: { name: "Un pececito", points: 1, color: "#f6a623" },
  mediano: { name: "Un pez mediano", points: 2, color: "#5e9fd0" },
  grande: { name: "¡Un pez enorme!", points: 3, color: "#8a6bc9" },
  bota: { name: "Una bota vieja", points: 0, color: "#7a5a3a" },
};

export function fishSpec(level: Lvl) {
  return level === "facil" ? { casts: 6, window: 1000 } : level === "dificil" ? { casts: 10, window: 520 } : { casts: 8, window: 720 };
}
/** La ventanita para jalar: los peces grandes se escapan más rápido. */
export const fishWindow = (level: Lvl, f: Fish) => Math.round(fishSpec(level).window * (f === "grande" ? 0.75 : f === "bota" ? 1.2 : 1));

/** Lo que va a picar en cada lanzada y cuánto tarda. */
export function fishPlan(rnd: () => number, level: Lvl) {
  return Array.from({ length: fishSpec(level).casts }, () => {
    const r = rnd();
    const fish: Fish = r < 0.12 ? "bota" : r < 0.5 ? "chico" : r < 0.82 ? "mediano" : "grande";
    return { fish, wait: 1200 + Math.round(rnd() * 2600) };
  });
}
export const fishPossible = (plan: { fish: Fish }[]) => plan.reduce((a, c) => a + FISH[c.fish].points, 0);
export const fishScore = (got: number, possible: number) => (possible <= 0 ? 1 : Math.round(Math.min(1, got / possible) * 100) / 100);

// ── Atrapa el frisbee ───────────────────────────────────────────────

export function frisbeeSpec(level: Lvl) {
  return level === "facil" ? { throws: 6, tol: 0.1, period: 1700, wind: 0 } : level === "dificil" ? { throws: 8, tol: 0.06, period: 1100, wind: 0.07 } : { throws: 7, tol: 0.08, period: 1400, wind: 0.04 };
}
/** Dónde espera Mochito y cuánto viento sopla en cada lanzamiento. */
export function frisbeePlan(rnd: () => number, level: Lvl) {
  const s = frisbeeSpec(level);
  return Array.from({ length: s.throws }, () => ({ target: 0.4 + Math.round(rnd() * 50) / 100, wind: Math.round((rnd() * 2 - 1) * s.wind * 100) / 100 }));
}
/** La fuerza va y viene (0→1→0) mientras esperas: es la medida de la barrita. */
export function frisbeePower(elapsed: number, period: number) {
  const t = (elapsed % period) / period;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}
export const frisbeeLand = (power: number, wind: number) => Math.min(1.05, Math.max(0.12, 0.15 + power * 0.85 + wind));

/** «aire»: lo atrapa de un brinco (3 puntos); «atrapa»: 1 punto; «falla»: no llega. */
export function frisbeeCatch(land: number, target: number, tol: number): "aire" | "atrapa" | "falla" {
  const d = Math.abs(land - target);
  return d <= tol / 3 ? "aire" : d <= tol ? "atrapa" : "falla";
}
export const frisbeeScore = (points: number, throws: number) => Math.round(Math.min(1, points / (throws * 2)) * 100) / 100;

// ── Encuentra las diferencias ───────────────────────────────────────

export type DiffId = "sol" | "nube" | "manzana" | "flor" | "pelota" | "pajaro" | "mariposa" | "ventana" | "hueso" | "cometa" | "valla" | "hongo";
/** Dónde está cada diferencia (en un dibujo de 100×75) y qué tan grande es la zona para tocarla. */
export const DIFFS: Record<DiffId, { x: number; y: number; r: number }> = {
  sol: { x: 88, y: 11, r: 8 },
  nube: { x: 34, y: 10, r: 8 },
  manzana: { x: 14, y: 26, r: 7 },
  flor: { x: 64, y: 64, r: 6 },
  pelota: { x: 80, y: 66, r: 6 },
  pajaro: { x: 56, y: 40, r: 6 },
  mariposa: { x: 70, y: 24, r: 6 },
  ventana: { x: 90, y: 42, r: 6 },
  hueso: { x: 54, y: 70, r: 6 },
  cometa: { x: 56, y: 9, r: 7 },
  valla: { x: 72, y: 50, r: 6 },
  hongo: { x: 8, y: 66, r: 6 },
};
export const DIFF_IDS = Object.keys(DIFFS) as DiffId[];
export const diffCount = (level: Lvl) => (level === "facil" ? 3 : level === "dificil" ? 7 : 5);
export const diffPick = (rnd: () => number, level: Lvl) => shuffle(DIFF_IDS, rnd).slice(0, diffCount(level));

/** Qué diferencia (de las que faltan) tocaste, si alguna. */
export function diffHit(x: number, y: number, left: DiffId[]): DiffId | null {
  let best: DiffId | null = null;
  let bestD = Infinity;
  for (const id of left) {
    const d = DIFFS[id];
    const dist = Math.hypot(x - d.x, y - d.y);
    if (dist <= d.r + 2 && dist < bestD) { best = id; bestD = dist; }
  }
  return best;
}
export const diffScore = (found: number, total: number, mistakes: number) => Math.max(0, Math.round(Math.min(1, found / total - mistakes * 0.08) * 100) / 100);

// ── Sopa de letras ──────────────────────────────────────────────────

export const WORDS = ["PERRO", "HUESO", "PATITA", "COLITA", "GALLETA", "PELOTA", "PASEO", "CORREA", "LADRA", "OREJAS", "CACHORRO", "PARQUE", "MOCHITO", "COLLAR", "CAMITA", "BAÑO", "AMIGO", "TRUCO", "PLATITO", "CARIÑO"];
const LETTERS = "AABCDEEFGHIIJLMNNÑOOPQRRSTUUVYZ";

export function soupSpec(level: Lvl) {
  return level === "facil"
    ? { size: 8, words: 4, dirs: [[0, 1], [1, 0]] }
    : level === "dificil"
      ? { size: 11, words: 8, dirs: [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, 1]] }
      : { size: 10, words: 6, dirs: [[0, 1], [1, 0], [1, 1]] };
}

export interface Soup { size: number; cells: string[]; words: { word: string; cells: number[] }[] }

/** Arma la sopa: acomoda las palabras sin chocar (pueden compartir letras iguales) y rellena lo demás. */
export function soupOf(rnd: () => number, level: Lvl): Soup {
  const { size, words: n, dirs } = soupSpec(level);
  for (let attempt = 0; attempt < 40; attempt++) {
    const cells: string[] = Array(size * size).fill("");
    const placed: Soup["words"] = [];
    for (const word of shuffle(WORDS.filter((w) => w.length <= size), rnd)) {
      if (placed.length >= n) break;
      for (let tries = 0; tries < 60; tries++) {
        const [dr, dc] = dirs[Math.floor(rnd() * dirs.length)];
        const r0 = Math.floor(rnd() * size), c0 = Math.floor(rnd() * size);
        const pos: number[] = [];
        let ok = true;
        for (let k = 0; k < word.length; k++) {
          const r = r0 + dr * k, c = c0 + dc * k;
          if (r < 0 || c < 0 || r >= size || c >= size) { ok = false; break; }
          const i = r * size + c;
          if (cells[i] && cells[i] !== word[k]) { ok = false; break; }
          pos.push(i);
        }
        if (!ok) continue;
        pos.forEach((i, k) => { cells[i] = word[k]; });
        placed.push({ word, cells: pos });
        break;
      }
    }
    if (placed.length < n) continue;
    for (let i = 0; i < cells.length; i++) if (!cells[i]) cells[i] = LETTERS[Math.floor(rnd() * LETTERS.length)];
    return { size, cells, words: placed };
  }
  throw new Error("No se pudo armar la sopa de letras");
}

/** Las casillas en línea recta de a hasta b (o null si no están en línea). */
export function soupLine(size: number, a: number, b: number): number[] | null {
  const ra = Math.floor(a / size), ca = a % size, rb = Math.floor(b / size), cb = b % size;
  const dr = Math.sign(rb - ra), dc = Math.sign(cb - ca);
  const len = Math.max(Math.abs(rb - ra), Math.abs(cb - ca));
  if (!(ra === rb || ca === cb || Math.abs(rb - ra) === Math.abs(cb - ca))) return null;
  return Array.from({ length: len + 1 }, (_, k) => (ra + dr * k) * size + ca + dc * k);
}

/** Qué palabra marcaste de a hasta b (en cualquier sentido). */
export function soupFind(s: Soup, a: number, b: number): string | null {
  const line = soupLine(s.size, a, b);
  if (!line) return null;
  const key = line.join(",");
  const back = [...line].reverse().join(",");
  return s.words.find((w) => { const k = w.cells.join(","); return k === key || k === back; })?.word ?? null;
}
export const soupScore = (found: number, total: number, misses: number) => Math.max(0, Math.round(Math.min(1, found / total - misses * 0.04) * 100) / 100);
