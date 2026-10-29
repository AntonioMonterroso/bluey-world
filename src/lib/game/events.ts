// Eventos de temporada de Dulce Co. Todo se calcula con la fecha: sin servidor, igual en todos tus dispositivos.
// Lógica pura (sin React ni base de datos) para poder probarla sola.

export interface Win {
  from: number;
  to: number;
}

export interface EventMods {
  arrivalMult?: number; // < 1 = llegan más seguido
  tipBonus?: number;
  priceMult?: number;
  patienceBonusMs?: number;
  maxCustomersBonus?: number;
  favCategories?: string[]; // postres que más piden estos días
  critic?: boolean; // llega el crítico
}

export type GoalKind = "customers" | "sold" | "critic";

export interface EventDef {
  id: string;
  name: string;
  blurb: string;
  icon: string; // nombre del dibujito (se resuelve en la pantalla)
  calendar?: { m1: number; d1: number; m2: number; d2: number }; // meses 1-12
  mods: EventMods;
  goal: { kind: GoalKind; n: number };
  reward: { coins: number; xp: number; items: string[] };
}

export const FAV_BOOST = 1.15; // lo que más piden estos días paga un poco más

export const CALENDAR_EVENTS: EventDef[] = [
  { id: "valentin", name: "Día del Cariño", blurb: "Todos quieren algo dulce para regalar.", icon: "heart", calendar: { m1: 2, d1: 7, m2: 2, d2: 14 },
    mods: { favCategories: ["Pasteles", "Cupcakes y muffins", "Postres fríos"], tipBonus: 0.05 }, goal: { kind: "customers", n: 20 }, reward: { coins: 80, xp: 50, items: ["wear:diadema", "sticker:corazon"] } },
  { id: "madre", name: "Día de la Madre", blurb: "Las mamás merecen el pastel más bonito.", icon: "flower", calendar: { m1: 5, d1: 5, m2: 5, d2: 10 },
    mods: { favCategories: ["Pasteles", "Tartas y pays"], priceMult: 1.1 }, goal: { kind: "customers", n: 20 }, reward: { coins: 80, xp: 50, items: ["wear:flor"] } },
  { id: "padre", name: "Día del Padre", blurb: "Algo rico para papá.", icon: "trophy", calendar: { m1: 6, d1: 12, m2: 6, d2: 17 },
    mods: { favCategories: ["Salado", "Panes", "Bebidas"] }, goal: { kind: "customers", n: 20 }, reward: { coins: 80, xp: 50, items: ["sticker:trofeo"] } },
  { id: "independencia", name: "Independencia", blurb: "Fiesta patria: el local se llena.", icon: "flag", calendar: { m1: 9, d1: 10, m2: 9, d2: 15 },
    mods: { favCategories: ["Panes", "Salado", "Postres fríos"], maxCustomersBonus: 1 }, goal: { kind: "customers", n: 25 }, reward: { coins: 90, xp: 60, items: ["wear:banda"] } },
  { id: "halloween", name: "Halloween", blurb: "Dulces y sustos: todos piden golosinas.", icon: "ghost", calendar: { m1: 10, d1: 24, m2: 10, d2: 31 },
    mods: { favCategories: ["Galletas", "Cupcakes y muffins", "Rellenos y cremas"], arrivalMult: 0.9 }, goal: { kind: "sold", n: 15 }, reward: { coins: 100, xp: 60, items: ["wear:bruja", "sticker:fantasma"] } },
  { id: "fiambre", name: "Fiambre y barriletes", blurb: "Día de Todos los Santos: se come en familia.", icon: "kite", calendar: { m1: 10, d1: 30, m2: 11, d2: 2 },
    mods: { favCategories: ["Salado", "Panes"], patienceBonusMs: 5000 }, goal: { kind: "customers", n: 20 }, reward: { coins: 80, xp: 50, items: ["sticker:barrilete"] } },
  { id: "navidad", name: "Navidad", blurb: "La temporada más dulce del año.", icon: "tree", calendar: { m1: 12, d1: 15, m2: 12, d2: 25 },
    mods: { favCategories: ["Panes", "Pasteles", "Galletas"], arrivalMult: 0.85, tipBonus: 0.05 }, goal: { kind: "customers", n: 30 }, reward: { coins: 120, xp: 80, items: ["wear:santa", "sticker:pino"] } },
  { id: "anio", name: "Año Nuevo", blurb: "Brindis y postres para empezar bien.", icon: "party", calendar: { m1: 12, d1: 28, m2: 1, d2: 2 },
    mods: { favCategories: ["Postres fríos", "Bebidas", "Pasteles"], priceMult: 1.1 }, goal: { kind: "sold", n: 15 }, reward: { coins: 80, xp: 50, items: ["sticker:fiesta"] } },
];

/** Uno por semana, elegido por la fecha. */
export const WEEKLY_EVENTS: EventDef[] = [
  { id: "merienda", name: "Hora de la merienda", blurb: "Esta semana llega más gente por su cafecito y su postre.", icon: "coffee",
    mods: { arrivalMult: 0.75, tipBonus: 0.05 }, goal: { kind: "customers", n: 15 }, reward: { coins: 40, xp: 25, items: [] } },
  { id: "concurso", name: "Concurso de repostería", blurb: "Los postres se pagan mejor: demuestra de qué eres capaz.", icon: "cake",
    mods: { priceMult: 1.15 }, goal: { kind: "sold", n: 12 }, reward: { coins: 60, xp: 40, items: [] } },
  { id: "critico", name: "Visita del crítico", blurb: "Un crítico gastronómico pasa esta semana. Atiéndelo perfecto.", icon: "glasses",
    mods: { critic: true }, goal: { kind: "critic", n: 1 }, reward: { coins: 50, xp: 40, items: [] } },
];

