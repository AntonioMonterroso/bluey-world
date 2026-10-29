// Cálculo de costos de recetas. Sin dependencias de la app para poder probarlo solo.
import type { Ingredient, Product } from "./db/db";

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .join(" ");

export type Kind = "g" | "ml" | "unidad";

const ML_PER: Record<string, number> = { taza: 240, cda: 15, cdita: 5, ml: 1, l: 1000 };
const G_PER: Record<string, number> = { g: 1, kg: 1000 };
const UNIT_WORDS = new Set(["", "unidad", "pieza", "huevo", "diente"]);
const PACK_UNITS = new Set(["barra", "lata", "paquete", "sobre"]);

// Gramos por taza de uso común en repostería (aprox.), por si el producto no trae el dato.
const DEFAULT_G_PER_CUP: [string, number][] = [
  ["azucar glass", 120], ["azucar impalpable", 120], ["azucar moreno", 190], ["azucar", 200],
  ["harina", 120], ["maicena", 128], ["cacao", 85], ["avena", 90], ["mantequilla", 225],
  ["nuez", 120], ["almendra", 110], ["chispa", 170], ["coco", 85], ["crema", 240], ["leche", 245],
];

export function defaultGramsPerCup(name: string): number | null {
  const n = norm(name);
  for (const [k, v] of DEFAULT_G_PER_CUP) if (n.includes(k)) return v;
  return null;
}

/** Cantidad del paquete expresada en su unidad base (g, ml o unidades). */
export function packBase(qty: number, unit: string): { kind: Kind; amount: number } | null {
  const u = norm(unit);
  if (u in G_PER) return { kind: "g", amount: qty * G_PER[u] };
  if (u === "ml" || u === "l") return { kind: "ml", amount: qty * ML_PER[u] };
  if (u === "unidad" || u === "") return { kind: "unidad", amount: qty };
  if (u === "docena") return { kind: "unidad", amount: qty * 12 };
  return null;
}

export function pricePerBase(price: number, qty: number, unit: string): { kind: Kind; value: number } | null {
  const b = packBase(qty, unit);
  return b && b.amount > 0 ? { kind: b.kind, value: price / b.amount } : null;
}

/** Busca el producto cuyo nombre aparece en el ingrediente (gana el nombre más largo). */
export function findProduct(name: string, products: Product[]): Product | undefined {
  const n = ` ${norm(name)} `;
  let best: Product | undefined;
  let bestLen = 0;
  for (const p of products) {
    const pn = norm(p.name);
    if (!pn) continue;
    if ((n.includes(` ${pn} `) || ` ${pn} `.includes(n)) && pn.length > bestLen) {
      best = p;
      bestLen = pn.length;
    }
  }
  return best;
}

export type CostResult = { cost: number | null; reason?: "sin-precio" | "sin-equivalencia" };

export function ingredientCost(ing: Ingredient, product: Product | undefined): CostResult {
  if (ing.qty === null) return { cost: 0 }; // "al gusto"
  if (!product) return { cost: null, reason: "sin-precio" };
  const ppb = pricePerBase(product.price, product.pack_qty, product.pack_unit);
  if (!ppb) return { cost: null, reason: "sin-equivalencia" };

  const u = norm(ing.unit);
  const cup = product.g_per_cup ?? defaultGramsPerCup(product.name);
  let kind: Kind;
  let amount: number;
  if (u in G_PER) { kind = "g"; amount = ing.qty * G_PER[u]; }
  else if (u in ML_PER) { kind = "ml"; amount = ing.qty * ML_PER[u]; }
  else if (UNIT_WORDS.has(u)) { kind = "unidad"; amount = ing.qty; }
  else if (PACK_UNITS.has(u) || u === "docena") {
    if (u === "docena") { kind = "unidad"; amount = ing.qty * 12; }
    else if (product.grams_per_unit) { kind = "g"; amount = ing.qty * product.grams_per_unit; }
    else return { cost: null, reason: "sin-equivalencia" };
  } else return { cost: null, reason: "sin-equivalencia" };

  if (kind === ppb.kind) return { cost: amount * ppb.value };
  // g ↔ ml con la densidad de "gramos por taza" (1 taza = 240 ml)
  if (kind === "ml" && ppb.kind === "g") return cup ? { cost: (amount / 240) * cup * ppb.value } : { cost: null, reason: "sin-equivalencia" };
  if (kind === "g" && ppb.kind === "ml") return cup ? { cost: (amount / cup) * 240 * ppb.value } : { cost: null, reason: "sin-equivalencia" };
  // unidad ↔ g/ml con los gramos de una unidad
  if (kind === "unidad" && product.grams_per_unit) return { cost: amount * product.grams_per_unit * ppb.value };
  if (ppb.kind === "unidad" && product.grams_per_unit && kind !== "unidad") return { cost: (amount / product.grams_per_unit) * ppb.value };
  return { cost: null, reason: "sin-equivalencia" };
}

export interface RecipeCost {
  total: number;
  missing: { ingredient: Ingredient; reason: "sin-precio" | "sin-equivalencia" }[];
  lines: { ingredient: Ingredient; cost: number | null }[];
}

export function recipeCost(ingredients: Ingredient[], products: Product[]): RecipeCost {
  let total = 0;
  const missing: RecipeCost["missing"] = [];
  const lines: RecipeCost["lines"] = [];
  for (const ing of ingredients) {
    const r = ingredientCost(ing, findProduct(ing.name, products));
    lines.push({ ingredient: ing, cost: r.cost });
    if (r.cost === null) missing.push({ ingredient: ing, reason: r.reason! });
    else total += r.cost;
  }
  return { total, missing, lines };
}

/** Cambio porcentual del precio por unidad base entre la última y la anterior entrada. */
export function trendOf(entries: { price: number; pack_qty: number; pack_unit: string; at: number }[]) {
  const sorted = [...entries].sort((a, b) => a.at - b.at);
  if (sorted.length < 2) return null;
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const a = pricePerBase(prev.price, prev.pack_qty, prev.pack_unit);
  const b = pricePerBase(last.price, last.pack_qty, last.pack_unit);
  if (!a || !b || a.kind !== b.kind || a.value === 0) return null;
  return { pct: ((b.value - a.value) / a.value) * 100, from: prev.price, to: last.price, at: last.at };
}
