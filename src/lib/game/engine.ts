// Motor del juego: todo se calcula a partir de lo que ella hace de verdad (cocinar, recetas,
// gastos...). Sin dependencias de la app para poder probarlo solo.
import { calendarEvents, progressOf, weeklyEvents } from "./events";
import type { BakeryDay, BakeryStaff, BakeryUpgrade, Budget, CookLog, Expense, PriceEntry, Product, Recipe } from "../db/db";

const pad = (n: number) => String(n).padStart(2, "0");

export const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const dayStart = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
/** Lunes a las 00:00 de la semana de `ms`. */
export const weekStart = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)).getTime();
};
export const weekEnd = (start: number) => {
  const d = new Date(start);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime();
};
export const weekKey = (ms: number) => `w${dayKey(weekStart(ms))}`;

export interface Win {
  from: number;
  to: number;
}
const inWin = (t: number, w: Win) => t >= w.from && t < w.to;

// ---------- Azar con semilla (el mismo cartón para la misma semana en todos los dispositivos) ----------

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(arr: T[], rnd: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Niveles ----------

export const xpToNext = (level: number) => 100 + 50 * (level - 1);

export function levelOf(xp: number) {
  let level = 1;
  let rem = Math.max(0, xp);
  while (rem >= xpToNext(level)) {
    rem -= xpToNext(level);
    level++;
  }
  return { level, into: rem, need: xpToNext(level) };
}

const TITLES: [number, string][] = [
  [1, "Aprendiz"], [3, "Pinche"], [5, "Hornera"], [8, "Pastelera"], [12, "Chef"], [16, "Maestra pastelera"], [20, "Leyenda dulce"],
];
export const titleOf = (level: number) => [...TITLES].reverse().find(([l]) => level >= l)![1];

// ---------- Datos que lee el motor ----------

export interface GameData {
  cookLogs: CookLog[];
  recipes: Recipe[];
  expenses: Expense[];
  priceHistory: PriceEntry[];
  products: Product[];
  budgets: Budget[];
  ownedIds: Set<string>;
  marks: Set<string>; // "<semana>:<reto>" marcadas a mano
  days?: BakeryDay[]; // turnos de venta de Dulce Co.
  staff?: BakeryStaff[];
  upgrades?: BakeryUpgrade[];
}

export interface EventInput {
  id: string;
  kind: string;
  label: string;
  xp: number;
  coins: number;
  at: number;
}
export interface ExistingEvent {
  id: string;
  xp: number;
  coins: number;
}

interface Ctx {
  cooks: CookLog[];
  allCooks: CookLog[];
  recipeOf: (id: string) => Recipe | undefined;
  recipesCreated: Recipe[];
  expenses: Expense[];
  purchases: Expense[];
  priceEntries: PriceEntry[];
  newProducts: number;
  budgetsSet: number;
  firstCookIds: Set<string>;
  shifts: number;
}

function makeCtx(d: GameData, w: Win): Ctx {
  const byId = new Map(d.recipes.map((r) => [r.id, r]));
  const earliest = new Map<string, number>();
  for (const l of d.cookLogs) earliest.set(l.recipe_id, Math.min(earliest.get(l.recipe_id) ?? Infinity, l.cooked_at));
  const firstEntry = new Map<string, number>();
  for (const h of d.priceHistory) firstEntry.set(h.product_id, Math.min(firstEntry.get(h.product_id) ?? Infinity, h.at));
  return {
    cooks: d.cookLogs.filter((l) => inWin(l.cooked_at, w)),
    allCooks: d.cookLogs,
    recipeOf: (id) => byId.get(id),
    recipesCreated: d.recipes.filter((r) => inWin(r.created_at, w)),
    expenses: d.expenses.filter((e) => inWin(e.date, w)),
    purchases: d.expenses.filter((e) => inWin(e.date, w) && e.note.startsWith("Compra:")),
    priceEntries: d.priceHistory.filter((h) => inWin(h.at, w)),
    newProducts: [...firstEntry.values()].filter((t) => inWin(t, w)).length,
    budgetsSet: d.budgets.filter((b) => inWin(b.updated_at, w)).length,
    firstCookIds: new Set(d.cookLogs.filter((l) => earliest.get(l.recipe_id) === l.cooked_at).map((l) => l.id)),
    shifts: (d.days ?? []).filter((x) => inWin(x.at, w)).length,
  };
}

// ---------- Retos ----------

export interface Challenge {
  id: string;
  label: string; // corto, cabe en una casilla
  detail: string; // explicación completa
  manual?: boolean;
  daily?: boolean; // puede salir como misión del día
  check: (c: Ctx) => boolean;
}

const hour = (l: CookLog) => new Date(l.cooked_at).getHours();
const days = (cs: CookLog[]) => new Set(cs.map((l) => dayKey(l.cooked_at)));
const cat = (id: string, name: string, label: string): Challenge => ({
  id, label, detail: `Cocina una receta de la categoría ${name}.`,
  check: (c) => c.cooks.some((l) => c.recipeOf(l.recipe_id)?.category === name),
});

export const CHALLENGES: Challenge[] = [
  { id: "cook1", label: "Cocina una receta", detail: "Cocina cualquier receta paso a paso y termina con ¡Listo!", daily: true, check: (c) => c.cooks.length >= 1 },
  { id: "cook2", label: "Cocina 2 recetas", detail: "Termina 2 recetas.", check: (c) => c.cooks.length >= 2 },
  { id: "cook3", label: "Cocina 3 recetas", detail: "Termina 3 recetas.", check: (c) => c.cooks.length >= 3 },
  { id: "days2", label: "Cocina 2 días distintos", detail: "Cocina en dos días diferentes.", check: (c) => days(c.cooks).size >= 2 },
  { id: "days3", label: "Cocina 3 días distintos", detail: "Cocina en tres días diferentes.", check: (c) => days(c.cooks).size >= 3 },
  { id: "rate4", label: "Que quede de 4 estrellas", detail: "Califica una receta con 4 estrellas o más al terminar.", daily: true, check: (c) => c.cooks.some((l) => (l.rating ?? 0) >= 4) },
  { id: "rate5", label: "Receta de 5 estrellas", detail: "Califica una receta con 5 estrellas.", check: (c) => c.cooks.some((l) => l.rating === 5) },
  { id: "photo", label: "Foto de tu postre", detail: "Sube la foto del resultado al terminar de cocinar.", daily: true, check: (c) => c.cooks.some((l) => !!l.photo) },
  { id: "notes", label: "Anota qué cambiarías", detail: "Escribe una nota al terminar una receta.", check: (c) => c.cooks.some((l) => l.notes.trim().length > 0) },
  { id: "newrecipe", label: "Cocina una receta nueva", detail: "Cocina por primera vez una receta que nunca habías hecho.", daily: true, check: (c) => c.cooks.some((l) => c.firstCookIds.has(l.id)) },
  { id: "hard", label: "Un reto difícil", detail: "Cocina una receta de dificultad Reto.", check: (c) => c.cooks.some((l) => c.recipeOf(l.recipe_id)?.difficulty === 3) },
  { id: "morning", label: "Hornea de mañana", detail: "Termina una receta antes del mediodía.", check: (c) => c.cooks.some((l) => hour(l) < 12) },
  { id: "night", label: "Cocina de noche", detail: "Termina una receta después de las 8 pm.", check: (c) => c.cooks.some((l) => hour(l) >= 20) },
  { id: "weekend", label: "Cocina en fin de semana", detail: "Termina una receta sábado o domingo.", check: (c) => c.cooks.some((l) => [0, 6].includes(new Date(l.cooked_at).getDay())) },
  { id: "withvideo", label: "Con un video de guía", detail: "Cocina una receta que tenga video de YouTube.", check: (c) => c.cooks.some((l) => !!c.recipeOf(l.recipe_id)?.video_url) },
  cat("pasteles", "Pasteles", "Haz un pastel"),
  cat("galletas", "Galletas", "Haz galletas"),
  cat("cupcakes", "Cupcakes y muffins", "Cupcakes o muffins"),
  cat("tartas", "Tartas y pays", "Haz una tarta o pay"),
  cat("frios", "Postres fríos", "Un postre frío"),
  cat("panes", "Panes", "Hornea pan"),
  cat("rellenos", "Rellenos y cremas", "Haz una crema o relleno"),
  { id: "addrecipe", label: "Guarda una receta nueva", detail: "Crea una receta con ingredientes y pasos.", daily: true, check: (c) => c.recipesCreated.some((r) => r.ingredients.length > 0 && r.steps.length > 0) },
  { id: "addrecipe2", label: "Guarda 2 recetas nuevas", detail: "Crea dos recetas completas.", check: (c) => c.recipesCreated.filter((r) => r.ingredients.length && r.steps.length).length >= 2 },
  { id: "recipephoto", label: "Receta con foto", detail: "Crea una receta con foto.", check: (c) => c.recipesCreated.some((r) => !!r.photo) },
  { id: "recipevideo", label: "Receta con video", detail: "Crea una receta con un video de YouTube.", check: (c) => c.recipesCreated.some((r) => !!r.video_url) },
  { id: "secret", label: "Escribe un secreto", detail: "Crea una receta con tu secreto escrito.", check: (c) => c.recipesCreated.some((r) => r.secret.trim().length > 0) },
  { id: "shift1", label: "Abre tu pastelería", detail: "Atiende un turno de ventas en Dulce Co.", daily: true, check: (c) => c.shifts >= 1 },
  { id: "shift2", label: "Atiende 2 turnos", detail: "Juega dos turnos de ventas en Dulce Co.", check: (c) => c.shifts >= 2 },
  { id: "expense1", label: "Anota un gasto", detail: "Registra un gasto.", daily: true, check: (c) => c.expenses.length >= 1 },
  { id: "expense3", label: "Anota 3 gastos", detail: "Registra tres gastos.", check: (c) => c.expenses.length >= 3 },
  { id: "priceup", label: "Actualiza un precio", detail: "Registra el precio nuevo de un producto.", daily: true, check: (c) => c.priceEntries.length >= 1 },
  { id: "purchase", label: "Registra una compra", detail: "Cierra una compra desde tu lista.", check: (c) => c.purchases.length >= 1 },
  { id: "products3", label: "Agrega 3 productos", detail: "Agrega tres productos al catálogo de precios.", check: (c) => c.newProducts >= 3 },
  { id: "cap", label: "Fija un tope", detail: "Pon o cambia el tope mensual de una categoría.", check: (c) => c.budgetsSet >= 1 },
  // A mano: la app no puede saber si lo hiciste
  { id: "m-ingredient", label: "Prueba un ingrediente nuevo", detail: "Usa un ingrediente que nunca habías usado. Márcala tú.", manual: true, check: () => false },
  { id: "m-technique", label: "Aprende una técnica nueva", detail: "Prueba una técnica distinta (temple, merengue, fondant…). Márcala tú.", manual: true, check: () => false },
  { id: "m-share", label: "Comparte un postre", detail: "Regala o comparte lo que horneaste. Márcala tú.", manual: true, check: () => false },
  { id: "m-pantry", label: "Ordena tu despensa", detail: "Dale una ordenada a tus ingredientes. Márcala tú.", manual: true, check: () => false },
  { id: "m-video", label: "Mira un video de repostería", detail: "Aprende algo de un video. Márcala tú.", manual: true, check: () => false },
  { id: "m-clean", label: "Cocina impecable", detail: "Deja la cocina limpia al terminar. Márcala tú.", manual: true, check: () => false },
];
const byChallengeId = new Map(CHALLENGES.map((c) => [c.id, c]));
export const challengeById = (id: string) => byChallengeId.get(id);

export const FREE = "free";

/** Cartón de la semana: 24 retos + casilla libre al centro, igual en todos los dispositivos. */
export function buildCard(wk: string): string[] {
  const rnd = rng(`bingo:${wk}`);
  const autos = shuffle(CHALLENGES.filter((c) => !c.manual).map((c) => c.id), rnd).slice(0, 20);
  const manuals = shuffle(CHALLENGES.filter((c) => c.manual).map((c) => c.id), rnd).slice(0, 4);
  const cells = shuffle([...autos, ...manuals], rnd);
  cells.splice(12, 0, FREE);
  return cells;
}

export const LINES: number[][] = [
  ...[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];
export const lineName = (i: number) => (i < 5 ? `fila ${i + 1}` : i < 10 ? `columna ${i - 4}` : i === 10 ? "diagonal ↘" : "diagonal ↙");

export interface CardState {
  week: string;
  cells: { id: string; done: boolean; manual: boolean; free: boolean }[];
  doneLines: number[];
  full: boolean;
}

export function cardState(d: GameData, wk: string, win: Win): CardState {
  const ctx = makeCtx(d, win);
  const cells = buildCard(wk).map((id) => {
    if (id === FREE) return { id, done: true, manual: false, free: true };
    const ch = challengeById(id)!;
    return { id, done: ch.manual ? d.marks.has(`${wk}:${id}`) : ch.check(ctx), manual: !!ch.manual, free: false };
  });
  const doneLines = LINES.map((l, i) => (l.every((n) => cells[n].done) ? i : -1)).filter((i) => i >= 0);
  return { week: wk, cells, doneLines, full: cells.every((c) => c.done) };
}

/** 3 misiones por día, distintas cada día. */
export function dailyMissions(dk: string): string[] {
  return shuffle(CHALLENGES.filter((c) => c.daily).map((c) => c.id), rng(`daily:${dk}`)).slice(0, 3);
}

export function missionState(d: GameData, dk: string, win: Win) {
  const ctx = makeCtx(d, win);
  return dailyMissions(dk).map((id) => ({ id, done: challengeById(id)!.check(ctx) }));
}

// ---------- Insignias ----------

export interface Stats {
  cooks: number;
  recipesCooked: number;
  maxStreak: number;
  recipesCreated: number;
  fiveStar: number;
  photoCooks: number;
  categoriesCooked: number;
  nightCooks: number;
  earlyCooks: number;
  videoCooks: number;
  secrets: number;
  expenses: number;
  budgetsSet: number;
  priceEntries: number;
  purchases: number;
  chocolateCooks: number;
  monthOnBudget: boolean;
  bingoLines: number;
  fullCards: number;
  level: number;
  owned: number;
  shifts: number;
  customers: number;
  perfectShifts: number;
  staff: number;
  maxedUpgrade: boolean;
  events: number;
}

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  coins: number;
  check: (s: Stats) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "first-recipe", name: "Primera receta", desc: "Guarda tu primera receta completa.", coins: 10, check: (s) => s.recipesCreated >= 1 },
  { id: "recipes-5", name: "Recetario creciendo", desc: "Guarda 5 recetas.", coins: 20, check: (s) => s.recipesCreated >= 5 },
  { id: "recipes-15", name: "Biblioteca dulce", desc: "Guarda 15 recetas.", coins: 40, check: (s) => s.recipesCreated >= 15 },
  { id: "first-cook", name: "Manos a la masa", desc: "Cocina tu primera receta.", coins: 10, check: (s) => s.cooks >= 1 },
  { id: "cooks-5", name: "Va tomando ritmo", desc: "Cocina 5 veces.", coins: 20, check: (s) => s.cooks >= 5 },
  { id: "cooks-10", name: "Horno encendido", desc: "Cocina 10 veces.", coins: 30, check: (s) => s.cooks >= 10 },
  { id: "cooks-25", name: "Pastelera de planta", desc: "Cocina 25 veces.", coins: 60, check: (s) => s.cooks >= 25 },
  { id: "streak-3", name: "Racha de 3 días", desc: "Cocina 3 días seguidos.", coins: 20, check: (s) => s.maxStreak >= 3 },
  { id: "streak-7", name: "Semana dulce", desc: "Cocina 7 días seguidos.", coins: 60, check: (s) => s.maxStreak >= 7 },
  { id: "five-star", name: "Cinco estrellas", desc: "Califica una receta con 5 estrellas.", coins: 15, check: (s) => s.fiveStar >= 1 },
  { id: "photo", name: "Para el recuerdo", desc: "Sube la foto de un postre terminado.", coins: 15, check: (s) => s.photoCooks >= 1 },
  { id: "variety", name: "De todo un poco", desc: "Cocina recetas de 3 categorías distintas.", coins: 30, check: (s) => s.categoriesCooked >= 3 },
  { id: "chocolate", name: "Maestra del chocolate", desc: "Cocina 3 recetas con chocolate.", coins: 30, check: (s) => s.chocolateCooks >= 3 },
  { id: "night-owl", name: "Búho pastelero", desc: "Termina una receta después de las 9 pm.", coins: 10, check: (s) => s.nightCooks >= 1 },
  { id: "early-bird", name: "Madrugadora", desc: "Termina una receta antes de las 8 am.", coins: 10, check: (s) => s.earlyCooks >= 1 },
  { id: "video-learner", name: "Aprende mirando", desc: "Cocina una receta con video.", coins: 10, check: (s) => s.videoCooks >= 1 },
  { id: "secret-keeper", name: "Guardiana de secretos", desc: "Guarda una receta con tu secreto.", coins: 10, check: (s) => s.secrets >= 1 },
  { id: "first-expense", name: "Cuentas claras", desc: "Anota tu primer gasto.", coins: 10, check: (s) => s.expenses >= 1 },
  { id: "budget-set", name: "Con tope", desc: "Fija el tope mensual de una categoría.", coins: 10, check: (s) => s.budgetsSet >= 1 },
  { id: "price-tracker", name: "Ojo con los precios", desc: "Anota 10 precios en el catálogo.", coins: 30, check: (s) => s.priceEntries >= 10 },
  { id: "shopper", name: "Compra registrada", desc: "Cierra una compra desde tu lista.", coins: 10, check: (s) => s.purchases >= 1 },
  { id: "on-budget", name: "Mes dentro del presupuesto", desc: "Termina un mes sin pasarte de ningún tope.", coins: 60, check: (s) => s.monthOnBudget },
  { id: "bingo-line", name: "¡Línea!", desc: "Completa una línea del Bingo.", coins: 20, check: (s) => s.bingoLines >= 1 },
  { id: "bingo-full", name: "¡Bingo completo!", desc: "Llena todo un cartón.", coins: 100, check: (s) => s.fullCards >= 1 },
  { id: "level-5", name: "Hornera", desc: "Llega al nivel 5.", coins: 30, check: (s) => s.level >= 5 },
  { id: "level-10", name: "Mano de oro", desc: "Llega al nivel 10.", coins: 80, check: (s) => s.level >= 10 },
  { id: "first-shift", name: "Abierto al público", desc: "Atiende tu primer turno en Dulce Co.", coins: 15, check: (s) => s.shifts >= 1 },
  { id: "customers-50", name: "Clientela fiel", desc: "Atiende a 50 clientes.", coins: 50, check: (s) => s.customers >= 50 },
  { id: "perfect-shift", name: "Turno perfecto", desc: "Atiende 5 clientes o más sin perder a ninguno.", coins: 30, check: (s) => s.perfectShifts >= 1 },
  { id: "first-hire", name: "Primer empleado", desc: "Contrata a alguien para Dulce Co.", coins: 15, check: (s) => s.staff >= 1 },
  { id: "team-5", name: "Equipo de cinco", desc: "Ten 5 empleados a la vez.", coins: 40, check: (s) => s.staff >= 5 },
  { id: "luxury", name: "Local de lujo", desc: "Lleva una mejora del local al máximo.", coins: 60, check: (s) => s.maxedUpgrade },
  { id: "festejo", name: "De fiesta", desc: "Cumple la meta de un evento de temporada.", coins: 30, check: (s) => s.events >= 1 },
  { id: "temporada", name: "Toda la temporada", desc: "Cumple la meta de 4 eventos.", coins: 80, check: (s) => s.events >= 4 },
  { id: "collector", name: "Coleccionista", desc: "Ten 5 cosas de la tienda.", coins: 30, check: (s) => s.owned >= 5 },
];

