import { shuffle } from "./engine";

// Lógica pura de los minijuegos de la sala. Usa tus recetas y, si faltan, unas de ejemplo.

export interface MiniRecipe {
  title: string;
  category: string;
  steps: string[];
  ingredients: string[];
  minutes: number | null;
}

export const SAMPLE_RECIPES: MiniRecipe[] = [
  { title: "Galletas de mantequilla", category: "Galletas", minutes: 25, ingredients: ["mantequilla", "azúcar", "harina", "huevo", "vainilla"], steps: ["Bate la mantequilla con el azúcar.", "Agrega el huevo y la vainilla.", "Incorpora la harina.", "Forma las galletas en la bandeja.", "Hornea hasta que doren los bordes."] },
  { title: "Panqué de limón", category: "Panqués", minutes: 50, ingredients: ["harina", "limón", "huevo", "azúcar", "mantequilla", "polvo de hornear"], steps: ["Precalienta el horno.", "Mezcla los ingredientes secos.", "Bate los huevos con el azúcar y el limón.", "Une las dos mezclas con la mantequilla derretida.", "Vierte en el molde y hornea.", "Deja enfriar antes de cortar."] },
  { title: "Brownies", category: "Chocolate", minutes: 35, ingredients: ["chocolate", "mantequilla", "azúcar", "huevo", "harina", "cacao"], steps: ["Derrite el chocolate con la mantequilla.", "Agrega el azúcar y los huevos.", "Incorpora la harina y el cacao.", "Vierte en el molde.", "Hornea y deja enfriar."] },
  { title: "Cupcakes de fresa", category: "Cupcakes", minutes: 40, ingredients: ["harina", "fresa", "azúcar", "huevo", "leche", "mantequilla"], steps: ["Bate la mantequilla con el azúcar.", "Agrega los huevos de uno en uno.", "Alterna harina y leche.", "Llena los moldes de cupcake.", "Hornea y decora con crema de fresa."] },
  { title: "Flan de vainilla", category: "Postres fríos", minutes: 60, ingredients: ["leche", "huevo", "azúcar", "vainilla"], steps: ["Haz el caramelo en el molde.", "Licúa la leche, los huevos y la vainilla.", "Vierte sobre el caramelo.", "Cocina a baño maría.", "Refrigera hasta que cuaje."] },
];

export const EXTRA_INGREDIENTS = ["canela", "coco", "nuez", "miel", "queso crema", "chispas de chocolate", "plátano", "zanahoria", "avena", "crema"];

const clean = (s: string) => s.trim().replace(/\s+/g, " ");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Mezcla recetas reales con las de ejemplo para que siempre haya con qué jugar. */
export function poolOf(mine: MiniRecipe[], need: (r: MiniRecipe) => boolean): MiniRecipe[] {
  const real = mine.filter(need);
  return real.length >= 2 ? real : [...real, ...SAMPLE_RECIPES.filter((s) => !real.some((r) => r.title === s.title))];
}

// ---------- Dificultad ----------

export type Level = "facil" | "normal" | "dificil";
export const LEVELS: { id: Level; label: string; mult: number }[] = [
  { id: "facil", label: "Fácil", mult: 0.8 },
  { id: "normal", label: "Normal", mult: 1 },
  { id: "dificil", label: "Difícil", mult: 1.25 },
];
export const levelMult = (l: Level) => LEVELS.find((x) => x.id === l)?.mult ?? 1;
export const levelLabel = (l: Level) => LEVELS.find((x) => x.id === l)?.label ?? l;

// ---------- Ordena los pasos ----------

export interface StepsRound {
  title: string;
  steps: string[]; // en el orden correcto
  order: number[]; // cómo se muestran: índices de steps, revueltos
}
export const STEPS_MAX = 5;

const STEPS_BY_LEVEL: Record<Level, number> = { facil: 4, normal: STEPS_MAX, dificil: 7 };

