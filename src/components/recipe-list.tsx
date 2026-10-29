"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChefHat, Clock, Heart, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Character } from "@/components/character";
import { inputClass } from "@/components/ui/fields";
import { useProfile } from "@/lib/db/profile";
import { CATEGORIES, DIFFICULTY, formatMinutes, useRecipes } from "@/lib/recipes";
import { frameClass } from "@/lib/game/shop";
import { cn } from "@/lib/utils";

export function RecipeList() {
  const recipes = useRecipes();
  const { profile } = useProfile();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (recipes ?? []).filter((r) => {
      if (cat && r.category !== cat) return false;
      if (favOnly && !r.favorite) return false;
      if (!term) return true;
      return (
        r.title.toLowerCase().includes(term) ||
        r.tags.some((t) => t.toLowerCase().includes(term)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(term))
      );
    });
  }, [recipes, q, cat, favOnly]);

  const used = useMemo(() => new Set((recipes ?? []).map((r) => r.category)), [recipes]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Mis recetas</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-5 text-base">
            <Link href="/recetas/importar">Importar</Link>
          </Button>
          <Button asChild size="lg" className="h-12 rounded-2xl px-5 text-base">
            <Link href="/recetas/nueva">
              <Plus aria-hidden /> Nueva receta
            </Link>
          </Button>
        </div>
      </div>

      {recipes === undefined ? null : recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-secondary p-8 text-center">
          <Character id={profile.character} className="h-48" />
          <h2 className="text-2xl">Tu recetario está vacío</h2>
          <p className="max-w-sm text-muted-foreground">
            Anota tu primera receta con ingredientes, pasos y una foto. Se guarda aunque no tengas internet.
          </p>
          <Button asChild size="lg" className="h-12 rounded-2xl px-5 text-base">
            <Link href="/recetas/nueva">Crear mi primera receta</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <label htmlFor="buscar" className="sr-only">
                Buscar receta
              </label>
              <input
                id="buscar"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca por nombre, ingrediente o etiqueta"
                className={cn(inputClass, "pl-12")}
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
              <Chip active={favOnly} onClick={() => setFavOnly((v) => !v)}>
                <Heart className="size-4" aria-hidden /> Favoritas
              </Chip>
              {CATEGORIES.filter((c) => used.has(c)).map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Ninguna receta coincide con tu búsqueda.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/recetas/ver?id=${r.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-[background-color] duration-150 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <div className={cn("relative aspect-[4/3] overflow-hidden bg-accent/50", r.photo && frameClass(profile.frame))}>
                      {r.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photo} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-primary/60">
                          <ChefHat className="size-12" aria-hidden />
                        </div>
                      )}
                      {r.favorite && (
                        <span className="absolute right-3 top-3 rounded-full bg-card p-2 text-primary" aria-label="Favorita">
                          <Heart className="size-4 fill-current" aria-hidden />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h2 className="text-lg leading-snug">{r.title}</h2>
                      <p className="text-xs font-semibold text-muted-foreground">{r.category}</p>
                      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="size-4" aria-hidden /> {r.servings}
                        </span>
                        {(r.prep_min || r.cook_min) && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-4" aria-hidden /> {formatMinutes((r.prep_min ?? 0) + (r.cook_min ?? 0))}
                          </span>
                        )}
                        <span>{DIFFICULTY[r.difficulty]}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold",
        active ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card hover:border-border",
      )}
    >
      {children}
    </button>
  );
}
