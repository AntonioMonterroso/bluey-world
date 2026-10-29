"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Account, type Recurring } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";
import { saveExpense } from "@/lib/budget";
import { nextDue, noon } from "@/lib/money-core";
import { newId } from "@/lib/recipes";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

// ---------- Cuentas ----------

export function useAccounts() {
  return useLiveQuery(async () => alive(await db.accounts.toArray()).sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name, "es")), []);
}

export type AccountInput = Omit<Account, "id" | "updated_at" | "deleted_at">;
export async function saveAccount(input: AccountInput, id?: string) {
  await upsertRow<Account>("accounts", { ...input, id: id ?? newId() });
}
export const removeAccount = (id: string) => deleteRow("accounts", id);

// ---------- Pagos e ingresos fijos ----------

export function useRecurring() {
  return useLiveQuery(async () => alive(await db.recurring.toArray()).sort((a, b) => Number(b.active) - Number(a.active) || a.next_due - b.next_due), []);
}

export type RecurringInput = Omit<Recurring, "id" | "updated_at" | "deleted_at">;
export async function saveRecurring(input: RecurringInput, id?: string) {
  await upsertRow<Recurring>("recurring", { ...input, id: id ?? newId() });
}
export const removeRecurring = (id: string) => deleteRow("recurring", id);

/**
 * Marca un pago (o un ingreso) fijo como hecho: crea el movimiento con la fecha en que de verdad
 * lo hiciste y pasa el vencimiento a la siguiente fecha. `amount` permite pagar un monto distinto (ej. luz).
 */
export async function payRecurring(r: Recurring, opts: { date?: number; amount?: number } = {}) {
  await saveExpense({
    date: noon(opts.date ?? Date.now()),
    amount: opts.amount ?? r.amount,
    category: r.category,
    note: r.name,
    store: "",
    photo: null,
    kind: r.kind,
    account_id: r.account_id,
    recurring_id: r.id,
  });
  await skipRecurring(r);
}

/** Pasa al siguiente vencimiento sin anotar nada (ya lo pagaste por otro lado o este mes no toca). */
export async function skipRecurring(r: Recurring) {
  await upsertRow<Recurring>("recurring", { ...r, next_due: nextDue(r.frequency, r.next_due, r.anchor_day) });
}