export function stepsRound(mine: MiniRecipe[], rnd: () => number, level: Level = "normal"): StepsRound {
  const pool = poolOf(mine, (r) => r.steps.filter((s) => clean(s)).length >= 3);
  const r = pool[Math.floor(rnd() * pool.length)];
  const steps = r.steps.map(clean).filter(Boolean).slice(0, STEPS_BY_LEVEL[level]);
  let order = shuffle(steps.map((_, i) => i), rnd);
  // Que no salga ya ordenado.
  if (order.every((v, i) => v === i)) order = [...order.slice(1), order[0]];
  return { title: r.title, steps, order };
}

/** Cuántos pasos están en su lugar (0 a 1) según el orden que puso la jugadora. */
export function scoreSteps(order: number[]): number {
  return order.length ? order.filter((v, i) => v === i).length / order.length : 0;
}

// ---------- Memoria de ingredientes ----------

export interface MemoryCard { id: number; pair: string }
export const PAIRS = 6;

export const pairsFor = (l: Level) => (l === "facil" ? 4 : l === "dificil" ? 8 : PAIRS);

export function memoryDeck(mine: MiniRecipe[], rnd: () => number, pairs = PAIRS): MemoryCard[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const n of [...mine.flatMap((r) => r.ingredients), ...SAMPLE_RECIPES.flatMap((r) => r.ingredients), ...EXTRA_INGREDIENTS].map((x) => clean(x).toLowerCase())) {
    if (n && n.length <= 18 && !seen.has(n)) { seen.add(n); names.push(n); }
  }
  // Primero los tuyos (barajados), luego los de relleno.
  const own = shuffle([...new Set(mine.flatMap((r) => r.ingredients).map((x) => clean(x).toLowerCase()).filter((n) => n && n.length <= 18))], rnd);
  const rest = shuffle(names.filter((n) => !own.includes(n)), rnd);
  const chosen = [...own, ...rest].slice(0, pairs);
  return shuffle(chosen.flatMap((p) => [p, p]), rnd).map((pair, id) => ({ id, pair }));
}

/** Estrellas (1 a 5) según los intentos: lo perfecto es PAIRS intentos. */
export function scoreMemory(tries: number, pairs = PAIRS): number {
  const extra = Math.max(0, tries - pairs);
  return Math.max(0.2, 1 - extra / (pairs * 2));
}

// ---------- Adivina el postre ----------

export interface GuessRound {
  answer: string;
  options: string[];
  clues: string[]; // de la más difícil a la más fácil
}

const OPTIONS_BY_LEVEL: Record<Level, number> = { facil: 3, normal: 4, dificil: 6 };

export function guessRound(mine: MiniRecipe[], rnd: () => number, level: Level = "normal"): GuessRound {
  const pool = poolOf(mine, (r) => r.ingredients.filter((i) => clean(i)).length >= 3);
  const r = pool[Math.floor(rnd() * pool.length)];
  const ing = shuffle(r.ingredients.map(clean).filter(Boolean), rnd).slice(0, 3);
  const clues = [
    `Lleva ${ing[0]}.`,
    `También lleva ${ing[1]}.`,
    `Y ${ing[2]}.`,
    `Es de la categoría “${r.category || "postres"}”.`,
    ...(r.minutes ? [`Se hace en unos ${r.minutes} minutos.`] : []),
  ];
  const others = shuffle(pool.filter((p) => p.title !== r.title).map((p) => p.title), rnd);
  const fill = shuffle(SAMPLE_RECIPES.map((p) => p.title).filter((t) => t !== r.title && !others.includes(t)), rnd);
  const options = shuffle([r.title, ...[...others, ...fill].slice(0, OPTIONS_BY_LEVEL[level] - 1)], rnd);
  return { answer: r.title, options, clues };
}

/** Puntaje (0 a 1): acertar con pocas pistas vale más; fallar vale 0. */
export function scoreGuess(correct: boolean, cluesUsed: number): number {
  return correct ? Math.max(0.4, 1 - (cluesUsed - 1) * 0.2) : 0;
}

// ---------- Premios con tope diario ----------

