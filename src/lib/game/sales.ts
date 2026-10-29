// Lógica del turno de venta de Dulce Co. Pura (sin React ni base de datos) para poder probarla sola.
import { FAV_BOOST } from "./events";
import { archetypeOf, pickChar, type Visit } from "./customers";

export interface MenuLite {
  id: string;
  name: string;
  icon: string;
  price: number;
  cost: number; // costo estimado por porción
  category?: string; // categoría de la receta (para las fiestas)
}

export interface OrderLine {
  menuId: string;
  done: boolean;
}

export interface Customer {
  id: number;
  char: string;
  order: OrderLine[];
  patienceMs: number;
  maxMs: number;
  status: "waiting" | "paying" | "eating";
  payMs: number;
  payElapsed: number;
  total: number;
  vip?: boolean; // el crítico
  fav?: boolean; // pidió algo de lo que más le gusta
  sits?: boolean; // le gustaría sentarse a comer
  table?: number; // mesa donde come
  eatMs?: number; // tiempo que le queda comiendo
  sat?: boolean; // ya comió en una mesa (más propina)
  combo?: boolean; // pidió bebida + postre
  special?: string; // id del pedido especial que viene a recoger
  quality?: number; // calidad del pedido especial (0 a 1)
}

/** Pedido especial ya decorado que un cliente viene a recoger durante el turno. */
export interface SpecialLite {
  id: string;
  char: string;
  menuId: string;
  price: number;
  quality: number;
}

export interface Shift {
  t: number;
  duration: number;
  nextArrival: number;
  nextId: number;
  customers: Customer[];
  stock: Record<string, number>;
  menu: MenuLite[];
  reputation: number; // 1 a 5
  chars: string[];
  served: number;
  lost: number;
  sales: number;
  tips: number;
  ratings: number[];
  sold: Record<string, number>;
  log: string | null; // último aviso, para lectores de pantalla
  opts: ShiftOptions;
  serverAcc: number;
  criticDone: boolean;
  criticResult: "ok" | "fail" | null;
  visits: Visit[];
  specialsPending: SpecialLite[];
  specialsDone: string[];
}

export interface ShiftOptions {
  maxCustomers: number;
  arrivalMult: number; // < 1 = llegan más seguido
  patienceBonusMs: number;
  tipBonus: number; // se suma a la tasa de propina
  priceMult: number; // decoración: sube lo que paga cada cliente
  cashier: number; // nivel efectivo de quien cobra solo (0 = nadie)
  server: number; // nivel efectivo de quien sirve solo (0 = nadie)
  favCategories: string[]; // lo que más piden por la fiesta del momento
  critic: boolean; // llega el crítico en este turno
  loyalty: Record<string, number>; // fidelidad de cada cliente frecuente
  tables: number; // mesas del local (0 a 2): quien se sienta libera su lugar en el mostrador
  specials: SpecialLite[]; // pedidos especiales para entregar hoy
}

export const DEFAULT_OPTIONS: ShiftOptions = { maxCustomers: 3, arrivalMult: 1, patienceBonusMs: 0, tipBonus: 0, priceMult: 1, cashier: 0, server: 0, favCategories: [], critic: false, loyalty: {}, tables: 0, specials: [] };

export const MAX_CUSTOMERS = 3;
export const SHIFT_MS = 150_000;
export const EAT_MS = 8_000;
export const PAY_MS = 7_000;
export const COIN_RATE = 0.25; // monedas del juego por cada Q vendido

export function startShift(menu: MenuLite[], stock: Record<string, number>, reputation: number, chars: string[], opts: ShiftOptions = DEFAULT_OPTIONS, duration = SHIFT_MS): Shift {
  // Los pedidos especiales ya están hechos: separan su porción desde el principio.
  const reserved = { ...stock };
  for (const sp of opts.specials) reserved[sp.menuId] = Math.max(0, (reserved[sp.menuId] ?? 0) - 1);
  return {
    t: 0, duration, nextArrival: 1500, nextId: 1, customers: [], stock: reserved, menu, reputation, chars,
    served: 0, lost: 0, sales: 0, tips: 0, ratings: [], sold: {}, log: null, opts, serverAcc: 0, criticDone: false, criticResult: null, visits: [],
    specialsPending: [...opts.specials], specialsDone: [],
  };
}

