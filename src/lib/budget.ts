"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Budget, type Expense, type PriceEntry, type Product, type ShoppingItem } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";
import { findProduct, ingredientCost, norm } from "@/lib/costing";
import { newId } from "@/lib/recipes";
import type { Recipe } from "@/lib/db/db";

export { EXPENSE_CATEGORIES } from "@/lib/money-core";
export const PACK_UNITS = ["g", "kg", "ml", "l", "unidad", "docena"];

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

export function money(n: number, symbol = "Q") {
  return `${symbol} ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------- Meses ----------

export const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getTime();
export const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const monthLabel = (d: Date) => d.toLocaleDateString("es", { month: "long", year: "numeric" });
export const dateInput = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const fromDateInput = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d, 12).getTime();
};

// ---------- Productos y precios ----------

export function useProducts() {
  return useLiveQuery(async () => alive(await db.products.toArray()).sort((a, b) => a.name.localeCompare(b.name, "es")), []);
}

export function usePriceHistory() {
  return useLiveQuery(async () => alive(await db.price_history.toArray()), []);
}

export type ProductInput = Omit<Product, "id" | "updated_at" | "deleted_at">;

async function addEntry(productId: string, p: Pick<Product, "price" | "pack_qty" | "pack_unit" | "store">, at = Date.now()) {
  await upsertRow<PriceEntry>("price_history", {
    id: newId(),
    product_id: productId,
    price: p.price,
    pack_qty: p.pack_qty,
    pack_unit: p.pack_unit,
    store: p.store,
    at,
  });
}

/** Crea o edita un producto; si cambió el precio o la presentación, queda anotado en el historial. */
export async function saveProduct(input: ProductInput, id?: string) {
  const existing = id ? await db.products.get(id) : undefined;
  const pid = existing?.id ?? newId();
  await upsertRow<Product>("products", { ...input, id: pid });
  const changed =
    !existing ||
    existing.price !== input.price ||
    existing.pack_qty !== input.pack_qty ||
    existing.pack_unit !== input.pack_unit;
  if (changed) await addEntry(pid, input);
  return pid;
}

export async function updatePrice(product: Product, price: number, store?: string) {
  if (price === product.price && (store ?? product.store) === product.store) return;
  const next = { ...product, price, store: store ?? product.store };
  await upsertRow<Product>("products", next);
  if (price !== product.price) await addEntry(product.id, next);
}

export async function deleteProduct(id: string) {
  await deleteRow("products", id);
}

// ---------- Gastos y presupuestos ----------

export function useExpenses() {
  return useLiveQuery(async () => alive(await db.expenses.toArray()).sort((a, b) => b.date - a.date), []);
}

export type ExpenseInput = Omit<Expense, "id" | "updated_at" | "deleted_at">;

export async function saveExpense(input: ExpenseInput, id?: string) {
  const eid = id ?? newId();
  await upsertRow<Expense>("expenses", { ...input, id: eid });
  return eid;
}

export const deleteExpense = (id: string) => deleteRow("expenses", id);

export function useBudgets() {
  return useLiveQuery(async () => alive(await db.budgets.toArray()), []);
}

export async function setBudget(category: string, limit: number) {
  if (limit > 0) await upsertRow<Budget>("budgets", { id: category, category, limit });
  else if (await db.budgets.get(category)) await deleteRow("budgets", category);
}

// ---------- Lista de compras ----------

export function useShopping() {
  return useLiveQuery(async () => alive(await db.shopping_items.toArray()).sort((a, b) => a.updated_at - b.updated_at), []);
}

/** Suma los ingredientes de una receta (escalada) a la lista, juntando los repetidos. */
export async function addRecipeToList(recipe: Recipe, factor: number) {
  const current = alive(await db.shopping_items.toArray());
  for (const ing of recipe.ingredients) {
    const qty = ing.qty === null ? null : ing.qty * factor;
    const same = current.find((i) => !i.checked && norm(i.name) === norm(ing.name) && norm(i.unit) === norm(ing.unit));
    if (same) {
      await upsertRow<ShoppingItem>("shopping_items", {
        ...same,
        qty: same.qty === null || qty === null ? (same.qty ?? qty) : same.qty + qty,
      });
    } else {
      const item = { id: newId(), name: ing.name, qty, unit: ing.unit, checked: false, recipe_id: recipe.id };
      await upsertRow<ShoppingItem>("shopping_items", item);
      current.push({ ...item, updated_at: Date.now() });
    }
  }
}

export async function addShoppingItem(name: string) {
  await upsertRow<ShoppingItem>("shopping_items", { id: newId(), name: name.trim(), qty: null, unit: "", checked: false, recipe_id: null });
}

export const toggleShopping = (i: ShoppingItem) => upsertRow<ShoppingItem>("shopping_items", { ...i, checked: !i.checked });
export const removeShopping = (id: string) => deleteRow("shopping_items", id);

/** Costo estimado de un renglón de la lista, o null si no se puede calcular. */
export function estimateItem(item: ShoppingItem, products: Product[]) {
  return ingredientCost({ qty: item.qty, unit: item.unit, name: item.name }, findProduct(item.name, products)).cost;
}

/**
 * Cierra una compra: actualiza los precios que cambiaron (con historial), crea el gasto
 * y quita de la lista lo comprado.
 */
export async function registerPurchase(opts: {
  items: { item: ShoppingItem; paid: number | null }[];
  store: string;
  total: number;
  date: number;
}) {
  const products = alive(await db.products.toArray());
  for (const { item, paid } of opts.items) {
    const product = findProduct(item.name, products);
    if (product && paid !== null && paid > 0) await updatePrice(product, paid, opts.store || undefined);
  }
  if (opts.total > 0) {
    await saveExpense({
      date: opts.date,
      amount: opts.total,
      category: "Cocina y negocio",
      note: `Compra: ${opts.items.map((i) => i.item.name).join(", ")}`.slice(0, 200),
      store: opts.store,
      photo: null,
    });
  }
  for (const { item } of opts.items) await removeShopping(item.id);
}
