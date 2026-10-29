"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import {
  addRecipeToList, addShoppingItem, dateInput, estimateItem, fromDateInput, registerPurchase, removeShopping,
  toggleShopping, useProducts, useShopping,
} from "@/lib/budget";
import { findProduct } from "@/lib/costing";
import type { ShoppingItem } from "@/lib/db/db";
import { formatQty, parseQty, useRecipes } from "@/lib/recipes";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

export function ShoppingPage() {
  const items = useShopping();
  const products = useProducts();
  const recipes = useRecipes();
  const fmt = useMoney();
  const [recipeId, setRecipeId] = useState("");
  const [servings, setServings] = useState("");
  const [manual, setManual] = useState("");
  const [paying, setPaying] = useState(false);

  const pending = useMemo(() => (items ?? []).filter((i) => !i.checked), [items]);
  const checked = useMemo(() => (items ?? []).filter((i) => i.checked), [items]);
  const estimate = useMemo(() => {
    let total = 0;
    let unknown = 0;
    for (const i of pending) {
      const c = estimateItem(i, products ?? []);
      if (c === null) unknown++;
      else total += c;
    }
    return { total, unknown };
  }, [pending, products]);

  const recipe = recipes?.find((r) => r.id === recipeId);

  async function addFromRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!recipe) return;
    const n = Number(servings) > 0 ? Number(servings) : recipe.servings;
    await addRecipeToList(recipe, n / recipe.servings);
    setRecipeId("");
    setServings("");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-4xl">Lista de compras</h1>

      <form onSubmit={addFromRecipe} className="flex flex-col gap-3 rounded-3xl border bg-card p-5">
        <h2 className="text-xl">Agregar los ingredientes de una receta</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-1 flex-col gap-2">
            <label htmlFor="rec" className={labelClass}>Receta</label>
            <select id="rec" className={inputClass} value={recipeId} onChange={(e) => { setRecipeId(e.target.value); setServings(""); }}>
              <option value="">Elige una receta</option>
              {(recipes ?? []).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="porc" className={labelClass}>Porciones</label>
            <input id="porc" inputMode="numeric" className={cn(inputClass, "w-28")} value={servings} onChange={(e) => setServings(e.target.value)} placeholder={recipe ? String(recipe.servings) : ""} disabled={!recipe} />
          </div>
          <Button type="submit" disabled={!recipe} className="h-12 rounded-2xl px-5 text-base"><Plus aria-hidden /> Agregar</Button>
        </div>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { void addShoppingItem(manual); setManual(""); } }} className="flex gap-2">
        <label htmlFor="manual" className="sr-only">Agregar otra cosa</label>
        <input id="manual" className={inputClass} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Agregar otra cosa a la lista" />
        <Button type="submit" variant="outline" className="h-12 rounded-2xl px-5">Agregar</Button>
      </form>

      {items === undefined ? null : items.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">Tu lista está vacía.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {[...pending, ...checked].map((i) => (
              <Row key={i.id} item={i} est={estimateItem(i, products ?? [])} hasProduct={!!findProduct(i.name, products ?? [])} fmt={fmt} />
            ))}
          </ul>

          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm font-semibold text-muted-foreground">Estimado de lo que falta comprar</p>
            <p className="font-heading text-3xl">{fmt(estimate.total)}</p>
            {estimate.unknown > 0 && (
              <p className="text-sm text-muted-foreground">{estimate.unknown} {estimate.unknown === 1 ? "cosa no tiene" : "cosas no tienen"} precio guardado.</p>
            )}
          </div>

          {checked.length > 0 && !paying && (
            <Button size="lg" className="h-14 rounded-2xl text-base" onClick={() => setPaying(true)}>
              Registrar compra ({checked.length})
            </Button>
          )}
          {paying && <PurchaseForm items={checked} products={products ?? []} onDone={() => setPaying(false)} fmt={fmt} />}
        </>
      )}
    </div>
  );
}

function Row({ item, est, hasProduct, fmt }: { item: ShoppingItem; est: number | null; hasProduct: boolean; fmt: (n: number) => string }) {
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        onClick={() => void toggleShopping(item)}
        className={cn("flex min-h-14 flex-1 items-center gap-3 rounded-2xl border-2 bg-card px-4 text-left", item.checked ? "border-primary/30 text-muted-foreground line-through" : "border-transparent")}
      >
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2", item.checked ? "border-primary bg-primary text-primary-foreground" : "border-border")} aria-hidden>
          {item.checked && "✓"}
        </span>
        <span className="flex-1">
          <span className="font-semibold tabular-nums">{item.qty !== null ? `${formatQty(item.qty)} ${item.unit}` : ""}</span> {item.name}
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">{est !== null ? fmt(est) : hasProduct ? "" : "sin precio"}</span>
      </button>
      <button type="button" aria-label={`Quitar ${item.name}`} onClick={() => void removeShopping(item.id)} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60">
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

function PurchaseForm({ items, products, onDone, fmt }: { items: ShoppingItem[]; products: ReturnType<typeof useProducts> & object; onDone: () => void; fmt: (n: number) => string }) {
  const [paid, setPaid] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, String(findProduct(i.name, products)?.price ?? "")])),
  );
  const [store, setStore] = useState("");
  const [date, setDate] = useState(dateInput(Date.now()));
  const [totalOverride, setTotalOverride] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sum = items.reduce((s, i) => s + (parseQty(paid[i.id] ?? "") || 0), 0);
  const total = totalOverride.trim() ? parseQty(totalOverride) : sum;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (total === undefined || total === null || total <= 0) return setError("Escribe cuánto pagaste en total.");
    await registerPurchase({
      items: items.map((item) => ({ item, paid: parseQty(paid[item.id] ?? "") || null })),
      store: store.trim(),
      total,
      date: fromDateInput(date),
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border bg-card p-5" noValidate>
      <h2 className="text-xl">Registrar compra</h2>
      <p className="text-sm text-muted-foreground">
        Escribe lo que pagaste por cada paquete. Los precios que cambiaron se actualizan solos y se anota el gasto.
      </p>
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3">
            <label htmlFor={`pg-${i.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold">{i.name}</label>
            <input id={`pg-${i.id}`} inputMode="decimal" className={cn(inputClass, "h-11 w-28")} value={paid[i.id] ?? ""} onChange={(e) => setPaid({ ...paid, [i.id]: e.target.value })} placeholder="0.00" />
          </li>
        ))}
      </ul>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="pc-tienda" className={labelClass}>Tienda</label>
          <input id="pc-tienda" className={inputClass} value={store} onChange={(e) => setStore(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pc-fecha" className={labelClass}>Fecha</label>
          <input id="pc-fecha" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pc-total" className={labelClass}>Total pagado</label>
          <input id="pc-total" inputMode="decimal" className={inputClass} value={totalOverride} onChange={(e) => setTotalOverride(e.target.value)} placeholder={sum ? sum.toFixed(2) : "0.00"} />
        </div>
      </div>
      <p className="font-heading text-xl">Total: {fmt(total && total > 0 ? total : 0)}</p>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="lg" className="h-12 rounded-2xl px-6 text-base">Guardar compra</Button>
        <Button type="button" variant="ghost" size="lg" className="h-12 rounded-2xl px-6 text-base" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}
