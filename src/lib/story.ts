"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type StoryProgress } from "@/lib/db/db";
import { upsertRow } from "@/lib/db/repo";
import { emptyState, finishChapter } from "@/lib/game/story/engine";
import { reputationOf } from "@/lib/game/sales";
import { chapterByN, TOTAL_CHAPTERS } from "@/lib/game/story/chapters";
import type { StoryData, StoryState } from "@/lib/game/story/types";
import { writeAwards } from "@/lib/game/use-game";

const ID = "main";
const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

/** Tu avance en la historia. `state` es el valor inicial hasta que llegue lo guardado. */
export function useStory(): { ready: boolean; state: StoryState } {
  const row = useLiveQuery(async () => (await db.story_progress.get(ID)) ?? null, []);
  return { ready: row !== undefined, state: row ? { chapter: row.chapter, pos: row.pos, started: row.started, done: row.done, flags: row.flags } : emptyState() };
}

export async function saveStory(next: StoryState) {
  await upsertRow<StoryProgress>("story_progress", { id: ID, ...next });
}

/** Lo que mira la historia para marcar tus tareas. */
export function useStoryData(): StoryData | undefined {
  return useLiveQuery(async () => {
    const [cooks, days, expenses, budgets, staff, recipes, bakery, plans, prices, specials, upgrades, events, profile, goals, orders, pantry, recurring] = await Promise.all([
      db.cook_log.toArray(), db.bakery_days.toArray(), db.expenses.toArray(), db.budgets.toArray(), db.bakery_staff.toArray(),
      db.recipes.toArray(), db.bakery.toArray(), db.day_plan.toArray(), db.price_history.toArray(), db.special_orders.toArray(),
      db.bakery_upgrades.toArray(), db.game_events.toArray(), db.profile.toArray(), db.savings_goals.toArray(), db.client_orders.toArray(),
      db.pantry.toArray(), db.recurring.toArray(),
    ]);
    const liveDays = alive(days);
    return {
      cookTimes: alive(cooks).map((c) => c.cooked_at),
      shiftTimes: liveDays.map((d) => d.at),
      expenseTimes: alive(expenses).filter((e) => (e.kind ?? "gasto") === "gasto").map((e) => e.updated_at),
      budgetTimes: alive(budgets).map((b) => b.updated_at),
      staffCount: alive(staff).length,
      secretRecipeTimes: alive(recipes).filter((r) => r.secret.trim() && r.photo).map((r) => r.updated_at),
      decorTimes: [...alive(bakery), ...alive(plans)].map((r) => r.updated_at),
      criticTimes: liveDays.filter((d) => d.critic).map((d) => d.at),
      priceTimes: alive(prices).map((p) => p.at),
      deliveredTimes: alive(specials).filter((o) => o.status === "delivered").map((o) => o.updated_at),
      upgradeTimes: alive(upgrades).filter((u) => u.level > 0).map((u) => u.updated_at),
      miniPlays: alive(events).filter((e) => e.id.startsWith("mini:")).map((e) => ({ at: e.at, game: e.id.split(":").pop() ?? "" })),
      reputation: reputationOf(liveDays),
      cooks: alive(cooks).length,
      shifts: liveDays.length,
      outfitCount: Object.keys(profile[0]?.outfit ?? {}).length,
      goalTimes: alive(goals).filter((g) => g.saved > 0).map((g) => g.updated_at),
      orderTimes: alive(orders).map((o) => o.created_at),
      diaryTimes: alive(cooks).filter((c) => c.notes.trim() || (c.change ?? "").trim() || c.photo).map((c) => c.updated_at),
      pantryTimes: alive(pantry).map((p) => p.updated_at),
      recurringTimes: alive(recurring).map((r) => r.updated_at),
    };
  }, []);
}

/** Termina el capítulo: abre el siguiente y entrega el premio (una sola vez, por su id en el registro). */
export async function completeChapter(state: StoryState, n: number) {
  const c = chapterByN(n);
  if (!c) return;
  await saveStory(finishChapter(state, n, TOTAL_CHAPTERS));
  const existing = await db.game_events.toArray();
  await writeAwards([{ id: `story:ch${n}`, kind: "story", label: `Historia: ${c.title}`, xp: c.reward.xp, coins: c.reward.coins, at: Date.now() }], existing);
}
