"use client";

import { useMemo, useState } from "react";
import { Camera, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass, textareaClass } from "@/components/ui/fields";
import { Stars } from "@/components/stars";
import type { CookLog } from "@/lib/db/db";
import { saveDiaryEntry, useDiary } from "@/lib/kitchen";
import { photoToDataUrl, useRecipes } from "@/lib/recipes";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const dayLabel = (ms: number) => new Date(ms).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

function EntryForm({ log, onClose }: { log: CookLog; onClose: () => void }) {
  const [rating, setRating] = useState(log.rating ?? 0);
  const [notes, setNotes] = useState(log.notes);
  const [change, setChange] = useState(log.change ?? "");
  const [photo, setPhoto] = useState(log.photo);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await saveDiaryEntry(log, { rating: rating || null, notes: notes.trim(), change: change.trim(), photo });
    onClose();
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-4">
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Calificación</span>
        <div className="flex gap-2" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)} className={cn("size-11 rounded-full border-2 font-semibold", rating >= n ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{n}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2"><label htmlFor={`n-${log.id}`} className={labelClass}>Cómo salió</label><textarea id={`n-${log.id}`} className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div className="flex flex-col gap-2"><label htmlFor={`c-${log.id}`} className={labelClass}>Qué cambiaría la próxima vez</label><textarea id={`c-${log.id}`} className={textareaClass} value={change} onChange={(e) => setChange(e.target.value)} placeholder="Menos azúcar, más tiempo de horno…" /></div>
      <div className="flex flex-wrap items-center gap-3">
        {photo && <img src={photo} alt="Foto del postre" className="size-20 rounded-2xl object-cover" />}
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border-2 border-border px-4 text-sm font-semibold">
          <Camera className="size-4" aria-hidden /> {photo ? "Cambiar foto" : "Agregar foto"}
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await photoToDataUrl(f)); e.target.value = ""; }} />
        </label>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="h-11 rounded-2xl px-6">Guardar</Button>
        <Button type="button" variant="outline" className="h-11 rounded-2xl px-6" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function Inner() {
  const diary = useDiary();
  const recipes = useRecipes();
  const [recipeId, setRecipeId] = useState("");
  const [view, setView] = useState<"linea" | "galeria">("linea");
  const [editing, setEditing] = useState<string | null>(null);

  const shown = useMemo(() => (diary ?? []).filter((l) => !recipeId || l.recipe_id === recipeId), [diary, recipeId]);
  const titles = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of diary ?? []) if (!m.has(l.recipe_id)) m.set(l.recipe_id, recipes?.find((r) => r.id === l.recipe_id)?.title ?? l.title);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [diary, recipes]);
  const rated = shown.filter((l) => l.rating).slice().reverse(); // de más viejo a más nuevo
  const trend = rated.length >= 2 ? rated[rated.length - 1].rating! - rated[0].rating! : null;

  if (diary === undefined) return null;
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-4xl">Diario de postres</h1>
      {diary.length === 0 ? (
        <p className="rounded-3xl border border-dashed bg-card p-6 text-center text-muted-foreground">Aquí aparece cada postre que cocinas con su foto y su nota. Termina una receta en el Modo Cocinar para empezar.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-48 flex-1 flex-col gap-2">
              <label htmlFor="d-rec" className={labelClass}>Receta</label>
              <select id="d-rec" className={inputClass} value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                <option value="">Todas</option>
                {titles.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2" role="group" aria-label="Vista">
              {(["linea", "galeria"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn("min-h-12 rounded-full border-2 px-5 text-sm font-semibold", view === v ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>{v === "linea" ? "Línea de tiempo" : "Galería"}</button>
              ))}
            </div>
          </div>

          {recipeId && shown.length >= 2 && (
            <section aria-labelledby="cmp" className="flex flex-col gap-3 rounded-3xl bg-secondary p-5">
              <h2 id="cmp" className="text-xl">Tus {shown.length} intentos</h2>
              <ol className="flex gap-3 overflow-x-auto pb-1">
                {shown.slice().reverse().map((l, i) => (
                  <li key={l.id} className="flex w-28 shrink-0 flex-col items-center gap-1 text-center text-xs">
                    {l.photo ? <img src={l.photo} alt="" className="size-24 rounded-2xl object-cover" /> : <span className="flex size-24 items-center justify-center rounded-2xl bg-card text-muted-foreground">Sin foto</span>}
                    <span className="font-semibold">Intento {i + 1}</span>
                    {l.rating ? <Stars value={l.rating} /> : <span className="text-muted-foreground">Sin nota</span>}
                  </li>
                ))}
              </ol>
              {trend !== null && <p className="text-sm font-semibold">{trend > 0 ? `Mejoraste ${trend} ${trend === 1 ? "estrella" : "estrellas"} desde el primer intento.` : trend < 0 ? "El primero te quedó mejor. Revisa qué cambiaste." : "Mantienes la misma calificación."}</p>}
            </section>
          )}

          {view === "galeria" ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shown.filter((l) => l.photo).map((l) => (
                <li key={l.id} className="overflow-hidden rounded-3xl border bg-card">
                  <img src={l.photo!} alt={`${l.title}, ${dayLabel(l.cooked_at)}`} className="aspect-square w-full object-cover" />
                  <p className="truncate px-3 py-2 text-sm font-semibold">{l.title}</p>
                </li>
              ))}
              {shown.every((l) => !l.photo) && <li className="col-span-full text-center text-muted-foreground">Todavía no hay fotos. Agrégalas desde la línea de tiempo.</li>}
            </ul>
          ) : (
            <ol className="flex flex-col gap-4">
              {shown.map((l) => (
                <li key={l.id} className="flex flex-col gap-3">
                  {editing === l.id ? <EntryForm log={l} onClose={() => setEditing(null)} /> : (
                    <article className="flex gap-4 rounded-3xl border bg-card p-4">
                      {l.photo ? <img src={l.photo} alt="" className="size-24 shrink-0 rounded-2xl object-cover" /> : <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-secondary text-xs text-muted-foreground">Sin foto</span>}
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-xs font-semibold text-muted-foreground">{dayLabel(l.cooked_at)}</p>
                        <h2 className="truncate text-xl">{l.title}</h2>
                        {l.rating ? <Stars value={l.rating} /> : null}
                        {l.notes && <p className="text-sm">{l.notes}</p>}
                        {l.change && <p className="text-sm text-muted-foreground"><span className="font-semibold">Cambiaría:</span> {l.change}</p>}
                        <Button variant="outline" className="mt-1 h-11 w-fit rounded-2xl" onClick={() => setEditing(l.id)}><Pencil aria-hidden /> Editar</Button>
                      </div>
                    </article>
                  )}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

export function DiaryPage() {
  return useIsClient() ? <Inner /> : null;
}
