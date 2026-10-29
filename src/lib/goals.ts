"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type SavingsGoal } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";
import { newId } from "@/lib/recipes";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

export function useGoals() {
  return useLiveQuery(async () => alive(await db.savings_goals.toArray()).sort((a, b) => Number(!!a.done_at) - Number(!!b.done_at) || a.created_at - b.created_at), []);
}

export const progressOf = (g: Pick<SavingsGoal, "saved" | "target">) => (g.target > 0 ? Math.max(0, Math.min(1, g.saved / g.target)) : 0);
export const leftOf = (g: Pick<SavingsGoal, "saved" | "target">) => Math.max(0, g.target - g.saved);

/** Cuánto apartar al mes para llegar a tiempo (null si no hay fecha, ya pasó o ya se cumplió). */
export function perMonth(g: SavingsGoal, now: number): number | null {
  if (!g.deadline || g.done_at) return null;
  const days = (g.deadline - now) / 86_400_000;
  if (days <= 0) return null;
  return leftOf(g) / Math.max(1, days / 30);
}

export async function saveGoal(input: { name: string; target: number; deadline: number | null }, id?: string) {
  const prev = id ? await db.savings_goals.get(id) : undefined;
  const saved = prev?.saved ?? 0;
  await upsertRow<SavingsGoal>("savings_goals", {
    id: id ?? newId(),
    name: input.name,
    target: input.target,
    deadline: input.deadline,
    saved,
    created_at: prev?.created_at ?? Date.now(),
    done_at: saved >= input.target ? (prev?.done_at ?? Date.now()) : null,
  });
}

/** Suma (o resta, si es negativo) dinero ahorrado. */
export async function addToGoal(g: SavingsGoal, amount: number) {
  const saved = Math.max(0, Math.round((g.saved + amount) * 100) / 100);
  await upsertRow<SavingsGoal>("savings_goals", { ...g, saved, done_at: saved >= g.target ? (g.done_at ?? Date.now()) : null });
}

export const removeGoal = (id: string) => deleteRow("savings_goals", id);
