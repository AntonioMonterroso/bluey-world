"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type SpecialOrder, type BakeryBatch, type BakeryDay, type BakeryStaff, type GameEvent, type MenuItem, type Regular } from "@/lib/db/db";
import { LOYALTY_START, loyaltyAfter } from "@/lib/game/customers";
import { upsertRow } from "@/lib/db/repo";
import { dayStart } from "@/lib/game/engine";
import type { ShiftSummary } from "@/lib/game/sales";
import { afterShift, totalWages } from "@/lib/game/team";
import { newId } from "@/lib/recipes";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

export function useBakeryDays() {
  return useLiveQuery(async () => alive(await db.bakery_days.toArray()).sort((a, b) => b.at - a.at), []);
}

export function useBatches() {
  return useLiveQuery(async () => alive(await db.bakery_batches.toArray()), []);
}

export function useRegulars() {
  return useLiveQuery(async () => alive(await db.regulars.toArray()), []);
}

export function useCookLogsAll() {
  return useLiveQuery(async () => alive(await db.cook_log.toArray()), []);
}

export interface ShiftResult {
  wages: number;
  promoted: string[]; // ids de personajes que ascendieron
}

/**
 * Guarda el turno terminado, paga los sueldos y actualiza a quien trabajó (ánimo, turnos, ascensos).
 * Las monedas y el XP los reparte el motor del juego a partir de este registro.
 */
export async function finishShift(sum: ShiftSummary, startedAt: number, workingIds: string[], eventKeys: string[] = []): Promise<ShiftResult> {
  const now = Date.now();
  const rows = (await db.bakery_staff.bulkGet(workingIds)).filter((r): r is BakeryStaff => !!r && !r.deleted_at);
  const wages = Math.min(totalWages(rows), sum.coins);
  const promoted: string[] = [];
  for (const r of rows) {
    const after = afterShift(r, now);
    if (after.promoted) promoted.push(r.char);
    await upsertRow<BakeryStaff>("bakery_staff", { ...r, ...after.staff });
  }
  await upsertRow<BakeryDay>("bakery_days", {
    id: newId(),
    date: dayStart(startedAt),
    at: now,
    served: sum.served,
    lost: sum.lost,
    sales: sum.sales,
    tips: sum.tips,
    cost: sum.cost,
    coins: sum.coins,
    rating: sum.rating,
    items: sum.items,
    perfect: sum.perfect,
    wages,
    ...(sum.critic ? { critic: sum.critic } : {}),
    ...(eventKeys.length ? { events: eventKeys } : {}),
  });

  // Pedidos especiales entregados.
  for (const id of sum.specialsDone) {
    const so = await db.special_orders.get(id);
    if (so) await upsertRow<SpecialOrder>("special_orders", { ...so, status: "delivered" });
  }

  // Clientes frecuentes: cada visita sube o baja su fidelidad.
  const byChar = new Map<string, typeof sum.visits>();
  for (const v of sum.visits) byChar.set(v.char, [...(byChar.get(v.char) ?? []), v]);
  for (const [char, visits] of byChar) {
    const cur = await db.regulars.get(char);
    let loyalty = cur && !cur.deleted_at ? cur.loyalty : LOYALTY_START;
    for (const v of visits) loyalty = loyaltyAfter(loyalty, v);
    await upsertRow<Regular>("regulars", { id: char, visits: (cur && !cur.deleted_at ? cur.visits : 0) + visits.length, loyalty, last_at: now });
  }
  return { wages, promoted };
}

/** Hornea una tanda de un postre inventado; cuesta monedas. (Las recetas reales se llenan cocinando.) */
export async function bakeBatch(item: MenuItem, spec: { qty: number; cost: number; quality?: number }): Promise<string | null> {
  const { qty, cost, quality } = spec;
  const coins = alive(await db.game_events.toArray()).reduce((s, e) => s + e.coins, 0);
  if (coins < cost) return `Te faltan ${cost - coins} monedas para hornear.`;
  const now = Date.now();
  const id = newId();
  await db.transaction("rw", db.bakery_batches, db.game_events, db.outbox, async () => {
    await upsertRow<BakeryBatch>("bakery_batches", { id, menu_id: item.id, qty, cost, at: now, ...(quality !== undefined ? { quality } : {}) });
    await upsertRow<GameEvent>("game_events", {
      id: `bake:${id}`, kind: "shop", label: `Horneaste ${qty} de ${item.name}`, xp: 0, coins: -cost, at: now,
    });
  });
  return null;
}
