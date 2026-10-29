"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import type { ProgressData } from "@/lib/game/progress";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

/** Lo que miran las metas, las rachas y las insignias nuevas. */
export function useProgressData(): ProgressData | undefined {
  return useLiveQuery(async () => {
    const [cooks, moves, days, events, orders, goals, accounts, recurring, pantry, profile, staff, story, scores] = await Promise.all([
      db.cook_log.toArray(), db.expenses.toArray(), db.bakery_days.toArray(), db.game_events.toArray(), db.client_orders.toArray(),
      db.savings_goals.toArray(), db.accounts.toArray(), db.recurring.toArray(), db.pantry.toArray(), db.profile.toArray(),
      db.bakery_staff.toArray(), db.story_progress.toArray(), db.mini_scores.toArray(),
    ]);
    const me = profile[0];
    return {
      cooks: alive(cooks).map((c) => ({ recipe_id: c.recipe_id, cooked_at: c.cooked_at, updated_at: c.updated_at, photo: c.photo, notes: c.notes, change: c.change })),
      moves: alive(moves).map((m) => ({ date: m.date, kind: m.kind, recurring_id: m.recurring_id, amount: m.amount })),
      shifts: alive(days).map((x) => ({ at: x.at, served: x.served, perfect: x.perfect })),
      events: alive(events).map((e) => ({ id: e.id, at: e.at })),
      orders: alive(orders).map((o) => ({ status: o.status, paid_at: o.paid_at })),
      goals: alive(goals).map((g) => ({ saved: g.saved, target: g.target, done_at: g.done_at, updated_at: g.updated_at })),
      accounts: alive(accounts).filter((a) => !a.archived).length,
      recurring: alive(recurring).length,
      pantry: alive(pantry).length,
      outfitCount: Object.keys(me?.outfit ?? {}).length,
      looks: me?.looks?.length ?? 0,
      staffDressed: alive(staff).filter((s) => Object.keys(s.outfit ?? {}).length > 0).length,
      storyDone: story.find((s) => s.id === "main")?.done ?? [],
      records: alive(scores).filter((s) => s.best > 0).length,
    } satisfies ProgressData;
  }, []);
}
