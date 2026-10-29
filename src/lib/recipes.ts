"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Ingredient, type Recipe, type RecipeContent, type RecipeVersion } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";

export const CATEGORIES = [
  "Pasteles",
  "Cupcakes y muffins",
  "Galletas",
  "Tartas y pays",
  "Postres fríos",
  "Panes",
  "Rellenos y cremas",
  "Bebidas",
  "Salado",
  "Otro",
] as const;

export const UNITS = ["g", "kg", "ml", "l", "taza", "cda", "cdita", "pizca", "unidad", "barra", "lata", "paquete"];

export const DIFFICULTY = { 1: "Fácil", 2: "Media", 3: "Reto" } as const;

export const newId = () => crypto.randomUUID();

export function emptyContent(): RecipeContent {
  return {
    title: "",
    category: CATEGORIES[0],
    servings: 8,
    prep_min: null,
    cook_min: null,
    difficulty: 1,
    tags: [],
    photo: null,
    ingredients: [{ qty: null, unit: "", name: "" }],
    steps: [{ text: "", minutes: null }],
    notes: "",
    secret: "",
    source_url: "",
    video_url: "",
  };
}

// ---------- Cantidades ----------

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

/** "1 1/2", "1/2", "0,5", "½" → número. Vacío → null. Texto inválido → undefined. */
export function parseQty(raw: string): number | null | undefined {
  let t = raw.trim().replace(",", ".");
  if (!t) return null;
  let total = 0;
  for (const [ch, v] of Object.entries(UNICODE_FRACTIONS)) {
    if (t.includes(ch)) {
      total += v;
      t = t.replace(ch, " ").trim();
    }
  }
  for (const part of t.split(/\s+/).filter(Boolean)) {
    const frac = part.match(/^(\d+)\/(\d+)$/);
    if (frac) {
      if (Number(frac[2]) === 0) return undefined;
      total += Number(frac[1]) / Number(frac[2]);
    } else if (/^\d*\.?\d+$/.test(part)) total += Number(part);
    else return undefined;
  }
  return total > 0 ? total : undefined;
}

const FRACTIONS: [number, string][] = [
  [0, ""], [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"],
  [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"], [1, ""],
];

export function formatQty(n: number | null): string {
  if (n === null || !isFinite(n) || n <= 0) return "";
  if (n >= 10) return String(Math.round(n * 10) / 10).replace(/\.0$/, "");
  let whole = Math.floor(n);
  const frac = n - whole;
  const [value, glyph] = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - frac) < Math.abs(best[0] - frac) ? f : best));
  if (Math.abs(value - frac) > 0.04) return String(Math.round(n * 100) / 100).replace(/\.?0+$/, "");
  if (value === 1) whole += 1;
  return `${whole || ""}${glyph}` || "0";
}

export function scaleIngredients(items: Ingredient[], factor: number): Ingredient[] {
  return items.map((i) => ({ ...i, qty: i.qty === null ? null : i.qty * factor }));
}

export function formatMinutes(min: number | null) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

// ---------- Datos ----------

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

export function useRecipes() {
  return useLiveQuery(async () => alive(await db.recipes.toArray()).sort((a, b) => b.updated_at - a.updated_at), []);
}

const MISSING = Symbol("missing");

/** undefined = cargando · null = no existe */
export function useRecipe(id: string | null) {
  const row = useLiveQuery(async () => (id ? ((await db.recipes.get(id)) ?? MISSING) : MISSING), [id]);
  if (row === undefined) return undefined;
  return row === MISSING || (row as Recipe).deleted_at ? null : (row as Recipe);
}

export function useVersions(recipeId: string) {
  return useLiveQuery(
    async () =>
      alive(await db.recipe_versions.where("recipe_id").equals(recipeId).toArray()).sort(
        (a, b) => b.updated_at - a.updated_at,
      ),
    [recipeId],
  );
}

export function contentOf(r: RecipeContent): RecipeContent {
  return {
    title: r.title, category: r.category, servings: r.servings, prep_min: r.prep_min, cook_min: r.cook_min,
    difficulty: r.difficulty, tags: r.tags, photo: r.photo, ingredients: r.ingredients, steps: r.steps,
    notes: r.notes, secret: r.secret, source_url: r.source_url, video_url: r.video_url,
  };
}

const MAX_VERSIONS = 15;

/** Crea o actualiza una receta. Al editar, guarda la versión anterior si algo cambió. */
export async function saveRecipe(content: RecipeContent, id?: string): Promise<string> {
  const clean: RecipeContent = {
    ...content,
    title: content.title.trim(),
    ingredients: content.ingredients.filter((i) => i.name.trim()),
    steps: content.steps.filter((s) => s.text.trim()),
    tags: content.tags.map((t) => t.trim()).filter(Boolean),
  };

  const existing = id ? await db.recipes.get(id) : undefined;
  if (existing) {
    if (JSON.stringify(contentOf(existing)) !== JSON.stringify(clean)) {
      await upsertRow<RecipeVersion>("recipe_versions", {
        id: newId(),
        recipe_id: existing.id,
        snapshot: contentOf(existing),
        note: "",
      });
      const old = alive(await db.recipe_versions.where("recipe_id").equals(existing.id).toArray()).sort(
        (a, b) => b.updated_at - a.updated_at,
      );
      for (const v of old.slice(MAX_VERSIONS)) await deleteRow("recipe_versions", v.id);
    }
    await upsertRow<Recipe>("recipes", { ...existing, ...clean });
    return existing.id;
  }

  const rid = newId();
  await upsertRow<Recipe>("recipes", { ...clean, id: rid, favorite: false, created_at: Date.now(), cooked_count: 0 });
  return rid;
}

export async function toggleFavorite(r: Recipe) {
  await upsertRow<Recipe>("recipes", { ...r, favorite: !r.favorite });
}

export async function duplicateRecipe(r: Recipe) {
  return saveRecipe({ ...contentOf(r), title: `${r.title} (copia)` });
}

export const deleteRecipe = (id: string) => deleteRow("recipes", id);

export function restoreVersion(r: Recipe, v: RecipeVersion) {
  return saveRecipe(v.snapshot, r.id);
}

/** Reduce una foto a un tamaño razonable para guardarla con la receta (funciona offline). */
export async function photoToDataUrl(file: File, max = 900): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  let q = 0.8;
  let url = canvas.toDataURL("image/jpeg", q);
  while (url.length > 260_000 && q > 0.4) {
    q -= 0.1;
    url = canvas.toDataURL("image/jpeg", q);
  }
  return url;
}

// ---------- Diario de cocción ----------

import type { CookLog } from "@/lib/db/db";

export function useCookLogs(recipeId: string) {
  return useLiveQuery(
    async () =>
      alive(await db.cook_log.where("recipe_id").equals(recipeId).toArray()).sort((a, b) => b.cooked_at - a.cooked_at),
    [recipeId],
  );
}

/** Registra que la receta se cocinó (base del diario y de las recompensas del juego). */
export async function finishCooking(
  recipe: Recipe,
  data: { servings: number; rating: number | null; notes: string; photo: string | null },
) {
  const now = Date.now();
  await upsertRow<CookLog>("cook_log", {
    id: newId(),
    recipe_id: recipe.id,
    title: recipe.title,
    cooked_at: now,
    ...data,
  });
  const current = await db.recipes.get(recipe.id);
  if (current) await upsertRow<Recipe>("recipes", { ...current, cooked_count: current.cooked_count + 1 });
}
