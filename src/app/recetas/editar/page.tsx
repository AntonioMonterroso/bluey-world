import { Suspense } from "react";
import { EditRecipeRoute } from "@/components/recipe-editor-route";

export default function Page() {
  return (
    <Suspense>
      <EditRecipeRoute />
    </Suspense>
  );
}
