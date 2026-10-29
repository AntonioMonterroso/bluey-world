"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, ChefHat, ChevronLeft, ChevronRight, Clock, Minus, Plus, Star, Timer as TimerIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Character, DancingCharacter } from "@/components/character";
import { TimerCard } from "@/components/timer-card";
import { labelClass, textareaClass } from "@/components/ui/fields";
import { useProfile } from "@/lib/db/profile";
import type { Recipe } from "@/lib/db/db";
import {
  finishCooking, formatMinutes, formatQty, photoToDataUrl, scaleIngredients, useRecipe, useRecipes,
} from "@/lib/recipes";
import { createTimer, useNow, useTimers } from "@/lib/timers";
import { useWakeLock } from "@/lib/wake-lock";
import { cn } from "@/lib/utils";

export function CookRoute() {
  const id = useSearchParams().get("id");
  const recipe = useRecipe(id);
  if (!id) return <Picker />;
  if (recipe === undefined) return null;
  if (recipe === null) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-4xl">No encontré esa receta</h1>
        <Button asChild className="rounded-2xl"><Link href="/cocinar">Elegir otra</Link></Button>
      </div>
    );
  }
  return <CookMode key={recipe.id} recipe={recipe} />;
}

function Picker() {
  const recipes = useRecipes();
  const { profile } = useProfile();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">¿Qué vamos a cocinar?</h1>
      {recipes === undefined ? null : recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-secondary p-8 text-center">
          <Character id={profile.character} className="h-40" />
          <p className="max-w-sm text-muted-foreground">Primero necesitas una receta para cocinarla paso a paso.</p>
          <Button asChild size="lg" className="h-12 rounded-2xl px-5 text-base"><Link href="/recetas/nueva">Crear una receta</Link></Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {recipes.map((r) => (
            <li key={r.id}>
              <Link href={`/cocinar?id=${r.id}`} className="flex items-center gap-4 rounded-3xl border bg-card p-3 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent/50 text-primary/60">
                  {r.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photo} alt="" className="size-full object-cover" />
                  ) : (
                    <ChefHat className="size-8" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-heading text-lg">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.steps.length} pasos · {r.ingredients.length} ingredientes</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Phase = "ing" | "steps" | "finish" | "done";
type Saved = { phase: Phase; step: number; checked: number[]; target: number; notes: string };

function CookMode({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const storeKey = `bw-cook-${recipe.id}`;
  const timers = useTimers();
  const { profile } = useProfile();
  const now = useNow(!!timers?.some((t) => t.status === "running"));

  const [saved] = useState<Saved | null>(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      return raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      return null;
    }
  });
  const [phase, setPhase] = useState<Phase>(saved?.phase ?? "ing");
  const [step, setStep] = useState(Math.min(saved?.step ?? 0, Math.max(0, recipe.steps.length - 1)));
  const [checked, setChecked] = useState<Set<number>>(new Set(saved?.checked ?? []));
  const [target, setTarget] = useState(saved?.target ?? recipe.servings);
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [rating, setRating] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useWakeLock(phase !== "done");

  useEffect(() => {
    if (phase === "done") return;
    try {
      localStorage.setItem(storeKey, JSON.stringify({ phase, step, checked: [...checked], target, notes } satisfies Saved));
    } catch {}
  }, [phase, step, checked, target, notes, storeKey]);

  const ingredients = scaleIngredients(recipe.ingredients, target / recipe.servings);
  const steps = recipe.steps;
  const current = steps[step];
  const stepLabel = `${recipe.title} · paso ${step + 1}`;
  const stepTimer = timers?.find((t) => t.recipe_id === recipe.id && t.label === stepLabel);

  async function finish() {
    setBusy(true);
    await finishCooking(recipe, { servings: target, rating, notes: notes.trim(), photo });
    try {
      localStorage.removeItem(storeKey);
    } catch {}
    setPhase("done");
  }

  const exit = (
    <button type="button" onClick={() => router.push(`/recetas/ver?id=${recipe.id}`)} className="flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-accent/60" aria-label="Salir del modo cocinar">
      <X className="size-4" aria-hidden /> Salir
    </button>
  );

  if (phase === "done") {
    return (
      <div className="flex max-w-xl flex-col items-center gap-5 py-6 text-center">
        <DancingCharacter id={profile.character} className="h-56" />
        <h1 className="text-4xl">¡Receta cocinada!</h1>
        <p className="text-muted-foreground">Quedó anotada en tu diario: {recipe.title}.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-2xl px-6 text-base"><Link href={`/recetas/ver?id=${recipe.id}`}>Ver la receta</Link></Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-6 text-base"><Link href="/cocinar">Cocinar otra</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate font-heading text-lg">{recipe.title}</p>
        {exit}
      </div>

      {!!timers?.length && (
        <section aria-label="Temporizadores en marcha" className="flex flex-col gap-2">
          {timers.map((t) => (
            <TimerCard key={t.id} timer={t} now={now} character={profile.character} compact />
          ))}
        </section>
      )}

      {phase === "ing" && (
        <section aria-labelledby="ci" className="flex flex-col gap-5">
          <h1 id="ci" className="text-4xl">Junta tus ingredientes</h1>
          <div className="flex items-center gap-2 self-start rounded-full bg-card p-1" role="group" aria-label="Porciones">
            <button type="button" aria-label="Menos porciones" disabled={target <= 1} onClick={() => setTarget(Math.max(1, target - 1))} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60 disabled:opacity-40"><Minus className="size-4" aria-hidden /></button>
            <span className="min-w-24 text-center text-sm font-semibold" aria-live="polite">Para {target}</span>
            <button type="button" aria-label="Más porciones" onClick={() => setTarget(target + 1)} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60"><Plus className="size-4" aria-hidden /></button>
          </div>
          <ul className="flex flex-col gap-2">
            {ingredients.map((i, n) => {
              const on = checked.has(n);
              return (
                <li key={n}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setChecked((prev) => { const next = new Set(prev); if (on) next.delete(n); else next.add(n); return next; })}
                    className={cn("flex min-h-14 w-full items-center gap-4 rounded-2xl border-2 bg-card px-4 text-left text-lg", on ? "border-primary/40 text-muted-foreground line-through" : "border-transparent")}
                  >
                    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {on && <Check className="size-4" aria-hidden />}
                    </span>
                    <span className="font-semibold tabular-nums">{formatQty(i.qty)} {i.unit}</span>
                    <span>{i.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted-foreground">{checked.size} de {ingredients.length} listos</p>
          <Button size="lg" className="h-14 rounded-2xl text-lg" onClick={() => setPhase(steps.length ? "steps" : "finish")}>
            {steps.length ? "Empezar a cocinar" : "Ir al final"}
          </Button>
        </section>
      )}

      {phase === "steps" && current && (
        <section aria-labelledby="cs" className="flex flex-col gap-5">
          <div>
            <h1 id="cs" className="text-lg font-semibold text-muted-foreground">Paso {step + 1} de {steps.length}</h1>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${((step + 1) / steps.length) * 100}%`, transition: "width 300ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
            </div>
          </div>
          <p className="min-h-40 whitespace-pre-line text-balance text-2xl leading-snug md:text-3xl">{current.text}</p>

          {current.minutes && !stepTimer && (
            (
              <Button variant="secondary" size="lg" className="h-14 w-fit rounded-2xl px-6 text-base" onClick={() => void createTimer({ label: stepLabel, ms: current.minutes! * 60_000, recipe_id: recipe.id })}>
                <TimerIcon aria-hidden /> Poner temporizador de {formatMinutes(current.minutes)}
              </Button>
            )
          )}

          <details className="rounded-2xl border bg-card px-4 py-3">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold"><Clock className="size-4" aria-hidden /> Ver ingredientes</summary>
            <ul className="mt-2 flex flex-col gap-1 pb-1 text-sm">
              {ingredients.map((i, n) => (
                <li key={n}><span className="font-semibold tabular-nums">{formatQty(i.qty)} {i.unit}</span> {i.name}</li>
              ))}
            </ul>
          </details>

          <div className="flex flex-col gap-2">
            <label htmlFor="nota-rapida" className={labelClass}>Nota rápida (queda en tu diario)</label>
            <textarea id="nota-rapida" className={cn(textareaClass, "min-h-16")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Le faltó un poco de azúcar" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" disabled={step === 0} className="h-14 rounded-2xl text-base" onClick={() => setStep(step - 1)}>
              <ChevronLeft aria-hidden /> Anterior
            </Button>
            {step < steps.length - 1 ? (
              <Button size="lg" className="h-14 rounded-2xl text-base" onClick={() => setStep(step + 1)}>
                Siguiente <ChevronRight aria-hidden />
              </Button>
            ) : (
              <Button size="lg" className="h-14 rounded-2xl text-base" onClick={() => setPhase("finish")}>
                Terminar <Check aria-hidden />
              </Button>
            )}
          </div>
        </section>
      )}

      {phase === "finish" && (
        <section aria-labelledby="cf" className="flex flex-col gap-5">
          <h1 id="cf" className="text-4xl">¿Cómo quedó?</h1>
          <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`} onClick={() => setRating(n)} className="flex size-12 items-center justify-center rounded-full hover:bg-accent/60">
                <Star className={cn("size-8", rating !== null && n <= rating ? "fill-primary text-primary" : "text-muted-foreground")} aria-hidden />
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="nota-final" className={labelClass}>¿Qué cambiarías?</label>
            <textarea id="nota-final" className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-accent/50 text-primary/60">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Foto de tu postre" className="size-full object-cover" />
              ) : (
                <Camera className="size-7" aria-hidden />
              )}
            </div>
            <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => fileRef.current?.click()}>
              <Camera aria-hidden /> {photo ? "Cambiar foto" : "Foto del resultado"}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await photoToDataUrl(f)); e.target.value = ""; }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" className="h-14 rounded-2xl text-base" onClick={() => setPhase(steps.length ? "steps" : "ing")}>
              <ChevronLeft aria-hidden /> Volver
            </Button>
            <Button size="lg" disabled={busy} className="h-14 rounded-2xl text-base" onClick={() => void finish()}>
              {busy ? "Guardando…" : "¡Listo!"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