// ---------- Fechas ----------

const startOfDay = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();
const GRACE_DAYS = 3; // se puede cobrar el premio unos días después de que termine

export interface EventInstance {
  def: EventDef;
  key: string; // identifica esta edición (ej. "navidad:2026")
  win: Win;
  active: boolean;
  weekly: boolean;
}

function calendarWindow(def: EventDef, year: number): Win {
  const c = def.calendar!;
  const crosses = c.m2 < c.m1;
  return { from: startOfDay(year, c.m1, c.d1), to: startOfDay(crosses ? year + 1 : year, c.m2, c.d2 + 1) };
}

/** Eventos del calendario que están en curso o terminaron hace poco. */
export function calendarEvents(now: number): EventInstance[] {
  const y = new Date(now).getFullYear();
  const out: EventInstance[] = [];
  for (const def of CALENDAR_EVENTS) {
    for (const year of [y - 1, y]) {
      const win = calendarWindow(def, year);
      if (now >= win.from && now < win.to + GRACE_DAYS * 86_400_000) {
        out.push({ def, key: `${def.id}:${year}`, win, active: now < win.to, weekly: false });
      }
    }
  }
  return out;
}

const mondayOf = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)).getTime();
};
const addDays = (ms: number, n: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
};
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function weeklyAt(monday: number, now: number): EventInstance {
  // El mismo número para todos: se deriva de la fecha del lunes.
  let h = 2166136261;
  for (const ch of `weekly:${dayKey(monday)}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const def = WEEKLY_EVENTS[(h >>> 0) % WEEKLY_EVENTS.length];
  const win = { from: monday, to: addDays(monday, 7) };
  return { def, key: `semana:${dayKey(monday)}`, win, active: now >= win.from && now < win.to, weekly: true };
}

/** Evento sorpresa de esta semana y el de la anterior (para poder cobrar su premio). */
export function weeklyEvents(now: number): EventInstance[] {
  const m = mondayOf(now);
  return [weeklyAt(m, now), weeklyAt(addDays(m, -7), now)];
}

export const activeEvents = (now: number) => [...calendarEvents(now), ...weeklyEvents(now)].filter((e) => e.active);

/** Próximas fiestas del calendario. */
export function upcoming(now: number, n = 3): { def: EventDef; start: number }[] {
  const y = new Date(now).getFullYear();
  const all: { def: EventDef; start: number }[] = [];
  for (const def of CALENDAR_EVENTS) for (const year of [y, y + 1]) {
    const w = calendarWindow(def, year);
    if (w.from > now) all.push({ def, start: w.from });
  }
  return all.sort((a, b) => a.start - b.start).slice(0, n);
}

// ---------- Efectos y metas ----------

export function combineMods(events: EventInstance[]): Required<Omit<EventMods, "favCategories" | "critic">> & { favCategories: string[]; critic: boolean } {
  const out = { arrivalMult: 1, tipBonus: 0, priceMult: 1, patienceBonusMs: 0, maxCustomersBonus: 0, favCategories: [] as string[], critic: false };
  for (const e of events) {
    const m = e.def.mods;
    out.arrivalMult *= m.arrivalMult ?? 1;
    out.tipBonus += m.tipBonus ?? 0;
    out.priceMult *= m.priceMult ?? 1;
    out.patienceBonusMs += m.patienceBonusMs ?? 0;
    out.maxCustomersBonus += m.maxCustomersBonus ?? 0;
    out.favCategories.push(...(m.favCategories ?? []));
    out.critic = out.critic || !!m.critic;
  }
  return out;
}

export interface DayLite {
  at: number;
  served: number;
  items: Record<string, number>;
  critic?: "ok" | "fail";
}

export function progressOf(def: EventDef, days: DayLite[], win: Win) {
  const inside = days.filter((d) => d.at >= win.from && d.at < win.to);
  const value =
    def.goal.kind === "customers" ? inside.reduce((n, d) => n + d.served, 0)
    : def.goal.kind === "sold" ? inside.reduce((n, d) => n + Object.values(d.items).reduce((a, b) => a + b, 0), 0)
    : inside.some((d) => d.critic === "ok") ? 1 : 0;
  return { value, goal: def.goal.n, done: value >= def.goal.n };
}

/** ¿Ya vino el crítico esta semana? */
export const criticVisited = (days: DayLite[], win: Win) => days.some((d) => d.at >= win.from && d.at < win.to && !!d.critic);

export const goalText = (def: EventDef) =>
  def.goal.kind === "customers" ? `Atiende ${def.goal.n} clientes`
  : def.goal.kind === "sold" ? `Vende ${def.goal.n} postres`
  : "Atiende bien al crítico";

/** Premios con objetos exclusivos: lo que se desbloquea al cumplir la meta de cada evento. */
export function itemsUnlockedBy(eventKey: string): string[] {
  const id = eventKey.split(":")[0];
  return CALENDAR_EVENTS.find((e) => e.id === id)?.reward.items ?? [];
}
