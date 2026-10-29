import { Suspense } from "react";
import { RecipeDetailRoute } from "@/components/recipe-detail";

export default function Page() {
  return (
    <Suspense>
      <RecipeDetailRoute />
    </Suspense>
  );
}
