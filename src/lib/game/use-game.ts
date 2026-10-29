"use client";

import { useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db, type BingoMark, type GameEvent, type OwnedItem,
} from "@/lib/db/db";
import { upsertRow } from "@/lib/db/repo";
import { computeAwards, levelOf, titleOf, type EventInput, type GameData } from "@/lib/game/engine";
import { itemsUnlockedBy } from "@/lib/game/events";
import type { ShopItem } from "@/lib/game/shop";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

/** Todo lo que el motor necesita para calcular retos, insignias y premios. */
export function useGameData(): GameData | undefined {
  return useLiveQuery(async () => {
    const [cookLogs, recipes, expenses, priceHistory, products, budgets, owned, marks, days, staff, upgrades] = await Promise.all([
      db.cook_log.toArray(), db.recipes.toArray(), db.expenses.toArray(), db.price_history.toArray(),
      db.products.toArray(), db.budgets.toArray(), db.owned_items.toArray(), db.bingo_marks.toArray(), db.bakery_days.toArray(),
      db.bakery_staff.toArray(), db.bakery_upgrades.toArray(),
    ]);
    return {
      cookLogs: alive(cookLogs), recipes: alive(recipes), expenses: alive(expenses).filter((e) => (e.kind ?? "gasto") === "gasto"), priceHistory: alive(priceHistory),
      products: alive(products), budgets: alive(budgets),
      ownedIds: new Set(alive(owned).map((o) => o.id)),
      marks: new Set(alive(marks).filter((m) => m.done).map((m) => m.id)),
      days: alive(days),
      staff: alive(staff),
      upgrades: alive(upgrades),
    } satisfies GameData;
  }, []);
}

export function useGame() {
  const events = useLiveQuery(() => db.game_events.toArray(), []);
  const owned = useLiveQuery(async () => alive(await db.owned_items.toArray()), []);
  const list = events ? alive(events) : [];
  const xp = list.reduce((s, e) => s + e.xp, 0);
  const coins = list.reduce((s, e) => s + e.coins, 0);
  const lvl = levelOf(xp);
  return {
    ready: events !== undefined && owned !== undefined,
    xp,
    coins,
    ...lvl,
    title: titleOf(lvl.level),
    events: [...list].sort((a, b) => b.at - a.at),
    // Lo que se compró, más lo que desbloquearon los eventos cumplidos
    ownedIds: new Set([...(owned ?? []).map((o) => o.id), ...list.flatMap((e) => (e.id.startsWith("event:") ? itemsUnlockedBy(e.id.slice(6)) : []))]),
  };
}

// ---------- Avisos ----------

export interface GameToast {
  id: number;
  title: string;
  lines: string[];
  levelUp: boolean;
}

let toasts: GameToast[] = [];
const EMPTY: GameToast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit(next: GameToast[]) {
  toasts = next;
  listeners.forEach((l) => l());
}
export const pushToast = (t: Omit<GameToast, "id">) => emit([...toasts, { ...t, id: nextId++ }].slice(-3));
export const dismissToast = (id: number) => emit(toasts.filter((t) => t.id !== id));

export function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => EMPTY,
  );
}

/** Guarda los premios nuevos y avisa. Los ids son fijos, así que repetirlo no duplica nada. */
export async function writeAwards(awards: EventInput[], existing: GameEvent[]) {
  const before = alive(existing).reduce((s, e) => s + e.xp, 0);
  const written: EventInput[] = [];
  await db.transaction("rw", db.game_events, db.outbox, async () => {
    for (const a of awards) {
      if (await db.game_events.get(a.id)) continue;
      await upsertRow<GameEvent>("game_events", a);
      written.push(a);
    }
  });
  if (!written.length) return;

  const xp = written.reduce((s, e) => s + e.xp, 0);
  const coins = written.reduce((s, e) => s + e.coins, 0);
  const levelBefore = levelOf(before).level;
  const levelAfter = levelOf(before + xp).level;
  const badges = written.filter((e) => e.kind === "badge").map((e) => e.label.replace("Insignia: ", ""));
  if (xp === 0 && coins <= 0) return;

  const lines: string[] = [];
  if (xp || coins) lines.push(`${xp ? `+${xp} XP` : ""}${xp && coins ? " · " : ""}${coins ? `+${coins} monedas` : ""}`);
  if (badges.length) lines.push(badges.length > 2 ? `${badges.length} insignias nuevas` : `Insignia: ${badges.join(", ")}`);
  if (written.some((e) => e.kind === "bingo")) lines.push("¡Bingo!");

  const firstRun = alive(existing).length === 0 && written.length > 6;
  pushToast({
    title: levelAfter > levelBefore ? `¡Nivel ${levelAfter}! ${titleOf(levelAfter)}` : firstRun ? "¡Tu progreso ya cuenta!" : "¡Sumaste puntos!",
    lines,
    levelUp: levelAfter > levelBefore,
  });
}

// ---------- Acciones ----------

export async function buyItem(item: ShopItem): Promise<string | null> {
  if (await db.owned_items.get(item.id)) return "Ya lo tienes.";
  const coins = alive(await db.game_events.toArray()).reduce((s, e) => s + e.coins, 0);
  if (coins < item.price) return `Te faltan ${item.price - coins} monedas.`;
  const now = Date.now();
  await db.transaction("rw", db.owned_items, db.game_events, db.outbox, async () => {
    await upsertRow<OwnedItem>("owned_items", { id: item.id, bought_at: now });
    await upsertRow<GameEvent>("game_events", {
      id: `buy:${item.id}`, kind: "buy", label: `Compraste ${item.name}`, xp: 0, coins: -item.price, at: now,
    });
  });
  return null;
}

export function setMark(week: string, challengeId: string, done: boolean) {
  return upsertRow<BingoMark>("bingo_marks", { id: `${week}:${challengeId}`, done });
}
