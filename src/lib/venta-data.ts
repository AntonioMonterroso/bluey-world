"use client";

import { useMemo } from "react";
import { useBakery, useMenu } from "@/lib/bakery";
import { useBakeryDays, useBatches, useCookLogsAll, useRegulars } from "@/lib/bakery-sales";
import { useStaff, useUpgradeLevels } from "@/lib/bakery-team";
import { useDayPlan, useSpecialOrders } from "@/lib/bakery-venta";
import { useProducts } from "@/lib/budget";
import { CHARACTERS } from "@/lib/characters";
import { recipeCost } from "@/lib/costing";
import type { BakeryDay, BakeryStaff, CookLog, MenuItem, Recipe, Regular, SpecialOrder } from "@/lib/db/db";
import { useProfile } from "@/lib/db/profile";
import { appealOf, appealEffects, type Appeal } from "@/lib/game/appeal";
import { SLOTS, equipped } from "@/lib/game/decor";
import { STICKER_ITEMS } from "@/lib/game/shop";
import { favoriteOfDay, stickerPoints } from "@/lib/game/stickers";
import { dayKey, dayStart } from "@/lib/game/engine";
import { qualityMap, reputationOf, shiftsLeft, stockMap } from "@/lib/game/sales";
import { onDuty, type StaffLite } from "@/lib/game/team";
import { useGame } from "@/lib/game/use-game";
import { scaleIngredients, useRecipes } from "@/lib/recipes";

export interface VentaData {
  day: string; // "2026-10-22"
  bakery: ReturnType<typeof useBakery>["bakery"];
  profile: ReturnType<typeof useProfile>["profile"];
  menu: MenuItem[];
  active: MenuItem[];
  recipes: Recipe[];
  cookLogs: CookLog[];
  days: BakeryDay[];
  staff: BakeryStaff[];
  working: StaffLite[]; // quienes trabajan hoy
  ups: Record<string, number>;
  regulars: Regular[];
  loyalty: Record<string, number>;
  stock: Record<string, number>;
  quality: Record<string, number>;
  unitCost: Map<string, number>;
  rep: number;
  left: number;
  coins: number;
  specials: SpecialOrder[];
  dayPlan: Record<string, string>;
  appeal: Appeal;
  effects: { arrivalMult: number; tipBonus: number };
  tables: number;
  chars: string[]; // personajes que pueden venir de clientes
  staffOutfits: Record<string, Record<string, string>>; // ropa de tu equipo, por personaje
}

/** Todo lo que necesita el flujo de venta, calculado en un solo lugar. undefined mientras carga. */
export function useVentaData(): VentaData | undefined {
  const { ready, bakery } = useBakery();
  const menu = useMenu();
  const recipes = useRecipes();
  const products = useProducts();
  const cookLogs = useCookLogsAll();
  const batches = useBatches();
  const days = useBakeryDays();
  const { profile } = useProfile();
  const game = useGame();
  const staff = useStaff();
  const ups = useUpgradeLevels();
  const regulars = useRegulars();
  const day = useMemo(() => dayKey(Date.now()), []);
  const specials = useSpecialOrders(day);
  const dayPlan = useDayPlan(day);

  const loaded = ready && menu && recipes && products && cookLogs && batches && days && staff && ups && regulars && specials && dayPlan && game.ready;

  return useMemo(() => {
    if (!loaded) return undefined;
    const now = Date.now();
    const stock = stockMap(menu, cookLogs, batches, days);
    const quality = qualityMap(menu, cookLogs, batches);
    const unitCost = new Map<string, number>();
    for (const m of menu) {
      if (m.kind === "custom") { unitCost.set(m.id, Math.round(m.price * 0.35 * 100) / 100); continue; }
      const r = recipes.find((x) => x.id === m.recipe_id);
      const c = r ? recipeCost(scaleIngredients(r.ingredients, 1), products) : null;
      unitCost.set(m.id, c && c.total > 0 && r ? Math.round((c.total / r.servings) * 100) / 100 : Math.round(m.price * 0.4 * 100) / 100);
    }
    const active = menu.filter((m) => m.active);
    const prices = Object.fromEntries(SLOTS.map((s) => [s.id, equipped(bakery.decor, s.id).price]));
    const fav = favoriteOfDay(STICKER_ITEMS.map((s) => s.id), day);
    const appeal = appealOf({ prices, props: dayPlan, shown: active.length, stickers: stickerPoints(bakery.stickers, fav).total });
    const taken = new Set([profile.character, ...staff.map((x) => x.char)]);
    return {
      day, bakery, profile, menu, active, recipes, cookLogs, days, staff,
      working: onDuty(staff, now), ups, regulars,
      loyalty: Object.fromEntries(regulars.map((r) => [r.id, r.loyalty])),
      stock, quality, unitCost,
      rep: reputationOf(days),
      left: shiftsLeft(days, cookLogs, dayStart(now)),
      coins: game.coins, specials, dayPlan, appeal, effects: appealEffects(appeal.total),
      tables: equipped(bakery.decor, "tables").id === "decor:t-dos" ? 2 : equipped(bakery.decor, "tables").id === "decor:t-una" ? 1 : 0,
      chars: CHARACTERS.map((c) => c.id).filter((id) => !taken.has(id)),
      staffOutfits: Object.fromEntries(staff.filter((s) => s.outfit).map((s) => [s.char, s.outfit!])),
    } satisfies VentaData;
  }, [loaded, menu, recipes, products, cookLogs, batches, days, staff, ups, regulars, specials, dayPlan, bakery, profile, game.coins, day]);
}
