"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleDollarSign } from "lucide-react";
import { inputClass } from "@/components/ui/fields";
import { useProducts } from "@/lib/budget";
import { recipeCost } from "@/lib/costing";
import type { Recipe } from "@/lib/db/db";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { scaleIngredients } from "@/lib/recipes";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

/** Costo estimado de la receta con los precios guardados, por porción y con precio de venta sugerido. */
export function RecipeCost({ recipe, servings }: { recipe: Recipe; servings: number }) {
  const products = useProducts();
  const { profile } = useProfile();
  const fmt = useMoney();
  const [marginDraft, setMarginDraft] = useState<string | null>(null);
  const margin = profile.margin ?? 100;

  if (products === undefined || recipe.ingredients.length === 0) return null;

  const cost = recipeCost(scaleIngredients(recipe.ingredients, servings / recipe.servings), products);
  const priced = recipe.ingredients.length - cost.missing.length;
  const perServing = servings > 0 ? cost.total / servings : 0;
  const sale = (n: number) => n * (1 + margin / 100);

  return (
    <section aria-labelledby="costo" className="flex flex-col gap-4 rounded-3xl border bg-card p-5">
      <h2 id="costo" className="flex items-center gap-2 text-2xl">
        <CircleDollarSign className="size-6 text-primary" aria-hidden /> Costo
      </h2>

      {products.length === 0 ? (
        <p className="text-muted-foreground">
          Guarda los precios de tus ingredientes y aquí verás cuánto cuesta hacer esta receta.{" "}
          <Link href="/mi-cocina/precios" className="font-semibold text-primary underline underline-offset-4">Agregar precios</Link>
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-semibold text-muted-foreground">Para {servings} porciones</p>
              <p className="font-heading text-2xl">{fmt(cost.total)}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-semibold text-muted-foreground">Por porción</p>
              <p className="font-heading text-2xl">{fmt(perServing)}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-semibold text-muted-foreground">Precio sugerido por porción</p>
              <p className="font-heading text-2xl">{fmt(sale(perServing))}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="margen" className="font-semibold">Ganancia sobre el costo</label>
            <input
              id="margen"
              inputMode="numeric"
              className={cn(inputClass, "h-11 w-24")}
              value={marginDraft ?? String(margin)}
              onChange={(e) => {
                setMarginDraft(e.target.value);
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 0) void updateProfile({ margin: n });
              }}
              onBlur={() => setMarginDraft(null)}
            />
            <span aria-hidden>%</span>
            <span className="text-muted-foreground">Total sugerido: {fmt(sale(cost.total))}</span>
          </div>

          {cost.missing.length > 0 && (
            <div className="rounded-2xl border border-dashed p-4">
              <p className="text-sm font-semibold">
                El costo es parcial: {priced} de {recipe.ingredients.length} ingredientes con precio.
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {cost.missing.map((m) => (
                  <li key={m.ingredient.name}>
                    <Link
                      href={`/mi-cocina/precios?nuevo=${encodeURIComponent(m.ingredient.name)}`}
                      className="flex min-h-11 items-center rounded-full bg-secondary px-4 text-sm font-semibold"
                    >
                      {m.ingredient.name} · {m.reason === "sin-precio" ? "poner precio" : "revisar unidad"}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
