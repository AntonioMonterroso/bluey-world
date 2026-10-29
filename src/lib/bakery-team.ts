"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type BakeryStaff, type BakeryUpgrade, type GameEvent } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";
import {
  GIFT_COST, GIFT_MOOD, MAX_LEVEL, MAX_STAFF, canWork, dutyLimit, moodNow, nextUpgradeCost, trainCost, upgradeMax,
  type Candidate,
} from "@/lib/game/team";
import { newId } from "@/lib/recipes";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

export function useStaff() {
  return useLiveQuery(async () => alive(await db.bakery_staff.toArray()).sort((a, b) => a.updated_at - b.updated_at), []);
}

/** Nivel de cada mejora: { vitrina: 1, horno: 2, ... } */
export function useUpgradeLevels() {
  return useLiveQuery(async () => Object.fromEntries(alive(await db.bakery_upgrades.toArray()).map((u) => [u.id, u.level])) as Record<string, number>, []);
}

/** Cobra monedas (con evento en el registro) y hace el cambio en la misma operación. */
export async function spend(cost: number, eventId: string, label: string, write: () => Promise<void>): Promise<string | null> {
  const coins = alive(await db.game_events.toArray()).reduce((s, e) => s + e.coins, 0);
  if (coins < cost) return `Te faltan ${cost - coins} monedas.`;
  await db.transaction("rw", [db.game_events, db.outbox, db.bakery_staff, db.bakery_upgrades, db.day_plan, db.special_orders], async () => {
    await write();
    await upsertRow<GameEvent>("game_events", { id: eventId, kind: "shop", label, xp: 0, coins: -cost, at: Date.now() });
  });
  return null;
}

export async function hireEmployee(c: Candidate): Promise<string | null> {
  const count = alive(await db.bakery_staff.toArray()).length;
  if (count >= MAX_STAFF) return `Tu equipo ya tiene ${MAX_STAFF} personas.`;
  const id = newId();
  const now = Date.now();
  return spend(c.cost, `hire:${id}`, "Contrataste a alguien", () =>
    upsertRow<BakeryStaff>("bakery_staff", {
      id, char: c.char, role: c.specialty, specialty: c.specialty, level: 1, worked: 0, mood: 100, mood_at: now, on_duty: false,
    }).then(() => undefined),
  );
}

export async function setRole(s: BakeryStaff, role: string) {
  await upsertRow<BakeryStaff>("bakery_staff", { ...s, role });
}

export async function setOnDuty(s: BakeryStaff, on: boolean): Promise<string | null> {
  const now = Date.now();
  if (on) {
    if (!canWork(s, now)) return "Está agotada: dale un descanso o un pastelito.";
    const [staff, ups] = await Promise.all([db.bakery_staff.toArray(), db.bakery_upgrades.toArray()]);
    const levels = Object.fromEntries(alive(ups).map((u) => [u.id, u.level]));
    const working = alive(staff).filter((x) => x.on_duty && canWork(x, now)).length;
    if (working >= dutyLimit(levels)) return `Solo caben ${dutyLimit(levels)} a la vez. Mejora la cocina para sumar puestos.`;
  }
  await upsertRow<BakeryStaff>("bakery_staff", { ...s, on_duty: on });
  return null;
}

export async function trainEmployee(s: BakeryStaff): Promise<string | null> {
  if (s.level >= MAX_LEVEL) return "Ya está en el nivel máximo.";
  return spend(trainCost(s.level), `train:${s.id}:${s.level + 1}`, "Entrenaste a alguien", () =>
    upsertRow<BakeryStaff>("bakery_staff", { ...s, level: s.level + 1 }).then(() => undefined),
  );
}

export async function giftEmployee(s: BakeryStaff): Promise<string | null> {
  const now = Date.now();
  return spend(GIFT_COST, `gift:${s.id}:${now}`, "Un pastelito para el equipo", () =>
    upsertRow<BakeryStaff>("bakery_staff", { ...s, mood: Math.min(100, moodNow(s, now) + GIFT_MOOD), mood_at: now }).then(() => undefined),
  );
}

export const fireEmployee = (id: string) => deleteRow("bakery_staff", id);

export async function buyUpgrade(id: string): Promise<string | null> {
  const row = await db.bakery_upgrades.get(id);
  const level = row && !row.deleted_at ? row.level : 0;
  const cost = nextUpgradeCost(id, level);
  if (cost === null || level >= upgradeMax(id)) return "Ya está al máximo.";
  return spend(cost, `upgrade:${id}:${level + 1}`, "Mejoraste el local", () =>
    upsertRow<BakeryUpgrade>("bakery_upgrades", { id, level: level + 1 }).then(() => undefined),
  );
}
