// Metas de la semana y del mes, rachas e insignias nuevas. Lógica pura: todo sale de tus datos reales,
// y los premios usan ids fijos en el registro, así que nada se cobra dos veces.

export interface ProgressData {
  cooks: { recipe_id: string; cooked_at: number; updated_at: number; photo: string | null; notes: string; change?: string }[];
  moves: { date: number; kind?: string; recurring_id?: string | null; amount: number }[];
  shifts: { at: number; served: number; perfect: boolean }[];
  events: { id: string; at: number }[]; // registro del juego (minijuegos, historia, etc.)
  orders: { status: string; paid_at: number | null }[];
  goals: { saved: number; target: number; done_at: number | null; updated_at: number }[];
  accounts: number;
  recurring: number;
  pantry: number;
  outfitCount: number;
  looks: number;
  staffDressed: number;
  storyDone: number[]; // capítulos terminados (principales, del barrio y de temporada)
  records: number; // minijuegos con récord
}

// ---------- Fechas ----------

const pad = (n: number) => String(n).padStart(2, "0");
export const dayOf = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const monthOf = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export function weekWindow(now: number) {
  const d = new Date(now);
  const back = (d.getDay() + 6) % 7; // lunes = 0
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back).getTime();
  const to = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back + 7).getTime();
  return { from, to, key: `sem-${dayOf(from)}` };
}
export function monthWindow(now: number) {
  const d = new Date(now);
  return { from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(), key: `mes-${monthOf(now)}` };
}

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => { h = (h + 0x6d2b79f5) >>> 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pick<T>(arr: T[], n: number, rnd: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

// ---------- Medidas ----------

type Measure = "cook" | "cookDistinct" | "cookPhoto" | "shifts" | "customers" | "perfect" | "minis" | "moneyDays" | "income" | "fixedPaid" | "story" | "orders" | "diary";
const inW = (t: number | null | undefined, from: number, to: number) => t != null && t >= from && t < to;

export function measure(m: Measure, d: ProgressData, from: number, to: number): number {
  switch (m) {
    case "cook": return d.cooks.filter((c) => inW(c.cooked_at, from, to)).length;
    case "cookDistinct": return new Set(d.cooks.filter((c) => inW(c.cooked_at, from, to)).map((c) => c.recipe_id)).size;
    case "cookPhoto": return d.cooks.filter((c) => c.photo && inW(c.cooked_at, from, to)).length;
    case "shifts": return d.shifts.filter((s) => s.served > 0 && inW(s.at, from, to)).length;
    case "customers": return d.shifts.filter((s) => inW(s.at, from, to)).reduce((n, s) => n + s.served, 0);
    case "perfect": return d.shifts.filter((s) => s.perfect && inW(s.at, from, to)).length;
    case "minis": return d.events.filter((e) => e.id.startsWith("mini:") && inW(e.at, from, to)).length;
    case "moneyDays": return new Set(d.moves.filter((x) => inW(x.date, from, to)).map((x) => dayOf(x.date))).size;
    case "income": return d.moves.filter((x) => x.kind === "ingreso" && inW(x.date, from, to)).length;
    case "fixedPaid": return d.moves.filter((x) => x.recurring_id && inW(x.date, from, to)).length;
    case "story": return d.events.filter((e) => e.id.startsWith("story:") && inW(e.at, from, to)).length;
    case "orders": return d.orders.filter((o) => o.status === "pagado" && inW(o.paid_at, from, to)).length;
    case "diary": return d.cooks.filter((c) => (c.notes.trim() || (c.change ?? "").trim()) && inW(c.updated_at, from, to)).length;
  }
}

export interface GoalDef { id: string; m: Measure; target: number; label: string; area: "cocina" | "dinero" | "juego" }

const WEEK_POOL: GoalDef[] = [
  { id: "cocina3", m: "cook", target: 3, label: "Cocina 3 veces", area: "cocina" },
  { id: "distintas2", m: "cookDistinct", target: 2, label: "Cocina 2 recetas distintas", area: "cocina" },
  { id: "foto1", m: "cookPhoto", target: 1, label: "Sube la foto de un postre", area: "cocina" },
  { id: "diario2", m: "diary", target: 2, label: "Escribe 2 notas en el diario", area: "cocina" },
  { id: "dinero4", m: "moneyDays", target: 4, label: "Anota tu dinero 4 días", area: "dinero" },
  { id: "fijo1", m: "fixedPaid", target: 1, label: "Marca un pago fijo como hecho", area: "dinero" },
  { id: "turnos3", m: "shifts", target: 3, label: "Atiende 3 turnos en Dulce Co.", area: "juego" },
  { id: "clientes20", m: "customers", target: 20, label: "Atiende a 20 clientes", area: "juego" },
  { id: "minis5", m: "minis", target: 5, label: "Juega 5 minijuegos", area: "juego" },
  { id: "historia1", m: "story", target: 1, label: "Termina un capítulo de la historia", area: "juego" },
];
const MONTH_POOL: GoalDef[] = [
  { id: "cocina12", m: "cook", target: 12, label: "Cocina 12 veces", area: "cocina" },
  { id: "distintas5", m: "cookDistinct", target: 5, label: "Cocina 5 recetas distintas", area: "cocina" },
  { id: "diario5", m: "diary", target: 5, label: "Escribe 5 notas en el diario", area: "cocina" },
  { id: "pedidos2", m: "orders", target: 2, label: "Cobra 2 pedidos de clientes", area: "cocina" },
  { id: "dinero15", m: "moneyDays", target: 15, label: "Anota tu dinero 15 días", area: "dinero" },
  { id: "ingresos2", m: "income", target: 2, label: "Anota 2 ingresos", area: "dinero" },
  { id: "turnos12", m: "shifts", target: 12, label: "Atiende 12 turnos", area: "juego" },
  { id: "perfectos3", m: "perfect", target: 3, label: "Logra 3 turnos perfectos", area: "juego" },
  { id: "minis20", m: "minis", target: 20, label: "Juega 20 minijuegos", area: "juego" },
  { id: "historia3", m: "story", target: 3, label: "Termina 3 capítulos de historia", area: "juego" },
];

/** Las 3 metas del periodo: una de cocina, una de dinero y una de juego (siempre las mismas para esa semana o mes). */
function choose(pool: GoalDef[], key: string): GoalDef[] {
  const rnd = rng(key);
  return (["cocina", "dinero", "juego"] as const).map((a) => pick(pool.filter((g) => g.area === a), 1, rnd)[0]);
}
export const weekGoals = (now: number) => choose(WEEK_POOL, weekWindow(now).key);
export const monthGoals = (now: number) => choose(MONTH_POOL, monthWindow(now).key);

export const WEEK_REWARD = { xp: 30, coins: 25 };
export const MONTH_REWARD = { xp: 80, coins: 60 };
export const ALL_WEEK_BONUS = { xp: 30, coins: 30 };

export interface GoalState extends GoalDef { have: number; done: boolean }
export function goalStates(goals: GoalDef[], d: ProgressData, from: number, to: number): GoalState[] {
  return goals.map((g) => { const have = measure(g.m, d, from, to); return { ...g, have: Math.min(have, g.target), done: have >= g.target }; });
}

// ---------- Rachas ----------

export type StreakKind = "cocina" | "dinero" | "juego";
export const STREAK_MILESTONES: { days: number; xp: number; coins: number }[] = [
  { days: 3, xp: 15, coins: 10 }, { days: 7, xp: 40, coins: 30 }, { days: 14, xp: 80, coins: 60 }, { days: 30, xp: 200, coins: 150 },
];

export function streakDays(kind: StreakKind, d: ProgressData): Set<string> {
  if (kind === "cocina") return new Set(d.cooks.map((c) => dayOf(c.cooked_at)));
  if (kind === "dinero") return new Set(d.moves.map((x) => dayOf(x.date)));
  return new Set([...d.shifts.map((s) => dayOf(s.at)), ...d.events.filter((e) => /^(mini:|story:)/.test(e.id)).map((e) => dayOf(e.at))]);
}

const prevDay = (key: string) => { const [y, m, dd] = key.split("-").map(Number); return dayOf(new Date(y, m - 1, dd - 1, 12).getTime()); };

/** Racha actual: días seguidos hasta hoy (o hasta ayer, si hoy todavía no lo hiciste), con su día de inicio. */
export function currentRun(days: Set<string>, now: number): { length: number; start: string | null; today: boolean } {
  const today = dayOf(now);
  let cur = days.has(today) ? today : prevDay(today);
  if (!days.has(cur)) return { length: 0, start: null, today: false };
  let length = 0;
  let start = cur;
  while (days.has(cur)) { length++; start = cur; cur = prevDay(cur); }
  return { length, start, today: days.has(today) };
}

export function bestRun(days: Set<string>): number {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of sorted) { run = prev && prevDay(k) === prev ? run + 1 : 1; best = Math.max(best, run); prev = k; }
  return best;
}

// ---------- Insignias nuevas ----------

export interface MoreBadge { id: string; name: string; desc: string; coins: number; group: string; check: (d: ProgressData, best: Record<StreakKind, number>) => boolean }

export const MORE_BADGES: MoreBadge[] = [
  { id: "dinero-primera-cuenta", group: "Dinero", name: "Todo en su lugar", desc: "Crea tu primera cuenta en Dinero.", coins: 10, check: (d) => d.accounts >= 1 },
  { id: "dinero-ingreso", group: "Dinero", name: "Entra dinero", desc: "Anota tu primer ingreso.", coins: 10, check: (d) => d.moves.some((x) => x.kind === "ingreso") },
  { id: "dinero-fijos3", group: "Dinero", name: "Sin sorpresas", desc: "Anota 3 pagos fijos.", coins: 20, check: (d) => d.recurring >= 3 },
  { id: "dinero-meta", group: "Dinero", name: "Meta cumplida", desc: "Completa una meta de ahorro.", coins: 50, check: (d) => d.goals.some((g) => g.done_at) },
  { id: "dinero-racha7", group: "Dinero", name: "Cuentas al día", desc: "Anota tu dinero 7 días seguidos.", coins: 40, check: (_d, b) => b.dinero >= 7 },
  { id: "cocina-racha14", group: "Cocina", name: "Dos semanas de horno", desc: "Cocina 14 días seguidos.", coins: 100, check: (_d, b) => b.cocina >= 14 },
  { id: "cocina-pedido", group: "Cocina", name: "Primer pedido cobrado", desc: "Cobra un pedido de un cliente real.", coins: 30, check: (d) => d.orders.some((o) => o.status === "pagado") },
  { id: "cocina-despensa", group: "Cocina", name: "Despensa ordenada", desc: "Ten 10 cosas anotadas en la despensa.", coins: 20, check: (d) => d.pantry >= 10 },
  { id: "historia-acto1", group: "Historia", name: "La puerta abierta", desc: "Termina el Acto I de la historia.", coins: 40, check: (d) => [1, 2, 3, 4, 5].every((n) => d.storyDone.includes(n)) },
  { id: "historia-final", group: "Historia", name: "La estrella de Dulce Villa", desc: "Termina la historia principal.", coins: 150, check: (d) => d.storyDone.includes(12) },
  { id: "historia-barrio", group: "Historia", name: "Vecina querida", desc: "Lee 5 historias del barrio.", coins: 50, check: (d) => d.storyDone.filter((n) => n >= 101 && n < 200).length >= 5 },
  { id: "historia-fiesta", group: "Historia", name: "Fiestera", desc: "Termina una historia de temporada.", coins: 30, check: (d) => d.storyDone.some((n) => n >= 201) },
  { id: "juegos-50", group: "Juegos", name: "Jugadora de sala", desc: "Juega 50 minijuegos.", coins: 50, check: (d) => d.events.filter((e) => e.id.startsWith("mini:")).length >= 50 },
  { id: "juegos-records", group: "Juegos", name: "Rompe récords", desc: "Ten récord en 5 minijuegos distintos.", coins: 40, check: (d) => d.records >= 5 },
  { id: "juegos-reto", group: "Juegos", name: "Retadora", desc: "Cumple 5 retos del día.", coins: 60, check: (d) => d.events.filter((e) => e.id.startsWith("mini-reto:")).length >= 5 },
  { id: "juegos-turnos", group: "Juegos", name: "Retos de turno", desc: "Cumple 10 retos de turno en Dulce Co.", coins: 60, check: (d) => d.events.filter((e) => e.id.startsWith("turno-reto:")).length >= 10 },
  { id: "estilo-look", group: "Estilo", name: "Con estilo", desc: "Ponle 4 prendas a tu personaje.", coins: 20, check: (d) => d.outfitCount >= 4 },
  { id: "estilo-looks", group: "Estilo", name: "Clóset lleno", desc: "Guarda 5 looks.", coins: 30, check: (d) => d.looks >= 5 },
  { id: "estilo-equipo", group: "Estilo", name: "Uniformados", desc: "Viste a 2 personas de tu equipo.", coins: 30, check: (d) => d.staffDressed >= 2 },
  { id: "metas-semana", group: "Metas", name: "Semana redonda", desc: "Cumple las 3 metas de una semana.", coins: 40, check: (d) => d.events.some((e) => /^meta:sem-.*:todas$/.test(e.id)) },
  { id: "metas-mes", group: "Metas", name: "Mes de campeonato", desc: "Cumple una meta del mes.", coins: 40, check: (d) => d.events.some((e) => e.id.startsWith("meta:mes-")) },
];

// ---------- Premios ----------

export interface ProgressAward { id: string; kind: string; label: string; xp: number; coins: number; at: number }

export function progressAwards(d: ProgressData, have: Set<string>, now: number): ProgressAward[] {
  const out: ProgressAward[] = [];
  const add = (a: ProgressAward) => { if (!have.has(a.id)) { have.add(a.id); out.push(a); } };

  // Metas de esta semana y la anterior (por si se cumplió el domingo y se abre el lunes)
  for (const t of [now, now - 7 * 86_400_000]) {
    const w = weekWindow(t);
    const st = goalStates(weekGoals(t), d, w.from, w.to);
    for (const g of st) if (g.done) add({ id: `meta:${w.key}:${g.id}`, kind: "meta", label: `Meta de la semana: ${g.label}`, ...WEEK_REWARD, at: now });
    if (st.every((g) => g.done)) add({ id: `meta:${w.key}:todas`, kind: "meta", label: "¡Las 3 metas de la semana!", ...ALL_WEEK_BONUS, at: now });
  }
  for (const t of [now, monthWindow(now).from - 1]) {
    const m = monthWindow(t);
    for (const g of goalStates(monthGoals(t), d, m.from, m.to)) if (g.done) add({ id: `meta:${m.key}:${g.id}`, kind: "meta", label: `Meta del mes: ${g.label}`, ...MONTH_REWARD, at: now });
  }

  // Rachas: cada hito se cobra una vez por racha (la racha se identifica por su día de inicio)
  const best = {} as Record<StreakKind, number>;
  for (const kind of ["cocina", "dinero", "juego"] as StreakKind[]) {
    const days = streakDays(kind, d);
    best[kind] = bestRun(days);
    const run = currentRun(days, now);
    for (const ms of STREAK_MILESTONES) {
      if (run.length >= ms.days && run.start) add({ id: `racha:${kind}:${ms.days}:${run.start}`, kind: "racha", label: `Racha de ${kind}: ${ms.days} días`, xp: ms.xp, coins: ms.coins, at: now });
    }
  }

  // Insignias nuevas (las metas cumplidas en esta misma pasada también cuentan)
  const withNew = { ...d, events: [...d.events, ...out.map((a) => ({ id: a.id, at: a.at }))] };
  for (const b of MORE_BADGES) if (b.check(withNew, best)) add({ id: `badge:${b.id}`, kind: "badge", label: `Insignia: ${b.name}`, xp: 25, coins: b.coins, at: now });
  return out;
}
