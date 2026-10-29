"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipe } from "@/lib/recipes";

export function EditRecipeRoute() {
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
  return <RecipeForm key={recipe.id} recipe={recipe} />;
}
