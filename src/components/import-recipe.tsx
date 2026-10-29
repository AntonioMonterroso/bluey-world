"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { labelClass, textareaClass } from "@/components/ui/fields";
import { RecipeForm } from "@/components/recipe-form";
import type { RecipeContent } from "@/lib/db/db";
import { parseRecipeText } from "@/lib/recipe-import";

const EXAMPLE = `Brownies de chocolate
Rinde 12 porciones
Ingredientes
- 200 g de chocolate amargo
- 1/2 taza de mantequilla
- 3 huevos
Preparación
1. Derrite el chocolate con la mantequilla.
2. Agrega los huevos y mezcla bien.
3. Hornea 30 minutos.`;

export function ImportRecipe() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<RecipeContent | null>(null);

  if (parsed) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold">Esto fue lo que entendí. Revisa y corrige lo que haga falta antes de guardar.</p>
        <RecipeForm initial={parsed} />
        <Button variant="ghost" className="h-11 w-fit rounded-2xl" onClick={() => setParsed(null)}>Volver al texto</Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <h1 className="text-4xl">Importar una receta</h1>
      <p className="text-muted-foreground">
        Pega aquí el texto de una receta (de un chat, una nota o una página). Reconozco el nombre, los ingredientes con sus cantidades y los pasos. Si trae un enlace, lo guardo como fuente.
      </p>
      <div className="flex flex-col gap-2">
        <label htmlFor="imp-text" className={labelClass}>Texto de la receta</label>
        <textarea id="imp-text" className={`${textareaClass} min-h-64`} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button disabled={text.trim().length < 10} className="h-12 rounded-2xl px-6 text-base" onClick={() => setParsed(parseRecipeText(text))}>Revisar receta</Button>
        <Button asChild variant="outline" className="h-12 rounded-2xl px-6 text-base"><Link href="/recetas">Cancelar</Link></Button>
      </div>
    </div>
  );
}
