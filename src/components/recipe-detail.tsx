"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChefHat, Clock, Copy, Eye, EyeOff, Heart, History, Minus, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { RecipeCost } from "@/components/recipe-cost";
import { PanScaler } from "@/components/pan-scaler";
import type { Recipe } from "@/lib/db/db";
import {
  DIFFICULTY, deleteRecipe, duplicateRecipe, formatMinutes, formatQty, restoreVersion, scaleIngredients,
  toggleFavorite, useCookLogs, useRecipe, useVersions,
} from "@/lib/recipes";
import { frameClass } from "@/lib/game/shop";
import { useProfile } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

export function RecipeDetailRoute() {
  const id = useSearchParams().get("id");
  const recipe = useRecipe(id);

  if (recipe === undefined) return null;
  if (recipe === null) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-4xl">No encontré esa receta</h1>
        <Button asChild className="rounded-2xl"><Link href="/recetas">Volver a mis recetas</Link></Button>
      </div>
    );
  }
  return <RecipeDetail key={recipe.id} recipe={recipe} />;
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const { profile } = useProfile();
  const [target, setTarget] = useState(recipe.servings);
  const [showSecret, setShowSecret] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [panFactor, setPanFactor] = useState<number | null>(null);

  const factor = panFactor ?? target / recipe.servings;
  const ingredients = scaleIngredients(recipe.ingredients, factor);
  const total = (recipe.prep_min ?? 0) + (recipe.cook_min ?? 0);

  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Link href="/recetas" className="w-fit text-sm font-semibold text-primary underline underline-offset-4">
          ← Mis recetas
        </Link>
        {recipe.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.photo} alt={`Foto de ${recipe.title}`} className={cn("aspect-[4/3] w-full rounded-[2rem] object-cover", frameClass(profile.frame))} />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-muted-foreground">{recipe.category}</p>
            <h1 className="text-balance text-4xl leading-tight">{recipe.title}</h1>
          </div>
          <button
            type="button"
            aria-pressed={recipe.favorite}
            aria-label={recipe.favorite ? "Quitar de favoritas" : "Marcar como favorita"}
            onClick={() => void toggleFavorite(recipe)}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-primary"
          >
            <Heart className={cn("size-6", recipe.favorite && "fill-current")} aria-hidden />
          </button>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5"><Users className="size-4" aria-hidden /> {recipe.servings} porciones</li>
          {total > 0 && <li className="flex items-center gap-1.5"><Clock className="size-4" aria-hidden /> {formatMinutes(total)}</li>}
          <li className="flex items-center gap-1.5"><ChefHat className="size-4" aria-hidden /> {DIFFICULTY[recipe.difficulty]}</li>
        </ul>
        {recipe.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {recipe.tags.map((t) => (
              <li key={t} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{t}</li>
            ))}
          </ul>
        )}
        <CookedLine recipeId={recipe.id} />
        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-11 rounded-2xl">
            <Link href={`/cocinar?id=${recipe.id}`}><ChefHat aria-hidden /> Cocinar</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl">
            <Link href={`/recetas/editar?id=${recipe.id}`}><Pencil aria-hidden /> Editar</Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-2xl"
            onClick={async () => router.push(`/recetas/ver?id=${await duplicateRecipe(recipe)}`)}
          >
            <Copy aria-hidden /> Duplicar
          </Button>
          {confirmDelete ? (
            <Button
              variant="destructive"
              className="h-11 rounded-2xl"
              onClick={async () => {
                await deleteRecipe(recipe.id);
                router.push("/recetas");
              }}
            >
              Sí, borrar
            </Button>
          ) : (
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setConfirmDelete(true)}>
              <Trash2 aria-hidden /> Borrar
            </Button>
          )}
        </div>
      </header>

      <section aria-labelledby="ing" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ing" className="text-2xl">Ingredientes</h2>
          <div className="flex items-center gap-2 rounded-full bg-card p-1" role="group" aria-label="Porciones">
            <button type="button" aria-label="Menos porciones" disabled={target <= 1} onClick={() => { setPanFactor(null); setTarget(Math.max(1, target - 1)); }} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60 disabled:opacity-40">
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="min-w-24 text-center text-sm font-semibold" aria-live="polite">Para {target}</span>
            <button type="button" aria-label="Más porciones" onClick={() => { setPanFactor(null); setTarget(target + 1); }} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <PanScaler active={panFactor} onApply={(f) => { setPanFactor(f); if (f) setTarget(Math.max(1, Math.round(recipe.servings * f))); }} />
        {(target !== recipe.servings || panFactor !== null) && (
          <button type="button" onClick={() => { setPanFactor(null); setTarget(recipe.servings); }} className="w-fit text-sm font-semibold text-primary underline underline-offset-4">
            Volver a las {recipe.servings} originales
          </button>
        )}
        <ul className="divide-y rounded-3xl border bg-card">
          {ingredients.map((i, n) => (
            <li key={n} className="flex gap-3 px-5 py-3">
              <span className="min-w-20 font-semibold tabular-nums">
                {formatQty(i.qty !== null && (i.unit === "" || i.unit === "unidad") ? Math.max(0.5, Math.round(i.qty * 2) / 2) : i.qty)} {i.unit}
              </span>
              <span>{i.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <RecipeCost recipe={recipe} servings={recipe.servings * factor} />

      {recipe.steps.length > 0 && (
        <section aria-labelledby="pasos" className="flex flex-col gap-4">
          <h2 id="pasos" className="text-2xl">Pasos</h2>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((s, n) => (
              <li key={n} className="flex gap-4 rounded-3xl border bg-card p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-primary-foreground">{n + 1}</span>
                <div className="flex flex-col gap-2">
                  <p className="whitespace-pre-line">{s.text}</p>
                  {s.minutes && (
                    <p className="flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                      <Clock className="size-3.5" aria-hidden /> {formatMinutes(s.minutes)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {recipe.video_url && (
        <section aria-labelledby="video" className="flex flex-col gap-3">
          <h2 id="video" className="text-2xl">Video</h2>
          <YouTubeEmbed url={recipe.video_url} title={`Video de ${recipe.title}`} />
        </section>
      )}

      {recipe.notes && (
        <section aria-labelledby="notas" className="flex flex-col gap-2">
          <h2 id="notas" className="text-2xl">Notas</h2>
          <p className="whitespace-pre-line text-muted-foreground">{recipe.notes}</p>
        </section>
      )}

      {recipe.secret && (
        <section aria-labelledby="secreto" className="flex flex-col gap-3 rounded-3xl bg-secondary p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="secreto" className="text-2xl">Mi secreto</h2>
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setShowSecret((v) => !v)} aria-pressed={showSecret}>
              {showSecret ? <EyeOff aria-hidden /> : <Eye aria-hidden />} {showSecret ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          {showSecret && <p className="whitespace-pre-line">{recipe.secret}</p>}
        </section>
      )}

      {recipe.source_url && <p className="text-sm text-muted-foreground">Fuente: {recipe.source_url}</p>}

      <VersionsPanel recipe={recipe} />
    </article>
  );
}

function CookedLine({ recipeId }: { recipeId: string }) {
  const logs = useCookLogs(recipeId);
  if (!logs?.length) return null;
  const last = logs[0];
  return (
    <p className="text-sm text-muted-foreground">
      Cocinada {logs.length} {logs.length === 1 ? "vez" : "veces"}
      {last.rating ? ` · última: ${last.rating}/5` : ""}
      {last.notes ? ` · “${last.notes}”` : ""}
    </p>
  );
}

function VersionsPanel({ recipe }: { recipe: Recipe }) {
  const versions = useVersions(recipe.id);
  const [open, setOpen] = useState(false);
  if (!versions?.length) return null;

  return (
    <section aria-labelledby="hist" className="flex flex-col gap-3 border-t pt-6">
      <button type="button" id="hist" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-fit items-center gap-2 text-lg font-heading">
        <History className="size-5" aria-hidden /> Versiones anteriores ({versions.length})
      </button>
      {open && (
        <ul className="flex flex-col gap-2">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
              <div>
                <p className="font-semibold">{v.snapshot.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.updated_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                  {v.snapshot.ingredients.length} ingredientes · {v.snapshot.servings} porciones
                </p>
              </div>
              <Button variant="outline" className="h-11 rounded-2xl" onClick={() => void restoreVersion(recipe, v)}>
                Restaurar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
