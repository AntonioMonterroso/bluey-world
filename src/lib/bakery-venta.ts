"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type DayPlan, type SpecialOrder } from "@/lib/db/db";
import { upsertRow } from "@/lib/db/repo";
import { spend } from "@/lib/bakery-team";
import { propById } from "@/lib/game/appeal";
import type { SpecialDraft } from "@/lib/game/cake";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

/** Pedidos especiales de un día. */
export function useSpecialOrders(day: string) {
  return useLiveQuery(async () => alive(await db.special_orders.where("day").equals(day).toArray()).sort((a, b) => a.id.localeCompare(b.id)), [day]);
}

/** Adornos puestos hoy: { colgante: "globos", ... } */
export function useDayPlan(day: string) {
  return useLiveQuery(async () => ((await db.day_plan.get(day)) && !(await db.day_plan.get(day))!.deleted_at ? (await db.day_plan.get(day))!.props : {}) as Record<string, string>, [day]);
}

/** Crea los pedidos del día si todavía no existen (los ids son fijos, así que no se duplican). */
export async function ensureSpecials(day: string, drafts: SpecialDraft[]) {
  for (const d of drafts) {
    if (await db.special_orders.get(d.id)) continue;
    await upsertRow<SpecialOrder>("special_orders", {
      id: d.id, day, char: d.char, request: d.request, price: d.price, base_menu_id: null, quality: null, status: "pending",
    });
  }
}

export async function decorateSpecial(o: SpecialOrder, baseMenuId: string, quality: number) {
  await upsertRow<SpecialOrder>("special_orders", { ...o, base_menu_id: baseMenuId, quality, status: "ready" });
}

/** Pone o quita un adorno del día. Poner uno cuesta monedas; quitarlo es gratis. */
export async function setProp(day: string, spot: string, propId: string | null): Promise<string | null> {
  const current = (await db.day_plan.get(day)) ?? { id: day, props: {} as Record<string, string> };
  const props = { ...current.props };
  if (propId === null) {
    delete props[spot];
    await upsertRow<DayPlan>("day_plan", { id: day, props });
    return null;
  }
  if (props[spot] === propId) return null;
  const p = propById(propId);
  if (!p || p.spot !== spot) return "Ese adorno no va ahí.";
  props[spot] = propId;
  return spend(p.cost, `prop:${day}:${spot}:${propId}`, `Adorno: ${p.name}`, () => upsertRow<DayPlan>("day_plan", { id: day, props }).then(() => undefined));
}