export type DayPhase = "manana" | "pico" | "tarde";

/** Cómo se reparte el turno: calma al abrir, hora pico a media jornada y tarde tranquila. */
export function phaseOf(p: number): DayPhase {
  return p >= 0.35 && p < 0.62 ? "pico" : p < 0.35 ? "manana" : "tarde";
}
const rushMult = (p: number) => (p < 0.12 ? 1.25 : phaseOf(p) === "pico" ? 0.6 : p >= 0.85 ? 1.2 : 1);

/** Clientes que ocupan lugar en el mostrador (quien come en una mesa lo libera). */
const atCounter = (s: Shift) => s.customers.filter((c) => c.status !== "eating").length;

/** Porciones que los clientes en la fila todavía esperan (para no prometer más de lo que hay). */
export function pending(s: Shift) {
  const out: Record<string, number> = {};
  for (const c of s.customers) for (const l of c.order) if (!l.done) out[l.menuId] = (out[l.menuId] ?? 0) + 1;
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function spawn(s: Shift, rnd: () => number): Shift {
  const reserved = pending(s);
  const available = s.menu.filter((m) => (s.stock[m.id] ?? 0) - (reserved[m.id] ?? 0) > 0);
  const base = Math.max(1800, 7000 - s.reputation * 700) * s.opts.arrivalMult * rushMult(s.t / s.duration);
  const next = s.t + base * (0.7 + rnd() * 0.6);
  if (available.length === 0) return { ...s, nextArrival: next, log: "Se acabó el stock: no llegan más clientes." };

  const char = pickChar(s.chars.length ? s.chars : ["bluey"], s.opts.loyalty, rnd);
  const arch = archetypeOf(char);
  const r = rnd();
  const wanted = r < 0.55 ? 1 : r < 0.9 ? 2 : 3;
  const size = Math.min(3, wanted + (arch.appetite && rnd() < 0.5 ? 1 : 0));
  const order: OrderLine[] = [];
  const left = new Map(available.map((m) => [m.id, (s.stock[m.id] ?? 0) - (reserved[m.id] ?? 0)]));
  const fav = (id: string) => !!s.menu.find((m) => m.id === id)?.category && s.opts.favCategories.includes(s.menu.find((m) => m.id === id)!.category!);
  for (let i = 0; i < size; i++) {
    // Los postres de la fiesta del momento se piden el triple.
    const mine = (id: string) => arch.favs.includes(s.menu.find((m) => m.id === id)?.category ?? "");
    let options = [...left.entries()].filter(([, n]) => n > 0).flatMap(([id]) => (fav(id) || mine(id) ? [id, id, id] : [id]));
    // A veces piden bebida con su postre (combo).
    if (i === 0 && size >= 2 && rnd() < 0.4) {
      const bev = options.filter((id) => s.menu.find((m) => m.id === id)?.category === "Bebidas");
      if (bev.length) options = bev;
    }
    if (!options.length) break;
    const id = options[Math.floor(rnd() * options.length)];
    left.set(id, left.get(id)! - 1);
    order.push({ menuId: id, done: false });
  }
  const maxMs = Math.round((26_000 + s.reputation * 2_000 + s.opts.patienceBonusMs) * arch.patience);
  const isBev = (l: OrderLine) => s.menu.find((m) => m.id === l.menuId)?.category === "Bebidas";
  const combo = order.length >= 2 && order.some(isBev) && order.some((l) => !isBev(l));
  const total = round2(order.reduce((sum, l) => sum + s.menu.find((m) => m.id === l.menuId)!.price * (fav(l.menuId) ? FAV_BOOST : 1), 0) * s.opts.priceMult * (combo ? 1.15 : 1));
  const wantsFav = order.some((l) => arch.favs.includes(s.menu.find((m) => m.id === l.menuId)?.category ?? ""));
  const c: Customer = { id: s.nextId, char, order, patienceMs: maxMs, maxMs, status: "waiting", payMs: PAY_MS, payElapsed: 0, total, fav: wantsFav, combo, sits: s.opts.tables > 0 && arch.id !== "apurados" && rnd() < 0.6 };
  return { ...s, nextId: s.nextId + 1, nextArrival: next, customers: [...s.customers, c], log: "Llegó un cliente." };
}

function visitOf(c: Customer, menu: MenuLite[], paid: boolean, ratio: number): Visit {
  return { char: c.char, paid, ratio, fav: !!c.fav, dish: menu.find((m) => m.id === c.order[0]?.menuId)?.name ?? "postre" };
}

function spawnSpecial(s: Shift, sp: SpecialLite): Shift {
  const total = round2(sp.price * (0.6 + 0.8 * sp.quality) * s.opts.priceMult);
  const c: Customer = {
    id: s.nextId, char: sp.char, order: [{ menuId: sp.menuId, done: true }], patienceMs: 20_000, maxMs: 20_000, status: "paying",
    payMs: PAY_MS * 2, payElapsed: 0, total, special: sp.id, quality: sp.quality,
  };
  return { ...s, nextId: s.nextId + 1, customers: [...s.customers, c], specialsPending: s.specialsPending.filter((x) => x.id !== sp.id), log: "Llegó un pedido especial a recoger." };
}

function spawnCritic(s: Shift, rnd: () => number): Shift {
  const reserved = pending(s);
  const options = s.menu.filter((m) => (s.stock[m.id] ?? 0) - (reserved[m.id] ?? 0) > 0);
  if (options.length === 0) return s;
  const picks = [options[Math.floor(rnd() * options.length)]];
  const rest = options.filter((m) => m.id !== picks[0].id);
  if (rest.length) picks.push(rest[Math.floor(rnd() * rest.length)]);
  const maxMs = 42_000 + s.opts.patienceBonusMs;
  const total = round2(picks.reduce((sum, m) => sum + m.price, 0) * 1.5 * s.opts.priceMult);
  const c: Customer = {
    id: s.nextId, char: "jean-luc", order: picks.map((m) => ({ menuId: m.id, done: false })), patienceMs: maxMs, maxMs,
    status: "waiting", payMs: PAY_MS, payElapsed: 0, total, vip: true,
  };
  return { ...s, nextId: s.nextId + 1, criticDone: true, customers: [...s.customers, c], log: "¡Llegó el crítico gastronómico! Atiéndelo perfecto." };
}

/** Avanza el turno `dt` milisegundos. */
export function tick(s: Shift, dt: number, rnd: () => number): Shift {
  let next: Shift = { ...s, t: s.t + dt, log: null };
  const customers: Customer[] = [];
  let lost = next.lost;
  const ratings = [...next.ratings];
  const visits = [...next.visits];
  for (const c of next.customers) {
    if (c.status === "waiting") {
      const patienceMs = c.patienceMs - dt;
      if (patienceMs <= 0) {
        lost++;
        if (c.vip) { ratings.push(1, 1, 1); next = { ...next, criticResult: "fail" }; next.log = "¡El crítico se fue sin su pedido!"; }
        else { ratings.push(1); next.log = "Un cliente se fue sin su pedido."; }
        visits.push(visitOf(c, next.menu, false, 0));
        continue;
      }
      customers.push({ ...c, patienceMs });
    } else if (c.status === "eating") {
      const eatMs = (c.eatMs ?? 0) - dt;
      if (eatMs <= 0) customers.push({ ...c, status: "paying", payMs: PAY_MS, payElapsed: 0, sat: true, eatMs: 0 });
      else customers.push({ ...c, eatMs });
    } else {
      const payMs = c.payMs - dt;
      if (payMs <= 0) {
        lost++;
        if (c.vip) { ratings.push(2, 2, 2); next = { ...next, criticResult: "fail" }; }
        else ratings.push(2);
        next.log = "Un cliente se fue sin pagar.";
        visits.push(visitOf(c, next.menu, false, 0));
        continue;
      }
      customers.push({ ...c, payMs, payElapsed: c.payElapsed + dt });
    }
  }
  next = { ...next, customers, lost, ratings, visits };
  if (next.t >= next.nextArrival && next.t < next.duration - 12_000 && atCounter(next) < next.opts.maxCustomers) {
    next = spawn(next, rnd);
  }

  // Pedidos especiales: llegan a recoger su torta ya decorada.
  if (next.specialsPending.length > 0 && atCounter(next) < next.opts.maxCustomers + 1) {
    const sp = next.specialsPending[0];
    const order = next.opts.specials.findIndex((x) => x.id === sp.id);
    if (next.t >= next.duration * (0.1 + 0.25 * order)) next = spawnSpecial(next, sp);
  }

  if (next.opts.critic && !next.criticDone && next.t >= 12_000 && next.t < next.duration - 25_000 && atCounter(next) < next.opts.maxCustomers + 1) {
    next = spawnCritic(next, rnd);
  }

  // Empleados: quien atiende sirve solo y quien está en caja cobra solo.
  if (next.opts.server > 0) {
    next = { ...next, serverAcc: next.serverAcc + dt };
    if (next.serverAcc >= Math.max(1200, 6500 - 1000 * next.opts.server)) {
      next = { ...next, serverAcc: 0 };
      const target = [...next.customers]
        .filter((c) => c.status === "waiting")
        .sort((a, b) => a.patienceMs / a.maxMs - b.patienceMs / b.maxMs)
        .flatMap((c) => c.order.filter((l) => !l.done && (next.stock[l.menuId] ?? 0) > 0).map((l) => l.menuId))[0];
      if (target) next = serve(next, target);
    }
  }
  if (next.opts.cashier > 0) {
    const delay = Math.max(500, 3200 - 550 * next.opts.cashier);
    for (const c of next.customers.filter((x) => x.status === "paying" && x.payElapsed >= delay)) next = collect(next, c.id);
  }
  return next;
}

/** Sirve una porción al primer cliente que la pidió. */
export function serve(s: Shift, menuId: string): Shift {
  if ((s.stock[menuId] ?? 0) <= 0) return { ...s, log: "No te queda de ese postre." };
  const idx = s.customers.findIndex((c) => c.status === "waiting" && c.order.some((l) => l.menuId === menuId && !l.done));
  if (idx < 0) return { ...s, log: "Nadie está pidiendo eso ahora." };
  const customers = s.customers.map((c, i) => {
    if (i !== idx) return c;
    let used = false;
    const order = c.order.map((l) => (!used && l.menuId === menuId && !l.done ? ((used = true), { ...l, done: true }) : l));
    const all = order.every((l) => l.done);
    if (all && c.sits) {
      const used = new Set(s.customers.filter((x) => x.status === "eating").map((x) => x.table));
      const free = [...Array(s.opts.tables).keys()].find((n) => !used.has(n));
      if (free !== undefined) return { ...c, order, status: "eating" as const, table: free, eatMs: EAT_MS, payMs: PAY_MS };
    }
    return { ...c, order, status: all ? ("paying" as const) : c.status, payMs: PAY_MS };
  });
  return {
    ...s,
    customers,
    stock: { ...s.stock, [menuId]: s.stock[menuId] - 1 },
    sold: { ...s.sold, [menuId]: (s.sold[menuId] ?? 0) + 1 },
    log: customers[idx].status === "paying" ? "Pedido listo: cobra." : customers[idx].status === "eating" ? "Se sentó a comer." : null,
  };
}

/** Cobra a un cliente cuyo pedido está completo. La propina depende de cuánto esperó. */
export function collect(s: Shift, customerId: number): Shift {
  const c = s.customers.find((x) => x.id === customerId);
  if (!c || c.status !== "paying") return s;
  const ratio = c.patienceMs / c.maxMs;
  const arch = archetypeOf(c.char);
  if (c.special) {
    const q = c.quality ?? 0.5;
    const tipSp = round2(c.total * (q >= 0.8 ? 0.4 : q >= 0.5 ? 0.2 : 0));
    const menuId = c.order[0].menuId;
    return {
      ...s,
      customers: s.customers.filter((x) => x.id !== customerId),
      served: s.served + 1,
      sales: round2(s.sales + c.total),
      tips: round2(s.tips + tipSp),
      ratings: [...s.ratings, q >= 0.8 ? 5 : q >= 0.5 ? 4 : 2],
      sold: { ...s.sold, [menuId]: (s.sold[menuId] ?? 0) + 1 },
      specialsDone: [...s.specialsDone, c.special],
      visits: [...s.visits, { char: c.char, paid: true, ratio: q >= 0.8 ? 1 : q >= 0.5 ? 0.5 : 0.2, fav: q >= 0.8, dish: "Pedido especial" }],
      log: q >= 0.8 ? "¡Le encantó su pedido especial!" : "Cobrado.",
    };
  }
  const tipRate = c.vip
    ? (ratio >= 0.6 ? 0.5 : 0)
    : ((ratio >= 0.6 ? 0.2 : ratio >= 0.3 ? 0.1 : 0) + (ratio >= 0.3 ? s.opts.tipBonus + (c.fav ? 0.05 : 0) + (c.sat ? 0.05 : 0) : 0)) * arch.tip;
  const tip = round2(c.total * tipRate);
  if (c.vip) {
    const good = ratio >= 0.6;
    return {
      ...s,
      customers: s.customers.filter((x) => x.id !== customerId),
      served: s.served + 1,
      sales: round2(s.sales + c.total),
      tips: round2(s.tips + tip),
      ratings: [...s.ratings, ...(good ? [5, 5, 5] : [3])],
      criticResult: good ? "ok" : "fail",
      visits: [...s.visits, visitOf(c, s.menu, true, ratio)],
      log: good ? "¡El crítico quedó encantado!" : "El crítico esperó demasiado.",
    };
  }
  return {
    ...s,
    customers: s.customers.filter((x) => x.id !== customerId),
    served: s.served + 1,
    sales: round2(s.sales + c.total),
    tips: round2(s.tips + tip),
    ratings: [...s.ratings, ratio >= 0.6 ? 5 : ratio >= 0.3 ? 4 : 3],
    visits: [...s.visits, visitOf(c, s.menu, true, ratio)],
    log: tip > 0 ? "¡Cobrado con propina!" : "Cobrado.",
  };
}

/** Cierra el local ya: los clientes que seguían esperando se van. */
export function closeNow(s: Shift): Shift {
  const vip = s.customers.some((c) => c.vip);
  return { ...s, t: s.duration, lost: s.lost + s.customers.length, ratings: [...s.ratings, ...s.customers.map(() => 1)], visits: [...s.visits, ...s.customers.map((c) => visitOf(c, s.menu, false, 0))], customers: [], criticResult: vip ? "fail" : s.criticResult };
}

export const isOver = (s: Shift) => s.t >= s.duration && s.customers.length === 0;

export interface ShiftSummary {
  served: number;
  lost: number;
  sales: number;
  tips: number;
  cost: number;
  profit: number;
  coins: number;
  rating: number;
  items: Record<string, number>;
  perfect: boolean;
  wages: number;
  critic: "ok" | "fail" | null;
  visits: Visit[];
  specialsDone: string[];
}

export const CRITIC_BONUS = 30;

export function summarize(s: Shift): ShiftSummary {
  const cost = round2(Object.entries(s.sold).reduce((sum, [id, n]) => sum + n * (s.menu.find((m) => m.id === id)?.cost ?? 0), 0));
  const rating = s.ratings.length ? Math.round((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) * 10) / 10 : 3;
  return {
    served: s.served, lost: s.lost, sales: s.sales, tips: s.tips, cost,
    profit: round2(s.sales + s.tips - cost),
    coins: Math.round((s.sales + s.tips) * COIN_RATE) + (s.criticResult === "ok" ? CRITIC_BONUS : 0),
    rating, items: s.sold, perfect: s.served >= 5 && s.lost === 0, wages: 0, critic: s.criticResult, visits: s.visits, specialsDone: s.specialsDone,
  };
}

// ---------- Stock, turnos y reputación ----------

/** Cocinar de verdad llena la vitrina: cada porción de una receta cocinada es un postre para vender. */
export function stockMap(
  menu: { id: string; kind: "recipe" | "custom"; recipe_id: string | null }[],
  cookLogs: { recipe_id: string; servings: number }[],
  batches: { menu_id: string; qty: number }[],
  days: { items: Record<string, number> }[],
) {
  const out: Record<string, number> = {};
  for (const m of menu) {
    const made = m.kind === "recipe"
      ? cookLogs.filter((l) => l.recipe_id === m.recipe_id).reduce((s, l) => s + l.servings, 0)
      : batches.filter((b) => b.menu_id === m.id).reduce((s, b) => s + b.qty, 0);
    const sold = days.reduce((s, d) => s + (d.items[m.id] ?? 0), 0);
    out[m.id] = Math.max(0, made - sold);
  }
  return out;
}

export const BASE_SHIFTS = 3;
export const MAX_BONUS_SHIFTS = 3;

/** 3 turnos al día, y uno más por cada receta que cocines ese día (hasta 3 extra). */
export function shiftsLeft(days: { date: number }[], cookLogs: { cooked_at: number }[], dayStartMs: number) {
  const end = new Date(dayStartMs);
  const to = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime();
  const cooks = cookLogs.filter((l) => l.cooked_at >= dayStartMs && l.cooked_at < to).length;
  const played = days.filter((d) => d.date >= dayStartMs && d.date < to).length;
  return Math.max(0, BASE_SHIFTS + Math.min(MAX_BONUS_SHIFTS, cooks) - played);
}

export function reputationOf(days: { rating: number; at: number }[]) {
  const last = [...days].sort((a, b) => b.at - a.at).slice(0, 10);
  if (!last.length) return 3;
  return Math.round((last.reduce((s, d) => s + d.rating, 0) / last.length) * 10) / 10;
}

export const BATCH_QTY = 6;
export const batchCost = (price: number) => Math.max(1, Math.round(price * BATCH_QTY * 0.2));

// ---------- Calidad ----------

/**
 * Calidad de cada postre (0 a 1): en las recetas reales sale de las estrellas con que calificaste
 * lo último que cocinaste; en los postres inventados, de qué tan bien salió el horneado.
 */
export function qualityMap(
  menu: { id: string; kind: "recipe" | "custom"; recipe_id: string | null }[],
  cookLogs: { recipe_id: string; rating: number | null; cooked_at: number }[],
  batches: { menu_id: string; qty: number; quality?: number }[],
) {
  const out: Record<string, number> = {};
  for (const m of menu) {
    if (m.kind === "recipe") {
      const rated = cookLogs.filter((l) => l.recipe_id === m.recipe_id && l.rating).sort((a, b) => b.cooked_at - a.cooked_at).slice(0, 3);
      out[m.id] = rated.length ? rated.reduce((s, l) => s + l.rating!, 0) / rated.length / 5 : 0.8;
    } else {
      const mine = batches.filter((b) => b.menu_id === m.id);
      const qty = mine.reduce((s, b) => s + b.qty, 0);
      out[m.id] = qty ? mine.reduce((s, b) => s + b.qty * (b.quality ?? 0.7), 0) / qty : 0.7;
    }
  }
  return out;
}

/** El precio sube o baja hasta 15 % según la calidad. */
export const priceByQuality = (price: number, q: number) => round2(price * (0.85 + 0.3 * q));
