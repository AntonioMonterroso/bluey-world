"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  Cake, CakeSlice, Candy, Cherry, Coffee, Cookie, Croissant, IceCreamCone, Wheat, type LucideIcon,
} from "lucide-react";
import { db, type Bakery, type MenuItem } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";
import { BRAND } from "@/lib/brand";
import { newId } from "@/lib/recipes";
import type { DecorSlot } from "@/lib/game/decor";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

export const BAKERY_ID = "me";

export const MENU_ICONS: Record<string, LucideIcon> = {
  cake: Cake, slice: CakeSlice, cookie: Cookie, ice: IceCreamCone, croissant: Croissant, candy: Candy, coffee: Coffee, wheat: Wheat, cherry: Cherry,
};
export const ICON_NAMES: Record<string, string> = {
  cake: "Pastel", slice: "Rebanada", cookie: "Galleta", ice: "Helado", croissant: "Cuernito", candy: "Dulce", coffee: "Café", wheat: "Pan", cherry: "Cereza",
};

const CATEGORY_ICON: Record<string, string> = {
  Pasteles: "cake", "Cupcakes y muffins": "cake", Galletas: "cookie", "Tartas y pays": "slice",
  "Postres fríos": "ice", Panes: "croissant", "Rellenos y cremas": "candy", Bebidas: "coffee", Salado: "wheat", Otro: "cherry",
};
export const iconForCategory = (c: string) => CATEGORY_ICON[c] ?? "cherry";

export const DEFAULT_PRICE = 12;

export function useBakery() {
  const row = useLiveQuery(async () => (await db.bakery.get(BAKERY_ID)) ?? null, []);
  const bakery: Bakery = { id: BAKERY_ID, name: BRAND.tycoon, decor: {}, updated_at: 0, ...(row ?? {}) };
  return { ready: row !== undefined, bakery };
}

export async function saveBakery(patch: Partial<Pick<Bakery, "name" | "decor" | "stickers">>) {
  const current = (await db.bakery.get(BAKERY_ID)) ?? { id: BAKERY_ID, name: BRAND.tycoon, decor: {} };
  await upsertRow<Bakery>("bakery", { ...current, ...patch, id: BAKERY_ID });
}

export async function setDecor(slot: DecorSlot, itemId: string) {
  const current = await db.bakery.get(BAKERY_ID);
  await saveBakery({ decor: { ...(current?.decor ?? {}), [slot]: itemId } });
}

export function useMenu() {
  return useLiveQuery(async () => alive(await db.bakery_menu.toArray()).sort((a, b) => a.name.localeCompare(b.name, "es")), []);
}

export type MenuInput = Omit<MenuItem, "id" | "updated_at" | "deleted_at">;

export async function saveMenuItem(input: MenuInput, id?: string) {
  const mid = id ?? newId();
  await upsertRow<MenuItem>("bakery_menu", { ...input, id: mid });
  return mid;
}

export const deleteMenuItem = (id: string) => deleteRow("bakery_menu", id);

export async function updateMenuItem(item: MenuItem, patch: Partial<Pick<MenuItem, "price" | "active" | "name" | "icon">>) {
  await upsertRow<MenuItem>("bakery_menu", { ...item, ...patch });
}

/** Cada receta que ya cocinaste se vuelve un postre del menú (una sola vez, con id fijo). */
export async function syncMenuFromCooking() {
  const [logs, recipes, menu] = await Promise.all([db.cook_log.toArray(), db.recipes.toArray(), db.bakery_menu.toArray()]);
  const cooked = new Set(alive(logs).map((l) => l.recipe_id));
  const have = new Set(menu.map((m) => m.id));
  for (const r of alive(recipes)) {
    const id = `recipe:${r.id}`;
    if (!cooked.has(r.id) || have.has(id)) continue;
    await upsertRow<MenuItem>("bakery_menu", {
      id, kind: "recipe", recipe_id: r.id, name: r.title, icon: iconForCategory(r.category), price: DEFAULT_PRICE, active: true,
    });
  }
}
