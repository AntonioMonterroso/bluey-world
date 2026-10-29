// Empleados y mejoras de Dulce Co. Lógica pura para poder probarla sola.
import { rng, shuffle } from "./engine";
import { batchCost, BATCH_QTY, DEFAULT_OPTIONS, type ShiftOptions } from "./sales";

export type Role = "caja" | "atencion" | "reposteria" | "decoracion";

export const ROLES: { id: Role; label: string; desc: string }[] = [
  { id: "caja", label: "Caja", desc: "Cobra sola a los clientes; más rápido con más nivel." },
  { id: "atencion", label: "Atención", desc: "Sirve los postres sola; más rápido con más nivel." },
  { id: "reposteria", label: "Repostería", desc: "Tus tandas salen más baratas y con más porciones." },
  { id: "decoracion", label: "Decoración", desc: "Presenta mejor los postres: cada cliente paga hasta 5 % más por nivel." },
];
export const roleLabel = (r: string) => ROLES.find((x) => x.id === r)?.label ?? r;

export const MAX_LEVEL = 5;
export const MAX_STAFF = 6;
export const PROMOTE_EVERY = 8;
export const GIFT_COST = 10;
export const GIFT_MOOD = 25;
export const MOOD_PER_HOUR = 6;
export const TIRED_BELOW = 20;

export interface StaffLite {
  id: string;
  char: string;
  role: string;
  specialty: string;
  level: number;
  worked: number;
  mood: number;
  mood_at: number;
  on_duty: boolean;
}

export const wageOf = (level: number) => 6 + 3 * level;
export const trainCost = (level: number) => 40 * level;

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** El ánimo se recupera solo con las horas. */
export const moodNow = (s: Pick<StaffLite, "mood" | "mood_at">, now: number) =>
  clamp(s.mood + ((now - s.mood_at) / 3_600_000) * MOOD_PER_HOUR, 0, 100);

export const canWork = (s: StaffLite, now: number) => moodNow(s, now) >= TIRED_BELOW;

export const moodFactor = (mood: number) => (mood >= 60 ? 1 : mood >= 30 ? 0.6 : mood >= TIRED_BELOW ? 0.3 : 0);

/** Nivel con el que rinde hoy: baja si está cansada y sube 1 en su especialidad. */
export function effectiveLevel(s: StaffLite, now: number) {
  const f = moodFactor(moodNow(s, now));
  if (f === 0) return 0;
  return Math.min(6, Math.max(1, Math.round(s.level * f)) + (s.role === s.specialty ? 1 : 0));
}

export const onDuty = (staff: StaffLite[], now: number) => staff.filter((s) => s.on_duty && canWork(s, now));

// ---------- Candidatos del día ----------

export interface Candidate {
  id: string;
  char: string;
  specialty: Role;
  cost: number;
}

/** 3 candidatos por día, iguales en todos tus dispositivos. */
export function candidatesFor(dayKey: string, excludedChars: string[], allChars: string[]): Candidate[] {
  const rnd = rng(`staff:${dayKey}`);
  const pool = shuffle(allChars.filter((c) => !excludedChars.includes(c)), rnd).slice(0, 3);
  return pool.map((char, i) => ({
    id: `${dayKey}:${i}`,
    char,
    specialty: ROLES[Math.floor(rnd() * ROLES.length)].id,
    cost: 60 + 20 * Math.floor(rnd() * 4),
  }));
}

// ---------- Mejoras del local ----------

export interface UpgradeDef {
  id: string;
  name: string;
  desc: (level: number) => string;
  costs: number[]; // costo de pasar al nivel 1, 2, 3...
}

export const UPGRADES: UpgradeDef[] = [
  { id: "vitrina", name: "Vitrina grande", desc: (l) => `Atiendes a ${3 + l} clientes a la vez`, costs: [80, 160] },
  { id: "letrero", name: "Letrero luminoso", desc: (l) => `Los clientes llegan ${l * 8} % más seguido`, costs: [60, 120, 200] },
  { id: "sala", name: "Sala de espera", desc: (l) => `Los clientes esperan ${l * 4} s más`, costs: [60, 120, 200] },
  { id: "caja", name: "Caja registradora", desc: (l) => `Propinas ${l * 3} % más altas`, costs: [70, 140, 230] },
  { id: "horno", name: "Horno profesional", desc: (l) => `Tandas con ${l * 2} porciones más y ${l * 10} % más baratas`, costs: [90, 170, 260] },
  { id: "puestos", name: "Cocina más amplia", desc: (l) => `${2 + l} empleados pueden trabajar a la vez`, costs: [100, 180, 280] },
];

export const upgradeById = (id: string) => UPGRADES.find((u) => u.id === id)!;
export const upgradeMax = (id: string) => upgradeById(id).costs.length;
export const nextUpgradeCost = (id: string, level: number): number | null => upgradeById(id).costs[level] ?? null;
export const dutyLimit = (ups: Record<string, number>) => 2 + (ups.puestos ?? 0);

// ---------- Efectos ----------

/** Cómo cambia el turno según quién trabaja y qué mejoras tienes. */
export function shiftOptions(working: StaffLite[], ups: Record<string, number>, now: number): ShiftOptions {
  const lvl = (role: Role) => Math.max(0, ...working.filter((s) => s.role === role).map((s) => effectiveLevel(s, now)));
  const decor = working.filter((s) => s.role === "decoracion").reduce((n, s) => n + effectiveLevel(s, now), 0);
  return {
    ...DEFAULT_OPTIONS,
    maxCustomers: 3 + (ups.vitrina ?? 0),
    arrivalMult: 1 - 0.08 * (ups.letrero ?? 0),
    patienceBonusMs: 4000 * (ups.sala ?? 0),
    tipBonus: 0.03 * (ups.caja ?? 0),
    priceMult: 1 + Math.min(0.25, 0.05 * decor),
    cashier: lvl("caja"),
    server: lvl("atencion"),
  };
}

/** Porciones y costo de una tanda con tus mejoras y tu equipo de repostería. */
export function batchSpec(price: number, working: StaffLite[], ups: Record<string, number>, now: number) {
  const repo = working.filter((s) => s.role === "reposteria").reduce((n, s) => n + effectiveLevel(s, now), 0);
  const horno = ups.horno ?? 0;
  const qty = BATCH_QTY + 2 * horno + Math.min(4, repo);
  const mult = Math.max(0.4, 1 - 0.1 * horno - 0.1 * repo);
  return { qty, cost: Math.max(1, Math.round(batchCost(price) * mult)) };
}

// ---------- Después del turno ----------

export interface ShiftAfter {
  staff: StaffLite;
  promoted: boolean;
}

/** Cansa a quien trabajó (menos en su especialidad), suma el turno y asciende cada 8. */
export function afterShift(s: StaffLite, now: number): ShiftAfter {
  const mood = clamp(moodNow(s, now) - (s.role === s.specialty ? 12 : 20), 0, 100);
  const worked = s.worked + 1;
  const promoted = worked % PROMOTE_EVERY === 0 && s.level < MAX_LEVEL;
  return {
    staff: { ...s, mood, mood_at: now, worked, level: promoted ? s.level + 1 : s.level },
    promoted,
  };
}

export const totalWages = (working: StaffLite[]) => working.reduce((n, s) => n + wageOf(s.level), 0);