export function maxStreakOf(cooks: CookLog[]) {
  const ds = [...new Set(cooks.map((l) => dayStart(l.cooked_at)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -1;
  for (const t of ds) {
    run = prev >= 0 && Math.round((t - prev) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export function currentStreak(cooks: CookLog[], now: number) {
  const set = new Set(cooks.map((l) => dayKey(l.cooked_at)));
  let d = dayStart(now);
  if (!set.has(dayKey(d))) d = new Date(new Date(d).getFullYear(), new Date(d).getMonth(), new Date(d).getDate() - 1).getTime();
  let n = 0;
  while (set.has(dayKey(d))) {
    n++;
    const x = new Date(d);
    d = new Date(x.getFullYear(), x.getMonth(), x.getDate() - 1).getTime();
  }
  return n;
}

function monthOnBudget(d: GameData, now: number) {
  const t = new Date(now);
  const from = new Date(t.getFullYear(), t.getMonth() - 1, 1).getTime();
  const to = new Date(t.getFullYear(), t.getMonth(), 1).getTime();
  const spent = (c: string) => d.expenses.filter((e) => e.category === c && e.date >= from && e.date < to).reduce((s, e) => s + e.amount, 0);
  const any = d.expenses.some((e) => e.date >= from && e.date < to);
  return d.budgets.length > 0 && any && d.budgets.every((b) => spent(b.category) <= b.limit);
}

// Nivel máximo de cada mejora (se repite aquí para que el motor siga sin depender de la app)
const MAX_UPGRADE: Record<string, number> = { vitrina: 2, letrero: 3, sala: 3, caja: 3, horno: 3, puestos: 3 };

export function statsOf(d: GameData, extra: { bingoLines: number; fullCards: number; level: number; events?: number }, now: number): Stats {
  const byId = new Map(d.recipes.map((r) => [r.id, r]));
  const valid = d.recipes.filter((r) => r.ingredients.length > 0 && r.steps.length > 0);
  const cats = new Set<string>();
  let choc = 0;
  for (const l of d.cookLogs) {
    const r = byId.get(l.recipe_id);
    if (r) cats.add(r.category);
    if (/chocolate|cacao|brownie/i.test(`${l.title} ${r?.tags.join(" ") ?? ""}`)) choc++;
  }
  return {
    cooks: d.cookLogs.length,
    recipesCooked: new Set(d.cookLogs.map((l) => l.recipe_id)).size,
    maxStreak: maxStreakOf(d.cookLogs),
    recipesCreated: valid.length,
    fiveStar: d.cookLogs.filter((l) => l.rating === 5).length,
    photoCooks: d.cookLogs.filter((l) => !!l.photo).length,
    categoriesCooked: cats.size,
    nightCooks: d.cookLogs.filter((l) => new Date(l.cooked_at).getHours() >= 21).length,
    earlyCooks: d.cookLogs.filter((l) => new Date(l.cooked_at).getHours() < 8).length,
    videoCooks: d.cookLogs.filter((l) => !!byId.get(l.recipe_id)?.video_url).length,
    secrets: valid.filter((r) => r.secret.trim()).length,
    expenses: d.expenses.length,
    budgetsSet: d.budgets.length,
    priceEntries: d.priceHistory.length,
    purchases: d.expenses.filter((e) => e.note.startsWith("Compra:")).length,
    chocolateCooks: choc,
    monthOnBudget: monthOnBudget(d, now),
    bingoLines: extra.bingoLines,
    fullCards: extra.fullCards,
    level: extra.level,
    owned: d.ownedIds.size,
    shifts: (d.days ?? []).length,
    customers: (d.days ?? []).reduce((n, x) => n + x.served, 0),
    perfectShifts: (d.days ?? []).filter((x) => x.perfect).length,
    staff: (d.staff ?? []).length,
    maxedUpgrade: (d.upgrades ?? []).some((u) => u.level >= (MAX_UPGRADE[u.id] ?? 99)),
    events: extra.events ?? 0,
  };
}

// ---------- Premios ----------

export const REWARDS = {
  cook: { xp: 20, coins: 10 },
  cookRating: { xp: 5, coins: 2 },
  cookPhoto: { xp: 5, coins: 3 },
  cookNotes: { xp: 3, coins: 0 },
  firstCook: { xp: 15, coins: 5 },
  recipe: { xp: 10, coins: 5 },
  expenseDay: { xp: 4, coins: 2 },
  purchase: { xp: 8, coins: 5 },
  price: { xp: 2, coins: 1 },
  mission: { xp: 10, coins: 8 },
  line: { xp: 30, coins: 25 },
  full: { xp: 100, coins: 100 },
  badgeXp: 25,
  welcomeCoins: 100,
} as const;

/** Calcula los premios que faltan por registrar. Solo devuelve los que aún no existen. */
export function computeAwards(d: GameData, existing: ExistingEvent[], now: number): EventInput[] {
  const have = new Set(existing.map((e) => e.id));
  const out: EventInput[] = [];
  const add = (e: EventInput) => {
    if (!have.has(e.id)) {
      have.add(e.id);
      out.push(e);
    }
  };

  add({ id: "welcome", kind: "welcome", label: "¡Bienvenida! Monedas de regalo", xp: 0, coins: REWARDS.welcomeCoins, at: now });

  const byId = new Map(d.recipes.map((r) => [r.id, r]));
  const earliest = new Map<string, number>();
  for (const l of d.cookLogs) earliest.set(l.recipe_id, Math.min(earliest.get(l.recipe_id) ?? Infinity, l.cooked_at));

  for (const l of d.cookLogs) {
    let xp: number = REWARDS.cook.xp;
    let coins: number = REWARDS.cook.coins;
    if (l.rating) { xp += REWARDS.cookRating.xp; coins += REWARDS.cookRating.coins; }
    if (l.photo) { xp += REWARDS.cookPhoto.xp; coins += REWARDS.cookPhoto.coins; }
    if (l.notes.trim()) xp += REWARDS.cookNotes.xp;
    add({ id: `cook:${l.id}`, kind: "cook", label: `Cocinaste ${l.title}`, xp, coins, at: l.cooked_at });
    if (earliest.get(l.recipe_id) === l.cooked_at) {
      add({ id: `firstcook:${l.recipe_id}`, kind: "cook", label: `Receta nueva: ${l.title}`, ...REWARDS.firstCook, at: l.cooked_at });
    }
  }

  for (const r of d.recipes) {
    if (r.ingredients.length > 0 && r.steps.length > 0 && r.title.trim().length >= 3) {
      add({ id: `recipe:${r.id}`, kind: "recipe", label: `Guardaste ${r.title}`, ...REWARDS.recipe, at: r.created_at });
    }
  }

  for (const day of d.days ?? []) {
    if (day.served > 0 || day.coins > 0) {
      if ((day.wages ?? 0) > 0) add({ id: `wage:${day.id}`, kind: "shop", label: "Sueldos del equipo", xp: 0, coins: -(day.wages ?? 0), at: day.at });
      add({ id: `shift:${day.id}`, kind: "shop", label: `Turno en Dulce Co.: ${day.served} clientes`, xp: day.served * 2 + (day.perfect ? 10 : 0), coins: day.coins, at: day.at });
    }
  }

  // Eventos de temporada: se cobra al cumplir la meta dentro de la ventana del evento.
  const dayLites = (d.days ?? []).map((x) => ({ at: x.at, served: x.served, items: x.items, critic: x.critic }));
  for (const e of [...calendarEvents(now), ...weeklyEvents(now)]) {
    if (progressOf(e.def, dayLites, e.win).done) {
      add({ id: `event:${e.key}`, kind: "event", label: `Evento: ${e.def.name}`, xp: e.def.reward.xp, coins: e.def.reward.coins, at: now });
    }
  }

  const expenseDays = new Set<string>();
  for (const e of [...d.expenses].sort((a, b) => a.date - b.date)) {
    const dk = dayKey(e.date);
    if (!expenseDays.has(dk)) {
      expenseDays.add(dk);
      add({ id: `expense-day:${dk}`, kind: "budget", label: "Anotaste tus gastos del día", ...REWARDS.expenseDay, at: e.date });
    }
    if (e.note.startsWith("Compra:")) add({ id: `purchase:${e.id}`, kind: "budget", label: "Registraste una compra", ...REWARDS.purchase, at: e.date });
  }

  const perDay = new Map<string, number>();
  for (const h of [...d.priceHistory].sort((a, b) => a.at - b.at)) {
    const dk = dayKey(h.at);
    const n = (perDay.get(dk) ?? 0) + 1;
    perDay.set(dk, n);
    if (n <= 3) add({ id: `price:${h.id}`, kind: "budget", label: "Actualizaste un precio", ...REWARDS.price, at: h.at });
  }

  // Bingo: semana actual y anterior (por si terminó el domingo y abre el lunes)
  const wkNow = weekStart(now);
  const weeks = [wkNow, new Date(new Date(wkNow).getFullYear(), new Date(wkNow).getMonth(), new Date(wkNow).getDate() - 7).getTime()];
  for (const ws of weeks) {
    const wk = weekKey(ws);
    const st = cardState(d, wk, { from: ws, to: weekEnd(ws) });
    for (const li of st.doneLines) {
      add({ id: `bingo:${wk}:line:${li}`, kind: "bingo", label: `¡Línea de Bingo! (${lineName(li)})`, ...REWARDS.line, at: now });
    }
    if (st.full) add({ id: `bingo:${wk}:full`, kind: "bingo", label: "¡Cartón de Bingo completo!", ...REWARDS.full, at: now });
  }

  // Misiones del día (hoy y ayer)
  for (const t of [dayStart(now), new Date(new Date(now).getFullYear(), new Date(now).getMonth(), new Date(now).getDate() - 1).getTime()]) {
    const dk = dayKey(t);
    const win = { from: t, to: new Date(new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate() + 1).getTime() };
    for (const m of missionState(d, dk, win)) {
      if (m.done) add({ id: `mission:${dk}:${m.id}`, kind: "mission", label: `Misión: ${challengeById(m.id)!.label}`, ...REWARDS.mission, at: now });
    }
  }

  // Insignias y niveles se alimentan entre sí: se repite hasta que no haya nada nuevo.
  const sum = (key: "xp" | "coins") => existing.reduce((s, e) => s + e[key], 0) + out.reduce((s, e) => s + e[key], 0);
  for (let i = 0; i < 4; i++) {
    const level = levelOf(sum("xp")).level;
    const all = [...existing.map((e) => e.id), ...out.map((e) => e.id)];
    const stats = statsOf(
      d,
      {
        bingoLines: all.filter((id) => /^bingo:.*:line:/.test(id)).length,
        fullCards: all.filter((id) => /^bingo:.*:full$/.test(id)).length,
        level,
        events: all.filter((id) => id.startsWith("event:")).length,
      },
      now,
    );
    const before = out.length;
    for (const b of BADGES) {
      if (b.check(stats)) add({ id: `badge:${b.id}`, kind: "badge", label: `Insignia: ${b.name}`, xp: REWARDS.badgeXp, coins: b.coins, at: now });
    }
    const lvl = levelOf(sum("xp")).level;
    for (let L = 2; L <= lvl; L++) add({ id: `level:${L}`, kind: "level", label: `¡Nivel ${L}! ${titleOf(L)}`, xp: 0, coins: 20 + L * 5, at: now });
    if (out.length === before) break;
  }

  return out;
}