// Tope bajo a propósito: lo que más rinde debe seguir siendo cocinar de verdad (una receta bien hecha da hasta 25 monedas).
export const DAILY_COIN_CAP = 30;
export const DAILY_XP_CAP = 40;
export const GAMES = ["pasos", "memoria", "adivina", "torta", "horno", "atrapa", "cambio"] as const;
export type MiniGame = (typeof GAMES)[number];

export interface MiniReward { xp: number; coins: number; capped: boolean }

/** Premio de una partida según el puntaje (0 a 1), recortado por lo que ya ganó hoy. */
export function rewardFor(score: number, earnedToday: { xp: number; coins: number }, mult = 1): MiniReward {
  const baseCoins = Math.round((2 + score * 8) * mult); // 2 a 10 (más en difícil)
  const baseXp = Math.round((3 + score * 7) * mult); // 3 a 10
  const coins = Math.max(0, Math.min(baseCoins, DAILY_COIN_CAP - earnedToday.coins));
  const xp = Math.max(0, Math.min(baseXp, DAILY_XP_CAP - earnedToday.xp));
  return { coins, xp, capped: coins < baseCoins || xp < baseXp };
}

export const starsOf = (score: number) => Math.max(1, Math.round(score * 5));
export { cap };

// ---------- Horno según dificultad ----------

export const ovenPeriod = (l: Level) => (l === "facil" ? 2600 : l === "dificil" ? 1250 : 1900);

// ---------- Atrapa ingredientes ----------

export const CATCH_GOOD = ["harina", "huevo", "azúcar", "mantequilla", "fresa", "chocolate", "leche", "canela"];
export const CATCH_BAD = ["calcetín", "piedra", "zapato"];
export const CATCH_MS = 30_000;
/** Cada cuánto cae algo y qué tan rápido, según la dificultad. */
export const catchSpec = (l: Level) => (l === "facil" ? { every: 900, speed: 0.22, bad: 0.15 } : l === "dificil" ? { every: 520, speed: 0.4, bad: 0.3 } : { every: 700, speed: 0.3, bad: 0.22 });
/** Puntaje (0 a 1): lo bueno que atrapaste, menos un castigo por lo malo. */
export function catchScore(caught: number, spawned: number, bad: number): number {
  if (spawned <= 0) return 0;
  return Math.max(0, Math.min(1, caught / spawned - bad * 0.1));
}

// ---------- Cuenta el cambio ----------

export const DENOMS = [0.25, 0.5, 1, 5, 10, 20, 50];
export const CHANGE_ROUNDS = 5;
export interface ChangeRound { price: number; paid: number; change: number }
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Un cliente compra algo y paga con un billete: hay que dar el vuelto exacto. */
export function changeRound(rnd: () => number, level: Level = "normal"): ChangeRound {
  const quarters = level === "facil" ? false : true;
  const max = level === "facil" ? 20 : level === "dificil" ? 95 : 45;
  const raw = 3 + rnd() * (max - 3);
  const price = quarters ? Math.round(raw * 4) / 4 : Math.round(raw);
  const bills = [5, 10, 20, 50, 100].filter((b) => b > price);
  const paid = bills[Math.floor(rnd() * Math.min(2, bills.length))];
  return { price: round2(price), paid, change: round2(paid - price) };
}
export const sumOf = (coins: number[]) => round2(coins.reduce((s, c) => s + c, 0));

// ---------- Reto del día ----------

export const CHALLENGE_GAMES: MiniGame[] = ["pasos", "memoria", "adivina", "horno", "atrapa", "cambio"];
/** El mismo reto para todo el día: juego y dificultad salen de la fecha. */
export function dailyChallenge(day: string): { game: MiniGame; level: Level } {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { game: CHALLENGE_GAMES[h % CHALLENGE_GAMES.length], level: (["normal", "dificil", "normal", "facil"] as Level[])[(h >> 3) % 4] };
}
export const CHALLENGE_BONUS = { xp: 15, coins: 10 };
export const CHALLENGE_MIN = 0.6;
