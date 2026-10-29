"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type ClientOrder, type CookLog, type OrderStatus, type PantryItem, type Recipe } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";
import { norm } from "@/lib/costing";
import { newId } from "@/lib/recipes";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);
const DAY = 86_400_000;

/** Mediodía de hoy, para comparar días sin problemas de hora. */
export const noonOf = (ms: number) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime(); };
export const daysUntil = (ms: number, now: number) => Math.round((noonOf(ms) - noonOf(now)) / DAY);

// ---------- Pedidos ----------

export const STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "cotizado", label: "Cotizado" },
  { id: "confirmado", label: "Confirmado" },
  { id: "horneando", label: "Horneando" },
  { id: "entregado", label: "Entregado" },
  { id: "pagado", label: "Pagado" },
  { id: "cancelado", label: "Cancelado" },
];
export const statusLabel = (s: OrderStatus) => STATUSES.find((x) => x.id === s)?.label ?? s;
/** Siguiente paso natural del pedido (null si ya terminó). */
export function nextStatus(s: OrderStatus): OrderStatus | null {
  return s === "cotizado" ? "confirmado" : s === "confirmado" ? "horneando" : s === "horneando" ? "entregado" : s === "entregado" ? "pagado" : null;
}
export const isOpen = (o: ClientOrder) => o.status !== "pagado" && o.status !== "cancelado";
export const balanceOf = (o: ClientOrder) => (o.status === "pagado" || o.status === "cancelado" ? 0 : Math.max(0, o.price - o.deposit));
export const profitOf = (o: ClientOrder) => o.price - o.cost;

export function dueLabel(due: number, now: number) {
  const n = daysUntil(due, now);
  return n < 0 ? `Atrasado ${-n} ${n === -1 ? "día" : "días"}` : n === 0 ? "Hoy" : n === 1 ? "Mañana" : `En ${n} días`;
}

export function useOrders() {
  return useLiveQuery(async () => alive(await db.client_orders.toArray()).sort((a, b) => a.due - b.due), []);
}

export type OrderInput = Omit<ClientOrder, "id" | "updated_at" | "deleted_at" | "created_at" | "paid_at">;

export async function saveOrder(input: OrderInput, id?: string) {
  const prev = id ? await db.client_orders.get(id) : undefined;
  const paid = input.status === "pagado";
  await upsertRow<ClientOrder>("client_orders", {
    ...input,
    id: id ?? newId(),
    created_at: prev?.created_at ?? Date.now(),
    paid_at: paid ? (prev?.paid_at ?? Date.now()) : null,
    // Al pagarse completo, el anticipo es todo el precio.
    deposit: paid ? input.price : Math.min(input.deposit, input.price),
  });
}

export async function setOrderStatus(o: ClientOrder, status: OrderStatus) {
  const { id, updated_at: _u, deleted_at: _d, ...rest } = o;
  void _u; void _d;
  await saveOrder({ ...rest, status }, id);
}

export const removeOrder = (id: string) => deleteRow("client_orders", id);

// ---------- Diario ----------

export function useDiary() {
  return useLiveQuery(async () => alive(await db.cook_log.toArray()).sort((a, b) => b.cooked_at - a.cooked_at), []);
}

export async function saveDiaryEntry(log: CookLog, patch: Partial<Pick<CookLog, "rating" | "notes" | "photo" | "change">>) {
  await upsertRow<CookLog>("cook_log", { ...log, ...patch });
}

// ---------- Despensa ----------

export const PANTRY_UNITS = ["g", "kg", "ml", "l", "unidad", "docena", "taza", "paquete"];

export function usePantry() {
  return useLiveQuery(async () => alive(await db.pantry.toArray()).sort((a, b) => a.name.localeCompare(b.name, "es")), []);
}

export type PantryInput = Omit<PantryItem, "id" | "updated_at" | "deleted_at">;

export async function savePantryItem(input: PantryInput, id?: string) {
  await upsertRow<PantryItem>("pantry", { ...input, id: id ?? newId() });
}
export const removePantryItem = (id: string) => deleteRow("pantry", id);

export type PantryState = "vencido" | "por-vencer" | "poco" | "ok";
export function pantryState(p: PantryItem, now: number): PantryState {
  if (p.expires !== null) {
    const n = daysUntil(p.expires, now);
    if (n < 0) return "vencido";
    if (n <= 7) return "por-vencer";
  }
  if (p.min !== null && p.qty !== null && p.qty <= p.min) return "poco";
  return "ok";
}

/** ¿Algo de la despensa cubre este ingrediente? Compara por nombre, sin tocar unidades. */
export function inPantry(ingredient: string, pantry: PantryItem[], now: number): PantryItem | undefined {
  const n = norm(ingredient);
  if (!n) return undefined;
  return pantry.find((p) => {
    if (p.qty !== null && p.qty <= 0) return false;
    if (p.expires !== null && daysUntil(p.expires, now) < 0) return false;
    const pn = norm(p.name);
    return !!pn && (n.includes(pn) || pn.includes(n));
  });
}

export interface CanCook {
  recipe: Recipe;
  have: number;
  total: number;
  missing: string[];
  expiring: number; // cuántos ingredientes usan algo por vencer
}

/** Recetas ordenadas por cuánto de lo que piden ya está en casa. */
export function whatCanICook(recipes: Recipe[], pantry: PantryItem[], now: number): CanCook[] {
  const out: CanCook[] = [];
  for (const recipe of recipes) {
    const ings = recipe.ingredients.filter((i) => i.name.trim());
    if (ings.length === 0) continue;
    let have = 0;
    let expiring = 0;
    const missing: string[] = [];
    for (const i of ings) {
      const hit = inPantry(i.name, pantry, now);
      if (hit) {
        have++;
        if (pantryState(hit, now) === "por-vencer") expiring++;
      } else missing.push(i.name);
    }
    if (have > 0) out.push({ recipe, have, total: ings.length, missing, expiring });
  }
  return out.sort((a, b) => b.have / b.total - a.have / a.total || b.expiring - a.expiring);
}
