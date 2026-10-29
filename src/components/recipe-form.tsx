"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Camera, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { inputClass, labelClass, textareaClass } from "@/components/ui/fields";
import type { Recipe, RecipeContent } from "@/lib/db/db";
import {
  CATEGORIES, DIFFICULTY, UNITS, emptyContent, formatQty, parseQty, photoToDataUrl, saveRecipe,
} from "@/lib/recipes";
import { parseYouTube } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type IngRow = { key: string; qty: string; unit: string; name: string };
type StepRow = { key: string; text: string; minutes: string };

let seq = 0;
const key = () => `r${++seq}`;

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function RecipeForm({ recipe, initial }: { recipe?: Recipe; initial?: RecipeContent }) {
  const router = useRouter();
  const base: RecipeContent = recipe ?? initial ?? emptyContent();

  const [title, setTitle] = useState(base.title);
  const [category, setCategory] = useState(base.category);
  const [servings, setServings] = useState(String(base.servings));
  const [prep, setPrep] = useState(base.prep_min?.toString() ?? "");
  const [cook, setCook] = useState(base.cook_min?.toString() ?? "");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(base.difficulty);
  const [tags, setTags] = useState(base.tags.join(", "));
  const [photo, setPhoto] = useState<string | null>(base.photo);
  const [ings, setIngs] = useState<IngRow[]>(
    base.ingredients.map((i) => ({ key: key(), qty: formatQty(i.qty), unit: i.unit, name: i.name })),
  );
  const [steps, setSteps] = useState<StepRow[]>(
    base.steps.map((s) => ({ key: key(), text: s.text, minutes: s.minutes?.toString() ?? "" })),
  );
  const [notes, setNotes] = useState(base.notes);
  const [secret, setSecret] = useState(base.secret);
  const [source, setSource] = useState(base.source_url);
  const [video, setVideo] = useState(base.video_url);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const videoOk = !video.trim() || parseYouTube(video) !== null;

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await photoToDataUrl(file));
    } catch {
      setError("No se pudo leer esa foto. Prueba con otra.");
    }
    e.target.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Ponle un nombre a la receta.");
    const s = Number(servings);
    if (!Number.isFinite(s) || s < 1) return setError("Las porciones deben ser un número desde 1.");
    if (!videoOk) return setError("Ese enlace no es de YouTube. Pega el enlace del video completo.");

    const ingredients = [];
    for (const r of ings) {
      if (!r.name.trim()) continue;
      const qty = parseQty(r.qty);
      if (qty === undefined) return setError(`No entendí la cantidad "${r.qty}" de ${r.name}. Usa números como 2, 1/2 o 1 1/2.`);
      ingredients.push({ qty, unit: r.unit.trim(), name: r.name.trim() });
    }
    const stepList = steps
      .filter((r) => r.text.trim())
      .map((r) => ({ text: r.text.trim(), minutes: Number(r.minutes) > 0 ? Math.round(Number(r.minutes)) : null }));

    setBusy(true);
    const id = await saveRecipe(
      {
        title, category, servings: Math.round(s),
        prep_min: Number(prep) > 0 ? Math.round(Number(prep)) : null,
        cook_min: Number(cook) > 0 ? Math.round(Number(cook)) : null,
        difficulty,
        tags: tags.split(","),
        photo, ingredients, steps: stepList, notes, secret,
        source_url: source.trim(), video_url: video.trim(),
      },
      recipe?.id,
    );
    router.push(`/recetas/ver?id=${id}`);
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-8" noValidate>
      <h1 className="text-4xl">{recipe ? "Editar receta" : "Nueva receta"}</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="titulo" className={labelClass}>Nombre de la receta</label>
        <input id="titulo" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Ej. Pastel de zanahoria" />
      </div>

      <div className="flex flex-col gap-3">
        <span className={labelClass}>Foto</span>
        <div className="flex items-center gap-4">
          <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-accent/50 text-primary/60">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Foto de la receta" className="size-full object-cover" />
            ) : (
              <Camera className="size-8" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => fileRef.current?.click()}>
              <Camera aria-hidden /> {photo ? "Cambiar foto" : "Agregar foto"}
            </Button>
            {photo && (
              <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={() => setPhoto(null)}>
                Quitar
              </Button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhoto} tabIndex={-1} aria-hidden />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="categoria" className={labelClass}>Categoría</label>
          <select id="categoria" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="porciones" className={labelClass}>Porciones</label>
          <input id="porciones" inputMode="numeric" className={inputClass} value={servings} onChange={(e) => setServings(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="prep" className={labelClass}>Preparación (min)</label>
          <input id="prep" inputMode="numeric" className={inputClass} value={prep} onChange={(e) => setPrep(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="coccion" className={labelClass}>Cocción u horno (min)</label>
          <input id="coccion" inputMode="numeric" className={inputClass} value={cook} onChange={(e) => setCook(e.target.value)} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={cn(labelClass, "mb-2")}>Dificultad</legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Dificultad">
          {([1, 2, 3] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={difficulty === d}
              onClick={() => setDifficulty(d)}
              className={cn(
                "min-h-11 rounded-full border-2 px-5 text-sm font-semibold",
                difficulty === d ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card hover:border-border",
              )}
            >
              {DIFFICULTY[d]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="etiquetas" className={labelClass}>Etiquetas (separadas por coma)</label>
        <input id="etiquetas" className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="chocolate, cumpleaños, sin horno" />
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="ing">
        <h2 id="ing" className="text-2xl">Ingredientes</h2>
        <datalist id="unidades">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
        <ul className="flex flex-col gap-3">
          {ings.map((r, i) => (
            <li key={r.key} className="grid grid-cols-[4.5rem_6rem_1fr] gap-2 sm:grid-cols-[5rem_7rem_1fr_auto]">
              <input aria-label={`Cantidad del ingrediente ${i + 1}`} className={inputClass} inputMode="decimal" placeholder="Cant." value={r.qty} onChange={(e) => setIngs(ings.map((x) => (x.key === r.key ? { ...x, qty: e.target.value } : x)))} />
              <input aria-label={`Unidad del ingrediente ${i + 1}`} list="unidades" className={inputClass} placeholder="Unidad" value={r.unit} onChange={(e) => setIngs(ings.map((x) => (x.key === r.key ? { ...x, unit: e.target.value } : x)))} />
              <input aria-label={`Nombre del ingrediente ${i + 1}`} className={inputClass} placeholder="Ingrediente" value={r.name} onChange={(e) => setIngs(ings.map((x) => (x.key === r.key ? { ...x, name: e.target.value } : x)))} />
              <div className="col-span-3 flex justify-end gap-1 sm:col-span-1">
                <IconBtn label="Subir" onClick={() => setIngs(move(ings, i, -1))}><ArrowUp className="size-4" /></IconBtn>
                <IconBtn label="Bajar" onClick={() => setIngs(move(ings, i, 1))}><ArrowDown className="size-4" /></IconBtn>
                <IconBtn label="Quitar ingrediente" onClick={() => setIngs(ings.filter((x) => x.key !== r.key))}><Trash2 className="size-4" /></IconBtn>
              </div>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" className="h-11 w-fit rounded-2xl" onClick={() => setIngs([...ings, { key: key(), qty: "", unit: "", name: "" }])}>
          <Plus aria-hidden /> Agregar ingrediente
        </Button>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="pasos">
        <h2 id="pasos" className="text-2xl">Pasos</h2>
        <ol className="flex flex-col gap-4">
          {steps.map((r, i) => (
            <li key={r.key} className="flex flex-col gap-2 rounded-3xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg">Paso {i + 1}</span>
                <div className="flex gap-1">
                  <IconBtn label="Subir" onClick={() => setSteps(move(steps, i, -1))}><ArrowUp className="size-4" /></IconBtn>
                  <IconBtn label="Bajar" onClick={() => setSteps(move(steps, i, 1))}><ArrowDown className="size-4" /></IconBtn>
                  <IconBtn label="Quitar paso" onClick={() => setSteps(steps.filter((x) => x.key !== r.key))}><Trash2 className="size-4" /></IconBtn>
                </div>
              </div>
              <textarea aria-label={`Texto del paso ${i + 1}`} className={textareaClass} value={r.text} onChange={(e) => setSteps(steps.map((x) => (x.key === r.key ? { ...x, text: e.target.value } : x)))} placeholder="Describe qué hacer" />
              <div className="flex items-center gap-2">
                <label htmlFor={`min-${r.key}`} className="text-sm text-muted-foreground">Temporizador (min)</label>
                <input id={`min-${r.key}`} inputMode="numeric" className={cn(inputClass, "w-24")} value={r.minutes} onChange={(e) => setSteps(steps.map((x) => (x.key === r.key ? { ...x, minutes: e.target.value } : x)))} />
              </div>
            </li>
          ))}
        </ol>
        <Button type="button" variant="outline" className="h-11 w-fit rounded-2xl" onClick={() => setSteps([...steps, { key: key(), text: "", minutes: "" }])}>
          <Plus aria-hidden /> Agregar paso
        </Button>
      </section>

      <div className="flex flex-col gap-2">
        <label htmlFor="notas" className={labelClass}>Notas</label>
        <textarea id="notas" className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Consejos, cambios, con qué acompañarla" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="secreto" className={labelClass}>Mi secreto</label>
        <textarea id="secreto" className={textareaClass} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Ese truco que solo tú sabes" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="video" className={labelClass}>Video de YouTube (opcional)</label>
        <input id="video" className={inputClass} value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/..." aria-invalid={!videoOk} />
        {!videoOk && <p className="text-sm font-semibold text-destructive">Ese enlace no es de YouTube.</p>}
        {video.trim() && videoOk && <YouTubeEmbed url={video} title="Vista previa del video" />}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="fuente" className={labelClass}>De dónde la sacaste (opcional)</label>
        <input id="fuente" className={inputClass} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Nombre o enlace" />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={busy} className="h-12 rounded-2xl px-6 text-base">
          {busy ? "Guardando…" : "Guardar receta"}
        </Button>
        <Button type="button" variant="ghost" size="lg" className="h-12 rounded-2xl px-6 text-base" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground">
      {children}
    </button>
  );
}
