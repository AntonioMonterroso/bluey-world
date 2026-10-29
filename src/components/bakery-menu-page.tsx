"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Cake, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { useProducts } from "@/lib/budget";
import {
  ICON_NAMES, MENU_ICONS, deleteMenuItem, saveMenuItem, updateMenuItem, useMenu,
} from "@/lib/bakery";
import { recipeCost } from "@/lib/costing";
import type { MenuItem } from "@/lib/db/db";
import { useProfile } from "@/lib/db/profile";
import { parseQty, useRecipes, scaleIngredients } from "@/lib/recipes";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

function MenuRow({ item, suggested, fmt }: { item: MenuItem; suggested: number | null; fmt: (n: number) => string }) {
  const Icon = MENU_ICONS[item.icon] ?? Cake;
  const [price, setPrice] = useState(String(item.price));
  const [confirm, setConfirm] = useState(false);

  function commit(raw: string) {
    const v = parseQty(raw);
    if (!v) return setPrice(String(item.price));
    const rounded = Math.round(v * 100) / 100;
    setPrice(String(rounded));
    if (rounded !== item.price) void updateMenuItem(item, { price: rounded });
  }

  return (
    <li className={cn("flex flex-col gap-3 rounded-3xl border p-4", item.active ? "bg-card" : "bg-muted/50")}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.kind === "recipe" ? "De tu recetario" : "Postre del juego"}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={item.active}
          aria-label={`${item.name} en la vitrina`}
          onClick={() => void updateMenuItem(item, { active: !item.active })}
          className={cn("flex h-11 w-16 shrink-0 items-center rounded-full border-2 p-1", item.active ? "justify-end border-primary bg-primary" : "justify-start border-border bg-card")}
        >
          <span className={cn("size-7 rounded-full", item.active ? "bg-primary-foreground" : "bg-muted-foreground/40")} />
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`precio-${item.id}`} className="text-xs font-semibold">Precio de venta</label>
          <input
            id={`precio-${item.id}`}
            inputMode="decimal"
            className={cn(inputClass, "h-11 w-28")}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
          />
        </div>
        {suggested !== null && Math.abs(suggested - item.price) >= 0.01 && (
          <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => { setPrice(String(suggested)); void updateMenuItem(item, { price: suggested }); }}>
            Usar sugerido {fmt(suggested)}
          </Button>
        )}
        {item.kind === "custom" &&
          (confirm ? (
            <Button variant="destructive" className="h-11 rounded-2xl" onClick={() => void deleteMenuItem(item.id)}>Sí, quitar</Button>
          ) : (
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setConfirm(true)}><Trash2 aria-hidden /> Quitar</Button>
          ))}
      </div>
    </li>
  );
}

export function BakeryMenuPage() {
  const menu = useMenu();
  const recipes = useRecipes();
  const products = useProducts();
  const { profile } = useProfile();
  const fmt = useMoney();
  const margin = profile.margin ?? 100;

  const suggested = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recipes ?? []) {
      const c = recipeCost(scaleIngredients(r.ingredients, 1), products ?? []);
      if (c.total > 0 && r.servings > 0) map.set(r.id, Math.round((c.total / r.servings) * (1 + margin / 100) * 100) / 100);
    }
    return map;
  }, [recipes, products, margin]);

  const locked = useMemo(() => {
    const have = new Set((menu ?? []).map((m) => m.recipe_id));
    return (recipes ?? []).filter((r) => !have.has(r.id));
  }, [recipes, menu]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [icon, setIcon] = useState("cake");
  const [error, setError] = useState<string | null>(null);

  async function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const p = parseQty(price);
    if (!name.trim()) return setError("Ponle nombre al postre.");
    if (!p) return setError("Escribe el precio de venta.");
    setError(null);
    await saveMenuItem({ kind: "custom", recipe_id: null, name: name.trim(), icon, price: Math.round(p * 100) / 100, active: true });
    setName("");
    setPrice("");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-4xl">Menú</h1>
      <p className="text-muted-foreground">
        Cada receta que cocinas de verdad aparece aquí sola. Ponle precio, elige cuáles van en la vitrina y agrega postres inventados.
      </p>

      <section aria-labelledby="en-menu" className="flex flex-col gap-3">
        <h2 id="en-menu" className="text-2xl">En tu menú</h2>
        {menu === undefined ? null : menu.length === 0 ? (
          <p className="rounded-3xl border border-dashed bg-card p-5 text-muted-foreground">
            Todavía no hay postres. <Link href="/cocinar" className="font-semibold text-primary underline underline-offset-4">Cocina una receta</Link> y aparecerá aquí.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {menu.map((m) => <MenuRow key={m.id} item={m} suggested={m.recipe_id ? (suggested.get(m.recipe_id) ?? null) : null} fmt={fmt} />)}
          </ul>
        )}
      </section>

      {locked.length > 0 && (
        <section aria-labelledby="por-desbloquear" className="flex flex-col gap-3">
          <h2 id="por-desbloquear" className="text-2xl">Por desbloquear</h2>
          <ul className="flex flex-wrap gap-2">
            {locked.map((r) => (
              <li key={r.id}>
                <Link href={`/cocinar?id=${r.id}`} className="flex min-h-11 items-center gap-2 rounded-full bg-muted/60 px-4 text-sm font-semibold text-muted-foreground hover:bg-accent/60">
                  <Lock className="size-4" aria-hidden /> {r.title} · cocínala
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={addCustom} className="flex flex-col gap-4 rounded-3xl border bg-card p-5" noValidate>
        <h2 className="text-xl">Inventa un postre del juego</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="n-nombre" className={labelClass}>Nombre</label>
            <input id="n-nombre" className={inputClass} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="Ej. Torta de nube" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="n-precio" className={labelClass}>Precio de venta</label>
            <input id="n-precio" inputMode="decimal" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className={cn(labelClass, "mb-1")}>Dibujito</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Dibujito del postre">
            {Object.entries(MENU_ICONS).map(([id, Icon]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={icon === id}
                aria-label={ICON_NAMES[id]}
                onClick={() => setIcon(id)}
                className={cn("flex size-12 items-center justify-center rounded-2xl border-2", icon === id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}
              >
                <Icon className="size-6" aria-hidden />
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="h-12 w-fit rounded-2xl px-6 text-base"><Plus aria-hidden /> Agregar al menú</Button>
      </form>
    </div>
  );
}
