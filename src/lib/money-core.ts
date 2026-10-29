// Lógica pura del dinero real (sin base de datos): totales, saldos y pagos que se repiten.
import type { Account, Expense, Frequency, MoneyKind, Recurring } from "@/lib/db/db";

export const EXPENSE_CATEGORIES = [
  "Vivienda", "Servicios", "Comida", "Transporte", "Salud", "Educación", "Deudas y tarjetas",
  "Suscripciones", "Ropa y cuidado", "Diversión", "Hogar", "Cocina y negocio", "Otros",
] as const;
export const INCOME_CATEGORIES = ["Sueldo", "Ventas", "Trabajos extra", "Regalos", "Reembolsos", "Otros ingresos"] as const;

export const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: "semanal", label: "Cada semana" },
  { id: "bisemanal", label: "Cada 2 semanas" },
  { id: "quincenal", label: "Quincenal (día 15 y fin de mes)" },
  { id: "mensual", label: "Cada mes" },
  { id: "anual", label: "Cada año" },
];
export const frequencyLabel = (f: Frequency) => FREQUENCIES.find((x) => x.id === f)?.label ?? f;

export const ACCOUNT_TYPES = [
  { id: "efectivo", label: "Efectivo" },
  { id: "banco", label: "Cuenta de banco" },
  { id: "tarjeta", label: "Tarjeta de crédito" },
  { id: "ahorro", label: "Ahorro" },
] as const;

const DAY = 86_400_000;
export const noon = (ms: number) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime(); };
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const at = (y: number, m: number, day: number) => new Date(y, m, Math.min(day, daysIn(y, m)), 12).getTime();

export const kindOf = (e: Pick<Expense, "kind">): MoneyKind => e.kind ?? "gasto";

/** Siguiente fecha de un pago que se repite, a partir de la fecha en que tocaba. */
export function nextDue(freq: Frequency, from: number, anchorDay: number): number {
  const d = new Date(from);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  switch (freq) {
    case "semanal": return noon(from + 7 * DAY);
    case "bisemanal": return noon(from + 14 * DAY);
    case "quincenal": {
      const last = daysIn(y, m);
      if (day < 15) return at(y, m, 15);
      if (day < last) return at(y, m, last);
      return at(y, m + 1, 15);
    }
    case "mensual": return at(y, m + 1, anchorDay);
    case "anual": return at(y + 1, m, anchorDay);
  }
}

/** Todas las fechas en que toca pagar entre dos momentos (para proyectar el mes). */
export function occurrences(r: Pick<Recurring, "frequency" | "next_due" | "anchor_day" | "active">, from: number, to: number): number[] {
  if (!r.active) return [];
  const out: number[] = [];
  let t = r.next_due;
  for (let i = 0; i < 400 && t < to; i++) {
    if (t >= from) out.push(t);
    t = nextDue(r.frequency, t, r.anchor_day);
  }
  return out;
}

export type DueState = "atrasado" | "hoy" | "pronto" | "luego";
export const daysUntil = (due: number, now: number) => Math.round((noon(due) - noon(now)) / DAY);
export function dueState(r: Pick<Recurring, "next_due" | "remind_days">, now: number): DueState {
  const n = daysUntil(r.next_due, now);
  return n < 0 ? "atrasado" : n === 0 ? "hoy" : n <= r.remind_days ? "pronto" : "luego";
}
export function dueLabel(due: number, now: number): string {
  const n = daysUntil(due, now);
  return n < 0 ? `Atrasado ${-n} ${n === -1 ? "día" : "días"}` : n === 0 ? "Hoy" : n === 1 ? "Mañana" : `En ${n} días`;
}

// ---------- Totales ----------

export interface MonthTotals { income: number; spent: number; net: number; byCategory: Record<string, number>; incomeByCategory: Record<string, number> }

/** Ingresos, gastos y saldo del periodo. Las transferencias entre tus cuentas no cuentan. */
export function totalsOf(moves: Expense[], from: number, to: number): MonthTotals {
  const out: MonthTotals = { income: 0, spent: 0, net: 0, byCategory: {}, incomeByCategory: {} };
  for (const e of moves) {
    if (e.date < from || e.date >= to) continue;
    const k = kindOf(e);
    if (k === "gasto") { out.spent += e.amount; out.byCategory[e.category] = (out.byCategory[e.category] ?? 0) + e.amount; }
    else if (k === "ingreso") { out.income += e.amount; out.incomeByCategory[e.category] = (out.incomeByCategory[e.category] ?? 0) + e.amount; }
  }
  out.net = out.income - out.spent;
  return out;
}

/** Saldo de una cuenta: lo que empezó + lo que entró − lo que salió. En una tarjeta, negativo = lo que debes. */
export function balanceOf(a: Pick<Account, "id" | "opening">, moves: Expense[]): number {
  let b = a.opening;
  for (const e of moves) {
    const k = kindOf(e);
    if (k === "ingreso" && e.account_id === a.id) b += e.amount;
    else if (k === "gasto" && e.account_id === a.id) b -= e.amount;
    else if (k === "transferencia") {
      if (e.account_id === a.id) b -= e.amount;
      if (e.to_account_id === a.id) b += e.amount;
    }
  }
  return Math.round(b * 100) / 100;
}

export interface Position { cash: number; debt: number; net: number }
/** Lo que tienes (efectivo, banco, ahorro), lo que debes (tarjetas) y la diferencia. */
export function positionOf(accounts: Account[], moves: Expense[]): Position {
  let cash = 0;
  let debt = 0;
  for (const a of accounts) {
    if (a.archived) continue;
    const b = balanceOf(a, moves);
    if (a.type === "tarjeta") debt += Math.max(0, -b);
    else cash += b;
  }
  return { cash: Math.round(cash * 100) / 100, debt: Math.round(debt * 100) / 100, net: Math.round((cash - debt) * 100) / 100 };
}

export interface Outlook { pendingExpenses: number; pendingIncome: number; left: number }
/** Lo que falta por pagar y cobrar de los fijos hasta fin de mes, y cuánto te queda si todo se cumple. */
export function monthOutlook(totals: MonthTotals, recurring: Recurring[], monthEnd: number): Outlook {
  let pendingExpenses = 0;
  let pendingIncome = 0;
  for (const r of recurring) {
    const n = occurrences(r, 0, monthEnd).length; // todas las que faltan hasta fin de mes (incluye las atrasadas)
    const total = r.amount * n;
    if (r.kind === "gasto") pendingExpenses += total; else pendingIncome += total;
  }
  return { pendingExpenses, pendingIncome, left: totals.income + pendingIncome - totals.spent - pendingExpenses };
}

/** Pagos fijos que vencen en los próximos días (incluye los atrasados), del más urgente al más lejano. */
export function dueSoon(recurring: Recurring[], now: number, horizonDays: number) {
  return recurring
    .filter((r) => r.active && daysUntil(r.next_due, now) <= horizonDays)
    .sort((a, b) => a.next_due - b.next_due);
}
