import type { Ingredient, RecipeContent, RecipeStep } from "@/lib/db/db";
import { CATEGORIES, emptyContent, parseQty } from "@/lib/recipes";

// Convierte una receta pegada como texto (de un chat, una nota, una página) en una receta editable.
// Es una ayuda: siempre se revisa en el formulario antes de guardar.

const UNIT_ALIASES: Record<string, string> = {
  g: "g", gr: "g", grs: "g", gramo: "g", gramos: "g",
  kg: "kg", kilo: "kg", kilos: "kg", kilogramo: "kg", kilogramos: "kg",
  ml: "ml", mililitro: "ml", mililitros: "ml",
  l: "l", lt: "l", lts: "l", litro: "l", litros: "l",
  taza: "taza", tazas: "taza", tz: "taza",
  cda: "cda", cdas: "cda", cucharada: "cda", cucharadas: "cda", tbsp: "cda",
  cdita: "cdita", cditas: "cdita", cucharadita: "cdita", cucharaditas: "cdita", tsp: "cdita",
  pizca: "pizca", pizcas: "pizca",
  unidad: "unidad", unidades: "unidad", u: "unidad", pieza: "unidad", piezas: "unidad",
  barra: "barra", barras: "barra", lata: "lata", latas: "lata", paquete: "paquete", paquetes: "paquete",
};

const ING_HEADER = /^\s*#*\s*(ingredientes?|ingredients?)\s*:?\s*$/i;
const STEP_HEADER = /^\s*#*\s*(preparaci[oó]n|procedimiento|instrucciones|pasos|modo de (?:hacer|preparaci[oó]n)|elaboraci[oó]n|directions?|method|steps)\s*:?\s*$/i;
const BULLET = /^\s*(?:[-•*·▪●]|\d+\s*[.)]|paso\s*\d+\s*[:.)-]?)\s*/i;
const QTY_START = /^\s*((?:\d+\s+)?\d+\/\d+|\d+[.,]?\d*|[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s*(?:[¼½¾⅓⅔⅛⅜⅝⅞]))?/;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

export function parseIngredientLine(raw: string): Ingredient {
  const line = clean(raw.replace(BULLET, ""));
  const m = line.match(QTY_START);
  if (!m) return { qty: null, unit: "", name: line };
  const qty = parseQty(m[0].trim()) ?? null;
  let rest = line.slice(m[0].length).trim();
  let unit = "";
  const um = rest.match(/^([a-zA-Záéíóúñ.]+)\b\.?\s*/);
  if (um) {
    const u = UNIT_ALIASES[um[1].toLowerCase().replace(/\.$/, "")];
    if (u) { unit = u; rest = rest.slice(um[0].length); }
  }
  rest = rest.replace(/^de\s+/i, "").trim();
  return { qty, unit, name: rest || line };
}

const looksLikeIngredient = (l: string) => QTY_START.test(l.replace(BULLET, "")) && l.replace(BULLET, "").length < 80;

function guessCategory(title: string): string {
  const t = title.toLowerCase();
  const rules: [RegExp, string][] = [
    [/cupcake|muffin/, "Cupcakes y muffins"], [/galleta|cookie|polvor/, "Galletas"], [/pan\b|panecillo|brioche|focaccia/, "Panes"],
    [/tarta|pay\b|pie\b|tartaleta/, "Tartas y pays"], [/flan|gelatina|helado|mousse|tres leches|postre fr/, "Postres fríos"],
    [/relleno|crema|ganache|betún|betun|glaseado|merengue/, "Rellenos y cremas"], [/pastel|brownie|blondie|torta|bizcocho|keke|queque|panqu/, "Pasteles"],
    [/limonada|batido|licuado|bebida|chocolate caliente/, "Bebidas"],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? CATEGORIES[CATEGORIES.length - 1];
}

export function parseRecipeText(text: string): RecipeContent {
  const out = emptyContent();
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim());
  const url = text.match(/https?:\/\/\S+/)?.[0];
  if (url) out.source_url = url.replace(/[.,)]+$/, "");

  const nonEmpty = lines.filter((l) => l && !/^https?:\/\//.test(l));
  const titleLine = nonEmpty.find((l) => !ING_HEADER.test(l) && !STEP_HEADER.test(l) && !looksLikeIngredient(l));
  out.title = clean((titleLine ?? "").replace(/^#+\s*/, "").replace(/^receta\s*(de|:)\s*/i, "")).slice(0, 80);
  out.category = guessCategory(out.title);

  let mode: "none" | "ing" | "step" = "none";
  const ings: Ingredient[] = [];
  const steps: RecipeStep[] = [];
  const hasHeaders = lines.some((l) => ING_HEADER.test(l) || STEP_HEADER.test(l));

  for (const l of lines) {
    if (!l || l === titleLine || /^https?:\/\//.test(l)) continue;
    if (ING_HEADER.test(l)) { mode = "ing"; continue; }
    if (STEP_HEADER.test(l)) { mode = "step"; continue; }
    const serv = l.match(/(?:rinde|porciones|raciones|sirve|para|serves|servings)\s*:?\s*(\d{1,3})/i);
    if (serv && l.length < 60) { out.servings = Number(serv[1]); continue; }
    const prep = l.match(/(?:tiempo|horno|hornear|cocci[oó]n)[^\d]{0,20}(\d{1,3})\s*(?:min|minutos)/i);
    if (prep && l.length < 50 && !BULLET.test(l)) { out.cook_min = Number(prep[1]); continue; }

    const asIng = mode === "ing" || (mode === "none" && !hasHeaders && looksLikeIngredient(l));
    if (asIng) { ings.push(parseIngredientLine(l)); continue; }
    const stepText = clean(l.replace(BULLET, ""));
    if (!stepText) continue;
    const mins = stepText.match(/(\d{1,3})\s*(?:minutos|min)\b/i);
    steps.push({ text: stepText, minutes: mins ? Number(mins[1]) : null });
  }
  if (ings.length) out.ingredients = ings;
  if (steps.length) out.steps = steps;
  return out;
}
